/**
 * Centralized Logger for FocusOnIt Task Manager
 *
 * Features:
 * - Structured logging (JSON format)
 * - Multiple log levels (error, warn, info, debug)
 * - Integration with Sentry for error tracking
 * - Context enrichment (user, request, tags)
 * - Environment-aware (verbose in dev, quiet in prod)
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('Task created', { taskId: '123', userId: 'abc' });
 * logger.error('Failed to sync calendar', error, { userId: 'abc' });
 * logger.warn('Rate limit approaching', { usage: 90, limit: 100 });
 * ```
 */

import * as Sentry from '@sentry/nextjs';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string;
  taskId?: string;
  eventId?: string;
  requestId?: string;
  route?: string;
  method?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;
  private minLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';

    // Set minimum log level based on environment
    this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * Check if a log level should be logged based on current environment
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);

    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Format log entry as JSON
   */
  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Output log entry to console
   */
  private output(entry: LogEntry): void {
    const { level, message, context, error } = entry;

    // In development: colorized, pretty-printed
    if (this.isDevelopment) {
      const colors: Record<LogLevel, string> = {
        error: '\x1b[31m', // Red
        warn: '\x1b[33m',  // Yellow
        info: '\x1b[36m',  // Cyan
        debug: '\x1b[90m', // Gray
      };
      const reset = '\x1b[0m';
      const color = colors[level] || reset;

      console[level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : 'log'](
        `${color}[${level.toUpperCase()}]${reset} ${message}`,
        context ? context : '',
        error ? error : ''
      );
    } else {
      // In production: structured JSON
      console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log error message
   * Automatically sends to Sentry with full context
   */
  error(message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const entry = this.formatLogEntry(LogLevel.ERROR, message, context, error);
    this.output(entry);

    // Send to Sentry
    if (error) {
      Sentry.captureException(error, {
        tags: {
          logger: 'true',
          ...context,
        },
        contexts: {
          custom: context,
        },
        level: 'error',
      });
    } else {
      Sentry.captureMessage(message, {
        tags: {
          logger: 'true',
          ...context,
        },
        contexts: {
          custom: context,
        },
        level: 'error',
      });
    }
  }

  /**
   * Log warning message
   * Sends to Sentry with 'warning' level
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const entry = this.formatLogEntry(LogLevel.WARN, message, context);
    this.output(entry);

    // Send to Sentry (but with lower priority)
    if (this.isProduction) {
      Sentry.captureMessage(message, {
        tags: {
          logger: 'true',
          ...context,
        },
        contexts: {
          custom: context,
        },
        level: 'warning',
      });
    }
  }

  /**
   * Log info message
   * Does NOT send to Sentry (too noisy)
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const entry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.output(entry);
  }

  /**
   * Log debug message
   * Only in development, never in production
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    this.output(entry);
  }

  /**
   * Start a performance timer
   * Returns a function that logs the elapsed time when called
   */
  startTimer(operation: string): () => void {
    const start = Date.now();

    return (context?: LogContext) => {
      const duration = Date.now() - start;
      this.info(`${operation} completed`, {
        ...context,
        duration,
        operation,
      });
    };
  }

  /**
   * Log API request
   */
  request(method: string, route: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.info('API Request', {
      method,
      route,
      statusCode,
      duration,
      ...context,
    });
  }

  /**
   * Add breadcrumb to Sentry (for debugging context)
   */
  breadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });

    // Also log as debug
    this.debug(`[Breadcrumb: ${category}] ${message}`, data as LogContext);
  }

  /**
   * Set user context in Sentry
   */
  setUser(userId: string, email?: string, username?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });

    this.debug('User context set', { userId, email, username });
  }

  /**
   * Clear user context (on logout)
   */
  clearUser(): void {
    Sentry.setUser(null);
    this.debug('User context cleared');
  }

  /**
   * Add custom tag to all future Sentry events
   */
  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
  }

  /**
   * Flush Sentry queue (useful before serverless shutdown)
   */
  async flush(timeout = 2000): Promise<void> {
    await Sentry.flush(timeout);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common use cases

/**
 * Log task operation
 */
export function logTaskOperation(
  operation: 'create' | 'update' | 'delete' | 'complete',
  taskId: string,
  userId: string,
  context?: LogContext
): void {
  logger.info(`Task ${operation}`, {
    operation,
    taskId,
    userId,
    ...context,
  });
}

/**
 * Log calendar sync operation
 */
export function logCalendarSync(
  operation: string,
  success: boolean,
  eventId?: string,
  error?: Error,
  context?: LogContext
): void {
  if (success) {
    logger.info(`Calendar sync: ${operation}`, {
      operation,
      eventId,
      ...context,
    });
  } else {
    logger.error(`Calendar sync failed: ${operation}`, error, {
      operation,
      eventId,
      ...context,
    });
  }
}

/**
 * Log authentication event
 */
export function logAuth(
  event: 'login' | 'logout' | 'signup' | 'oauth',
  userId?: string,
  provider?: string,
  error?: Error
): void {
  if (error) {
    logger.error(`Auth ${event} failed`, error, { event, userId, provider });
  } else {
    logger.info(`Auth ${event}`, { event, userId, provider });
  }
}

/**
 * Log performance metric
 */
export function logPerformance(
  metric: 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'API',
  value: number,
  context?: LogContext
): void {
  // Only log in production (avoid noise in dev)
  if (process.env.NODE_ENV === 'production') {
    logger.info(`Performance: ${metric}`, {
      metric,
      value,
      ...context,
    });

    // Send to Sentry as measurement
    Sentry.getCurrentScope().setContext('performance', {
      metric,
      value,
      ...context,
    });
  }
}
