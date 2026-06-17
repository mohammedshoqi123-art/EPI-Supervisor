#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Setup i18n for admin-web
# Run this script to add internationalization support
# ═══════════════════════════════════════════════════════════

set -e

echo "🌐 Setting up i18n for admin-web..."

cd "$(dirname "$0")/../apps/admin-web"

# Install packages
npm install i18next react-i18next --save

# Create i18n directory
mkdir -p src/i18n

echo "✅ i18n packages installed!"
echo ""
echo "Next steps:"
echo "1. Copy src/i18n/index.ts from the docs/i18n-example.ts file"
echo "2. Add 'import ./i18n' to src/main.tsx"
echo "3. Use useTranslation() hook in components"
echo ""
echo "Example:"
echo "  const { t } = useTranslation()"
echo "  t('nav.dashboard') // → 'لوحة المعلومات'"
