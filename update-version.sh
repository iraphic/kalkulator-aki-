#!/bin/bash

# Version updater script for AKICalc
# Usage: ./update-version.sh [major|minor|patch]

VERSION_FILE="version.json"
VERSION_TYPE="${1:-patch}"

if [ ! -f "$VERSION_FILE" ]; then
    echo "❌ Error: version.json not found!"
    exit 1
fi

# Read current version
CURRENT_VERSION=$(grep '"version"' "$VERSION_FILE" | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
echo "📦 Current version: $CURRENT_VERSION"

# Parse version parts
IFS='.' read -r MAJOR MINOR PATCH BUILD <<< "$CURRENT_VERSION"

# Update version based on type
case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        BUILD=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        BUILD=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        BUILD=0
        ;;
    build)
        BUILD=$((BUILD + 1))
        ;;
    *)
        echo "❌ Invalid version type. Use: major, minor, patch, or build"
        exit 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH.$BUILD"
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📝 New version: $NEW_VERSION"
echo "⏰ Updated at: $CURRENT_DATE"

# Update version.json using Node.js
node << EOF
const fs = require('fs');
const versionData = JSON.parse(fs.readFileSync('$VERSION_FILE', 'utf8'));

// Update version and timestamp
versionData.version = '$NEW_VERSION';
versionData.lastUpdated = '$CURRENT_DATE';

// Add to changelog if it's a new entry
const lastEntry = versionData.changelog[0];
if (!lastEntry || lastEntry.version !== '$NEW_VERSION') {
    versionData.changelog.unshift({
        version: '$NEW_VERSION',
        date: '$CURRENT_DATE'.split('T')[0],
        changes: ['Version bump: $VERSION_TYPE']
    });
}

// Keep only last 20 changelog entries
versionData.changelog = versionData.changelog.slice(0, 20);

fs.writeFileSync('$VERSION_FILE', JSON.stringify(versionData, null, 2) + '\n');
console.log('✅ version.json updated successfully!');
EOF

echo "✨ Version update complete!"
echo ""
echo "💡 Pro tip: Update your version.html badge with the new version"
