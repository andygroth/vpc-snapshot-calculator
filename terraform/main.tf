# IBM Cloud VPC Snapshot Calculator - Terraform Configuration
# Deploys the calculator on an IBM Cloud VPC VM with nginx

terraform {
  required_version = ">= 1.0"
  required_providers {
    ibm = {
      source  = "IBM-Cloud/ibm"
      version = "~> 1.60"
    }
  }
}

# Provider configuration
provider "ibm" {
  ibmcloud_api_key = var.ibmcloud_api_key
  region           = var.region
}

# Data sources
data "ibm_is_image" "ubuntu" {
  name = "ibm-ubuntu-22-04-3-minimal-amd64-1"
}

data "ibm_is_ssh_key" "existing_key" {
  count = var.ssh_key_name != "" ? 1 : 0
  name  = var.ssh_key_name
}

# Resource Group
data "ibm_resource_group" "group" {
  name = var.resource_group
}

# VPC
resource "ibm_is_vpc" "vpc" {
  name           = "${var.prefix}-vpc"
  resource_group = data.ibm_resource_group.group.id
  tags           = var.tags
}

# Public Gateway for internet access
resource "ibm_is_public_gateway" "pgw" {
  name           = "${var.prefix}-pgw"
  vpc            = ibm_is_vpc.vpc.id
  zone           = "${var.region}-1"
  resource_group = data.ibm_resource_group.group.id
  tags           = var.tags
}

# Subnet
resource "ibm_is_subnet" "subnet" {
  name                     = "${var.prefix}-subnet"
  vpc                      = ibm_is_vpc.vpc.id
  zone                     = "${var.region}-1"
  total_ipv4_address_count = 256
  public_gateway           = ibm_is_public_gateway.pgw.id
  resource_group           = data.ibm_resource_group.group.id
  tags                     = var.tags
}

# Security Group
resource "ibm_is_security_group" "sg" {
  name           = "${var.prefix}-sg"
  vpc            = ibm_is_vpc.vpc.id
  resource_group = data.ibm_resource_group.group.id
  tags           = var.tags
}

# Security Group Rules
resource "ibm_is_security_group_rule" "ssh" {
  group     = ibm_is_security_group.sg.id
  direction = "inbound"
  remote    = "0.0.0.0/0"

  tcp {
    port_min = 22
    port_max = 22
  }
}

resource "ibm_is_security_group_rule" "http" {
  group     = ibm_is_security_group.sg.id
  direction = "inbound"
  remote    = "0.0.0.0/0"

  tcp {
    port_min = 80
    port_max = 80
  }
}

resource "ibm_is_security_group_rule" "https" {
  group     = ibm_is_security_group.sg.id
  direction = "inbound"
  remote    = "0.0.0.0/0"

  tcp {
    port_min = 443
    port_max = 443
  }
}

resource "ibm_is_security_group_rule" "outbound" {
  group     = ibm_is_security_group.sg.id
  direction = "outbound"
  remote    = "0.0.0.0/0"
}

# Floating IP
resource "ibm_is_floating_ip" "fip" {
  name           = "${var.prefix}-fip"
  target         = ibm_is_instance.vm.primary_network_interface[0].id
  resource_group = data.ibm_resource_group.group.id
  tags           = var.tags
}

# Virtual Server Instance
resource "ibm_is_instance" "vm" {
  name           = "${var.prefix}-vm"
  vpc            = ibm_is_vpc.vpc.id
  zone           = "${var.region}-1"
  profile        = var.instance_profile
  image          = data.ibm_is_image.ubuntu.id
  keys           = var.ssh_key_name != "" ? [data.ibm_is_ssh_key.existing_key[0].id] : []
  resource_group = data.ibm_resource_group.group.id
  tags           = var.tags

  primary_network_interface {
    subnet          = ibm_is_subnet.subnet.id
    security_groups = [ibm_is_security_group.sg.id]
  }

  user_data = templatefile("${path.module}/user_data.sh", {
    app_name = var.app_name
  })

  boot_volume {
    name = "${var.prefix}-boot-volume"
  }
}

# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = ibm_is_vpc.vpc.id
}

output "vm_id" {
  description = "ID of the virtual server instance"
  value       = ibm_is_instance.vm.id
}

output "vm_private_ip" {
  description = "Private IP address of the VM"
  value       = ibm_is_instance.vm.primary_network_interface[0].primary_ip[0].address
}

output "vm_public_ip" {
  description = "Public IP address of the VM"
  value       = ibm_is_floating_ip.fip.address
}

output "application_url" {
  description = "URL to access the application"
  value       = "http://${ibm_is_floating_ip.fip.address}"
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh root@${ibm_is_floating_ip.fip.address}"
}
