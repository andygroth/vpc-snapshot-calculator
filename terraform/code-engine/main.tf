/**
 * IBM Code Engine Terraform Configuration
 * 
 * Deploys VPC Snapshot Calculator to IBM Code Engine:
 * - Backend API (container application)
 * - Frontend (static application)
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

# Container Registry Namespace (for API image)
resource "ibm_cr_namespace" "vpc_calculator" {
  name              = var.registry_namespace
  resource_group_id = data.ibm_resource_group.group.id
}

# Secret for Container Registry access
resource "ibm_code_engine_secret" "registry_access" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "registry-access"
  format     = "registry"

  data = {
    username = "iamapikey"
    password = var.ibmcloud_api_key
    server   = "${var.registry_region}.icr.io"
    email    = "noreply@ibm.com"
  }
}

# Secret for IBM Cloud API Key (used by backend)
resource "ibm_code_engine_secret" "api_key" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "ibm-cloud-api-key"
  format     = "generic"

  data = {
    IBM_CLOUD_API_KEY = var.pricing_api_key
  }
}

# Backend API Application
resource "ibm_code_engine_app" "api" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = "${var.project_name}-api"

  image_reference = "${var.registry_region}.icr.io/${ibm_cr_namespace.vpc_calculator.name}/vpc-calculator-api:${var.api_image_tag}"
  image_port      = 3001
  image_secret    = ibm_code_engine_secret.registry_access.name

  # Scaling configuration
  scale_min_instances     = var.api_min_instances
  scale_max_instances     = var.api_max_instances
  scale_cpu_limit         = var.api_cpu_limit
  scale_memory_limit      = var.api_memory_limit
  scale_concurrency       = var.api_concurrency
  scale_concurrency_target = var.api_concurrency_target

  # Environment variables
  # Note: PORT is reserved by Code Engine and set automatically via image_port
  
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
    type  = "secret_key_reference"
    name  = "IBM_CLOUD_API_KEY"
    key   = "IBM_CLOUD_API_KEY"
    reference = ibm_code_engine_secret.api_key.name
  }

  # Health check
  run_service_account = "default"
}

# Frontend Static Application
resource "ibm_code_engine_app" "frontend" {
  project_id = ibm_code_engine_project.vpc_calculator.project_id
  name       = var.project_name

  image_reference = "${var.registry_region}.icr.io/${ibm_cr_namespace.vpc_calculator.name}/vpc-calculator-frontend:${var.frontend_image_tag}"
  image_port      = 8080
  image_secret    = ibm_code_engine_secret.registry_access.name

  # Scaling configuration
  scale_min_instances     = var.frontend_min_instances
  scale_max_instances     = var.frontend_max_instances
  scale_cpu_limit         = "0.25"
  scale_memory_limit      = "0.5G"
  scale_concurrency       = 100
  scale_concurrency_target = 80

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

output "registry_namespace" {
  description = "Container Registry namespace"
  value       = ibm_cr_namespace.vpc_calculator.name
}

output "api_image_url" {
  description = "Full API image URL"
  value       = "${var.registry_region}.icr.io/${ibm_cr_namespace.vpc_calculator.name}/vpc-calculator-api:${var.api_image_tag}"
}

output "frontend_image_url" {
  description = "Full frontend image URL"
  value       = "${var.registry_region}.icr.io/${ibm_cr_namespace.vpc_calculator.name}/vpc-calculator-frontend:${var.frontend_image_tag}"
}
