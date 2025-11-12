import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Disable caching for health checks
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: {
      status: boolean;
      message?: string;
      responseTime?: number;
    };
    realtime: {
      status: boolean;
      message?: string;
    };
    calendar: {
      status: boolean;
      message?: string;
    };
  };
  version: string;
  environment: string;
  uptime?: number;
  responseTime: number;
}

/**
 * Health check endpoint
 *
 * Returns health status of all critical services:
 * - Database (Supabase connection)
 * - Real-time (Supabase subscriptions)
 * - Calendar (Google Calendar API availability)
 *
 * Used by:
 * - UptimeRobot for uptime monitoring
 * - Load balancers for health checks
 * - DevOps team for manual verification
 *
 * Response codes:
 * - 200: All systems healthy
 * - 503: One or more systems degraded/unhealthy
 */
export async function GET() {
  const startTime = Date.now();

  const health: HealthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: {
        status: false,
        message: 'Not checked',
      },
      realtime: {
        status: false,
        message: 'Not checked',
      },
      calendar: {
        status: false,
        message: 'Not checked',
      },
    },
    version:
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
      'dev',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    responseTime: 0,
  };

  try {
    // Check 1: Database Connection
    const dbStartTime = Date.now();
    try {
      const supabase = await createServerSupabaseClient();

      // Simple query to verify database connectivity
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .limit(1)
        .single();

      const dbResponseTime = Date.now() - dbStartTime;

      if (error) {
        // If no tasks exist, that's OK - connection works
        if (error.code === 'PGRST116') {
          health.checks.database = {
            status: true,
            message: 'Connected (no data)',
            responseTime: dbResponseTime,
          };
        } else {
          health.checks.database = {
            status: false,
            message: `Database error: ${error.message}`,
            responseTime: dbResponseTime,
          };
        }
      } else {
        health.checks.database = {
          status: true,
          message: 'Connected',
          responseTime: dbResponseTime,
        };
      }
    } catch (dbError) {
      health.checks.database = {
        status: false,
        message: `Connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
      };
    }

    // Check 2: Supabase Real-time
    // Note: Full WebSocket check requires client-side, this is simplified
    try {
      // If database is healthy, assume real-time is available
      // (Both run on same Supabase instance)
      if (health.checks.database.status) {
        health.checks.realtime = {
          status: true,
          message: 'Available',
        };
      } else {
        health.checks.realtime = {
          status: false,
          message: 'Database connection required',
        };
      }
    } catch (realtimeError) {
      health.checks.realtime = {
        status: false,
        message: `Check failed: ${realtimeError instanceof Error ? realtimeError.message : 'Unknown error'}`,
      };
    }

    // Check 3: Google Calendar API
    // Note: We don't actually call Google API to avoid quota usage
    // Just verify that environment variables are configured
    try {
      const hasGoogleConfig =
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

      if (hasGoogleConfig) {
        health.checks.calendar = {
          status: true,
          message: 'Configured',
        };
      } else {
        health.checks.calendar = {
          status: false,
          message: 'Not configured',
        };
      }
    } catch (calendarError) {
      health.checks.calendar = {
        status: false,
        message: `Check failed: ${calendarError instanceof Error ? calendarError.message : 'Unknown error'}`,
      };
    }

    // Determine overall status
    const allHealthy = Object.values(health.checks).every((check) => check.status);
    const anyUnhealthy = Object.values(health.checks).some((check) => !check.status);

    if (allHealthy) {
      health.status = 'healthy';
    } else if (anyUnhealthy && health.checks.database.status) {
      // If DB is up but other services are down, still degraded (not unhealthy)
      health.status = 'degraded';
    } else {
      // If DB is down, system is unhealthy
      health.status = 'unhealthy';
    }

    health.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    // Catch-all for unexpected errors
    health.status = 'unhealthy';
    health.responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...health,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 503 }
    );
  }
}
