import { describe, it, expect, beforeEach } from 'bun:test';
import { ShellExecutor, ShellExecutionError } from '../../src/utils/shell.js';
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

    it('should handle command failure (execution)', async () => {
      // This command is allowed but will fail execution
      const result = await shellExecutor.executeQuiet('ls /nonexistent-dir'); 

      expect(result.success).toBe(false);
      expect(result.exitCode).toBeGreaterThan(0);
      expect(result.stderr).toContain('No such file or directory');
    });

    it('should execute command with working directory', async () => {
      const result = await shellExecutor.execute('pwd', { cwd: '/tmp' });
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toMatch(/\/tmp$/);
    });

    it('should execute command with environment variables', async () => {
      const result = await shellExecutor.execute('printenv TEST_VAR', {
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

    it('should stop sequence on first failure (execution)', async () => {
      const commands = [
        'echo "first"',
        'ls /nonexistent-dir', // This will fail execution
        'echo "third"',
      ];

      try {
        await shellExecutor.executeSequence(commands);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ShellExecutionError);
        expect((error as ShellExecutionError).result.stderr).toContain('No such file or directory');
      }

      // Should have executed only the first command successfully, and the second command failed execution.
      const commandHistory = logger.getCommandHistory();
      expect(commandHistory).toHaveLength(2);
      expect(commandHistory[0].success).toBe(true);
      expect(commandHistory[1].success).toBe(false);
      expect(commandHistory[1].stderr).toContain('No such file or directory');
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

    it('should throw if any command fails in parallel and throwOnError is true (validation)', async () => {
      const commands = [
        'echo "parallel1"',
        'invalid-cmd', // This will fail validation
        'echo "parallel3"',
      ];

      await expect(shellExecutor.executeParallel(commands, { throwOnError: true })).rejects.toThrow(ShellExecutionError);
      const error = await shellExecutor.executeParallel(commands, { throwOnError: true }).catch(e => e);
      expect(error.result.stderr).toContain('Command validation failed');
    });

    it('should throw if any command fails in parallel and throwOnError is true (execution)', async () => {
      const commands = [
        'echo "parallel1"',
        'ls /nonexistent-dir', // This will fail execution
        'echo "parallel3"',
      ];

      await expect(shellExecutor.executeParallel(commands, { throwOnError: true })).rejects.toThrow(ShellExecutionError);
      const error = await shellExecutor.executeParallel(commands, { throwOnError: true }).catch(e => e);
      expect(error.result.stderr).toContain('No such file or directory');
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
      const result = await shellExecutor.executeInDirectory('/tmp', 'echo "in_tmp"');
      expect(result.success).toBe(true);
      expect(result.stdout.trim()).toBe('in_tmp');
    });
  });

  describe('logging integration', () => {
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

    it('should log failed command details (execution)', async () => {
      await shellExecutor.executeQuiet('ls /nonexistent-dir');

      const logs = logger.getLogs();
      const errorLog = logs.find(log => log.message.includes('Command failed'));
      
      expect(errorLog).toBeDefined();
      expect(errorLog?.level).toBe(LogLevel.ERROR);
      expect(errorLog?.context?.command).toBe('ls /nonexistent-dir');
      expect(errorLog?.context?.success).toBe(false);
      expect(errorLog?.context?.exitCode).toBeGreaterThan(0);
      expect(errorLog?.context?.stderr).toContain('No such file or directory');
    });
  });
});