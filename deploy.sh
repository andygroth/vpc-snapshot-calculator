#!/bin/bash
# Quick deployment script for VPC Snapshot Calculator

set -e

echo "=========================================="
echo "VPC Snapshot Calculator - Quick Deploy"
echo "=========================================="

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "ERROR: Terraform is not installed"
    echo "Install it from: https://www.terraform.io/downloads"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: Please run this script from the vpc-snapshot-calculator directory"
    exit 1
fi

# Navigate to terraform directory
cd terraform

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "ERROR: terraform.tfvars not found"
    echo "Please create it from terraform.tfvars.example:"
    echo "  cd terraform"
    echo "  cp terraform.tfvars.example terraform.tfvars"
    echo "  nano terraform.tfvars  # Edit with your IBM Cloud API key"
    exit 1
fi

echo ""
echo "Step 1: Initializing Terraform..."
terraform init

echo ""
echo "Step 2: Planning deployment..."
terraform plan

echo ""
read -p "Do you want to proceed with deployment? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo "Step 3: Deploying infrastructure..."
terraform apply -auto-approve

echo ""
echo "Step 4: Getting server IP..."
SERVER_IP=$(terraform output -raw vm_public_ip)

echo ""
echo "=========================================="
echo "Infrastructure deployed successfully!"
echo "=========================================="
echo ""
echo "Server IP: $SERVER_IP"
echo "Application URL: http://$SERVER_IP"
echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for the server to finish setup"
echo "2. Upload the application code:"
echo "   cd .."
echo "   scp -r . root@$SERVER_IP:/opt/vpc-snapshot-calculator/"
echo ""
echo "3. SSH into the server and deploy:"
echo "   ssh root@$SERVER_IP"
echo "   /opt/deploy-app.sh"
echo ""
echo "4. Access the application at: http://$SERVER_IP"
echo ""
echo "=========================================="

# Save deployment info
cat > ../deployment-info.txt <<EOF
VPC Snapshot Calculator - Deployment Info
==========================================

Deployed: $(date)
Server IP: $SERVER_IP
Application URL: http://$SERVER_IP

SSH Command:
  ssh root@$SERVER_IP

Upload Application:
  cd $(pwd)/..
  scp -r . root@$SERVER_IP:/opt/vpc-snapshot-calculator/

Deploy Application:
  ssh root@$SERVER_IP
  /opt/deploy-app.sh

Destroy Infrastructure:
  cd terraform
  terraform destroy

==========================================
EOF

echo "Deployment info saved to: deployment-info.txt"
echo ""

# Made with Bob
