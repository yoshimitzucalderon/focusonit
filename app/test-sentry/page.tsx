'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Test page for Sentry error tracking
 *
 * DELETE THIS PAGE AFTER VERIFYING SENTRY IS WORKING
 *
 * Usage:
 * 1. Deploy application with Sentry configured
 * 2. Visit /test-sentry
 * 3. Click buttons to trigger different error types
 * 4. Check Sentry dashboard to verify errors are captured
 * 5. Delete this file after verification
 */
export default function TestSentryPage() {
  const [showSuccess, setShowSuccess] = useState(false);

  const triggerClientError = () => {
    try {
      throw new Error('Test Client-Side Error - Sentry Integration Working!');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test: 'client-error',
          component: 'test-sentry',
        },
        level: 'error',
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const triggerServerError = async () => {
    try {
      const response = await fetch('/api/test-sentry', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Server error triggered successfully');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error triggering server error:', error);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const triggerWarning = () => {
    Sentry.captureMessage('Test Warning - This is a warning level message', {
      level: 'warning',
      tags: {
        test: 'warning',
        component: 'test-sentry',
      },
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sentry Test Page
            </h1>
            <p className="text-red-600 dark:text-red-400 font-semibold">
              DELETE THIS PAGE AFTER TESTING
            </p>
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              Click the buttons below to trigger different types of errors and verify that Sentry is capturing them correctly.
            </p>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 rounded">
              <p className="text-green-800 dark:text-green-200">
                Error triggered! Check your Sentry dashboard.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="border-b dark:border-gray-700 pb-4">
              <button
                onClick={triggerClientError}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Trigger Client-Side Error
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Triggers a JavaScript error that will be captured by Sentry on the client-side.
              </p>
            </div>

            <div className="border-b dark:border-gray-700 pb-4">
              <button
                onClick={triggerServerError}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Trigger Server-Side Error
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Sends a request to an API route that will throw an error captured on the server.
              </p>
            </div>

            <div className="border-b dark:border-gray-700 pb-4">
              <button
                onClick={triggerWarning}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Trigger Warning Message
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Captures a warning-level message (not an error) for testing different severity levels.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Verification Steps:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Click each button above</li>
              <li>Go to your Sentry dashboard (sentry.io)</li>
              <li>Navigate to Issues</li>
              <li>Verify that 3 events appear (error, server error, warning)</li>
              <li>Once verified, DELETE THIS FILE: app/test-sentry/page.tsx</li>
              <li>Also delete: app/api/test-sentry/route.ts</li>
            </ol>
          </div>

          <div className="mt-6">
            <a
              href="/dashboard"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
