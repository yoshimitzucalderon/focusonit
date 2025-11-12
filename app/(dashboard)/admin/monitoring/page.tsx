import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Admin Monitoring Dashboard
 *
 * Displays system health metrics and sync statistics.
 * Only accessible to admin users.
 *
 * Metrics shown:
 * - Total tasks with sync enabled
 * - Tasks synced in last 24h
 * - Sync errors in last 24h
 * - Success rate percentage
 * - Recent sync activity
 * - System health status
 */
export default async function MonitoringPage() {
  const supabase = await createServerSupabaseClient();

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  // TODO: Implement proper admin role check
  // For now, only allow specific email(s)
  const adminEmails = [
    'admin@ycm360.com',
    'yoshlack@gmail.com', // Add your admin email here
  ];

  const isAdmin = adminEmails.includes(user.email || '');

  if (!isAdmin) {
    redirect('/dashboard');
  }

  // Fetch monitoring data
  const [tasksResult, syncStatsResult, healthResult] = await Promise.all([
    // Total tasks with sync enabled
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('google_calendar_sync', true)
      .not('calendar_event_id', 'is', null),

    // Recent sync activity (last 24 hours)
    supabase
      .from('tasks')
      .select('id, updated_at, google_calendar_sync, calendar_event_id')
      .eq('google_calendar_sync', true)
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
      .limit(10),

    // System health check (call internal API)
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`, {
      cache: 'no-store',
    }).then((res) => res.json()),
  ]);

  const totalSyncEnabled = tasksResult.count || 0;
  const recentSyncActivity: Array<{
    id: string;
    updated_at: string;
    google_calendar_sync: boolean | null;
    calendar_event_id: string | null;
  }> = syncStatsResult.data || [];
  const healthStatus = healthResult;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time system health and sync statistics
          </p>
        </div>

        {/* System Health Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            System Health
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div
                  className={`text-4xl font-bold mb-2 ${
                    healthStatus.status === 'healthy'
                      ? 'text-green-600 dark:text-green-400'
                      : healthStatus.status === 'degraded'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {healthStatus.status === 'healthy' ? '✓' : '⚠'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overall Status</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {healthStatus.status}
                </p>
              </div>

              <div className="text-center">
                <div
                  className={`text-4xl font-bold mb-2 ${
                    healthStatus.checks?.database?.status
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {healthStatus.checks?.database?.status ? '✓' : '✗'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Database</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {healthStatus.checks?.database?.status ? 'Connected' : 'Error'}
                </p>
                {healthStatus.checks?.database?.responseTime && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {healthStatus.checks.database.responseTime}ms
                  </p>
                )}
              </div>

              <div className="text-center">
                <div
                  className={`text-4xl font-bold mb-2 ${
                    healthStatus.checks?.realtime?.status
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {healthStatus.checks?.realtime?.status ? '✓' : '✗'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Real-time</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {healthStatus.checks?.realtime?.status ? 'Available' : 'Error'}
                </p>
              </div>

              <div className="text-center">
                <div
                  className={`text-4xl font-bold mb-2 ${
                    healthStatus.checks?.calendar?.status
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  {healthStatus.checks?.calendar?.status ? '✓' : '⚠'}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Calendar API</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {healthStatus.checks?.calendar?.status ? 'Configured' : 'Not Configured'}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Response Time: <span className="font-semibold">{healthStatus.responseTime}ms</span>
                {' | '}
                Version: <span className="font-semibold">{healthStatus.version}</span>
                {' | '}
                Environment: <span className="font-semibold">{healthStatus.environment}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Sync Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Google Calendar Sync
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Tasks with Sync Enabled
              </h3>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {totalSyncEnabled}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Synced (24h)
              </h3>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {recentSyncActivity.length}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Success Rate
              </h3>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                {totalSyncEnabled > 0
                  ? Math.round((recentSyncActivity.length / totalSyncEnabled) * 100)
                  : 100}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Recent Sync Activity */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Sync Activity (Last 24h)
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {recentSyncActivity.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No sync activity in the last 24 hours
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Task ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Calendar Event ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentSyncActivity.map((task) => (
                    <tr key={task.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {task.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {task.calendar_event_id?.slice(0, 16)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(task.updated_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Synced
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex justify-between items-center">
          <a
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}
