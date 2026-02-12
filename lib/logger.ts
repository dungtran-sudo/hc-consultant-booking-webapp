type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  requestId?: string;
  [key: string]: unknown;
}

function formatLog(entry: LogEntry): string {
  const { level, message, context, requestId, ...extra } = entry;
  const ts = new Date().toISOString();
  const parts = [`[${ts}]`, `[${level.toUpperCase()}]`];
  if (context) parts.push(`[${context}]`);
  if (requestId) parts.push(`[${requestId}]`);
  parts.push(message);
  const extraKeys = Object.keys(extra);
  if (extraKeys.length > 0) {
    parts.push(JSON.stringify(extra));
  }
  return parts.join(' ');
}

export function createLogger(context: string) {
  return {
    info(message: string, extra?: Record<string, unknown>) {
      console.log(formatLog({ level: 'info', message, context, ...extra }));
    },
    warn(message: string, extra?: Record<string, unknown>) {
      console.warn(formatLog({ level: 'warn', message, context, ...extra }));
    },
    error(message: string, error?: unknown, extra?: Record<string, unknown>) {
      const errorInfo: Record<string, unknown> = { ...extra };
      if (error instanceof Error) {
        errorInfo.errorName = error.name;
        errorInfo.errorMessage = error.message;
        if (error.stack) errorInfo.stack = error.stack.split('\n').slice(0, 3).join(' | ');
      } else if (error !== undefined) {
        errorInfo.rawError = String(error);
      }
      console.error(formatLog({ level: 'error', message, context, ...errorInfo }));
    },
  };
}

/** Safe error message for API responses — never leaks internals */
export function safeErrorMessage(error: unknown, fallback: string): string {
  // Only return the fallback message to clients
  // Log the real error server-side via logger
  void error;
  return fallback;
}
