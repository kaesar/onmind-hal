import { describe, it, expect, beforeEach } from 'bun:test';
import { ShellExecutor } from '../../src/utils/shell.js';
import { logger, LogLevel } from '../../src/utils/logger.js';

describe('Shell Command Execution Integration', () => {
  let shellExecutor: ShellExecutor;

  beforeEach(() => {
    shellExecutor = new ShellExecutor();
    logger.clearAll();
    logger.setLogLevel(LogLevel.DEBUG);
  });

  describe('basic command execution', () => {
    it('should execute simple echo command', async () => {
      const result = await shellExecutor.execute('echo "Hello World"');

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe('Hello World');
      expect(result.stderr).toBe('');
      expect(result.executionTime).toBeGreaterThan(0);

      // Check that command was logged
      const commandHistory = logger.getCommandHistory();
      expect(commandHistory).toHaveLength(1);
      expect(commandHistory[0].command).toBe('echo "Hello World"');
      expect(commandHistory[0].success).toBe(true);
    });

    it('should handle command failure', async () => {
      const result = await shellExecutor.executeQuiet('false');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.executionTime).toBeGreaterThan(0);

      // Check that failed command was logged
      const failedCommands = logger.getFailedCommands();
      expect(failedCommands).toHaveLength(1);
      expect(failedCommands[0].command).toBe('false');
      expect(failedCommands[0].success).toBe(false);
    });

    it('should execute command with working directory', async () => {
      const result = await shellExecutor.execute('pwd', { cwd: '/tmp' });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toMatch(/\/tmp$/);
    });

    it('should execute command with environment variables', async () => {
      const result = await shellExecutor.execute('echo $TEST_VAR', {
        env: { TEST_VAR: 'test-value' },
      });

      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('test-value');
    });
  });

  describe('command sequence execution', () => {
    it('should execute multiple commands in sequence', async () => {
      const commands = [
        'echo "first"',
        'echo "second"',
        'echo "third"',
      ];

      const results = await shellExecutor.executeSequence(commands, {
        throwOnError: false,
      });

      expect(results).toHaveLength(3);
      expect(results[0].stdout.trim()).toBe('first');
      expect(results[1].stdout.trim()).toBe('second');
      expect(results[2].stdout.trim()).toBe('third');

      // Check that all commands were logged
      const commandHistory = logger.getCommandHistory();
      expect(commandHistory).toHaveLength(3);
      expect(commandHistory.every(cmd => cmd.success)).toBe(true);
    });

    it('should stop sequence on first failure', async () => {
      const commands = [
        'echo "first"',
        'false', // This will fail
        'echo "third"',
      ];

      try {
        await shellExecutor.executeSequence(commands);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Should have executed only first two commands
      const commandHistory = logger.getCommandHistory();
      expect(commandHistory).toHaveLength(2);
      expect(commandHistory[0].success).toBe(true);
      expect(commandHistory[1].success).toBe(false);
    });
  });

  describe('parallel command execution', () => {
    it('should execute multiple commands in parallel', async () => {
      const commands = [
        'echo "parallel1"',
        'echo "parallel2"',
        'echo "parallel3"',
      ];

      const results = await shellExecutor.executeParallel(commands, {
        throwOnError: false,
      });

      expect(results).toHaveLength(3);
      
      // Results might be in different order due to parallel execution
      const outputs = results.map(r => r.stdout.trim()).sort();
      expect(outputs).toEqual(['parallel1', 'parallel2', 'parallel3']);

      // Check that all commands were logged
      const commandHistory = logger.getCommandHistory();
      expect(commandHistory).toHaveLength(3);
      expect(commandHistory.every(cmd => cmd.success)).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should check if command exists', async () => {
      const echoExists = await shellExecutor.commandExists('echo');
      expect(echoExists).toBe(true);

      const nonExistentExists = await shellExecutor.commandExists('nonexistent-command-12345');
      expect(nonExistentExists).toBe(false);
    });

    it('should get current directory', async () => {
      const cwd = await shellExecutor.getCurrentDirectory();
      expect(cwd).toBeDefined();
      expect(cwd.length).toBeGreaterThan(0);
    });

    it('should execute command in specific directory', async () => {
      const result = await shellExecutor.executeInDirectory('/tmp', 'pwd');
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toMatch(/\/tmp$/);
    });
  });

  describe('logging integration', () => {
    it('should track execution statistics', async () => {
      // Execute some successful commands
      await shellExecutor.execute('echo "success1"');
      await shellExecutor.execute('echo "success2"');
      
      // Execute a failed command
      await shellExecutor.executeQuiet('false');

      const stats = logger.getExecutionStats();
      expect(stats.totalCommands).toBe(3);
      expect(stats.successfulCommands).toBe(2);
      expect(stats.failedCommands).toBe(1);
      expect(stats.successRate).toBeCloseTo(66.67, 1);
      expect(stats.averageExecutionTime).toBeGreaterThan(0);
    });

    it('should log command execution details', async () => {
      await shellExecutor.execute('echo "test output"');

      const logs = logger.getLogs();
      const commandLogs = logs.filter(log => 
        log.message.includes('Starting command execution') || 
        log.message.includes('Command completed successfully')
      );

      expect(commandLogs.length).toBeGreaterThanOrEqual(2);
      
      const startLog = commandLogs.find(log => log.message.includes('Starting command execution'));
      const endLog = commandLogs.find(log => log.message.includes('Command completed successfully'));
      
      expect(startLog).toBeDefined();
      expect(endLog).toBeDefined();
      expect(endLog?.context?.command).toBe('echo "test output"');
      expect(endLog?.context?.success).toBe(true);
    });

    it('should log failed command details', async () => {
      await shellExecutor.executeQuiet('false');

      const logs = logger.getLogs();
      const errorLog = logs.find(log => log.message.includes('Command failed'));
      
      expect(errorLog).toBeDefined();
      expect(errorLog?.level).toBe(LogLevel.ERROR);
      expect(errorLog?.context?.command).toBe('false');
      expect(errorLog?.context?.success).toBe(false);
      expect(errorLog?.context?.exitCode).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle timeout gracefully', async () => {
      const result = await shellExecutor.executeQuiet('sleep 10', { timeout: 100 });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBeGreaterThan(0); // Process was killed, so exit code > 0
      expect(result.executionTime).toBeGreaterThan(90); // Should be close to timeout

      // Check that timeout was logged
      const failedCommands = logger.getFailedCommands();
      expect(failedCommands.length).toBeGreaterThan(0);
    }, 10000); // Increase timeout for this test

    it('should handle non-existent commands', async () => {
      const result = await shellExecutor.executeQuiet('nonexistent-command-12345');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });
});