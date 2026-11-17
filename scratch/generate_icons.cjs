// Simple PNG generator for extension icons
const fs = require('fs');
const path = require('path');

// Ensure directory exists
const iconsDir = path.join(__dirname, '../extension/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1x1 transparent PNG fallback or minimal valid PNG buffer with gradient violet/blue
// Minimal valid 1x1 PNG:
const minimalPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), minimalPng);
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), minimalPng);
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), minimalPng);
console.log('Extension icons created successfully in extension/icons/');
