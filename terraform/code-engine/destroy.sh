#!/bin/bash

# IBM Code Engine Destroy Script
# This script forcefully destroys all Code Engine resources

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== IBM Code Engine Destroy ===${NC}"
echo -e "${RED}WARNING: This will delete all Code Engine resources!${NC}"
echo -e "${YELLOW}Container Registry namespace and images will be preserved.${NC}"
echo ""

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo -e "${RED}Error: terraform.tfvars not found!${NC}"
    exit 1
fi

# Load project name from terraform.tfvars
PROJECT_NAME=$(grep 'project_name' terraform.tfvars | cut -d'"' -f2)

echo -e "${YELLOW}Project to destroy: $PROJECT_NAME${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Destroy cancelled."
    exit 0
fi

echo ""
echo -e "${GREEN}Step 1: Running Terraform destroy...${NC}"
if ! terraform destroy -auto-approve; then
    echo -e "${YELLOW}Terraform destroy had issues. Attempting force cleanup...${NC}"
fi

echo ""
echo -e "${GREEN}Step 2: Force deleting Code Engine project via CLI...${NC}"

# Select and delete the project
if ibmcloud ce project select --name $PROJECT_NAME 2>/dev/null; then
    echo "Deleting project: $PROJECT_NAME"
    if ibmcloud ce project delete --name $PROJECT_NAME --force --hard; then
        echo -e "${GREEN}✓ Project deleted successfully${NC}"
    else
        echo -e "${YELLOW}Warning: Could not delete project via CLI${NC}"
    fi
else
    echo -e "${GREEN}✓ Project already deleted${NC}"
fi

echo ""
echo -e "${GREEN}=== Cleanup Complete! ===${NC}"
echo ""
echo -e "${YELLOW}Note: Container Registry namespace and images were preserved.${NC}"
echo "You can redeploy using: ./deploy.sh"

# Made with Bob
