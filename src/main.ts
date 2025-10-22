import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeAnalytics } from './app/analytics-init';
import { initializeCloudflareAnalytics } from './app/cloudflare-analytics-init';
import { environment } from './environments/environment';

// Initialize Google Analytics before bootstrapping the app
initializeAnalytics(environment.gaMeasurementId);

// Initialize Cloudflare Web Analytics before bootstrapping the app
initializeCloudflareAnalytics(environment.cfAnalyticsToken);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
