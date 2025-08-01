# PM2 Deployment Guide

This guide explains how to deploy and manage the FoloUp application using PM2 process manager.

## 📋 Prerequisites

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Install dependencies:**
   ```bash
   npm run setup:all
   ```

3. **Build both applications:**
   ```bash
   npm run build:all
   ```

4. **Configure environment files:**
   ```bash
   # Copy example environment files
   cp env.example .env.local
   cp ATS-System/env.example ATS-System/.env.local
   
   # Edit the files with your actual values
   nano .env.local
   nano ATS-System/.env.local
   ```

## 🚀 PM2 Commands

### **Start Applications**
```bash
# Start both Next.js and ATS System
npm run pm2:start

# Or directly with PM2
pm2 start ecosystem.config.js
```

### **Stop Applications**
```bash
# Stop both applications
npm run pm2:stop

# Or directly with PM2
pm2 stop ecosystem.config.js
```

### **Restart Applications**
```bash
# Restart both applications
npm run pm2:restart

# Or directly with PM2
pm2 restart ecosystem.config.js
```

### **Reload Applications (Zero-downtime)**
```bash
# Reload both applications
npm run pm2:reload

# Or directly with PM2
pm2 reload ecosystem.config.js
```

### **Delete Applications**
```bash
# Remove applications from PM2
npm run pm2:delete

# Or directly with PM2
pm2 delete ecosystem.config.js
```

### **Monitoring**
```bash
# View logs
npm run pm2:logs

# Check status
npm run pm2:status

# Open monitoring dashboard
npm run pm2:monit
```

## 📊 Application Details

### **Next.js Application (foloup-nextjs)**
- **Port:** 3000
- **Directory:** `./`
- **Script:** `npm start`
- **Logs:** `./logs/foloup-nextjs-*.log`

### **ATS System (foloup-ats)**
- **Port:** 3001
- **Directory:** `./ATS-System`
- **Script:** `npm start`
- **Logs:** `./logs/foloup-ats-*.log`

## 🔧 Environment Configuration

### **Production Environment**
```bash
# Set environment variables
export NODE_ENV=production
export PORT=3000

# Start with production config
pm2 start ecosystem.config.js --env production
```

### **Development Environment**
```bash
# Set environment variables
export NODE_ENV=development
export PORT=3000

# Start with development config
pm2 start ecosystem.config.js --env development
```

## 📝 Log Management

### **View Specific Logs**
```bash
# Next.js logs
pm2 logs foloup-nextjs

# ATS System logs
pm2 logs foloup-ats

# All logs
pm2 logs
```

### **Log Files Location**
- **Error logs:** `./logs/foloup-*-error.log`
- **Output logs:** `./logs/foloup-*-out.log`
- **Combined logs:** `./logs/foloup-*-combined.log`

## 🔄 Deployment Workflow

### **1. Initial Setup**
```bash
# Install dependencies
npm run setup:all

# Build applications
npm run build:all

# Start with PM2
npm run pm2:start
```

### **2. Update Deployment**
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm run setup:all

# Build applications
npm run build:all

# Reload applications (zero-downtime)
npm run pm2:reload
```

### **3. Rollback**
```bash
# Stop applications
npm run pm2:stop

# Checkout previous version
git checkout <previous-commit>

# Rebuild and restart
npm run build:all
npm run pm2:start
```

## 🛠️ Troubleshooting

### **Check Application Status**
```bash
pm2 status
```

### **View Real-time Logs**
```bash
pm2 logs --lines 100
```

### **Restart Specific Application**
```bash
pm2 restart foloup-nextjs
pm2 restart foloup-ats
```

### **Check Memory Usage**
```bash
pm2 monit
```

### **Clear Logs**
```bash
pm2 flush
```

## 🔒 Security Considerations

1. **Environment Variables:** Store sensitive data in environment variables
2. **Port Configuration:** Ensure ports are not exposed unnecessarily
3. **Log Rotation:** Configure log rotation to prevent disk space issues
4. **Process Limits:** Set appropriate memory limits for each application

## 📈 Performance Monitoring

### **Enable PM2 Monitoring**
```bash
# Install PM2 Plus (optional)
pm2 install pm2-server-monit

# View detailed metrics
pm2 monit
```

### **Custom Metrics**
```bash
# Monitor specific metrics
pm2 web
```

## 🔧 Customization

### **Modify Ecosystem Config**
Edit `ecosystem.config.js` to:
- Change ports
- Adjust memory limits
- Add more instances
- Configure clustering
- Set custom environment variables

### **Add New Applications**
```javascript
{
  name: 'your-new-app',
  script: 'npm',
  args: 'start',
  cwd: './your-app-directory',
  // ... other configuration
}
```

## 📞 Support

For issues with PM2 deployment:
1. Check logs: `pm2 logs`
2. Verify status: `pm2 status`
3. Review configuration: `cat ecosystem.config.js`
4. Check system resources: `pm2 monit` 
