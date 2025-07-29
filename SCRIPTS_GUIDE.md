# 🚀 Scripts Guide - FoloUp with ATS System

This guide explains all the available scripts in your `package.json` for running the application with the ATS system.

## 🎯 **Quick Start (Recommended)**

### **One Command to Run Everything:**
```bash
npm run start:complete
```
This will:
- ✅ Check prerequisites (Node.js, npm)
- ✅ Install all dependencies (main app + ATS)
- ✅ Create necessary directories
- ✅ Set up environment files
- ✅ Start both servers simultaneously

### **Alternative Quick Start:**
```bash
./run-all.sh
```

## 📋 **Available Scripts**

### **Main Application Scripts**
```bash
npm run dev          # Start main Next.js app in development mode
npm run build        # Build the application for production
npm run start        # Start the built application
npm run lint         # Run ESLint for code linting
```

### **ATS System Scripts**
```bash
npm run ats:install  # Install ATS system dependencies
npm run ats:start    # Start ATS server only
npm run ats:dev      # Start ATS server in development mode
```

### **Combined Scripts**
```bash
npm run dev:all      # Start both main app and ATS server in development
npm run start:all    # Start both main app and ATS server in production
npm run setup:all    # Install dependencies for both main app and ATS
npm run run:all      # Setup + start both in development mode
npm run start:complete # Complete setup and start (recommended)
```

## 🌐 **Access Points**

Once running, you can access:

- **Main Application**: http://localhost:3000
- **ATS Server API**: http://localhost:4000
- **ATS Interface**: http://localhost:3000/ats
- **ATS Health Check**: http://localhost:4000/health

## 🔧 **Environment Setup**

### **Main App (.env.local)**
```bash
# ATS Server URL
ATS_SERVER_URL=http://localhost:4000/api

# Gemini API Key (for AI analysis)
GEMINI_API_KEY=your_gemini_api_key_here
```

### **ATS System (.env)**
```bash
# ATS System Environment Variables
PORT=4000
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🛠️ **Manual Setup (if needed)**

### **Step 1: Install Dependencies**
```bash
# Main app dependencies
npm install

# ATS system dependencies
cd ATS-System && npm install && cd ..
```

### **Step 2: Set Environment Variables**
- Copy `.env.local` template and add your values
- Copy `ATS-System/.env` template and add your values

### **Step 3: Start Servers**
```bash
# Option 1: Start both together
npm run dev:all

# Option 2: Start separately
npm run dev          # Terminal 1
npm run ats:start    # Terminal 2
```

## 🐛 **Troubleshooting**

### **Port Already in Use**
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :4000

# Kill processes if needed
kill -9 <PID>
```

### **Dependencies Issues**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For ATS system
cd ATS-System
rm -rf node_modules package-lock.json
npm install
cd ..
```

### **Permission Issues**
```bash
# Make scripts executable
chmod +x run-all.sh
chmod +x start-ats-server.sh
```

## 📊 **Script Comparison**

| Script | Purpose | Dependencies | Servers |
|--------|---------|--------------|---------|
| `npm run dev` | Main app only | ✅ | Main app |
| `npm run ats:start` | ATS server only | ✅ | ATS server |
| `npm run dev:all` | Both servers | ✅ | Both |
| `npm run start:complete` | Complete setup + run | ✅ | Both |

## 🎯 **Recommended Workflow**

1. **First Time Setup:**
   ```bash
   npm run start:complete
   ```

2. **Daily Development:**
   ```bash
   npm run dev:all
   ```

3. **Production:**
   ```bash
   npm run build
   npm run start:all
   ```

## 🔍 **Monitoring**

### **Check Server Status**
```bash
# Main app health
curl http://localhost:3000

# ATS server health
curl http://localhost:4000/health
```

### **View Logs**
Both servers will show colored output:
- 🔵 **Blue**: Main application
- 🟢 **Green**: ATS server

## 🚨 **Important Notes**

- **Environment Variables**: Make sure to set up your `.env.local` and `ATS-System/.env` files
- **Ports**: Ensure ports 3000 and 4000 are available
- **Node.js**: Requires Node.js 18+ and npm
- **Gemini API**: You'll need a valid Gemini API key for AI features

## 📞 **Support**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Ensure both ports are available
4. Check the console output for specific error messages 
