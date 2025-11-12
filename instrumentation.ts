// Next.js instrumentation file
// Sentry integration temporarily disabled for deployment
// This runs before any other code in your application
export async function register() {
  // Placeholder for future instrumentation
  console.log('Application instrumentation initialized');
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
  // Log errors to console (Sentry temporarily disabled)
  console.error('Request error:', {
    error: err.message,
    method: request.method,
    url: request.url,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
