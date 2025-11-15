// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  // Integrations for server-side
  integrations: [
    // HTTP integration for automatic instrumentation of HTTP requests
    // No additional options needed - tracing is controlled by tracesSampleRate
    Sentry.httpIntegration(),
  ],

  // Filter out sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Scrub environment variables
    if (event.contexts?.runtime?.env) {
      const env = event.contexts.runtime.env as Record<string, unknown>;
      const sensitiveKeys = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'GOOGLE_CLIENT_SECRET',
        'SENTRY_AUTH_TOKEN',
        'DATABASE_URL',
      ];

      sensitiveKeys.forEach(key => {
        if (env[key]) {
          env[key] = '[REDACTED]';
        }
      });
    }

    // Scrub request headers
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    // Scrub request body (might contain passwords, tokens)
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>;
      const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'access_token', 'refresh_token'];

      sensitiveFields.forEach(field => {
        if (data[field]) {
          data[field] = '[REDACTED]';
        }
      });
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Supabase auth errors (expected, not bugs)
    'Invalid login credentials',
    'User not found',
    // Network timeouts (often infrastructure, not app bugs)
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
  ],

  // Add custom tags to all events
  initialScope: {
    tags: {
      runtime: 'server',
      app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    },
  },
});
