#!/bin/bash
# User Data Script for IBM Cloud VPC Snapshot Calculator
# This script installs Node.js, builds the app, and configures nginx

set -e

# Log everything
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=========================================="
echo "Starting deployment of ${app_name}"
echo "=========================================="

# Update system
echo "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "Installing required packages..."
apt-get install -y \
    curl \
    git \
    nginx \
    unzip \
    build-essential

# Install Node.js 18.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installations
echo "Verifying installations..."
node --version
npm --version
nginx -v

# Create application directory
APP_DIR="/opt/${app_name}"
echo "Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Download application code from the VM's local filesystem
# Note: In production, you'd typically clone from git or download from object storage
# For now, we'll create a deployment script that can be run after terraform apply

# Create a placeholder index.html for nginx
echo "Creating placeholder page..."
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VPC Snapshot Calculator - Deploying</title>
    <style>
        body {
            font-family: 'IBM Plex Sans', Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0f62fe 0%, #001d6c 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid white;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .instructions {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>IBM Cloud VPC Snapshot Calculator</h1>
        <p>Deployment in progress...</p>
        <div class="spinner"></div>
        <div class="instructions">
            <p><strong>Next Steps:</strong></p>
            <p>1. SSH into the server</p>
            <p>2. Run the deployment script: <code>/opt/deploy-app.sh</code></p>
            <p>3. Refresh this page</p>
        </div>
    </div>
</body>
</html>
EOF

# Create deployment script
echo "Creating deployment script..."
cat > /opt/deploy-app.sh <<'DEPLOY_SCRIPT'
#!/bin/bash
# Deployment script for VPC Snapshot Calculator
# Run this script after uploading the application code

set -e

APP_DIR="/opt/vpc-snapshot-calculator"
WEB_ROOT="/var/www/html"

echo "=========================================="
echo "Deploying VPC Snapshot Calculator"
echo "=========================================="

# Check if application code exists
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "ERROR: Application code not found at $APP_DIR"
    echo "Please upload the application code first:"
    echo "  scp -r vpc-snapshot-calculator root@<server-ip>:/opt/"
    exit 1
fi

cd $APP_DIR

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building application..."
npm run build

# Copy built files to nginx web root
echo "Deploying to nginx..."
rm -rf $WEB_ROOT/*
cp -r dist/* $WEB_ROOT/

# Set proper permissions
chown -R www-data:www-data $WEB_ROOT
chmod -R 755 $WEB_ROOT

# Restart nginx
echo "Restarting nginx..."
systemctl restart nginx

echo "=========================================="
echo "Deployment complete!"
echo "Application is now available at http://$(curl -s ifconfig.me)"
echo "=========================================="
DEPLOY_SCRIPT

chmod +x /opt/deploy-app.sh

# Configure nginx
echo "Configuring nginx..."
cat > /etc/nginx/sites-available/default <<'NGINX_CONFIG'
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html;

    server_name _;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_CONFIG

# Test nginx configuration
nginx -t

# Enable and start nginx
systemctl enable nginx
systemctl restart nginx

# Create info file
cat > /root/deployment-info.txt <<EOF
========================================
VPC Snapshot Calculator Deployment Info
========================================

Server IP: $(curl -s ifconfig.me)
Application URL: http://$(curl -s ifconfig.me)

Deployment Status: Initial setup complete
Next Steps:
  1. Upload application code:
     scp -r vpc-snapshot-calculator root@$(curl -s ifconfig.me):/opt/
  
  2. Run deployment script:
     ssh root@$(curl -s ifconfig.me)
     /opt/deploy-app.sh

Useful Commands:
  - Check nginx status: systemctl status nginx
  - View nginx logs: tail -f /var/log/nginx/access.log
  - View deployment logs: tail -f /var/log/user-data.log
  - Restart nginx: systemctl restart nginx

Application Directory: /opt/vpc-snapshot-calculator
Web Root: /var/www/html
Nginx Config: /etc/nginx/sites-available/default

========================================
EOF

cat /root/deployment-info.txt

echo "=========================================="
echo "Initial setup complete!"
echo "See /root/deployment-info.txt for next steps"
echo "=========================================="

# Made with Bob
