#!/bin/bash

# IBM Code Engine Deployment Script
# This script builds Docker images, pushes them to IBM Container Registry,
# and deploys the application using Terraform.

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== IBM Code Engine Deployment ===${NC}"

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform.tfvars not found!${NC}"
    echo "Please create terraform.tfvars from terraform.tfvars.example"
    exit 1
fi

# Load variables from terraform.tfvars
REGION=$(grep 'region' terraform.tfvars | cut -d'"' -f2)
REGISTRY_REGION=$(grep 'registry_region' terraform.tfvars | cut -d'"' -f2)
REGISTRY_NAMESPACE=$(grep 'registry_namespace' terraform.tfvars | cut -d'"' -f2)
API_IMAGE_TAG=$(grep 'api_image_tag' terraform.tfvars | cut -d'"' -f2 || echo "latest")
FRONTEND_IMAGE_TAG=$(grep 'frontend_image_tag' terraform.tfvars | cut -d'"' -f2 || echo "latest")

echo -e "${YELLOW}Configuration:${NC}"
echo "  Region: $REGION"
echo "  Registry Region: $REGISTRY_REGION"
echo "  Registry Namespace: $REGISTRY_NAMESPACE"
echo "  API Image Tag: $API_IMAGE_TAG"
echo "  Frontend Image Tag: $FRONTEND_IMAGE_TAG"
echo ""

# Step 1: Login to IBM Cloud
echo -e "${GREEN}Step 1: Logging in to IBM Cloud...${NC}"
if ! ibmcloud login --apikey $(grep 'ibmcloud_api_key' terraform.tfvars | cut -d'"' -f2) -r $REGION; then
    echo -e "${RED}Failed to login to IBM Cloud${NC}"
    exit 1
fi

# Step 2: Login to Container Registry
echo -e "${GREEN}Step 2: Logging in to Container Registry...${NC}"
if ! ibmcloud cr login --client docker; then
    echo -e "${RED}Failed to login to Container Registry${NC}"
    exit 1
fi

# Step 3: Build and push API image
echo -e "${GREEN}Step 3: Building and pushing API image...${NC}"
cd ../../api
API_IMAGE="${REGISTRY_REGION}.icr.io/${REGISTRY_NAMESPACE}/vpc-calculator-api:${API_IMAGE_TAG}"
echo "Building: $API_IMAGE"
if ! docker build -t $API_IMAGE .; then
    echo -e "${RED}Failed to build API image${NC}"
    exit 1
fi
if ! docker push $API_IMAGE; then
    echo -e "${RED}Failed to push API image${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API image pushed successfully${NC}"

# Step 4: Build and push frontend image
echo -e "${GREEN}Step 4: Building and pushing frontend image...${NC}"
cd ..
FRONTEND_IMAGE="${REGISTRY_REGION}.icr.io/${REGISTRY_NAMESPACE}/vpc-calculator-frontend:${FRONTEND_IMAGE_TAG}"
echo "Building: $FRONTEND_IMAGE"
if ! docker build -t $FRONTEND_IMAGE .; then
    echo -e "${RED}Failed to build frontend image${NC}"
    exit 1
fi
if ! docker push $FRONTEND_IMAGE; then
    echo -e "${RED}Failed to push frontend image${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend image pushed successfully${NC}"

# Step 5: Initialize Terraform
echo -e "${GREEN}Step 5: Initializing Terraform...${NC}"
cd terraform/code-engine
if ! terraform init; then
    echo -e "${RED}Failed to initialize Terraform${NC}"
    exit 1
fi

# Step 6: Apply Terraform configuration
echo -e "${GREEN}Step 6: Applying Terraform configuration...${NC}"
if ! terraform apply -auto-approve; then
    echo -e "${RED}Terraform apply failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "Application URLs:"
terraform output -raw frontend_url 2>/dev/null && echo ""
echo ""
echo "API Endpoint:"
terraform output -raw api_endpoint 2>/dev/null && echo ""
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for the applications to be fully available.${NC}"

# Made with Bob
