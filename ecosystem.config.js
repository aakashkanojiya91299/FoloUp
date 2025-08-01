module.exports = {
  apps: [
    {
      name: 'foloup-nextjs',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: './.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: './logs/foloup-nextjs-error.log',
      out_file: './logs/foloup-nextjs-out.log',
      log_file: './logs/foloup-nextjs-combined.log',
      time: true
    },
    {
      name: 'foloup-ats',
      script: 'npm',
      args: 'start',
      cwd: './ATS-System',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env_file: './ATS-System/.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      error_file: './logs/foloup-ats-error.log',
      out_file: './logs/foloup-ats-out.log',
      log_file: './logs/foloup-ats-combined.log',
      time: true
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
      'pre-setup': ''
    }
  }
}; 
