/**
 * Simplified IBM Code Engine Deployment
 * Builds directly from GitHub - no local container builds needed!
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

# Secret for Container Registry access (for builds)
resource "ibm_code_engine_secret" "registry" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "registry-secret"
  format     = "registry"

  data = {
    username = "iamapikey"
    password = var.ibmcloud_api_key
    server   = "private.${var.region}.icr.io"
    email    = "noreply@ibm.com"
  }
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

# Build configuration for API
resource "ibm_code_engine_build" "api" {
  project_id    = ibm_code_engine_project.vpc_calculator.project_id
  name          = "${var.project_name}-api-build"
  output_image  = "private.${var.region}.icr.io/${var.project_name}/api"
  output_secret = ibm_code_engine_secret.registry.name
  source_url    = var.github_repo_url
  source_revision = var.github_branch
  source_context_dir = "api"
  strategy_type = "dockerfile"
  strategy_spec_file = "Dockerfile"
  strategy_size = "medium"
}

# Build configuration for Frontend
resource "ibm_code_engine_build" "frontend" {
  project_id    = ibm_code_engine_project.vpc_calculator.project_id
  name          = "${var.project_name}-frontend-build"
  output_image  = "private.${var.region}.icr.io/${var.project_name}/frontend"
  output_secret = ibm_code_engine_secret.registry.name
  source_url    = var.github_repo_url
  source_revision = var.github_branch
  source_context_dir = "."
  strategy_type = "dockerfile"
  strategy_spec_file = "Dockerfile"
  strategy_size = "medium"
}

# Backend API Application
resource "ibm_code_engine_app" "api" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "${var.project_name}-api"

  image_reference = ibm_code_engine_build.api.output_image
  image_port      = 3001

  # Scaling configuration
  scale_min_instances = var.api_min_instances
  scale_max_instances = var.api_max_instances
  scale_cpu_limit     = var.api_cpu_limit
  scale_memory_limit  = var.api_memory_limit

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
  
  depends_on = [ibm_code_engine_build.api]
}

# Frontend Application
resource "ibm_code_engine_app" "frontend" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = var.project_name

  image_reference = ibm_code_engine_build.frontend.output_image
  image_port      = 8080

  # Scaling configuration
  scale_min_instances = var.frontend_min_instances
  scale_max_instances = var.frontend_max_instances
  scale_cpu_limit     = "0.25"
  scale_memory_limit  = "0.5G"

  # Environment variable for API endpoint
  run_env_variables {
    type  = "literal"
    name  = "VITE_API_URL"
    value = "https://${ibm_code_engine_app.api.endpoint}"
  }

  run_service_account = "default"
  
  depends_on = [ibm_code_engine_build.frontend]
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

output "api_build_status" {
  description = "API build status"
  value       = ibm_code_engine_build.api.status
}

output "frontend_build_status" {
  description = "Frontend build status"
  value       = ibm_code_engine_build.frontend.status
}
