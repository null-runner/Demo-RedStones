type LogLevel = "info" | "warn" | "error";

function formatMessage(level: LogLevel, module: string, message: string): string {
  const timestamp = new Date().toISOString();
  const levelTag = level.toUpperCase().padEnd(5);
  return `${timestamp} ${levelTag} [${module}] ${message}`;
}

export const logger = {
  info(module: string, message: string): void {
    console.log(formatMessage("info", module, message));
  },

  warn(module: string, message: string): void {
    console.warn(formatMessage("warn", module, message));
  },

  error(module: string, message: string, error?: unknown): void {
    const formatted = formatMessage("error", module, message);
    if (error !== undefined) {
      console.error(formatted, error);
    } else {
      console.error(formatted);
    }
  },
};
