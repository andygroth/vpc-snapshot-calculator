# IBM Cloud VPC Snapshot Calculator

A professional web-based calculator for estimating monthly costs of IBM Cloud VPC Snapshots for block storage volumes. Built with React and IBM Carbon Design System.

![IBM Cloud VPC Snapshot Calculator](https://img.shields.io/badge/IBM-Cloud-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Carbon Design System](https://img.shields.io/badge/Carbon-Design-blue)

## Features

✅ **Volume Configuration**
- Configure number of systems
- Set average volume size per system
- Automatic total volume calculation

✅ **Change Rate Selection**
- Preset options: Low (5%), Medium (20%), High (40%)
- Custom change rate input
- Industry-standard assumptions

✅ **Multiple Snapshot Schedules**
- Hourly snapshots
- Daily snapshots
- Weekly snapshots
- Monthly snapshots
- Concurrent schedule support
- Customizable retention for each schedule

✅ **Cost Calculation**
- Real-time cost estimates
- Per-schedule breakdown
- Total monthly and annual costs
- Storage usage details

✅ **Professional Design**
- IBM Carbon Design System
- Responsive layout
- Dark theme (g100)
- Accessible components

## Prerequisites

Before running this application, ensure you have:

- **Node.js** (version 16 or higher)
- **npm** (version 7 or higher) or **yarn**

## Installation

1. **Clone or download this repository**

2. **Navigate to the project directory**
   ```bash
   cd vpc-snapshot-calculator
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

The application will open automatically at `http://localhost:3000`

### Production Build

Build the application for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage Guide

### 1. Configure Data Volume

- **Number of Systems**: Enter the total number of systems with block storage volumes
- **Average Volume Size**: Enter the average size of each volume in GB
- The calculator automatically displays the total base volume

### 2. Select Change Rate

Choose a change rate that matches your workload:

- **Low (5%)**: Production databases with stable data
- **Medium (20%)**: Standard enterprise workloads (default)
- **High (40%)**: Development/test environments with frequent changes
- **Custom**: Define your own percentage

### 3. Configure Snapshot Schedules

Enable and configure one or more schedules:

- **Hourly**: For critical data requiring minimal RPO (e.g., 24 snapshots = last 24 hours)
- **Daily**: Standard for most production workloads (e.g., 7 snapshots = last 7 days)
- **Weekly**: For less critical data (e.g., 4 snapshots = last 4 weeks)
- **Monthly**: Long-term retention for compliance (e.g., 12 snapshots = last 12 months)

### 4. View Results

The calculator displays:
- Total monthly cost
- Total annual cost
- Total storage used
- Per-schedule breakdown with costs
- Pricing details and assumptions

## Calculation Methodology

### Snapshot Storage Formula

```
Total Storage = Initial Snapshot + Sum of Incremental Snapshots

Where:
- Initial Snapshot = Base Volume Size (full copy)
- Incremental Snapshot = Base Volume × Change Rate × Time Factor
```

### Time Factors

- **Hourly**: Daily rate ÷ 24
- **Daily**: Daily rate × 1
- **Weekly**: Daily rate × 7
- **Monthly**: Daily rate × 30

### Example Calculation

**Scenario:**
- 10 systems × 100 GB = 1,000 GB base volume
- Medium change rate (20% daily)
- Daily schedule with 7 snapshots

**Calculation:**
- 1 full snapshot: 1,000 GB
- 6 incremental snapshots: 6 × (1,000 × 0.20) = 1,200 GB
- Total storage: 2,200 GB
- Monthly cost (at $0.05/GB): $110.00

## Pricing Information

### Current Pricing (as of 2026-02-05)

The calculator uses approximate pricing based on IBM Cloud documentation:

- **US South (Dallas)**: $0.05 per GB per month
- **US East (Washington DC)**: $0.05 per GB per month
- **UK (London)**: $0.055 per GB per month
- **Germany (Frankfurt)**: $0.055 per GB per month
- **Japan (Tokyo)**: $0.06 per GB per month

### Updating Pricing

To update pricing information:

1. **Verify current pricing** at [IBM Cloud VPC Pricing](https://www.ibm.com/cloud/vpc/pricing)

2. **Edit the pricing file**: `src/utils/pricing.js`

3. **Update the pricing data**:
   ```javascript
   export const pricingData = {
     lastUpdated: 'YYYY-MM-DD',  // Update this date
     regions: {
       'us-south': {
         pricePerGB: 0.05,  // Update price
         // ...
       }
     }
   };
   ```

4. **Rebuild the application** if deployed

### Important Notes

⚠️ **Pricing Disclaimer**
- Prices shown are estimates and subject to change
- Always verify current rates at IBM Cloud pricing page
- Actual costs may vary based on:
  - Geographic region
  - Volume type
  - Commitment level
  - Enterprise discounts

## Project Structure

```
vpc-snapshot-calculator/
├── src/
│   ├── components/          # React components
│   │   ├── VolumeInput.jsx
│   │   ├── ChangeRateSelector.jsx
│   │   ├── ScheduleConfig.jsx
│   │   ├── ResultsDisplay.jsx
│   │   └── PricingInfo.jsx
│   ├── utils/               # Utility functions
│   │   ├── calculations.js  # Calculation logic
│   │   └── pricing.js       # Pricing data
│   ├── App.jsx              # Main application
│   ├── App.scss             # Styles
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
└── README.md                # This file
```

## Technology Stack

- **React 18.2** - UI framework
- **Vite 5.0** - Build tool and dev server
- **IBM Carbon Design System 1.37** - UI components and styling
- **Sass** - CSS preprocessing

## Deployment

### Ubuntu Server Deployment

Complete guide for deploying on Ubuntu Server (20.04 LTS or higher).

#### Prerequisites

Update your system:
```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 1: Install Node.js and npm

Install Node.js 18.x (LTS):
```bash
# Install curl if not present
sudo apt install -y curl

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

#### Step 2: Install Git (if not already installed)

```bash
sudo apt install -y git
```

#### Step 3: Clone the Repository

```bash
# Navigate to your desired directory
cd /var/www  # or any directory you prefer

# Clone the repository
git clone https://github.com/andygroth/vpc-snapshot-calculator.git

# Navigate to project directory
cd vpc-snapshot-calculator
```

#### Step 4: Install Dependencies

```bash
npm install
```

This will install all required packages (~223 MB).

#### Step 5: Build the Application

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

#### Step 6: Install and Configure Nginx

Install Nginx web server:
```bash
sudo apt install -y nginx
```

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/vpc-calculator
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    root /var/www/vpc-snapshot-calculator/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/vpc-calculator /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Step 7: Configure Firewall

```bash
# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status
```

#### Step 8: Access the Application

Open your browser and navigate to:
- `http://your-server-ip`
- or `http://your-domain.com`

#### Optional: Enable HTTPS with Let's Encrypt

Install Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to configure HTTPS. Certbot will automatically:
- Obtain a certificate
- Configure Nginx for HTTPS
- Set up automatic renewal

#### Optional: Set Up as a Service (Development Mode)

If you want to run the development server as a service:

Create a systemd service file:
```bash
sudo nano /etc/systemd/system/vpc-calculator.service
```

Add the following:
```ini
[Unit]
Description=VPC Snapshot Calculator
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/vpc-snapshot-calculator
ExecStart=/usr/bin/npm run dev -- --host 0.0.0.0
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable vpc-calculator
sudo systemctl start vpc-calculator
sudo systemctl status vpc-calculator
```

#### Updating the Application

To update to the latest version:

```bash
cd /var/www/vpc-snapshot-calculator

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart Nginx (if using production build)
sudo systemctl restart nginx

# Or restart service (if using development mode)
sudo systemctl restart vpc-calculator
```

#### Troubleshooting

**Port 3000 already in use:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

**Permission issues:**
```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/vpc-snapshot-calculator

# Set correct permissions
sudo chmod -R 755 /var/www/vpc-snapshot-calculator
```

**Nginx not starting:**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check Nginx configuration
sudo nginx -t
```

**Application not loading:**
```bash
# Check if build directory exists
ls -la /var/www/vpc-snapshot-calculator/dist

# Rebuild if necessary
cd /var/www/vpc-snapshot-calculator
npm run build
```

### Static Hosting Options

This application can also be deployed to any static hosting service:

#### GitHub Pages

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to GitHub Pages

#### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

#### Vercel

1. Import your repository to Vercel
2. Vercel will auto-detect Vite configuration
3. Deploy with one click

#### IBM Cloud Static Web Apps

1. Build the application
2. Upload the `dist` folder to IBM Cloud Object Storage
3. Configure as a static website

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

This application follows WCAG 2.1 Level AA guidelines:
- Keyboard navigation support
- Screen reader compatible
- Sufficient color contrast
- Focus indicators
- Semantic HTML

## Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is provided as-is for use with IBM Cloud services.

## Support

For issues or questions:
- Check IBM Cloud documentation
- Verify pricing at [IBM Cloud Pricing](https://www.ibm.com/cloud/vpc/pricing)
- Review calculation methodology in this README

## Changelog

### Version 1.0.0 (2026-02-05)
- Initial release
- Volume configuration
- Change rate selection (Low/Medium/High/Custom)
- Multiple concurrent schedules
- Real-time cost calculation
- IBM Carbon Design System integration
- Responsive design
- Pricing information with verification

## Acknowledgments

- Built with [IBM Carbon Design System](https://carbondesignsystem.com/)
- Powered by [React](https://react.dev/)
- Bundled with [Vite](https://vitejs.dev/)

---

**Note**: This calculator provides cost estimates based on configured parameters. Always verify pricing and calculations for production planning.
