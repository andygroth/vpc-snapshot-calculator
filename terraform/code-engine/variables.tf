/**
 * IBM Code Engine Terraform Variables
 */

variable "ibmcloud_api_key" {
  description = "IBM Cloud API key for Terraform provider"
  type        = string
  sensitive   = true
}

variable "pricing_api_key" {
  description = "IBM Cloud API key for pricing API (can be same as ibmcloud_api_key)"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "IBM Cloud region for Code Engine project"
  type        = string
  default     = "us-south"
}

variable "resource_group_name" {
  description = "Name of the IBM Cloud resource group"
  type        = string
  default     = "Default"
}

variable "project_name" {
  description = "Name of the Code Engine project"
  type        = string
  default     = "vpc-snapshot-calculator"
}

variable "registry_namespace" {
  description = "Container Registry namespace name"
  type        = string
  default     = "vpc-calculator"
}

variable "registry_region" {
  description = "Container Registry region"
  type        = string
  default     = "us"
}

# API Configuration
variable "api_image_tag" {
  description = "Docker image tag for API"
  type        = string
  default     = "latest"
}

variable "api_min_instances" {
  description = "Minimum number of API instances"
  type        = number
  default     = 0
}

variable "api_max_instances" {
  description = "Maximum number of API instances"
  type        = number
  default     = 10
}

variable "api_cpu_limit" {
  description = "CPU limit for API instances"
  type        = string
  default     = "0.5"
}

variable "api_memory_limit" {
  description = "Memory limit for API instances"
  type        = string
  default     = "1G"
}

variable "api_concurrency" {
  description = "Maximum concurrent requests per API instance"
  type        = number
  default     = 100
}

variable "api_concurrency_target" {
  description = "Target concurrent requests for scaling"
  type        = number
  default     = 80
}

variable "cache_ttl" {
  description = "Cache TTL in seconds for pricing data"
  type        = string
  default     = "86400"
}

variable "cors_origin" {
  description = "CORS origin for API (empty string for wildcard)"
  type        = string
  default     = ""
}

# Frontend Configuration
variable "frontend_image_tag" {
  description = "Docker image tag for frontend"
  type        = string
  default     = "latest"
}

variable "frontend_min_instances" {
  description = "Minimum number of frontend instances"
  type        = number
  default     = 0
}

variable "frontend_max_instances" {
  description = "Maximum number of frontend instances"
  type        = number
  default     = 10
}
