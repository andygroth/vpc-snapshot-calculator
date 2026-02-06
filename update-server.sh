#!/bin/bash

###############################################################################
# VPC Snapshot Calculator - Server Update Script
# 
# This script automates the update process on Ubuntu servers:
# - Pulls latest code from GitHub
# - Installs new dependencies
# - Rebuilds the application
# - Restarts services
#
# Usage: ./update-server.sh [options]
# Options:
#   --production    Update production build (default)
#   --dev           Update development service
#   --no-restart    Skip service restart
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
MODE="production"
RESTART_SERVICE=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            MODE="production"
            shift
            ;;
        --dev)
            MODE="dev"
            shift
            ;;
        --no-restart)
            RESTART_SERVICE=false
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [--production|--dev] [--no-restart]"
            exit 1
            ;;
    esac
done

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Start update process
echo ""
echo "=========================================="
echo "  VPC Snapshot Calculator Update Script"
echo "=========================================="
echo ""

print_info "Update mode: $MODE"
print_info "Restart services: $RESTART_SERVICE"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if git is installed
if ! command_exists git; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Step 1: Backup current build (if exists)
print_info "Creating backup of current build..."
if [ -d "dist" ]; then
    BACKUP_DIR="dist.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r dist "$BACKUP_DIR"
    print_success "Backup created: $BACKUP_DIR"
else
    print_warning "No existing build found to backup"
fi

# Step 2: Stash any local changes
print_info "Checking for local changes..."
if ! git diff-index --quiet HEAD --; then
    print_warning "Local changes detected. Stashing them..."
    git stash
    print_success "Local changes stashed"
fi

# Step 3: Pull latest code
print_info "Pulling latest code from GitHub..."
if git pull origin main; then
    print_success "Code updated successfully"
else
    print_error "Failed to pull latest code"
    exit 1
fi

# Step 4: Install/update dependencies
print_info "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 5: Build application (for production mode)
if [ "$MODE" = "production" ]; then
    print_info "Building production bundle..."
    if npm run build; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        # Restore backup if build fails
        if [ -d "$BACKUP_DIR" ]; then
            print_warning "Restoring backup..."
            rm -rf dist
            mv "$BACKUP_DIR" dist
            print_success "Backup restored"
        fi
        exit 1
    fi
    
    # Remove backup if build was successful
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$BACKUP_DIR"
        print_info "Backup removed (build successful)"
    fi
fi

# Step 6: Restart services
if [ "$RESTART_SERVICE" = true ]; then
    print_info "Restarting services..."
    
    if [ "$MODE" = "production" ]; then
        # Restart Nginx for production
        if command_exists nginx; then
            if sudo systemctl restart nginx; then
                print_success "Nginx restarted successfully"
            else
                print_warning "Failed to restart Nginx (may need sudo privileges)"
            fi
        else
            print_warning "Nginx not found, skipping restart"
        fi
    else
        # Restart development service
        if systemctl is-active --quiet vpc-calculator; then
            if sudo systemctl restart vpc-calculator; then
                print_success "Development service restarted successfully"
            else
                print_warning "Failed to restart service (may need sudo privileges)"
            fi
        else
            print_warning "Development service not running, skipping restart"
        fi
    fi
fi

# Step 7: Display status
echo ""
print_success "Update completed successfully!"
echo ""
print_info "Summary:"
echo "  - Mode: $MODE"
echo "  - Git branch: $(git branch --show-current)"
echo "  - Latest commit: $(git log -1 --pretty=format:'%h - %s')"
echo "  - Node version: $(node --version)"
echo "  - npm version: $(npm --version)"

if [ "$MODE" = "production" ]; then
    echo ""
    print_info "Production build is ready in the 'dist' directory"
    if command_exists nginx; then
        print_info "Nginx status: $(systemctl is-active nginx)"
    fi
else
    echo ""
    print_info "Development mode"
    if systemctl is-active --quiet vpc-calculator; then
        print_info "Service status: $(systemctl is-active vpc-calculator)"
    fi
fi

echo ""
print_success "All done! 🚀"
echo ""

# Made with Bob
