#!/usr/bin/env bash

# AKICalc Version Management - Quick Commands Reference
# Usage: See below for common version update commands

echo "======================================"
echo "   AKICalc Version Management Guide"
echo "======================================"
echo ""
echo "📦 CURRENT SETUP:"
echo "   Version File: version.json"
echo "   Current Version: $(grep version version.json | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')"
echo "   Last Updated: $(grep lastUpdated version.json | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:Z]+')"
echo ""

echo "🚀 QUICK COMMANDS:"
echo ""
echo "   Bump BUILD number (1.1.6.7 → 1.1.6.8):"
echo "   $ node update-version.js build"
echo ""
echo "   Bump PATCH (1.1.6.7 → 1.1.7.0):"
echo "   $ node update-version.js patch"
echo ""
echo "   Bump MINOR (1.1.6.7 → 1.2.0.0):"
echo "   $ node update-version.js minor"
echo ""
echo "   Bump MAJOR (1.1.6.7 → 2.0.0.0):"
echo "   $ node update-version.js major"
echo ""

echo "📊 FEATURES:"
echo "   ✓ Automatic timestamp update"
echo "   ✓ Version display badge (top-right)"
echo "   ✓ Changelog history (last 50 versions)"
echo "   ✓ Cache busting on deployment"
echo "   ✓ Browser console logging"
echo ""

echo "📖 DOCUMENTATION:"
echo "   See VERSION_MANAGEMENT.md for detailed guide"
echo ""
echo "======================================"
