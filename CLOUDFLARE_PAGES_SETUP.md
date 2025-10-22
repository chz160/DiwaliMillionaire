# Cloudflare Pages Setup Guide

## Google Analytics Integration with Cloudflare Pages

This guide explains how the Google Analytics integration works with Cloudflare Pages deployments and how to configure environment variables.

## How It Works

### Build-Time Environment Variables

Cloudflare Pages provides environment variables at **build time** through Node.js `process.env`. Our application reads the `GA_MEASUREMENT_ID` environment variable during the build process:

1. **Build Process Flow**:
   - Cloudflare Pages triggers the build command: `npm run build`
   - The `prebuild` script runs first: `node scripts/generate-version.js`
   - This script reads `process.env.GA_MEASUREMENT_ID`
   - The value is written to `src/environments/environment.ts`
   - Angular build process bundles this file into the application
   - The resulting static files are deployed

2. **Code Implementation**:
   ```javascript
   // In scripts/generate-version.js
   const gaMeasurementId = process.env.GA_MEASUREMENT_ID || '';
   
   const envFileContent = `// This file is auto-generated during build. Do not edit manually.
   export const environment = {
     version: '${version}',
     gaMeasurementId: '${gaMeasurementId}'
   };
   `;
   ```

3. **Runtime Usage**:
   ```typescript
   // In src/main.ts
   import { environment } from './environments/environment';
   
   // Initialize Google Analytics before bootstrapping the app
   initializeAnalytics(environment.gaMeasurementId);
   ```

## Configuring Environment Variables in Cloudflare Pages

### Prerequisites
- A Cloudflare account
- A Cloudflare Pages project connected to your repository
- A Google Analytics 4 (GA4) Measurement ID (format: `G-XXXXXXXXXX`)

### Step-by-Step Configuration

1. **Log in to Cloudflare Dashboard**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **Pages** from the left sidebar

2. **Select Your Project**
   - Click on your DiwaliMillionaire project

3. **Access Settings**
   - Click on the **Settings** tab
   - Click on **Environment variables** in the left sidebar

4. **Add Environment Variable**
   - Click **Add variable** button
   - Enter the variable details:
     - **Variable name**: `GA_MEASUREMENT_ID`
     - **Value**: Your Google Analytics 4 Measurement ID (e.g., `G-XXXXXXXXXX`)
     - **Environment**: Choose the appropriate environment(s):
       - **Production**: For your main branch deployments
       - **Preview**: For preview deployments from pull requests
       - Both: If you want analytics on all deployments

5. **Save and Redeploy**
   - Click **Save**
   - Trigger a new deployment for the changes to take effect:
     - Option 1: Push a new commit to your repository
     - Option 2: Go to **Deployments** tab and click **Retry deployment** on the latest deployment

## Verification

### 1. Check Build Logs

After deploying with the environment variable configured:

1. Go to your Cloudflare Pages project
2. Click on the **Deployments** tab
3. Click on the latest deployment
4. Check the build logs for:
   ```
   Generated version: YYYY.MMDD.SSSSS
   Written to: /opt/buildhome/repo/src/environments/environment.ts
   ```
   - The log should show the environment file was created successfully

### 2. Verify in Browser Console

After deployment:

1. Open your deployed site in a web browser
2. Open browser Developer Tools (F12)
3. Go to the **Console** tab
4. Look for one of these messages:
   - With GA configured: `Google Analytics initialized with ID: G-XXXXXXXXXX`
   - Without GA configured: `Google Analytics not initialized: No measurement ID configured`

### 3. Check Network Requests

If analytics is properly configured:

1. Open browser Developer Tools (F12)
2. Go to the **Network** tab
3. Start a new game
4. Look for requests to:
   - `googletagmanager.com` (GA script loading)
   - `google-analytics.com` (Analytics events)

## Environment-Specific Configuration

You can set different Google Analytics properties for different environments:

### Production Only
Set the variable only for **Production** environment to track only your main site.

### Preview Only
Set the variable only for **Preview** environment to test analytics in preview deployments without affecting production data.

### Separate Properties for Each
Create two GA4 properties (one for production, one for preview) and set different measurement IDs:
- Production: `GA_MEASUREMENT_ID=G-PROD-ID`
- Preview: `GA_MEASUREMENT_ID=G-PREVIEW-ID`

## Important Notes

### Build-Time vs Runtime

⚠️ **Critical Understanding**: 
- Environment variables in Cloudflare Pages are available at **build time** only
- They are **not** available at runtime in the browser
- The value is "baked in" to the static files during build
- Changing the environment variable requires a new build/deployment

This is why our implementation correctly reads the variable during the build process and includes it in the generated static files.

### Security Considerations

✅ **Google Analytics Measurement IDs are safe to expose**:
- The GA Measurement ID (G-XXXXXXXXXX) is **not a secret**
- It's meant to be publicly visible in client-side code
- It appears in the HTML source of any site using GA
- No security risk in including it in public repositories or static files

However, never expose:
- Google Analytics Management API keys
- Service account credentials
- Admin access tokens

## Troubleshooting

### Analytics Not Working

1. **Check Environment Variable**:
   - Verify `GA_MEASUREMENT_ID` is set in Cloudflare Pages settings
   - Ensure there are no typos in the variable name (exact match required)
   - Verify the measurement ID format is correct (G-XXXXXXXXXX)

2. **Check Browser Console**:
   - Look for initialization messages
   - Check for any JavaScript errors
   - Verify Do Not Track is not enabled (if testing)

3. **Verify Build Logs**:
   - Confirm the prebuild script ran successfully
   - Check that environment.ts was generated

4. **Clear Cache**:
   - Cloudflare Pages may cache old deployments
   - Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Check in incognito/private browsing mode

### Environment Variable Not Available

If `process.env.GA_MEASUREMENT_ID` is empty during build:

1. **Double-check spelling**: Variable name must be exactly `GA_MEASUREMENT_ID`
2. **Verify environment**: Make sure it's set for the correct environment (Production/Preview)
3. **Redeploy**: Environment variable changes require a new build
4. **Check build command**: Ensure `npm run build` is used (which triggers prebuild)

## Alternative Approach: Runtime Configuration

**Note**: The current implementation (build-time) is the **recommended approach** for Cloudflare Pages. However, if runtime configuration is needed:

### Why Runtime Config is Complex with Cloudflare Pages

Cloudflare Pages deploys static files and doesn't provide runtime environment variables to the browser. Options for runtime config:

1. **Cloudflare Workers/Functions**: Add a serverless function to expose variables
2. **External Config Service**: Fetch configuration from an external API
3. **Multiple Builds**: Maintain separate builds for different environments

**These approaches add complexity and are not recommended for a simple static site.**

## Testing Locally

To test the build process locally with the environment variable:

### Linux/macOS:
```bash
GA_MEASUREMENT_ID=G-TEST123456 npm run build
```

### Windows PowerShell:
```powershell
$env:GA_MEASUREMENT_ID="G-TEST123456"; npm run build
```

### Windows CMD:
```cmd
set GA_MEASUREMENT_ID=G-TEST123456 && npm run build
```

Then check `src/environments/environment.ts` to verify the ID was included.

## Summary

✅ **Current Implementation is Cloudflare Pages Compatible**:
- Uses `process.env` which is the standard way to access build-time environment variables
- Environment variables are configured in Cloudflare Pages dashboard (Settings > Environment variables)
- The build process correctly injects the GA Measurement ID into static files
- No code changes needed - the implementation is already correct

The only requirement is to **configure the `GA_MEASUREMENT_ID` environment variable** in your Cloudflare Pages project settings.
