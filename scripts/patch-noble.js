import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagePath = path.resolve(__dirname, '../node_modules/@noble/hashes/package.json');

try {
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add the browser crypto fix
    if (!pkg.browser) {
      pkg.browser = {};
    }
    pkg.browser.crypto = false;

    // Ensure utils.js is in exports, sometimes yarn strips or messes up exports
    if (!pkg.exports) {
      pkg.exports = {};
    }
    if (!pkg.exports['./utils.js']) {
      pkg.exports['./utils.js'] = './utils.js';
    }
    if (!pkg.exports['./utils']) {
      pkg.exports['./utils'] = './utils.js';
    }

    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    console.log('Successfully patched @noble/hashes for Vercel/Vite compatibility.');
  } else {
    console.log('@noble/hashes not found. Skipping patch.');
  }
} catch (e) {
  console.error('Failed to patch @noble/hashes:', e);
}
