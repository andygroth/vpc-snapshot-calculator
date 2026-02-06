# Deployment Guide - IBM Cloud VPC

This guide explains how to deploy the VPC Snapshot Calculator on an IBM Cloud VPC virtual machine using Terraform.

## Architecture

The deployment creates:
- **VPC** with public gateway
- **Subnet** in availability zone 1
- **Security Group** with rules for HTTP (80), HTTPS (443), and SSH (22)
- **Virtual Server Instance** (Ubuntu 22.04) with Node.js and nginx
- **Floating IP** for public access

## Prerequisites

### 1. Install Required Tools

**Terraform** (v1.0 or higher)
```bash
# macOS
brew install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
```

**IBM Cloud CLI** (optional, for managing resources)
```bash
curl -fsSL https://clis.cloud.ibm.com/install/linux | sh
```

### 2. Get IBM Cloud API Key

1. Log in to [IBM Cloud Console](https://cloud.ibm.com)
2. Navigate to **Manage** → **Access (IAM)** → **API keys**
3. Click **Create an IBM Cloud API key**
4. Give it a name (e.g., "terraform-vpc-snapshot-calc")
5. Copy and save the API key securely

### 3. (Optional) Create SSH Key

If you want SSH access to the VM:

1. In IBM Cloud Console, go to **VPC Infrastructure** → **SSH keys**
2. Click **Create**
3. Upload your public SSH key or generate a new one
4. Note the key name for later use

## Deployment Steps

### Step 1: Configure Terraform Variables

1. Navigate to the terraform directory:
   ```bash
   cd vpc-snapshot-calculator/terraform
   ```

2. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

3. Edit `terraform.tfvars` with your values:
   ```bash
   nano terraform.tfvars
   ```

   Required values:
   ```hcl
   ibmcloud_api_key = "YOUR_API_KEY_HERE"
   region           = "us-south"
   resource_group   = "Default"
   prefix           = "snapshot-calc"
   ssh_key_name     = "your-ssh-key-name"  # Optional
   ```

### Step 2: Initialize Terraform

```bash
terraform init
```

This downloads the IBM Cloud provider and initializes the working directory.

### Step 3: Review the Plan

```bash
terraform plan
```

Review the resources that will be created:
- 1 VPC
- 1 Public Gateway
- 1 Subnet
- 1 Security Group (with 4 rules)
- 1 Virtual Server Instance
- 1 Floating IP

### Step 4: Apply the Configuration

```bash
terraform apply
```

Type `yes` when prompted to confirm.

**Deployment time:** ~5-10 minutes

### Step 5: Get the Server IP

After successful deployment, Terraform will output:

```
Outputs:

application_url = "http://169.XX.XX.XX"
ssh_command = "ssh root@169.XX.XX.XX"
vm_public_ip = "169.XX.XX.XX"
```

### Step 6: Deploy the Application

The VM is now running with nginx, but the application needs to be deployed.

**Option A: Automated Deployment (Recommended)**

1. From your local machine, upload the application:
   ```bash
   cd /Users/andreasgroth/Desktop
   scp -r vpc-snapshot-calculator root@<VM_IP>:/opt/
   ```

2. SSH into the server:
   ```bash
   ssh root@<VM_IP>
   ```

3. Run the deployment script:
   ```bash
   /opt/deploy-app.sh
   ```

**Option B: Manual Deployment**

1. SSH into the server:
   ```bash
   ssh root@<VM_IP>
   ```

2. Clone or upload the application code to `/opt/vpc-snapshot-calculator`

3. Build and deploy:
   ```bash
   cd /opt/vpc-snapshot-calculator
   npm install
   npm run build
   cp -r dist/* /var/www/html/
   systemctl restart nginx
   ```

### Step 7: Access the Application

Open your browser and navigate to:
```
http://<VM_IP>
```

You should see the VPC Snapshot Calculator!

## Post-Deployment

### Verify Deployment

1. **Check nginx status:**
   ```bash
   ssh root@<VM_IP>
   systemctl status nginx
   ```

2. **View logs:**
   ```bash
   # User data script logs
   tail -f /var/log/user-data.log
   
   # Nginx access logs
   tail -f /var/log/nginx/access.log
   
   # Nginx error logs
   tail -f /var/log/nginx/error.log
   ```

3. **Test the application:**
   ```bash
   curl http://<VM_IP>
   ```

### Update the Application

To deploy updates:

1. Make changes to the application code locally
2. Build the application:
   ```bash
   npm run build
   ```
3. Upload the new build:
   ```bash
   scp -r dist/* root@<VM_IP>:/var/www/html/
   ```
4. Clear browser cache and refresh

### Add HTTPS (Optional)

To add SSL/TLS with Let's Encrypt:

1. Get a domain name and point it to your VM's IP
2. SSH into the server
3. Install certbot:
   ```bash
   apt-get install -y certbot python3-certbot-nginx
   ```
4. Get certificate:
   ```bash
   certbot --nginx -d yourdomain.com
   ```
5. Certbot will automatically configure nginx for HTTPS

## Managing Resources

### View Current Resources

```bash
terraform show
```

### Update Resources

1. Modify `terraform.tfvars` or `main.tf`
2. Run:
   ```bash
   terraform plan
   terraform apply
   ```

### Destroy Resources

⚠️ **Warning:** This will delete all resources and data!

```bash
terraform destroy
```

Type `yes` to confirm.

## Troubleshooting

### Issue: Cannot connect to VM

**Check security group rules:**
```bash
terraform state show ibm_is_security_group.sg
```

**Verify floating IP:**
```bash
terraform output vm_public_ip
```

### Issue: Application not loading

**Check nginx status:**
```bash
ssh root@<VM_IP>
systemctl status nginx
```

**Check if files exist:**
```bash
ssh root@<VM_IP>
ls -la /var/www/html/
```

**Restart nginx:**
```bash
ssh root@<VM_IP>
systemctl restart nginx
```

### Issue: User data script failed

**View logs:**
```bash
ssh root@<VM_IP>
cat /var/log/user-data.log
```

### Issue: SSH connection refused

1. Verify you added an SSH key in `terraform.tfvars`
2. Check that the key exists in IBM Cloud
3. Verify security group allows SSH (port 22)

## Cost Estimation

Approximate monthly costs (US South region):

| Resource | Cost |
|----------|------|
| VPC | Free |
| Public Gateway | ~$45/month |
| Virtual Server (cx2-2x4) | ~$35/month |
| Floating IP | ~$5/month |
| **Total** | **~$85/month** |

**Note:** Costs vary by region and usage. Check [IBM Cloud Pricing](https://cloud.ibm.com/vpc/provision/vs) for current rates.

## Security Best Practices

1. **Change default SSH port** (optional):
   ```bash
   # Edit /etc/ssh/sshd_config
   Port 2222
   systemctl restart sshd
   ```

2. **Enable firewall:**
   ```bash
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw allow 22/tcp
   ufw enable
   ```

3. **Keep system updated:**
   ```bash
   apt-get update && apt-get upgrade -y
   ```

4. **Monitor logs:**
   ```bash
   tail -f /var/log/nginx/access.log
   ```

5. **Use HTTPS** in production (see "Add HTTPS" section above)

## Backup and Recovery

### Backup Application

```bash
# On the VM
cd /opt
tar -czf vpc-snapshot-calculator-backup.tar.gz vpc-snapshot-calculator
```

### Create VPC Snapshot

1. In IBM Cloud Console, go to **VPC Infrastructure** → **Virtual server instances**
2. Select your instance
3. Go to **Storage volumes** → **Boot volume**
4. Click **Create snapshot**

### Restore from Snapshot

1. Create a new instance from the snapshot
2. Attach a floating IP
3. Update DNS if using a domain

## Advanced Configuration

### Custom Domain

1. Get a domain name
2. Add an A record pointing to your VM's IP
3. Update nginx configuration:
   ```nginx
   server_name yourdomain.com www.yourdomain.com;
   ```

### Load Balancer (High Availability)

For production, consider adding:
- IBM Cloud Load Balancer
- Multiple VMs across availability zones
- Auto-scaling groups

### Monitoring

Set up monitoring with:
- IBM Cloud Monitoring (Sysdig)
- IBM Cloud Logging (LogDNA)
- Custom health checks

## Support

For issues:
- Check Terraform logs: `terraform.log`
- Review IBM Cloud status: https://cloud.ibm.com/status
- IBM Cloud documentation: https://cloud.ibm.com/docs

## Cleanup

To remove all resources and avoid charges:

```bash
terraform destroy
```

This will delete:
- Virtual Server Instance
- Floating IP
- Security Group
- Subnet
- Public Gateway
- VPC

**Note:** This action cannot be undone!

---

## Quick Reference

```bash
# Initialize
terraform init

# Plan
terraform plan

# Deploy
terraform apply

# Get outputs
terraform output

# Destroy
terraform destroy

# SSH to VM
ssh root@$(terraform output -raw vm_public_ip)

# Deploy app
scp -r vpc-snapshot-calculator root@$(terraform output -raw vm_public_ip):/opt/
ssh root@$(terraform output -raw vm_public_ip) "/opt/deploy-app.sh"
