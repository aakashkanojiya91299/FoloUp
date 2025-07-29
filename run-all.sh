#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting FoloUp Application with ATS System${NC}"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are available${NC}"

# Create uploads directory for ATS
echo -e "${YELLOW}📁 Creating uploads directory for ATS...${NC}"
mkdir -p ATS-System/uploads

# Install dependencies for main app
echo -e "${YELLOW}📦 Installing main application dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Main app dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install main app dependencies${NC}"
    exit 1
fi

# Install dependencies for ATS
echo -e "${YELLOW}📦 Installing ATS system dependencies...${NC}"
if cd ATS-System && npm install && cd ..; then
    echo -e "${GREEN}✅ ATS system dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install ATS system dependencies${NC}"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found. Creating template...${NC}"
    cat > .env.local << EOF
# Add your environment variables here
# ATS_SERVER_URL=http://localhost:4000/api
# GEMINI_API_KEY=your_gemini_api_key_here
EOF
    echo -e "${GREEN}✅ Created .env.local template${NC}"
    echo -e "${YELLOW}📝 Please edit .env.local with your actual values${NC}"
fi

# Check if ATS .env exists
if [ ! -f "ATS-System/.env" ]; then
    echo -e "${YELLOW}⚠️  ATS-System/.env file not found. Creating template...${NC}"
    cat > ATS-System/.env << EOF
# ATS System Environment Variables
PORT=4000
GEMINI_API_KEY=your_gemini_api_key_here
EOF
    echo -e "${GREEN}✅ Created ATS-System/.env template${NC}"
    echo -e "${YELLOW}📝 Please edit ATS-System/.env with your actual values${NC}"
fi

echo -e "${GREEN}🎉 Setup complete! Starting both servers...${NC}"
echo -e "${BLUE}📱 Main app will be available at: http://localhost:3000${NC}"
echo -e "${BLUE}🤖 ATS server will be available at: http://localhost:4000${NC}"
echo -e "${BLUE}📊 ATS interface will be available at: http://localhost:3000/ats${NC}"
echo ""

# Start both servers using concurrently
echo -e "${YELLOW}🔄 Starting servers...${NC}"
echo "Press Ctrl+C to stop both servers"
echo ""

npx concurrently \
    --names "Main App,ATS Server" \
    --prefix-colors "blue,green" \
    "npm run dev" \
    "npm run ats:start" 
