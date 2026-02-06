# IBM Cloud VPC Snapshot Calculator - Terraform Variables

variable "ibmcloud_api_key" {
  description = "IBM Cloud API Key"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "IBM Cloud region where resources will be created"
  type        = string
  default     = "us-south"
}

variable "resource_group" {
  description = "Name of the resource group"
  type        = string
  default     = "Default"
}

variable "prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "snapshot-calc"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "vpc-snapshot-calculator"
}

variable "instance_profile" {
  description = "Instance profile for the VM"
  type        = string
  default     = "cx2-2x4"
}

variable "ssh_key_name" {
  description = "Name of existing SSH key in IBM Cloud (leave empty to skip)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = ["vpc-snapshot-calculator", "terraform"]
}
