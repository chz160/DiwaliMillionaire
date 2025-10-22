#!/bin/bash

echo "======================================"
echo "Cloudflare Pages Compatibility Check"
echo "======================================"
echo ""

# Check 1: Verify generate-version.js reads from process.env
echo "1. Checking generate-version.js implementation..."
if grep -q "process.env.GA_MEASUREMENT_ID" scripts/generate-version.js; then
    echo "   ✅ PASS: Uses process.env.GA_MEASUREMENT_ID"
else
    echo "   ❌ FAIL: Does not use process.env.GA_MEASUREMENT_ID"
    exit 1
fi

# Check 2: Test build without GA_MEASUREMENT_ID
echo ""
echo "2. Testing build WITHOUT GA_MEASUREMENT_ID..."
npm run build > /dev/null 2>&1
if [ -f "src/environments/environment.ts" ]; then
    if grep -q "gaMeasurementId: ''" src/environments/environment.ts; then
        echo "   ✅ PASS: Build succeeds without GA_MEASUREMENT_ID (empty string)"
    else
        echo "   ⚠️  WARNING: GA_MEASUREMENT_ID has unexpected value when not set"
        cat src/environments/environment.ts
    fi
else
    echo "   ❌ FAIL: Environment file not generated"
    exit 1
fi

# Check 3: Test build WITH GA_MEASUREMENT_ID
echo ""
echo "3. Testing build WITH GA_MEASUREMENT_ID..."
GA_MEASUREMENT_ID="G-TEST123456" npm run build > /dev/null 2>&1
if [ -f "src/environments/environment.ts" ]; then
    if grep -q "gaMeasurementId: 'G-TEST123456'" src/environments/environment.ts; then
        echo "   ✅ PASS: Build correctly includes GA_MEASUREMENT_ID"
    else
        echo "   ❌ FAIL: GA_MEASUREMENT_ID not correctly included"
        cat src/environments/environment.ts
        exit 1
    fi
else
    echo "   ❌ FAIL: Environment file not generated"
    exit 1
fi

# Check 4: Verify the value is in the built output
echo ""
echo "4. Checking if GA_MEASUREMENT_ID is in built output..."
if grep -r "G-TEST123456" dist/diwali-millionaire/browser/*.js > /dev/null 2>&1; then
    echo "   ✅ PASS: GA_MEASUREMENT_ID found in built JavaScript files"
else
    echo "   ❌ FAIL: GA_MEASUREMENT_ID not found in built output"
    exit 1
fi

# Check 5: Verify analytics initialization code exists
echo ""
echo "5. Verifying analytics initialization code..."
if [ -f "src/app/analytics-init.ts" ]; then
    echo "   ✅ PASS: analytics-init.ts exists"
else
    echo "   ❌ FAIL: analytics-init.ts not found"
    exit 1
fi

if grep -q "initializeAnalytics" src/main.ts; then
    echo "   ✅ PASS: main.ts calls initializeAnalytics"
else
    echo "   ❌ FAIL: main.ts does not call initializeAnalytics"
    exit 1
fi

# Check 6: Verify prebuild script is configured
echo ""
echo "6. Checking package.json prebuild configuration..."
if grep -q '"prebuild": "node scripts/generate-version.js"' package.json; then
    echo "   ✅ PASS: prebuild script is configured"
else
    echo "   ❌ FAIL: prebuild script is not configured correctly"
    exit 1
fi

echo ""
echo "======================================"
echo "✅ All checks passed!"
echo "======================================"
echo ""
echo "The implementation is fully compatible with Cloudflare Pages."
echo ""
echo "Next steps:"
echo "1. Configure GA_MEASUREMENT_ID in Cloudflare Pages dashboard"
echo "   - Go to your Cloudflare Pages project > Settings > Environment variables"
echo "   - Add variable: GA_MEASUREMENT_ID = G-XXXXXXXXXX"
echo "2. Deploy to Cloudflare Pages"
echo "3. Verify in browser console for: 'Google Analytics initialized with ID: G-XXXXXXXXXX'"
echo ""
