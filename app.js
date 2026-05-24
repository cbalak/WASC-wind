const path = require('path');

const nodeVersion = process.version;
const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
if (major < 16) {
  console.error('ERROR: Node.js 16+ is required. Current version:', nodeVersion);
  console.error('Please upgrade Node.js in your cPanel or contact your hosting provider.');
  process.exit(1);
}

const backendPath = path.join(__dirname, 'apps', 'backend', 'dist', 'index.js');

try {
  require(backendPath);
} catch (err) {
  console.error('Failed to start backend. Did you run npm install?');
  console.error(err.message);
  process.exit(1);
}
