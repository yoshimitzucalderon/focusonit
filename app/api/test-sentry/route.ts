import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Test API route for Sentry server-side error tracking
 *
 * DELETE THIS FILE AFTER VERIFYING SENTRY IS WORKING
 */
export async function POST() {
  try {
    // Trigger a test error
    throw new Error('Test Server-Side Error - Sentry Integration Working!');
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error, {
      tags: {
        test: 'server-error',
        api: 'test-sentry',
      },
      level: 'error',
    });

    // Return error response
    return NextResponse.json(
      { error: 'Test error triggered successfully' },
      { status: 500 }
    );
  }
}
