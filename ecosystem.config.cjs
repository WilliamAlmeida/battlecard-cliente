module.exports = {
  apps: [
    {
      name: 'pokebattle-client',
      script: 'npm',
      args: 'run dev -- --port 8001',
      cwd: __dirname,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
