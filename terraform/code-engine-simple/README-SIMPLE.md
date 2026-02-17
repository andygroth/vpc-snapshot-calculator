# Ultra-Simplified Code Engine Deployment

**No Docker builds, no Container Registry, no complexity!**

## How This Works

Instead of building custom container images, this approach:

1. ✅ Uses public base images (Node.js, Nginx)
2. ✅ Clones your GitHub repo at startup
3. ✅ Installs dependencies and runs your app
4. ✅ Everything happens in Code Engine

**No local builds needed. No architecture issues. Just works!**

## Quick Deploy

```bash
cd terraform/code-engine-simple

# Backup the complex version
mv main.tf main-complex.tf.bak

# Use the simple version
mv main-simple.tf main.tf

# Configure (if not already done)
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars

# Deploy!
terraform init
terraform apply
```

## How It Works

### Backend API
- Starts with `node:18-alpine` image
- Clones your GitHub repo
- Runs `npm install && npm start`
- Serves on port 3001

### Frontend
- Starts with `nginx:alpine` image
- Clones your GitHub repo
- Runs `npm install && npm run build`
- Serves built files with Nginx on port 8080

## Advantages

| Complex Approach | Simple Approach |
|-----------------|-----------------|
| ❌ Custom Docker builds | ✅ Public base images |
| ❌ Container Registry | ✅ No registry needed |
| ❌ Build secrets | ✅ No secrets for builds |
| ❌ Architecture issues | ✅ No build issues |
| ❌ Build failures | ✅ Just works |

## Trade-offs

**Pros:**
- ✅ No build complexity
- ✅ No architecture issues
- ✅ Faster to deploy
- ✅ Easier to debug

**Cons:**
- ⚠️ Slower cold starts (needs to clone & build)
- ⚠️ Uses more memory during startup
- ⚠️ Not ideal for production at scale

## For Production

This approach is great for:
- ✅ Development/testing
- ✅ Proof of concept
- ✅ Low-traffic applications

For high-traffic production, consider:
- Pre-built container images
- IBM Cloud Toolchain
- External CI/CD

## Troubleshooting

### App Not Starting

```bash
# Check logs
ibmcloud ce app logs --name vpc-snapshot-calculator-api --tail 100

# Common issues:
# - GitHub clone failed (check repo URL)
# - npm install failed (check package.json)
# - Port mismatch (should be 3001 for API, 8080 for frontend)
```

### Slow Startup

This is normal! The app needs to:
1. Clone repo (~5-10 seconds)
2. Install dependencies (~30-60 seconds)
3. Build (frontend only, ~30-60 seconds)
4. Start serving

First request may take 1-2 minutes.

## Cleanup

```bash
terraform destroy
```

## Next Steps

Once this works, you can:
1. Optimize with pre-built images
2. Set up CI/CD pipeline
3. Add caching for faster startups
4. Move to production-grade setup

But for now, this gets you deployed without any build complexity!
