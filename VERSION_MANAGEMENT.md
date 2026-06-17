# 📦 AKICalc Version Management Guide

## Overview

AKICalc uses **semantic versioning** with 4 version components:
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes
- **Build**: Auto-increment patches/builds

**Format**: `MAJOR.MINOR.PATCH.BUILD` (e.g., `1.1.6.6`)

---

## 🚀 How to Update Version

### Option 1: Using Node.js Script (Cross-Platform) ✅ RECOMMENDED

```bash
# Bump build number (1.1.6.6 → 1.1.6.7)
node update-version.js build

# Bump patch (1.1.6.6 → 1.1.7.0)
node update-version.js patch

# Bump minor (1.1.6.6 → 1.2.0.0)
node update-version.js minor

# Bump major (1.1.6.6 → 2.0.0.0)
node update-version.js major
```

### Option 2: Using Bash Script (macOS/Linux)

```bash
# Bump build number
./update-version.sh build

# Bump patch
./update-version.sh patch

# Bump minor
./update-version.sh minor

# Bump major
./update-version.sh major
```

### Option 3: Manual Update

Edit `version.json`:

```json
{
  "version": "1.1.6.7",
  "lastUpdated": "2026-06-17T12:30:45Z",
  "changelog": [
    {
      "version": "1.1.6.7",
      "date": "2026-06-17",
      "changes": [
        "Fixed calculation bug",
        "Improved UI performance"
      ]
    }
  ]
}
```

---

## 📍 Files Involved

### `version.json`
Central version source file:
- Contains current version number
- Stores last update timestamp
- Maintains changelog history (last 50 entries)

### `index.html`
- Loads `version.json` automatically
- Displays version badge (top-right corner)
- Shows last updated time on hover
- Uses version for cache busting

### `app.js`
- Reads `window.versionInfo` from index.html
- Displays version info in header
- Format: "Version X.X.X.X • Updated [date/time]"

---

## 🔄 Automatic Features

### Cache Busting ✅
Every time you update the version, the browser cache is automatically cleared:
```javascript
// app.js loads with version-based query string
mainScript.src = './app.js?v=' + timestamp;

// version.json fetches with timestamp
fetch('./version.json?t=' + Date.now())
```

### Timestamp Display ✅
Users always see when the app was last updated:
- Version badge (top-right): Shows current version
- Hover tooltip: Shows full timestamp
- Header: Shows "Updated [date/time]"

### Changelog Tracking ✅
Automatically maintains version history:
```json
"changelog": [
  {
    "version": "1.1.6.7",
    "date": "2026-06-17",
    "changes": ["Description of changes"]
  }
]
```

---

## 💻 Workflow Example

**Scenario**: You fixed a bug and want to deploy

```bash
# 1. Make your code changes
# 2. Update version
node update-version.js patch
# → 1.1.6.6 becomes 1.1.6.7

# 3. Verify version.json was updated
cat version.json

# 4. Commit to git
git add version.json
git commit -m "Bump version to 1.1.6.7 - Fixed calculation bug"

# 5. Push and deploy
git push
```

---

## 📊 Version Display Locations

### 1. **Version Badge** (Top-Right Corner)
- Shows: `v1.1.6.7`
- Click to see full details
- Style: Blue badge with hover effect

### 2. **Header Info** (Below Title)
- Shows: `Version 1.1.6.7 • Updated 17/06/2026, 12:30:45`
- Updates automatically from version.json
- Format: Indonesian locale date/time

### 3. **Browser Console**
- Logs version load status: `✓ Version loaded: 1.1.6.7 at 17/06/2026, 12:30:45`
- Shows if version.json fails to load

---

## 🔧 Advanced: Custom Changelog

Edit `version.json` to add detailed changelog:

```json
{
  "version": "1.1.6.7",
  "lastUpdated": "2026-06-17T12:30:45Z",
  "changelog": [
    {
      "version": "1.1.6.7",
      "date": "2026-06-17",
      "changes": [
        "🐛 Fixed NPV calculation precision",
        "⚡ Improved export performance",
        "🎨 Updated UI colors",
        "📱 Better mobile responsiveness"
      ]
    },
    {
      "version": "1.1.6.6",
      "date": "2026-06-16",
      "changes": [
        "Initial version with code splitting"
      ]
    }
  ]
}
```

---

## ⚙️ Integration Tips

### Git Pre-commit Hook (Optional)

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Automatically bump build number on commit
node update-version.js build
git add version.json
```

### CI/CD Integration

For automated deployment, run version update in your CI pipeline:
```yaml
# Example GitHub Actions
- name: Update Version
  run: node update-version.js patch
```

### Vercel/Netlify

The version system works automatically with any static hosting:
- No server required
- version.json is automatically cached-busted
- Version persists across deploys

---

## 🎯 Best Practices

1. **Update version BEFORE deploying** - Never deploy without updating version
2. **Use semantic versioning** - Follow the 4-part version format
3. **Add changelog entries** - Describe what changed
4. **Commit version changes** - Keep git history clean
5. **Test locally first** - Verify version displays correctly

---

## ❓ FAQ

**Q: Why 4 version parts?**
A: Build number helps track incremental updates within a patch release.

**Q: Do users see version updates automatically?**
A: Yes! Cache busting ensures fresh app loads with new version info.

**Q: Can I see version history?**
A: Yes! Check the changelog array in `version.json` (stores last 50 versions).

**Q: What if I need to revert?**
A: Edit `version.json` manually or use git to revert the file.

---

## 📝 Quick Reference

```bash
# Show current version
grep "version" version.json

# Update version (choose one)
node update-version.js build    # 1.1.6.6 → 1.1.6.7
node update-version.js patch    # 1.1.6.6 → 1.1.7.0
node update-version.js minor    # 1.1.6.6 → 1.2.0.0
node update-version.js major    # 1.1.6.6 → 2.0.0.0

# Verify version.json
cat version.json | jq .version

# Check last update time
cat version.json | jq .lastUpdated
```

---

## 🚨 Troubleshooting

**Problem**: Version not updating
- Solution: Check that `version.json` exists and is valid JSON
- Run: `node -e "console.log(JSON.parse(require('fs').readFileSync('version.json')))"`

**Problem**: Old version still showing
- Solution: Hard refresh with `Ctrl+Shift+R` or click "🔄 Clear Cache" button
- Browser might have cached old version

**Problem**: Script returns "command not found"
- Solution: Make sure you're in the correct directory:
- `cd /Users/960302/Library/CloudStorage/OneDrive-PT.TelekomunikasiIndonesia/VSCode/kalkulator-aki-`

---

## 📞 Support

For issues or questions about version management:
1. Check version.json is valid JSON
2. Verify you have write permissions
3. Check browser console for errors (F12)
4. Ensure both version.json, index.html, and app.js are deployed

---

**Version Management System Created**: 2026-06-17
**Last Updated**: 2026-06-17
