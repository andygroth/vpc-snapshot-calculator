# IBM Code Engine Deployment Guide

Deploy the VPC Snapshot Calculator to IBM Code Engine with Terraform.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    IBM Code Engine                       │
│                                                          │
│  ┌──────────────────┐         ┌──────────────────┐     │
│  │   Frontend App   │────────▶│   Backend API    │     │
│  │  (Static React)  │         │  (Node.js/Express)│     │
│  │                  │         │                  │     │
│  │  - Vite build    │         │  - Pricing API   │     │
│  │  - Nginx server  │         │  - Caching       │     │
│  │  - Port 8080     │         │  - Port 3001     │     │
│  └──────────────────┘         └──────────────────┘     │
│         │                              │                │
│         │                              │                │
│         └──────────────────────────────┘                │
│                      │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
                       ▼
              IBM Cloud Pricing API
```

## Prerequisites

1. **IBM Cloud Account** with appropriate permissions
2. **IBM Cloud CLI** installed
3. **Terraform** (>= 1.0) installed
4. **Docker** installed (for building images)
5. **IBM Cloud API Key** (get from https://cloud.ibm.com/iam/apikeys)

## Quick Start

### 1. Install IBM Cloud CLI Plugins

```bash
# Install Container Registry plugin
ibmcloud plugin install container-registry

# Install Code Engine plugin
ibmcloud plugin install code-engine

# Install Kubernetes Service plugin (for kubectl)
ibmcloud plugin install kubernetes-service
```

### 2. Login to IBM Cloud

```bash
# Login
ibmcloud login --apikey YOUR_API_KEY

# Target your resource group
ibmcloud target -g Default

# Login to Container Registry
ibmcloud cr login
```

### 3. Build and Push Docker Images

#### Build API Image

```bash
cd api

# Build the image
docker build -t us.icr.io/vpc-calculator/vpc-calculator-api:latest .

# Push to IBM Container Registry
docker push us.icr.io/vpc-calculator/vpc-calculator-api:latest
```

#### Build Frontend Image

First, create a Dockerfile for the frontend:

```dockerfile
# Dockerfile (in project root)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

Create nginx.conf:

```nginx
server {
    listen 8080;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and push:

```bash
# Build frontend image
docker build -t us.icr.io/vpc-calculator/vpc-calculator-frontend:latest .

# Push to IBM Container Registry
docker push us.icr.io/vpc-calculator/vpc-calculator-frontend:latest
```

### 4. Configure Terraform

```bash
cd terraform/code-engine

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
nano terraform.tfvars
```

Required variables:
```hcl
ibmcloud_api_key = "your-terraform-api-key"
pricing_api_key  = "your-pricing-api-key"
region           = "us-south"
```

### 5. Deploy with Terraform

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

### 6. Access Your Application

After deployment, Terraform will output the URLs:

```bash
# Get the URLs
terraform output frontend_url
terraform output api_endpoint
```

Visit the frontend URL in your browser!

## Configuration

### Environment Variables

#### Backend API

| Variable | Description | Default |
|----------|-------------|---------|
| `IBM_CLOUD_API_KEY` | API key for pricing data | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | production |
| `CACHE_TTL` | Cache duration (seconds) | 86400 |
| `CORS_ORIGIN` | Allowed CORS origin | * |

#### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | Auto-configured |

### Scaling Configuration

Modify in `terraform.tfvars`:

```hcl
# API Scaling
api_min_instances = 0    # Scale to zero when idle
api_max_instances = 10   # Maximum instances
api_cpu_limit     = "0.5"
api_memory_limit  = "1G"

# Frontend Scaling
frontend_min_instances = 0
frontend_max_instances = 10
```

## Cost Optimization

### Scale to Zero

Code Engine can scale to zero when not in use:

```hcl
api_min_instances      = 0
frontend_min_instances = 0
```

This means you only pay when the application is actively serving requests.

### Resource Limits

Adjust CPU and memory based on your needs:

```hcl
# Smaller instances = lower cost
api_cpu_limit    = "0.25"  # 0.25 vCPU
api_memory_limit = "0.5G"  # 512 MB
```

### Caching

Increase cache TTL to reduce API calls:

```hcl
cache_ttl = "86400"  # 24 hours
```

## Monitoring

### View Logs

```bash
# List applications
ibmcloud ce app list

# View API logs
ibmcloud ce app logs --name vpc-snapshot-calculator-api

# View frontend logs
ibmcloud ce app logs --name vpc-snapshot-calculator
```

### Health Checks

```bash
# Check API health
curl https://YOUR_API_URL/health

# Check cache stats
curl https://YOUR_API_URL/api/cache/stats
```

### Metrics

View metrics in IBM Cloud Console:
1. Navigate to Code Engine
2. Select your project
3. Click on Applications
4. View metrics for each app

## Updating the Application

### Update API

```bash
# Build new image
cd api
docker build -t us.icr.io/vpc-calculator/vpc-calculator-api:v1.2.0 .
docker push us.icr.io/vpc-calculator/vpc-calculator-api:v1.2.0

# Update Terraform variable
# In terraform.tfvars:
api_image_tag = "v1.2.0"

# Apply changes
terraform apply
```

### Update Frontend

```bash
# Build new image
docker build -t us.icr.io/vpc-calculator/vpc-calculator-frontend:v1.2.0 .
docker push us.icr.io/vpc-calculator/vpc-calculator-frontend:v1.2.0

# Update Terraform variable
frontend_image_tag = "v1.2.0"

# Apply changes
terraform apply
```

## Troubleshooting

### Application Not Starting

```bash
# Check application status
ibmcloud ce app get --name vpc-snapshot-calculator-api

# View recent logs
ibmcloud ce app logs --name vpc-snapshot-calculator-api --tail 100
```

### API Key Issues

Verify the secret is configured:

```bash
# List secrets
ibmcloud ce secret list

# Get secret details
ibmcloud ce secret get --name ibm-cloud-api-key
```

### Image Pull Errors

Ensure Container Registry access:

```bash
# Verify namespace exists
ibmcloud cr namespace-list

# Check image exists
ibmcloud cr image-list --restrict vpc-calculator
```

### CORS Errors

Update CORS origin in terraform.tfvars:

```hcl
cors_origin = "https://your-frontend-url.codeengine.appdomain.cloud"
```

Then apply:

```bash
terraform apply
```

## Custom Domain

To use a custom domain:

1. Create a custom domain mapping in Code Engine
2. Update DNS records
3. Configure SSL certificate

```bash
# Create domain mapping
ibmcloud ce domainmapping create \
  --name vpc-calculator \
  --domain your-domain.com \
  --target vpc-snapshot-calculator
```

## Cleanup

To remove all resources:

```bash
# Destroy Terraform resources
terraform destroy

# Delete Container Registry images (optional)
ibmcloud cr image-rm us.icr.io/vpc-calculator/vpc-calculator-api:latest
ibmcloud cr image-rm us.icr.io/vpc-calculator/vpc-calculator-frontend:latest

# Delete namespace (optional)
ibmcloud cr namespace-rm vpc-calculator
```

## Security Best Practices

1. **API Keys**: Never commit API keys to Git
2. **Secrets**: Use Code Engine secrets for sensitive data
3. **CORS**: Restrict CORS to your frontend domain in production
4. **HTTPS**: Code Engine provides HTTPS by default
5. **IAM**: Use least-privilege IAM policies

## Support

- [IBM Code Engine Documentation](https://cloud.ibm.com/docs/codeengine)
- [Terraform IBM Provider](https://registry.terraform.io/providers/IBM-Cloud/ibm/latest/docs)
- [Project GitHub](https://github.com/andygroth/vpc-snapshot-calculator)

## License

MIT
