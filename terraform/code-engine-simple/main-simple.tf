/**
 * Ultra-Simplified Code Engine Deployment
 * Uses public container images - no builds needed!
 */

terraform {
  required_version = ">= 1.0"
  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = "~> 1.60"
    }
  }
}

provider "ibm" {
  ibmcloud_api_key = var.ibmcloud_api_key
  region           = var.region
}

# Data source for resource group
data "ibm_resource_group" "group" {
  name = var.resource_group_name
}

# Code Engine Project
resource "ibm_code_engine_project" "vpc_calculator" {
  name              = var.project_name
  resource_group_id = data.ibm_resource_group.group.id
}

# Secret for IBM Cloud API Key (used by backend API)
resource "ibm_code_engine_secret" "api_key" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "ibm-cloud-api-key"
  format     = "generic"

  data = {
    IBM_CLOUD_API_KEY = var.pricing_api_key
  }
}

# Backend API Application
# Using a simple Node.js base image - we'll inject code via environment
resource "ibm_code_engine_app" "api" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "${var.project_name}-api"

  # Use official Node.js image
  image_reference = "docker.io/library/node:18-alpine"
  image_port      = 3001

  # Scaling configuration
  scale_min_instances = var.api_min_instances
  scale_max_instances = var.api_max_instances
  scale_cpu_limit     = var.api_cpu_limit
  scale_memory_limit  = var.api_memory_limit

  # Run command to clone repo and start app
  run_commands = [
    "/bin/sh",
    "-c",
    "apk add --no-cache git && git clone ${var.github_repo_url} /app && cd /app/api && npm install && npm start"
  ]

  # Environment variables
  run_env_variables {
    type  = "literal"
    name  = "NODE_ENV"
    value = "production"
  }

  run_env_variables {
    type  = "literal"
    name  = "CACHE_TTL"
    value = var.cache_ttl
  }

  run_env_variables {
    type  = "literal"
    name  = "CORS_ORIGIN"
    value = var.cors_origin != "" ? var.cors_origin : "*"
  }

  # Secret reference for API key
  run_env_variables {
    type      = "secret_key_reference"
    name      = "IBM_CLOUD_API_KEY"
    key       = "IBM_CLOUD_API_KEY"
    reference = ibm_code_engine_secret.api_key.name
  }

  run_service_account = "default"
}

# Frontend Application
resource "ibm_code_engine_app" "frontend" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = var.project_name

  # Use nginx with a startup script
  image_reference = "docker.io/library/nginx:alpine"
  image_port      = 8080

  # Scaling configuration
  scale_min_instances = var.frontend_min_instances
  scale_max_instances = var.frontend_max_instances
  scale_cpu_limit     = "0.25"
  scale_memory_limit  = "0.5G"

  # Run command to clone repo, build, and serve
  run_commands = [
    "/bin/sh",
    "-c",
    "apk add --no-cache git nodejs npm && git clone ${var.github_repo_url} /build && cd /build && npm install && npm run build && cp -r dist/* /usr/share/nginx/html/ && sed -i 's/listen       80/listen       8080/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
  ]

  # Environment variable for API endpoint
  run_env_variables {
    type  = "literal"
    name  = "VITE_API_URL"
    value = "https://${ibm_code_engine_app.api.endpoint}"
  }

  run_service_account = "default"
}

# Outputs
output "project_id" {
  description = "Code Engine project ID"
  value       = ibm_code_engine_project.vpc_calculator.project_id
}

output "api_endpoint" {
  description = "Backend API endpoint URL"
  value       = "https://${ibm_code_engine_app.api.endpoint}"
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "https://${ibm_code_engine_app.frontend.endpoint}"
}
