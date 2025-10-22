/**
 * Initialize Cloudflare Web Analytics if CF_ANALYTICS_TOKEN is configured.
 * 
 * This script should be loaded early in the application lifecycle to ensure
 * analytics tracking is available from the start. It loads the Cloudflare
 * beacon script asynchronously and never blocks rendering.
 */
export function initializeCloudflareAnalytics(cfAnalyticsToken: string): void {
  // Don't load analytics if no token is provided
  if (!cfAnalyticsToken || cfAnalyticsToken.trim() === '') {
    console.log('Cloudflare Analytics not initialized: No token configured');
    return;
  }

  try {
    // Create script element for Cloudflare beacon
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.setAttribute(
      'data-cf-beacon',
      JSON.stringify({ token: cfAnalyticsToken })
    );

    // Append to head
    document.head.appendChild(script);

    console.log(`Cloudflare Analytics initialized with token: ${cfAnalyticsToken.substring(0, 6)}...`);
  } catch (error) {
    console.error('Error initializing Cloudflare Analytics:', error);
  }
}
