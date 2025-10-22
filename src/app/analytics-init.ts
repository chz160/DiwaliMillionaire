/**
 * Initialize Google Analytics (GA4) if GA_MEASUREMENT_ID is configured.
 * 
 * This script should be loaded early in the application lifecycle to ensure
 * analytics tracking is available from the start. It respects "Do Not Track"
 * browser settings and only loads GA if a measurement ID is configured.
 */
export function initializeAnalytics(gaMeasurementId: string): void {
  // Don't load analytics if no measurement ID is provided
  if (!gaMeasurementId || gaMeasurementId.trim() === '') {
    console.log('Google Analytics not initialized: No measurement ID configured');
    return;
  }

  // Respect Do Not Track browser setting
  const doNotTrack = navigator.doNotTrack === '1' || 
                    (window as any).doNotTrack === '1' ||
                    (navigator as any).msDoNotTrack === '1';
  
  if (doNotTrack) {
    console.log('Google Analytics not initialized: Do Not Track is enabled');
    return;
  }

  try {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function
    window.gtag = function() {
      window.dataLayer!.push(arguments);
    };
    
    // Initialize with current timestamp
    window.gtag('js', new Date());
    
    // Configure GA with anonymize_ip for privacy compliance
    window.gtag('config', gaMeasurementId, {
      anonymize_ip: true,
      send_page_view: true
    });

    // Load the GA script dynamically
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;
    
    // Insert before the first script tag
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    console.log('Google Analytics initialized with ID:', gaMeasurementId);
  } catch (error) {
    console.error('Error initializing Google Analytics:', error);
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}
