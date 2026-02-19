import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate version based on timestamp
const now = new Date();
const version = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
const buildDate = now.toISOString().split('T')[0];

const versionData = {
    version,
    buildDate,
    buildTime: now.toISOString(),
    description: 'Auto-generated version for cache busting'
};

// Update public/version.json
const publicVersionPath = path.join(__dirname, '../public/version.json');
fs.writeFileSync(publicVersionPath, JSON.stringify(versionData, null, 2));

console.log('✅ Version updated:', version);
console.log('📅 Build date:', buildDate);
console.log('📝 File:', publicVersionPath);

// Update src/utils/versionCheck.js
const versionCheckPath = path.join(__dirname, '../src/utils/versionCheck.js');
let versionCheckContent = fs.readFileSync(versionCheckPath, 'utf8');

// Replace APP_VERSION value
versionCheckContent = versionCheckContent.replace(
    /const APP_VERSION = ['"].*?['"]/,
    `const APP_VERSION = '${version}'`
);

fs.writeFileSync(versionCheckPath, versionCheckContent);
console.log('✅ versionCheck.js updated with new version');
