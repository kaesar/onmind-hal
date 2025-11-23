#!/usr/bin/env bun

/**
 * OnMind-HAL (Home Apps Labs) - Main Entry Point
 * 
 * This is the main entry point for the HomeLab automation tool.
 * It orchestrates the entire installation and configuration process.
 */

import { CLIInterface } from './cli/interface.js';
import { HomelabApplication } from './core/application.js';
import { ErrorHandler } from './utils/errors.js';
import { logger } from './utils/logger.js';

/**
 * Main application function
 */
async function main(): Promise<void> {
  const errorHandler = ErrorHandler.getInstance();
  
  try {
    // Display welcome banner
    console.log('🏠 Welcome to OnMind-HAL (Home Apps Labs)');
    console.log('=========================================');
    console.log('');
    
    // Verify sudo access
    console.log('⚠️  This script requires sudo privileges for installation.');
    console.log('   It is convenient to run first: sudo -v');
    console.log('');
    
    // Test sudo access
    try {
      await Bun.spawn(['sudo', '-n', 'true'], { stdout: 'ignore', stderr: 'ignore' }).exited;
      console.log('✅ Sudo access verified.');
    } catch {
      console.log('⚠️  Sudo access not cached. You will be prompted for password during installation.');
    }
    console.log('');
    
    logger.info('Starting HomeLab Tool...');
    
    // Initialize CLI interface
    const cli = new CLIInterface();
    
    // Initialize main application
    const app = new HomelabApplication();
    
    // Start the interactive setup process
    // Start the interactive setup process and collect configuration
    const config = await cli.start();

    // Set the collected configuration to the application
    app.setConfig(config);

    // Run the main application workflow
    await app.run();
    
    logger.info('OnMind-HAL has finished successfully! 🎉');
    console.log('');
    console.log('🎉 Installation completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check your services at the configured domain');
    console.log('2. Access Portainer for container management');
    console.log('3. Use Copyparty for file sharing');
    console.log('');
    console.log('For support, check the documentation or logs.');
    
  } catch (error) {
    logger.error('Fatal error in main application:', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    await errorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
    
    console.error('');
    console.error('❌ Installation failed!');
    console.error('');
    console.error('Please check the logs for more details.');
    console.error('You can retry the installation after fixing any issues.');
    
    process.exit(1);
  }
}

/**
 * Handle unhandled promise rejections
 */
process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', { reason: String(reason) });
  const errorHandler = ErrorHandler.getInstance();
  await errorHandler.gracefulShutdown(new Error(`Unhandled Promise Rejection: ${reason}`));
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  const errorHandler = ErrorHandler.getInstance();
  await errorHandler.gracefulShutdown(error);
});

/**
 * Handle SIGINT (Ctrl+C)
 */
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Installation interrupted by user');
  logger.warn('Installation interrupted by user (SIGINT)');
  
  const errorHandler = ErrorHandler.getInstance();
  if (errorHandler.getRecoveryManager().hasActions()) {
    console.log('🔄 Cleaning up...');
    await errorHandler.getRecoveryManager().executeRollback();
  }
  
  console.log('👋 Goodbye!');
  process.exit(0);
});

/**
 * Handle SIGTERM
 */
process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Installation terminated');
  logger.warn('Installation terminated (SIGTERM)');
  
  const errorHandler = ErrorHandler.getInstance();
  if (errorHandler.getRecoveryManager().hasActions()) {
    console.log('🔄 Cleaning up...');
    await errorHandler.getRecoveryManager().executeRollback();
  }
  
  process.exit(0);
});

// Run the main function
if (import.meta.main) {
  main().catch(async (error) => {
    console.error('Fatal error:', error);
    const errorHandler = ErrorHandler.getInstance();
    await errorHandler.gracefulShutdown(error);
  });
}