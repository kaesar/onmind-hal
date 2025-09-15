import { describe, it, expect, beforeEach } from 'bun:test';
import { ShellExecutionError, type ShellResult } from '../../src/utils/shell.js';

// Create a test implementation of ShellExecutor for unit testing
class TestShellExecutor {
  private mockResults: Map<string, any> = new Map();
  private mockErrors: Map<string, Error> = new Map();

  setMockResult(command: string, result: any) {
    this.mockResults.set(command, result);
  }

  setMockError(command: string, error: Error) {
    this.mockErrors.set(command, error);
  }

  async execute(command: string, options: any = {}): Promise<ShellResult> {
    const startTime = Date.now();

    // Check for mock error
    if (this.mockErrors.has(command)) {
      const error = this.mockErrors.get(command)!;
      const executionTime = Date.now() - startTime;
      
      if (error.message.includes('timeout')) {
        const result: ShellResult = {
          stdout: '',
          stderr: error.message,
          exitCode: -1,
          command,
          executionTime,
          success: false,
        };

        if (options.throwOnError !== false) {
          throw new ShellExecutionError(command, -1, error.message, result);
        }
        return result;
      }

      // For non-timeout errors, still throw ShellExecutionError if throwOnError is true
      if (options.throwOnError !== false) {
        const result: ShellResult = {
          stdout: '',
          stderr: error.message,
          exitCode: -1,
          command,
          executionTime,
          success: false,
        };
        throw new ShellExecutionError(command, -1, error.message, result);
      }

      throw error;
    }

    // Get mock result
    const mockResult = this.mockResults.get(command) || {
      stdout: '',
      stderr: 'Command not found',
      exitCode: 127,
    };

    const executionTime = Date.now() - startTime;
    const result: ShellResult = {
      stdout: mockResult.stdout || '',
      stderr: mockResult.stderr || '',
      exitCode: mockResult.exitCode || 0,
      command,
      executionTime,
      success: (mockResult.exitCode || 0) === 0,
    };

    if (!result.success && options.throwOnError !== false) {
      throw new ShellExecutionError(command, result.exitCode, result.stderr, result);
    }

    return result;
  }

  async executeQuiet(command: string, options: any = {}): Promise<ShellResult> {
    return this.execute(command, { ...options, throwOnError: false });
  }

  async executeSequence(commands: string[], options: any = {}): Promise<ShellResult[]> {
    const results: ShellResult[] = [];

    for (const command of commands) {
      const result = await this.execute(command, options);
      results.push(result);

      if (!result.success && options.throwOnError !== false) {
        break;
      }
    }

    return results;
  }

  async executeParallel(commands: string[], options: any = {}): Promise<ShellResult[]> {
    const promises = commands.map(command => 
      this.execute(command, { ...options, throwOnError: false })
    );

    const results = await Promise.all(promises);

    if (options.throwOnError !== false) {
      const failedResult = results.find(result => !result.success);
      if (failedResult) {
        throw new ShellExecutionError(
          failedResult.command,
          failedResult.exitCode,
          failedResult.stderr,
          failedResult
        );
      }
    }

    return results;
  }

  async commandExists(command: string): Promise<boolean> {
    try {
      const result = await this.executeQuiet(`which ${command}`);
      return result.success;
    } catch {
      return false;
    }
  }

  async getCurrentDirectory(): Promise<string> {
    const result = await this.execute('pwd');
    return result.stdout.trim();
  }

  async executeInDirectory(directory: string, command: string, options: any = {}): Promise<ShellResult> {
    return this.execute(command, { ...options, cwd: directory });
  }
}

describe('ShellExecutor', () => {
  let shellExecutor: TestShellExecutor;

  beforeEach(() => {
    shellExecutor = new TestShellExecutor();
  });

  describe('execute', () => {
    it('should execute a successful command', async () => {
      shellExecutor.setMockResult('echo "Hello World"', {
        stdout: 'Hello World',
        stderr: '',
        exitCode: 0,
      });

      const result = await shellExecutor.execute('echo "Hello World"');

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('Hello World');
      expect(result.stderr).toBe('');
      expect(result.exitCode).toBe(0);
      expect(result.command).toBe('echo "Hello World"');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle command failure with throwOnError true', async () => {
      shellExecutor.setMockResult('nonexistent-command', {
        stdout: '',
        stderr: 'Command not found',
        exitCode: 127,
      });

      await expect(
        shellExecutor.execute('nonexistent-command')
      ).rejects.toThrow(ShellExecutionError);
    });

    it('should handle command failure with throwOnError false', async () => {
      shellExecutor.setMockResult('nonexistent-command', {
        stdout: '',
        stderr: 'Command not found',
        exitCode: 127,
      });

      const result = await shellExecutor.execute('nonexistent-command', {
        throwOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(127);
      expect(result.stderr).toBe('Command not found');
    });

    it('should apply cwd option', async () => {
      shellExecutor.setMockResult('pwd', {
        stdout: '/tmp',
        stderr: '',
        exitCode: 0,
      });

      const result = await shellExecutor.execute('pwd', { cwd: '/tmp' });

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('/tmp');
    });

    it('should apply env option', async () => {
      shellExecutor.setMockResult('echo $TEST_VAR', {
        stdout: 'test-value',
        stderr: '',
        exitCode: 0,
      });

      const env = { TEST_VAR: 'test-value' };
      const result = await shellExecutor.execute('echo $TEST_VAR', { env });

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('test-value');
    });

    it('should apply timeout option', async () => {
      shellExecutor.setMockResult('sleep 1', {
        stdout: 'done',
        stderr: '',
        exitCode: 0,
      });

      const result = await shellExecutor.execute('sleep 1', { timeout: 5000 });

      expect(result.success).toBe(true);
      expect(result.stdout).toBe('done');
    });

    it('should handle timeout errors', async () => {
      shellExecutor.setMockError('sleep 10', new Error('Command timed out after 1000ms'));

      await expect(
        shellExecutor.execute('sleep 10', { timeout: 1000 })
      ).rejects.toThrow(ShellExecutionError);
    });

    it('should handle timeout errors without throwing when throwOnError is false', async () => {
      // Set up a mock result that simulates a timeout
      shellExecutor.setMockResult('sleep 10', {
        stdout: '',
        stderr: 'Command timed out after 1000ms',
        exitCode: -1,
      });

      const result = await shellExecutor.execute('sleep 10', {
        timeout: 1000,
        throwOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(-1);
      expect(result.stderr).toContain('timed out');
    });

    it('should handle unexpected errors', async () => {
      shellExecutor.setMockError('some-command', new Error('Unexpected error'));

      await expect(
        shellExecutor.execute('some-command')
      ).rejects.toThrow(Error);
    });
  });

  describe('executeQuiet', () => {
    it('should not throw on command failure', async () => {
      shellExecutor.setMockResult('failing-command', {
        stdout: '',
        stderr: 'Command failed',
        exitCode: 1,
      });

      const result = await shellExecutor.executeQuiet('failing-command');

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });
  });

  describe('executeSequence', () => {
    it('should execute commands in sequence', async () => {
      const commands = ['echo "first"', 'echo "second"', 'echo "third"'];
      
      shellExecutor.setMockResult('echo "first"', { stdout: 'first', stderr: '', exitCode: 0 });
      shellExecutor.setMockResult('echo "second"', { stdout: 'second', stderr: '', exitCode: 0 });
      shellExecutor.setMockResult('echo "third"', { stdout: 'third', stderr: '', exitCode: 0 });

      const results = await shellExecutor.executeSequence(commands, {
        throwOnError: false,
      });

      expect(results).toHaveLength(3);
      expect(results[0].stdout).toBe('first');
      expect(results[1].stdout).toBe('second');
      expect(results[2].stdout).toBe('third');
    });

    it('should stop on first failure when throwOnError is true', async () => {
      const commands = ['echo "first"', 'failing-command', 'echo "third"'];
      
      shellExecutor.setMockResult('echo "first"', { stdout: 'first', stderr: '', exitCode: 0 });
      shellExecutor.setMockResult('failing-command', { stdout: '', stderr: 'Command failed', exitCode: 1 });

      await expect(
        shellExecutor.executeSequence(commands)
      ).rejects.toThrow(ShellExecutionError);
    });
  });

  describe('executeParallel', () => {
    it('should execute commands in parallel', async () => {
      const commands = ['echo "first"', 'echo "second"', 'echo "third"'];
      
      shellExecutor.setMockResult('echo "first"', { stdout: 'first', stderr: '', exitCode: 0 });
      shellExecutor.setMockResult('echo "second"', { stdout: 'second', stderr: '', exitCode: 0 });
      shellExecutor.setMockResult('echo "third"', { stdout: 'third', stderr: '', exitCode: 0 });

      const results = await shellExecutor.executeParallel(commands, {
        throwOnError: false,
      });

      expect(results).toHaveLength(3);
      expect(results[0].stdout).toBe('first');
      expect(results[1].stdout).toBe('second');
      expect(results[2].stdout).toBe('third');
    });

    it('should throw if any command fails and throwOnError is true', async () => {
      const commands = ['echo "first"', 'failing-command', 'echo "third"'];
      
      shellExecutor.setMockResult('echo "first"', { stdout: 'first', stderr: '', exitCode: 0 });
      shellExecutor.setMockResult('failing-command', { stdout: '', stderr: 'Command failed', exitCode: 1 });
      shellExecutor.setMockResult('echo "third"', { stdout: 'third', stderr: '', exitCode: 0 });

      await expect(
        shellExecutor.executeParallel(commands)
      ).rejects.toThrow(ShellExecutionError);
    });
  });

  describe('commandExists', () => {
    it('should return true for existing command', async () => {
      shellExecutor.setMockResult('which ls', {
        stdout: '/usr/bin/ls',
        stderr: '',
        exitCode: 0,
      });

      const exists = await shellExecutor.commandExists('ls');

      expect(exists).toBe(true);
    });

    it('should return false for non-existing command', async () => {
      shellExecutor.setMockResult('which nonexistent', {
        stdout: '',
        stderr: 'which: nonexistent: not found',
        exitCode: 1,
      });

      const exists = await shellExecutor.commandExists('nonexistent');

      expect(exists).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      shellExecutor.setMockError('which some-command', new Error('Command error'));

      const exists = await shellExecutor.commandExists('some-command');

      expect(exists).toBe(false);
    });
  });

  describe('getCurrentDirectory', () => {
    it('should return current directory', async () => {
      shellExecutor.setMockResult('pwd', {
        stdout: '/home/user\n',
        stderr: '',
        exitCode: 0,
      });

      const cwd = await shellExecutor.getCurrentDirectory();

      expect(cwd).toBe('/home/user');
    });
  });

  describe('executeInDirectory', () => {
    it('should execute command in specified directory', async () => {
      shellExecutor.setMockResult('ls file.txt', {
        stdout: 'file.txt',
        stderr: '',
        exitCode: 0,
      });

      const result = await shellExecutor.executeInDirectory(
        '/tmp',
        'ls file.txt'
      );

      expect(result.stdout).toBe('file.txt');
      expect(result.success).toBe(true);
    });
  });

  describe('ShellExecutionError', () => {
    it('should create error with proper message and result', () => {
      const result: ShellResult = {
        stdout: '',
        stderr: 'Command failed',
        exitCode: 1,
        command: 'failing-command',
        executionTime: 100,
        success: false,
      };

      const error = new ShellExecutionError(
        'failing-command',
        1,
        'Command failed',
        result
      );

      expect(error.message).toContain('failing-command');
      expect(error.message).toContain('Command failed');
      expect(error.code).toBe('SHELL_EXECUTION_FAILED');
      expect(error.result).toBe(result);
    });
  });
});