// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
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

  // Replay configuration (optional - session replay feature)
  replaysOnErrorSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE || '1.0'),
  replaysSessionSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || '0.1'),

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration({
      // Track navigation and interactions
      enableInp: true, // Track Interaction to Next Paint
    }),
  ],

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Don't send errors from bot user agents
    const userAgent = event.request?.headers?.['user-agent'];
    if (userAgent && /bot|crawler|spider|crawling/i.test(userAgent)) {
      return null;
    }

    // Scrub sensitive data from request
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove query params that might contain sensitive data
      if (event.request.query_string) {
        const sensitiveParams = ['token', 'api_key', 'password', 'secret'];
        sensitiveParams.forEach(param => {
          if (event.request?.query_string) {
            event.request.query_string = event.request.query_string.replace(
              new RegExp(`${param}=[^&]+`, 'gi'),
              `${param}=[REDACTED]`
            );
          }
        });
      }
    }

    return event;
  },

  // Ignore specific errors that are not actionable
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors
    'NetworkError',
    'Network request failed',
    // ResizeObserver errors (non-critical)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // React hydration mismatches (usually harmless)
    'Hydration failed because the initial UI does not match',
  ],

  // Ignore errors from specific URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],

  // Add custom tags to all events
  initialScope: {
    tags: {
      runtime: 'browser',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    },
  },
});
