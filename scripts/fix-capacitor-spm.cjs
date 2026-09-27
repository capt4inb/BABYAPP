const fs = require('node:fs');
const path = require('node:path');

const packageFile = path.join(__dirname, '..', 'ios', 'App', 'CapApp-SPM', 'Package.swift');
if (fs.existsSync(packageFile)) {
  const source = fs.readFileSync(packageFile, 'utf8');
  const normalized = source.replaceAll('..\\..\\..\\node_modules\\@capacitor\\app', '../../../node_modules/@capacitor/app');
  if (normalized !== source) fs.writeFileSync(packageFile, normalized);
}
