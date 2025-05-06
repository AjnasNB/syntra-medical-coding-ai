/**
 * MediCode AI - Start Script
 * Launches both backend and frontend servers
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting MediCode AI servers...');

// Start the backend server
const backend = spawn('node', ['backend.js'], {
  stdio: 'inherit',
  shell: true
});

// Start the frontend server after a short delay
setTimeout(() => {
  const frontend = spawn('node', ['frontend-server.js'], {
    stdio: 'inherit',
    shell: true
  });

  frontend.on('error', (error) => {
    console.error('Failed to start frontend server:', error);
  });
}, 1000);

backend.on('error', (error) => {
  console.error('Failed to start backend server:', error);
});

console.log('Servers starting...');
console.log('Backend will be available at http://localhost:3000');
console.log('Frontend will be available at http://localhost:8080');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  process.exit();
}); 