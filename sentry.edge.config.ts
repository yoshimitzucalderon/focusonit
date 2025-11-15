// This file configures the initialization of Sentry for edge features (middleware, edge routes, edge render).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment (production, staging, development)
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '1.0'),

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Scrub request headers
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Edge runtime specific errors to ignore
    'Network request failed',
    'fetch failed',
  ],

  // Add custom tags to all events
  initialScope: {
    tags: {
      runtime: 'edge',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    },
  },
});
