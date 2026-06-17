#!/usr/bin/env node

/**
 * Version Updater Script for AKICalc
 * Usage: node update-version.js [major|minor|patch|build]
 */

const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, 'version.json');
const versionType = process.argv[2] || 'patch';

// Validate version type
if (!['major', 'minor', 'patch', 'build'].includes(versionType)) {
    console.error('❌ Invalid version type. Use: major, minor, patch, or build');
    process.exit(1);
}

if (!fs.existsSync(VERSION_FILE)) {
    console.error('❌ Error: version.json not found!');
    process.exit(1);
}

// Read current version
const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
const currentVersion = versionData.version;
console.log(`📦 Current version: ${currentVersion}`);

// Parse version parts
const [major, minor, patch, build] = currentVersion.split('.').map(Number);

let newMajor = major;
let newMinor = minor;
let newPatch = patch;
let newBuild = build;

// Update version based on type
switch (versionType) {
    case 'major':
        newMajor = major + 1;
        newMinor = 0;
        newPatch = 0;
        newBuild = 0;
        break;
    case 'minor':
        newMinor = minor + 1;
        newPatch = 0;
        newBuild = 0;
        break;
    case 'patch':
        newPatch = patch + 1;
        newBuild = 0;
        break;
    case 'build':
        newBuild = build + 1;
        break;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}.${newBuild}`;
const currentDate = new Date().toISOString();

console.log(`📝 New version: ${newVersion}`);
console.log(`⏰ Updated at: ${currentDate}`);

// Update version data
versionData.version = newVersion;
versionData.lastUpdated = currentDate;

// Add to changelog if it's a new entry
if (!versionData.changelog || versionData.changelog.length === 0 || versionData.changelog[0].version !== newVersion) {
    if (!versionData.changelog) versionData.changelog = [];
    versionData.changelog.unshift({
        version: newVersion,
        date: currentDate.split('T')[0],
        changes: [`Version bump: ${versionType}`]
    });
}

// Keep only last 50 changelog entries
versionData.changelog = versionData.changelog.slice(0, 50);

// Write updated version.json
fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');

console.log('✅ version.json updated successfully!');
console.log('');
console.log('📊 Version History:');
versionData.changelog.slice(0, 5).forEach((entry, idx) => {
    console.log(`   ${idx + 1}. v${entry.version} (${entry.date})`);
});

console.log('');
console.log('🎉 Ready to deploy!');
console.log(`💾 Don't forget to commit changes to your repository`);
