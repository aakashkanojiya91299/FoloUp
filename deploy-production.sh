#!/bin/bash

# Production Deployment Script for FoloUp
# Usage: ./deploy-production.sh

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2@latest
fi

# Check if environment files exist
if [ ! -f ".env" ]; then
    print_warning "Production environment file (.env) not found"
    if [ -f "env.production.example" ]; then
        print_status "Creating .env from production example..."
        cp env.production.example .env
        print_warning "Please edit .env with your production values before continuing"
        exit 1
    else
        print_error "No environment template found. Please create .env file manually"
        exit 1
    fi
fi

if [ ! -f "ATS-System/.env" ]; then
    print_warning "ATS System environment file (ATS-System/.env) not found"
    if [ -f "ATS-System/env.example" ]; then
        print_status "Creating ATS-System/.env from example..."
        cp ATS-System/env.example ATS-System/.env
        print_warning "Please edit ATS-System/.env with your production values before continuing"
        exit 1
    else
        print_error "No ATS System environment template found. Please create ATS-System/.env file manually"
        exit 1
    fi
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs

# Install dependencies
print_status "Installing dependencies..."
npm run setup:all

# Build applications
print_status "Building applications..."
npm run build:all

# Stop existing PM2 processes
print_status "Stopping existing PM2 processes..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start applications with production environment
print_status "Starting applications with production configuration..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup

# Display status
print_status "Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "📝 Log Locations:"
echo "  Next.js: ./logs/foloup-nextjs-*.log"
echo "  ATS System: ./logs/foloup-ats-*.log"

echo ""
echo "🔧 Useful Commands:"
echo "  View logs: pm2 logs"
echo "  Monitor: pm2 monit"
echo "  Restart: pm2 restart ecosystem.config.js"
echo "  Reload: pm2 reload ecosystem.config.js"

echo ""
print_status "Production deployment completed! 🎉" 
