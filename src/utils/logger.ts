/**
 * Logger utility for tracking command execution and results
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export interface CommandExecutionLog {
  command: string;
  startTime: Date;
  endTime?: Date;
  executionTime?: number;
  exitCode?: number;
  success?: boolean;
  stdout?: string;
  stderr?: string;
  options?: Record<string, any>;
}

/**
 * Logger class for tracking application events and command execution
 */
export class Logger {
  private logs: LogEntry[] = [];
  private commandHistory: CommandExecutionLog[] = [];
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private maxLogEntries: number = 1000;
  private maxCommandHistory: number = 100;

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.currentLogLevel = logLevel;
  }

  /**
   * Set the current log level
   */
  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Get the current log level
   */
  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log a message with specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.currentLogLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    this.logs.push(entry);

    // Trim logs if exceeding max entries
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }

    // Output to console based on level
    this.outputToConsole(entry);
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const logMessage = `[${timestamp}] ${levelName}: ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  /**
   * Start tracking a command execution
   */
  startCommandExecution(command: string, options?: Record<string, any>): CommandExecutionLog {
    const commandLog: CommandExecutionLog = {
      command,
      startTime: new Date(),
      options,
    };

    this.commandHistory.push(commandLog);

    // Trim command history if exceeding max entries
    if (this.commandHistory.length > this.maxCommandHistory) {
      this.commandHistory = this.commandHistory.slice(-this.maxCommandHistory);
    }

    this.debug(`Starting command execution: ${command}`, options);

    return commandLog;
  }

  /**
   * End tracking a command execution
   */
  endCommandExecution(
    commandLog: CommandExecutionLog,
    exitCode: number,
    stdout?: string,
    stderr?: string
  ): void {
    commandLog.endTime = new Date();
    commandLog.executionTime = commandLog.endTime.getTime() - commandLog.startTime.getTime();
    commandLog.exitCode = exitCode;
    commandLog.success = exitCode === 0;
    commandLog.stdout = stdout;
    commandLog.stderr = stderr;

    const context = {
      command: commandLog.command,
      executionTime: commandLog.executionTime,
      exitCode,
      success: commandLog.success,
    };

    if (commandLog.success) {
      this.info(`Command completed successfully: ${commandLog.command}`, context);
    } else {
      this.error(`Command failed: ${commandLog.command}`, {
        ...context,
        stderr: stderr?.substring(0, 200), // Limit stderr output
      });
    }
  }

  /**
   * Get all log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get command execution history
   */
  getCommandHistory(): CommandExecutionLog[] {
    return [...this.commandHistory];
  }

  /**
   * Get failed commands from history
   */
  getFailedCommands(): CommandExecutionLog[] {
    return this.commandHistory.filter(cmd => cmd.success === false);
  }

  /**
   * Get successful commands from history
   */
  getSuccessfulCommands(): CommandExecutionLog[] {
    return this.commandHistory.filter(cmd => cmd.success === true);
  }

  /**
   * Get average execution time for commands
   */
  getAverageExecutionTime(): number {
    const completedCommands = this.commandHistory.filter(cmd => cmd.executionTime !== undefined);
    
    if (completedCommands.length === 0) {
      return 0;
    }

    const totalTime = completedCommands.reduce((sum, cmd) => sum + (cmd.executionTime || 0), 0);
    return totalTime / completedCommands.length;
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const totalCommands = this.commandHistory.length;
    const successfulCommands = this.getSuccessfulCommands().length;
    const failedCommands = this.getFailedCommands().length;
    const averageExecutionTime = this.getAverageExecutionTime();
    const successRate = totalCommands > 0 ? (successfulCommands / totalCommands) * 100 : 0;

    return {
      totalCommands,
      successfulCommands,
      failedCommands,
      averageExecutionTime,
      successRate,
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Clear command history
   */
  clearCommandHistory(): void {
    this.commandHistory = [];
  }

  /**
   * Clear all logs and command history
   */
  clearAll(): void {
    this.clearLogs();
    this.clearCommandHistory();
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify({
      logs: this.logs,
      commandHistory: this.commandHistory,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Import logs from JSON string
   */
  importLogs(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.logs && Array.isArray(data.logs)) {
        this.logs = data.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }

      if (data.commandHistory && Array.isArray(data.commandHistory)) {
        this.commandHistory = data.commandHistory.map((cmd: any) => ({
          ...cmd,
          startTime: new Date(cmd.startTime),
          endTime: cmd.endTime ? new Date(cmd.endTime) : undefined,
        }));
      }
    } catch (error) {
      this.error('Failed to import logs', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

// Create a default logger instance
export const logger = new Logger();