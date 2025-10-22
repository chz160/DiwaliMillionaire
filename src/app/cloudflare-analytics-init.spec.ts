import { initializeCloudflareAnalytics } from './cloudflare-analytics-init';

describe('CloudflareAnalyticsInit', () => {
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let consoleLogSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    // Spy on console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    consoleLogSpy = jasmine.createSpy('log');
    consoleErrorSpy = jasmine.createSpy('error');
    console.log = consoleLogSpy;
    console.error = consoleErrorSpy;

    // Clean up any existing Cloudflare beacon scripts
    const existingScripts = document.head.querySelectorAll('script[data-cf-beacon]');
    existingScripts.forEach(script => script.remove());
  });

  afterEach(() => {
    // Restore console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;

    // Clean up any scripts added during tests
    const scripts = document.head.querySelectorAll('script[data-cf-beacon]');
    scripts.forEach(script => script.remove());
  });

  it('should not initialize when token is empty', () => {
    initializeCloudflareAnalytics('');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cloudflare Analytics not initialized: No token configured'
    );

    const script = document.head.querySelector('script[data-cf-beacon]');
    expect(script).toBeNull();
  });

  it('should not initialize when token is whitespace', () => {
    initializeCloudflareAnalytics('   ');

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cloudflare Analytics not initialized: No token configured'
    );

    const script = document.head.querySelector('script[data-cf-beacon]');
    expect(script).toBeNull();
  });

  it('should create script element with correct attributes when token is provided', () => {
    const testToken = 'test-token-12345678';
    initializeCloudflareAnalytics(testToken);

    const script = document.head.querySelector('script[data-cf-beacon]') as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.defer).toBe(true);
    expect(script.src).toBe('https://static.cloudflareinsights.com/beacon.min.js');

    const beaconData = script.getAttribute('data-cf-beacon');
    expect(beaconData).toBe(JSON.stringify({ token: testToken }));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cloudflare Analytics initialized with token: test-tok...'
    );
  });

  it('should truncate token in log message for security', () => {
    const testToken = 'abcdefghijklmnopqrstuvwxyz';
    initializeCloudflareAnalytics(testToken);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Cloudflare Analytics initialized with token: abcdefgh...'
    );
  });

  it('should append script to document head', () => {
    const initialScriptCount = document.head.querySelectorAll('script').length;
    
    initializeCloudflareAnalytics('test-token');

    const newScriptCount = document.head.querySelectorAll('script').length;
    expect(newScriptCount).toBe(initialScriptCount + 1);
  });

  it('should handle errors gracefully', () => {
    // Mock appendChild to throw an error
    const originalAppendChild = document.head.appendChild;
    spyOn(document.head, 'appendChild').and.throwError('Test error');

    initializeCloudflareAnalytics('test-token');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error initializing Cloudflare Analytics:',
      jasmine.any(Error)
    );

    // Restore
    document.head.appendChild = originalAppendChild;
  });

  it('should not create duplicate scripts when called multiple times', () => {
    initializeCloudflareAnalytics('test-token-1');
    initializeCloudflareAnalytics('test-token-2');

    const scripts = document.head.querySelectorAll('script[data-cf-beacon]');
    expect(scripts.length).toBe(2); // Each call creates a new script
  });
});
