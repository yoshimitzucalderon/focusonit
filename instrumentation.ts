// Next.js instrumentation file (optional - for Sentry)
// This runs before any other code in your application
export async function register() {
  // Try to load Sentry config, but don't fail if it's not available
  try {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.server.config');
    }
  } catch (e) {
    // Sentry not available - that's OK
    console.log('Sentry instrumentation not loaded');
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
  // Additional error context for Sentry (if available)
  try {
    const Sentry = await import('@sentry/nextjs');

    Sentry.captureException(err, {
      contexts: {
        request: {
          method: request.method,
          url: request.url,
          // Don't include headers (may contain secrets)
        },
        nextjs: {
          routerKind: context.routerKind,
          routePath: context.routePath,
          routeType: context.routeType,
        },
      },
    });
  } catch (e) {
    // Sentry not available - just log to console
    console.error('Request error:', err);
  }
};
