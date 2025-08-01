module.exports = {
  apps: [
    {
      name: 'foloup-nextjs',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: './',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable clustering for better performance
      autorestart: true,
      watch: false,
      max_memory_restart: '2G', // Increased memory limit for production
      env_file: './.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/foloup-nextjs-error.log',
      out_file: './logs/foloup-nextjs-out.log',
      log_file: './logs/foloup-nextjs-combined.log',
      time: true,
      // Production-specific settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Security settings
      node_args: '--max-old-space-size=2048',
      // Monitoring
      pmx: true,
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'foloup-ats',
      script: './ATS-System/dist/server.js',
      cwd: './ATS-System',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable clustering for better performance
      autorestart: true,
      watch: false,
      max_memory_restart: '2G', // Increased memory limit for production
      env_file: './ATS-System/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/foloup-ats-error.log',
      out_file: './logs/foloup-ats-out.log',
      log_file: './logs/foloup-ats-combined.log',
      time: true,
      // Production-specific settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // Security settings
      node_args: '--max-old-space-size=2048',
      // Monitoring
      pmx: true,
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/FoloUp.git',
      path: '/var/www/foloup',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      // Production deployment settings
      'post-setup': 'npm install -g pm2@latest',
      'pre-deploy': 'pm2 stop ecosystem.config.js || true',
      'post-deploy': 'npm install && npm run build:all && pm2 start ecosystem.config.js --env production && pm2 save',
      // Environment setup
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env production && pm2 save && pm2 startup'
    },
    staging: {
      user: 'deploy',
      host: 'your-staging-server-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/FoloUp.git',
      path: '/var/www/foloup-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:all && pm2 reload ecosystem.config.js --env development',
      'pre-setup': ''
    }
  }
}; 
