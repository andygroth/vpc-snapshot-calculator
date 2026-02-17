# Simplified Code Engine Deployment

Deploy VPC Snapshot Calculator to IBM Code Engine **without building containers locally!**

## How It Works

This simplified approach uses Code Engine's **build-from-source** capability:

1. ✅ Push code to GitHub
2. ✅ Code Engine pulls from GitHub
3. ✅ Code Engine builds images natively on AMD64
4. ✅ Code Engine deploys automatically

**No Docker/Podman needed on your Mac!**

## Prerequisites

1. **IBM Cloud Account** with Code Engine access
2. **IBM Cloud CLI** installed
3. **Terraform** (>= 1.0) installed
4. **IBM Cloud API Key** (get from https://cloud.ibm.com/iam/apikeys)
5. **Code pushed to GitHub**

## Quick Start

### 1. Ensure Code is on GitHub

```bash
# Make sure all changes are committed and pushed
git add .
git commit -m "Ready for Code Engine deployment"
git push origin main
```

### 2. Configure Terraform

```bash
cd terraform/code-engine-simple

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

Required variables:
```hcl
ibmcloud_api_key    = "your-api-key"
pricing_api_key     = "your-api-key"  # Can be same
region              = "eu-de"
resource_group_name = "andygroth-rg"
github_repo_url     = "https://github.com/andygroth/vpc-snapshot-calculator"
```

### 3. Deploy

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Deploy!
terraform apply
```

### 4. Access Your Application

After deployment (takes 5-10 minutes for builds):

```bash
# Get the URLs
terraform output frontend_url
terraform output api_endpoint

# Check build status
terraform output api_build_status
terraform output frontend_build_status
```

## How Builds Work

### Build Process

1. **Terraform creates build configurations** pointing to your GitHub repo
2. **Code Engine clones your repo** on IBM Cloud
3. **Code Engine builds Docker images** natively on AMD64 (no emulation!)
4. **Images are stored** in IBM Cloud Container Registry
5. **Applications are deployed** using the built images

### Build Resources

- **API Build**: Builds from `/api` directory
- **Frontend Build**: Builds from root directory
- **Build Size**: Medium (sufficient for most apps)
- **Build Time**: 5-10 minutes per image

## Updating Your Application

### Update Code

```bash
# Make changes locally
git add .
git commit -m "Update application"
git push origin main

# Trigger rebuild and redeploy
cd terraform/code-engine-simple
terraform apply
```

Code Engine will:
1. Pull latest code from GitHub
2. Rebuild images
3. Deploy new versions

### Update Configuration

```bash
# Edit terraform.tfvars
nano terraform.tfvars

# Apply changes
terraform apply
```

## Advantages Over Local Builds

| Local Build Approach | Build-from-Source |
|---------------------|-------------------|
| ❌ Requires Docker/Podman | ✅ No local tools needed |
| ❌ Apple Silicon issues | ✅ Native AMD64 builds |
| ❌ Cross-platform emulation | ✅ No emulation |
| ❌ Memory intensive | ✅ Cloud resources |
| ❌ Slow on Mac | ✅ Fast cloud builds |
| ❌ Manual image push | ✅ Automatic |

## Monitoring

### View Build Logs

```bash
# List builds
ibmcloud ce build list

# Get build details
ibmcloud ce build get --name vpc-snapshot-calculator-api-build

# View build logs
ibmcloud ce buildrun logs --build vpc-snapshot-calculator-api-build
```

### View Application Logs

```bash
# List applications
ibmcloud ce app list

# View API logs
ibmcloud ce app logs --name vpc-snapshot-calculator-api

# View frontend logs
ibmcloud ce app logs --name vpc-snapshot-calculator
```

## Troubleshooting

### Build Fails

```bash
# Check build status
terraform output api_build_status
terraform output frontend_build_status

# View build logs
ibmcloud ce buildrun logs --build vpc-snapshot-calculator-api-build
```

Common issues:
- **Dockerfile errors**: Check Dockerfile syntax
- **Missing dependencies**: Ensure package.json is correct
- **GitHub access**: Verify repo is public or add credentials

### Application Not Starting

```bash
# Check application status
ibmcloud ce app get --name vpc-snapshot-calculator-api

# View recent logs
ibmcloud ce app logs --name vpc-snapshot-calculator-api --tail 100
```

### Rebuild from Scratch

```bash
# Destroy everything
terraform destroy

# Redeploy
terraform apply
```

## Cost Optimization

### Scale to Zero

```hcl
api_min_instances      = 0
frontend_min_instances = 0
```

Applications scale to zero when idle - you only pay for:
- Active request time
- Build time (minimal)

### Build Optimization

- Builds are cached - subsequent builds are faster
- Only rebuild when code changes
- Use `.dockerignore` to exclude unnecessary files

## Cleanup

```bash
# Remove all resources
terraform destroy

# Optionally delete build images
ibmcloud cr image-rm private.eu-de.icr.io/vpc-snapshot-calculator/api
ibmcloud cr image-rm private.eu-de.icr.io/vpc-snapshot-calculator/frontend
```

## Comparison with Previous Approach

### Old Approach (terraform/code-engine/)
- ❌ Required local Docker/Podman
- ❌ Manual image builds
- ❌ Manual image pushes
- ❌ Container Registry namespace management
- ❌ Apple Silicon compatibility issues

### New Approach (terraform/code-engine-simple/)
- ✅ No local container tools
- ✅ Automatic builds on IBM Cloud
- ✅ Native AMD64 builds
- ✅ Simpler configuration
- ✅ Works perfectly on Apple Silicon

## Support

- [IBM Code Engine Documentation](https://cloud.ibm.com/docs/codeengine)
- [Code Engine Builds](https://cloud.ibm.com/docs/codeengine?topic=codeengine-plan-build)
- [Project GitHub](https://github.com/andygroth/vpc-snapshot-calculator)

## License

MIT
