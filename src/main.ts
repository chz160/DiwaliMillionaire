import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeAnalytics } from './app/analytics-init';
import { environment } from './environments/environment';

// Initialize Google Analytics before bootstrapping the app
initializeAnalytics(environment.gaMeasurementId);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
