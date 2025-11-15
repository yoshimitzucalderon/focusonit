// instrumentation.ts - Next.js Instrumentation Hook
// This file is automatically loaded by Next.js when the server starts
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import and initialize Sentry for server
    await import('./sentry.server.config');

    // Log initialization (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Sentry server initialized');
    }
  }

  // Edge runtime (middleware)
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import and initialize Sentry for edge
    await import('./sentry.edge.config');

    // Log initialization (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Sentry edge initialized');
    }
  }
}

export const onRequestError = async (
  err: Error,
  request: {
    method: string;
    url: string;
    headers: Headers;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
  }
) => {
  // Send to Sentry if available
  if (typeof window === 'undefined') {
    // Server-side error
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(err, {
      tags: {
        route: context.routePath,
        routeType: context.routeType,
        method: request.method,
      },
      contexts: {
        request: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries()),
        },
      },
    });
  }

  // Also log to console for local debugging
  console.error('Request error:', {
    error: err.message,
    stack: err.stack,
    method: request.method,
    url: request.url,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
