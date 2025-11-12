import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - 10% sampling rate (adjust based on traffic)
  tracesSampleRate: 0.1,

  // Environment tracking
  environment: process.env.NODE_ENV || 'development',

  // Release tracking (uses Vercel commit SHA)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ? `focusonit@${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
    : undefined,

  // Enhanced error context
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Session replay for error debugging (only on errors)
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Track propagation to these targets
  tracePropagationTargets: ["localhost", "focusonit.ycm360.com"],

  // Session replay sampling
  replaysSessionSampleRate: 0, // Don't record normal sessions
  replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors

  // Filter sensitive data before sending to Sentry
  beforeSend(event, hint) {
    // Remove cookies and auth headers
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
    }

    // Remove email from user context (keep user ID for tracking)
    if (event.user?.email) {
      event.user.email = event.user.email.replace(/@.*$/, '@***');
    }

    // Don't send validation errors (these are expected user errors)
    const errorType = event.exception?.values?.[0]?.type;
    if (errorType === 'ValidationError' || errorType === 'UserInputError') {
      return null;
    }

    // Don't send network timeouts from unstable connections
    const errorMessage = event.exception?.values?.[0]?.value || '';
    if (errorMessage.includes('timeout') || errorMessage.includes('NetworkError')) {
      // Only send if it happens repeatedly
      if (!event.fingerprint) {
        event.fingerprint = ['network-error'];
      }
    }

    return event;
  },

  // Ignore common browser errors that aren't actionable
  ignoreErrors: [
    // Browser quirks
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',

    // Network issues (user's connection problems)
    'NetworkError when attempting to fetch resource',
    'Failed to fetch',
    'Load failed',

    // Browser extensions
    'Extension context invalidated',
    'chrome-extension://',
    'moz-extension://',

    // Non-error promise rejections
    'Non-Error promise rejection captured',
    'Non-Error exception captured',

    // Expected auth errors
    'Invalid Refresh Token',
    'Auth session missing',
  ],

  // Don't send transactions from certain URLs
  ignoreTransactions: [
    '/api/health', // Health checks generate too much noise
  ],
});
