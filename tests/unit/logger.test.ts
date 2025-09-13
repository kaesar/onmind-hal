import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { Logger, LogLevel, type LogEntry, type CommandExecutionLog } from '../../src/utils/logger.js';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: any;

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG);
    // Spy on console methods to prevent actual output during tests
    consoleSpy = {
      debug: spyOn(console, 'debug').mockImplementation(() => {}),
      info: spyOn(console, 'info').mockImplementation(() => {}),
      warn: spyOn(console, 'warn').mockImplementation(() => {}),
      error: spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { key: 'value' });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Debug message');
      expect(logs[0].context).toEqual({ key: 'value' });
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Info message');
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warning messages', () => {
      logger.warn('Warning message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Error message');
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('log level filtering', () => {
    it('should respect log level filtering', () => {
      logger.setLogLevel(LogLevel.WARN);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[1].level).toBe(LogLevel.ERROR);
    });

    it('should get logs by level', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Error message');
    });
  });

  describe('command execution tracking', () => {
    it('should start and end command execution tracking', async () => {
      const commandLog = logger.startCommandExecution('echo "test"', { cwd: '/tmp' });

      expect(commandLog.command).toBe('echo "test"');
      expect(commandLog.startTime).toBeInstanceOf(Date);
      expect(commandLog.options).toEqual({ cwd: '/tmp' });

      // Wait a bit to ensure execution time > 0
      await new Promise(resolve => setTimeout(resolve, 1));

      // Simulate command completion
      logger.endCommandExecution(commandLog, 0, 'test\n', '');

      expect(commandLog.endTime).toBeInstanceOf(Date);
      expect(commandLog.executionTime).toBeGreaterThanOrEqual(0);
      expect(commandLog.exitCode).toBe(0);
      expect(commandLog.success).toBe(true);
      expect(commandLog.stdout).toBe('test\n');
      expect(commandLog.stderr).toBe('');

      const history = logger.getCommandHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toBe(commandLog);
    });

    it('should track failed command execution', () => {
      const commandLog = logger.startCommandExecution('nonexistent-command');

      logger.endCommandExecution(commandLog, 127, '', 'command not found');

      expect(commandLog.success).toBe(false);
      expect(commandLog.exitCode).toBe(127);
      expect(commandLog.stderr).toBe('command not found');

      const failedCommands = logger.getFailedCommands();
      expect(failedCommands).toHaveLength(1);
      expect(failedCommands[0]).toBe(commandLog);
    });

    it('should get successful commands', () => {
      const successfulCommand = logger.startCommandExecution('echo "success"');
      logger.endCommandExecution(successfulCommand, 0, 'success\n', '');

      const failedCommand = logger.startCommandExecution('false');
      logger.endCommandExecution(failedCommand, 1, '', '');

      const successfulCommands = logger.getSuccessfulCommands();
      expect(successfulCommands).toHaveLength(1);
      expect(successfulCommands[0]).toBe(successfulCommand);
    });

    it('should calculate average execution time', () => {
      const command1 = logger.startCommandExecution('command1');
      // Simulate 100ms execution
      command1.startTime = new Date(Date.now() - 100);
      logger.endCommandExecution(command1, 0, '', '');

      const command2 = logger.startCommandExecution('command2');
      // Simulate 200ms execution
      command2.startTime = new Date(Date.now() - 200);
      logger.endCommandExecution(command2, 0, '', '');

      const avgTime = logger.getAverageExecutionTime();
      expect(avgTime).toBeGreaterThan(0);
      expect(avgTime).toBeLessThan(300); // Should be around 150ms
    });

    it('should get execution statistics', async () => {
      // Add successful command
      const successfulCommand = logger.startCommandExecution('echo "success"');
      await new Promise(resolve => setTimeout(resolve, 1));
      logger.endCommandExecution(successfulCommand, 0, 'success\n', '');

      // Add failed command
      const failedCommand = logger.startCommandExecution('false');
      await new Promise(resolve => setTimeout(resolve, 1));
      logger.endCommandExecution(failedCommand, 1, '', '');

      const stats = logger.getExecutionStats();
      expect(stats.totalCommands).toBe(2);
      expect(stats.successfulCommands).toBe(1);
      expect(stats.failedCommands).toBe(1);
      expect(stats.successRate).toBe(50);
      expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('log management', () => {
    it('should clear logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);

      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should clear command history', () => {
      const commandLog = logger.startCommandExecution('test');
      logger.endCommandExecution(commandLog, 0, '', '');
      expect(logger.getCommandHistory()).toHaveLength(1);

      logger.clearCommandHistory();
      expect(logger.getCommandHistory()).toHaveLength(0);
    });

    it('should clear all logs and history', () => {
      logger.info('Test message');
      const commandLog = logger.startCommandExecution('test');
      logger.endCommandExecution(commandLog, 0, '', '');

      const logsCount = logger.getLogs().length;
      expect(logsCount).toBeGreaterThan(0); // Should have some logs
      expect(logger.getCommandHistory()).toHaveLength(1);

      logger.clearAll();
      expect(logger.getLogs()).toHaveLength(0);
      expect(logger.getCommandHistory()).toHaveLength(0);
    });
  });

  describe('import/export', () => {
    it('should export logs as JSON', () => {
      logger.info('Test message');
      const commandLog = logger.startCommandExecution('test');
      logger.endCommandExecution(commandLog, 0, 'output', '');

      const exported = logger.exportLogs();
      const data = JSON.parse(exported);

      expect(data.logs.length).toBeGreaterThan(0); // Should have some logs
      expect(data.commandHistory).toHaveLength(1);
      expect(data.exportedAt).toBeDefined();
    });

    it('should import logs from JSON', () => {
      const testData = {
        logs: [
          {
            timestamp: new Date().toISOString(),
            level: LogLevel.INFO,
            message: 'Imported message',
            context: { imported: true },
          },
        ],
        commandHistory: [
          {
            command: 'imported-command',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            executionTime: 100,
            exitCode: 0,
            success: true,
            stdout: 'output',
            stderr: '',
          },
        ],
      };

      logger.importLogs(JSON.stringify(testData));

      const logs = logger.getLogs();
      const history = logger.getCommandHistory();

      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Imported message');
      expect(logs[0].context).toEqual({ imported: true });

      expect(history).toHaveLength(1);
      expect(history[0].command).toBe('imported-command');
      expect(history[0].success).toBe(true);
    });

    it('should handle invalid JSON during import', () => {
      logger.importLogs('invalid json');

      // Should log an error but not crash
      const logs = logger.getLogs();
      expect(logs.some(log => log.message.includes('Failed to import logs'))).toBe(true);
    });
  });

  describe('log limits', () => {
    it('should limit log entries', () => {
      const logger = new Logger();
      // Set a small limit for testing
      (logger as any).maxLogEntries = 3;

      logger.info('Message 1');
      logger.info('Message 2');
      logger.info('Message 3');
      logger.info('Message 4');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0].message).toBe('Message 2');
      expect(logs[2].message).toBe('Message 4');
    });

    it('should limit command history', () => {
      const logger = new Logger();
      // Set a small limit for testing
      (logger as any).maxCommandHistory = 2;

      const cmd1 = logger.startCommandExecution('command1');
      logger.endCommandExecution(cmd1, 0, '', '');

      const cmd2 = logger.startCommandExecution('command2');
      logger.endCommandExecution(cmd2, 0, '', '');

      const cmd3 = logger.startCommandExecution('command3');
      logger.endCommandExecution(cmd3, 0, '', '');

      const history = logger.getCommandHistory();
      expect(history).toHaveLength(2);
      expect(history[0].command).toBe('command2');
      expect(history[1].command).toBe('command3');
    });
  });
});