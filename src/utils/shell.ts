import { spawn } from 'bun';
import { ShellExecutionError as BaseShellExecutionError } from './errors.js';
import { validateShellCommand, sanitizeShellParameter } from './validation.js';
import { logger, type CommandExecutionLog } from './logger.js';

/**
 * Shell command execution result
 */
export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
  executionTime: number;
  success: boolean;
}

/**
 * Shell command execution options
 */
export interface ShellOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  throwOnError?: boolean;
}

/**
 * Shell command execution error (extends the base error from errors.ts)
 */
export class ShellExecutionError extends BaseShellExecutionError {
  constructor(
    command: string,
    exitCode: number,
    stderr: string,
    public result: ShellResult
  ) {
    super(command, exitCode, stderr);
  }
}

/**
 * ShellExecutor class using Bun's native $ shell module
 * Provides command execution with proper error capture and logging
 */
export class ShellExecutor {
  private defaultOptions: ShellOptions = {
    throwOnError: true,
    timeout: 30000, // 30 seconds default timeout
  };

  /**
   * Execute a shell command with error handling
   */
  async execute(
    command: string,
    options: ShellOptions = {}
  ): Promise<ShellResult> {
    // Validate command for security
    try {
      validateShellCommand(command);
    } catch (error) {
      throw new ShellExecutionError(
        command,
        -1,
        `Command validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
        {
          stdout: '',
          stderr: `Command validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
          exitCode: -1,
          command,
          executionTime: 0,
          success: false
        }
      );
    }

    const mergedOptions = { ...this.defaultOptions, ...options };
    const startTime = Date.now();

    // Start command execution tracking
    const commandLog = logger.startCommandExecution(command, mergedOptions);

    try {
      // Use shell to execute the command properly
      const cmd = 'sh';
      const args = ['-c', command];

      // Set up spawn options
      const spawnOptions: any = {
        stdout: 'pipe',
        stderr: 'pipe',
        stdin: 'ignore',
      };

      if (mergedOptions.cwd) {
        spawnOptions.cwd = mergedOptions.cwd;
      }

      if (mergedOptions.env) {
        // Validate environment variables
        for (const [key, value] of Object.entries(mergedOptions.env)) {
          try {
            // Import validation function here to avoid circular imports
            const { validateEnvironmentVariable } = await import('./validation.js');
            validateEnvironmentVariable(key, value);
          } catch (error) {
            throw new ShellExecutionError(
              command,
              -1,
              `Environment variable validation failed: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
              {
                stdout: '',
                stderr: `Environment variable validation failed for ${key}: ${error instanceof Error ? error.message : 'Unknown validation error'}`,
                exitCode: -1,
                command,
                executionTime: 0,
                success: false
              }
            );
          }
        }
        spawnOptions.env = { ...process.env, ...mergedOptions.env };
      }

      // Execute the command using Bun.spawn
      const proc = spawn([cmd, ...args], spawnOptions);

      // Handle timeout
      let timeoutId: Timer | null = null;
      if (mergedOptions.timeout) {
        timeoutId = setTimeout(() => {
          proc.kill();
        }, mergedOptions.timeout);
      }

      // Wait for the process to complete
      const exitCode = await proc.exited;
      const executionTime = Date.now() - startTime;

      // Clear timeout if set
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Read stdout and stderr
      const stdout = await new Response(proc.stdout).text();
      const stderr = await new Response(proc.stderr).text();

      const result: ShellResult = {
        stdout,
        stderr,
        exitCode,
        command,
        executionTime,
        success: exitCode === 0,
      };

      // End command execution tracking
      logger.endCommandExecution(commandLog, result.exitCode, result.stdout, result.stderr);

      // Throw error if command failed and throwOnError is true
      if (!result.success && mergedOptions.throwOnError) {
        throw new ShellExecutionError(
          command,
          result.exitCode,
          result.stderr,
          result
        );
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Handle timeout errors or process killed
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('killed'))) {
        const result: ShellResult = {
          stdout: '',
          stderr: `Command timed out after ${mergedOptions.timeout}ms`,
          exitCode: -1,
          command,
          executionTime,
          success: false,
        };

        // End command execution tracking for timeout
        logger.endCommandExecution(commandLog, result.exitCode, result.stdout, result.stderr);

        if (mergedOptions.throwOnError) {
          throw new ShellExecutionError(
            command,
            -1,
            result.stderr,
            result
          );
        }

        return result;
      }

      // Handle other shell execution errors
      if (error instanceof ShellExecutionError) {
        throw error;
      }

      // Handle unexpected errors
      const result: ShellResult = {
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        command,
        executionTime,
        success: false,
      };

      // End command execution tracking for unexpected errors
      logger.endCommandExecution(commandLog, result.exitCode, result.stdout, result.stderr);

      if (mergedOptions.throwOnError) {
        throw new ShellExecutionError(
          command,
          -1,
          result.stderr,
          result
        );
      }

      return result;
    }
  }

  /**
   * Execute a command without throwing on error
   */
  async executeQuiet(
    command: string,
    options: ShellOptions = {}
  ): Promise<ShellResult> {
    return this.execute(command, { ...options, throwOnError: false });
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeSequence(
    commands: string[],
    options: ShellOptions = {}
  ): Promise<ShellResult[]> {
    const results: ShellResult[] = [];

    for (const command of commands) {
      const result = await this.execute(command, options);
      results.push(result);

      // Stop execution if a command fails and throwOnError is true
      if (!result.success && options.throwOnError !== false) {
        break;
      }
    }

    return results;
  }

  /**
   * Execute multiple commands in parallel
   */
  async executeParallel(
    commands: string[],
    options: ShellOptions = {}
  ): Promise<ShellResult[]> {
    const promises = commands.map(command => 
      this.execute(command, { ...options, throwOnError: false })
    );

    const results = await Promise.all(promises);

    // Check if any command failed and throwOnError is true
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

  /**
   * Check if a command exists in the system
   */
  async commandExists(command: string): Promise<boolean> {
    try {
      const result = await this.executeQuiet(`which ${command}`);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get the current working directory
   */
  async getCurrentDirectory(): Promise<string> {
    const result = await this.execute('pwd');
    return result.stdout.trim();
  }

  /**
   * Change directory and execute a command
   */
  async executeInDirectory(
    directory: string,
    command: string,
    options: ShellOptions = {}
  ): Promise<ShellResult> {
    return this.execute(command, { ...options, cwd: directory });
  }
}