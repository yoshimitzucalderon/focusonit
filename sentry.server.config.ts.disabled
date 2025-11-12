import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Environment tracking
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA
    ? `focusonit@${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}`
    : undefined,

  // Server-side integrations
  // Note: @sentry/nextjs doesn't have httpIntegration
  // HTTP requests are automatically instrumented

  // Filter sensitive data on server-side
  beforeSend(event, hint) {
    // Remove all headers (may contain secrets)
    if (event.request?.headers) {
      const safeHeaders = {
        'user-agent': event.request.headers['user-agent'],
        'content-type': event.request.headers['content-type'],
      };
      event.request.headers = safeHeaders;
    }

    // Remove cookies
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    // Remove environment variables from context
    if (event.contexts?.runtime?.env) {
      // Only keep safe env vars
      const env = event.contexts.runtime.env as Record<string, string>;
      const safeEnvVars = {
        NODE_ENV: env.NODE_ENV,
        VERCEL_ENV: env.VERCEL_ENV,
      };
      event.contexts.runtime.env = safeEnvVars;
    }

    // Scrub sensitive data from error messages
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(exception => {
        if (exception.value) {
          // Remove API keys, tokens, passwords from error messages
          exception.value = exception.value
            .replace(/sk_[a-zA-Z0-9_-]+/g, 'sk_***')
            .replace(/pk_[a-zA-Z0-9_-]+/g, 'pk_***')
            .replace(/Bearer\s+[^\s]+/g, 'Bearer ***')
            .replace(/password['":\s]+[^'",\s}]+/gi, 'password":"***"')
            .replace(/token['":\s]+[^'",\s}]+/gi, 'token":"***"');
        }
        return exception;
      });
    }

    // Mask email addresses in user context
    if (event.user?.email) {
      event.user.email = event.user.email.replace(/@.*$/, '@***');
    }

    // Don't send Supabase RLS errors (these are expected security errors)
    const errorMessage = event.exception?.values?.[0]?.value || '';
    if (errorMessage.includes('Row Level Security') || errorMessage.includes('RLS policy')) {
      return null;
    }

    return event;
  },

  // Ignore server-side errors that aren't actionable
  ignoreErrors: [
    // Expected auth errors
    'Invalid Refresh Token',
    'JWT expired',
    'Auth session missing',

    // Expected database errors (handled gracefully)
    'unique constraint',
    'foreign key constraint',

    // Client disconnections (user closed browser)
    'ECONNRESET',
    'EPIPE',
  ],
});
