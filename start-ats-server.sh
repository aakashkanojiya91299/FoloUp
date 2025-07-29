#!/bin/bash

echo "Starting ATS Server..."

# Navigate to ATS-System directory
cd ATS-System

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the server
echo "Starting server on port 4000..."
npm start 
