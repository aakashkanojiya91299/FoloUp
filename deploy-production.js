#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function printStatus(message) {
  console.log(`${colors.green}[INFO]${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}

function runCommand(command, description) {
  try {
    printStatus(description);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    printError(`Failed to run: ${command}`);
    return false;
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function main() {
  console.log('🚀 Starting Production Deployment...\n');

  // Check prerequisites
  printStatus('Checking prerequisites...');

  // Check if PM2 is installed
  try {
    execSync('pm2 --version', { stdio: 'ignore' });
  } catch (error) {
    printStatus('Installing PM2...');
    runCommand('npm install -g pm2@latest', 'Installing PM2 globally');
  }

  // Check environment files
  if (!checkFileExists('.env')) {
    printWarning('Production environment file (.env) not found');
    if (checkFileExists('env.production.example')) {
      printStatus('Creating .env from production example...');
      runCommand('cp env.production.example .env', 'Creating .env file');
      printWarning('Please edit .env with your production values before continuing');
      process.exit(1);
    } else {
      printError('No environment template found. Please create .env file manually');
      process.exit(1);
    }
  }

  if (!checkFileExists('ATS-System/.env')) {
    printWarning('ATS System environment file (ATS-System/.env) not found');
    if (checkFileExists('ATS-System/env.example')) {
      printStatus('Creating ATS-System/.env from example...');
      runCommand('cp ATS-System/env.example ATS-System/.env', 'Creating ATS-System/.env file');
      printWarning('Please edit ATS-System/.env with your production values before continuing');
      process.exit(1);
    } else {
      printError('No ATS System environment template found. Please create ATS-System/.env file manually');
      process.exit(1);
    }
  }

  // Create logs directory
  printStatus('Creating logs directory...');
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
  }

  // Install dependencies
  if (!runCommand('npm run setup:all', 'Installing dependencies')) {
    process.exit(1);
  }

  // Build applications
  if (!runCommand('npm run build:all', 'Building applications')) {
    process.exit(1);
  }

  // Stop existing PM2 processes
  printStatus('Stopping existing PM2 processes...');
  runCommand('pm2 stop ecosystem.config.js 2>/dev/null || true', 'Stopping existing processes');
  runCommand('pm2 delete ecosystem.config.js 2>/dev/null || true', 'Deleting existing processes');

  // Start applications with production environment
  if (!runCommand('pm2 start ecosystem.config.js --env production', 'Starting applications with production configuration')) {
    process.exit(1);
  }

  // Save PM2 configuration
  if (!runCommand('pm2 save', 'Saving PM2 configuration')) {
    process.exit(1);
  }

  // Setup PM2 startup script
  if (!runCommand('pm2 startup', 'Setting up PM2 startup script')) {
    process.exit(1);
  }

  // Display status
  printStatus('Deployment completed successfully!');
  console.log('\n📊 Application Status:');
  runCommand('pm2 status', 'Displaying PM2 status');

  console.log('\n📝 Log Locations:');
  console.log('  Next.js: ./logs/foloup-nextjs-*.log');
  console.log('  ATS System: ./logs/foloup-ats-*.log');

  console.log('\n🔧 Useful Commands:');
  console.log('  View logs: pm2 logs');
  console.log('  Monitor: pm2 monit');
  console.log('  Restart: pm2 restart ecosystem.config.js');
  console.log('  Reload: pm2 reload ecosystem.config.js');

  console.log('\n');
  printStatus('Production deployment completed! 🎉');
}

if (require.main === module) {
  main();
} 