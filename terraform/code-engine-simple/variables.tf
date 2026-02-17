# IBM Cloud Configuration
variable "ibmcloud_api_key" {
  description = "IBM Cloud API key for Terraform"
  type        = string
  sensitive   = true
}

variable "pricing_api_key" {
  description = "IBM Cloud API key for pricing API (can be same as ibmcloud_api_key)"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "IBM Cloud region for Code Engine"
  type        = string
  default     = "eu-de"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "Default"
}

# Project Configuration
variable "project_name" {
  description = "Code Engine project name"
  type        = string
  default     = "vpc-snapshot-calculator"
}

# GitHub Configuration
variable "github_repo_url" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/andygroth/vpc-snapshot-calculator"
}

variable "github_branch" {
  description = "GitHub branch to deploy"
  type        = string
  default     = "main"
}

# API Configuration
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
  description = "CPU limit for API"
  type        = string
  default     = "0.5"
}

variable "api_memory_limit" {
  description = "Memory limit for API"
  type        = string
  default     = "1G"
}

variable "cache_ttl" {
  description = "Cache TTL in seconds"
  type        = string
  default     = "86400"
}

variable "cors_origin" {
  description = "CORS origin (empty for wildcard)"
  type        = string
  default     = ""
}

# Frontend Configuration
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
