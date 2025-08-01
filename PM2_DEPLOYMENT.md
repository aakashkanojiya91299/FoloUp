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
   cp env.example .env
   cp ATS-System/env.example ATS-System/.env
   
   # Edit the files with your actual values
   nano .env
   nano ATS-System/.env
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

## 🔐 Environment File Management

### **Environment Files Configuration**
PM2 automatically loads environment variables from the specified `env_file` in the ecosystem config:

- **Next.js App:** `./.env`
- **ATS System:** `./ATS-System/.env`

### **Required Environment Variables**

#### **Next.js Application (.env)**
```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=openai

# Retell Configuration
RETELL_API_KEY=your_retell_api_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

#### **ATS System (ATS-System/.env)**
```bash
# Database Configuration
DATABASE_URL=your_database_url_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
AI_PROVIDER=openai

# Application Configuration
PORT=3001
BASE_URL=http://localhost:3001
```

### **Environment File Setup**
```bash
# Copy example files
cp env.example .env
cp ATS-System/env.example ATS-System/.env

# Edit with your values
nano .env
nano ATS-System/.env

# Verify environment files are loaded
pm2 env foloup-nextjs
pm2 env foloup-ats
```

### **Environment File Security**
- **Never commit `.env` files to version control**
- **Use different environment files for different environments**
- **Rotate API keys regularly**
- **Use strong, unique secrets for each environment**

## 📈 Production Deployment

### **Production Ecosystem Features**
- **Clustering:** Uses all available CPU cores for maximum performance
- **Memory Management:** 2GB memory limit with automatic restart
- **Security:** Enhanced security settings and monitoring
- **Logging:** Comprehensive logging with rotation
- **Monitoring:** Built-in performance monitoring
- **Auto-restart:** Robust restart policies with delays

### **Production Environment Setup**
```bash
# Setup production environment files
npm run env:setup:prod

# Edit production environment files
nano .env
nano ATS-System/.env

# Deploy to production (choose one method)
npm run deploy:prod      # Shell script (may have permission issues)
npm run deploy:prod:js   # Node.js script (recommended)
npm run deploy:prod:npm  # Pure npm commands
```

### **Production Commands**
```bash
# Start with production environment
npm run pm2:start:prod

# Reload with zero downtime
npm run pm2:reload:prod

# Restart applications
npm run pm2:restart:prod

# Save PM2 configuration
npm run pm2:save

# Setup PM2 startup script
npm run pm2:startup
```

### **Production Monitoring**
```bash
# View real-time monitoring
pm2 monit

# Check application status
pm2 status

# View production logs
pm2 logs --lines 100

# Monitor resource usage
pm2 show foloup-nextjs
pm2 show foloup-ats
```

### **Production Security Checklist**
- [ ] Environment variables are properly set
- [ ] API keys are production-grade
- [ ] Database connections are secure
- [ ] HTTPS is configured
- [ ] Rate limiting is enabled
- [ ] Monitoring is active
- [ ] Logs are being rotated
- [ ] Backup strategy is in place

### **Production Performance Optimization**
- **Clustering:** Applications run on multiple CPU cores
- **Memory Management:** 2GB limit with automatic restart
- **Caching:** Enable application-level caching
- **CDN:** Use CDN for static assets
- **Database:** Optimize database connections
- **Monitoring:** Real-time performance monitoring

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
