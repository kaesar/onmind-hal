/**
 * Unit tests for Amazon Linux distribution strategy
 */

import { describe, it, expect, beforeEach, spyOn } from 'bun:test';
import { AmazonLinuxStrategy } from '../../../src/distribution/amazon.js';

describe('AmazonLinuxStrategy', () => {
  let strategy: AmazonLinuxStrategy;

  beforeEach(() => {
    strategy = new AmazonLinuxStrategy();
  });

  describe('name', () => {
    it('should return amazon as name', () => {
      expect(strategy.name).toBe('amazon');
    });
  });

  describe('getPackageManager', () => {
    it('should return dnf as package manager', () => {
      expect(strategy.getPackageManager()).toBe('dnf');
    });
  });

  describe('detectDistribution', () => {
    it('should return true when system-release contains Amazon Linux identifier', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('Amazon Linux release 2023.2.20231113 (Amazon Linux)');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Amazon Linux ID', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('ID="amzn"\nNAME="Amazon Linux"\nVERSION="2023"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when os-release contains Amazon Linux NAME', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'yum') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('NAME="Amazon Linux"\nVERSION="2023"\nID_LIKE="rhel fedora"');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when amazon-linux-release file exists', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/amazon-linux-release') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('');

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return true when EC2 metadata indicates Amazon Linux environment', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockImplementation((path: string) => {
          if (path === '/etc/system-release') return Promise.resolve(false);
          if (path === '/etc/os-release') return Promise.resolve(false);
          if (path === '/etc/amazon-linux-release') return Promise.resolve(false);
          if (path === '/sys/hypervisor/uuid') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockImplementation((path: string) => {
          if (path === '/sys/hypervisor/uuid') return Promise.resolve('ec2a1b2c-3d4e-5f6g-7h8i-9j0k1l2m3n4o');
          return Promise.resolve('');
        });

      const result = await strategy.detectDistribution();
      expect(result).toBe(true);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should return false when neither dnf nor yum commands exist', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockResolvedValue(false);

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockCommandExists.mockRestore();
    });

    it('should return false when no Amazon Linux identifiers are found', async () => {
      const mockFileExists = spyOn(strategy as any, 'fileExists')
        .mockResolvedValue(false);
      
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });
      
      const mockReadFile = spyOn(strategy as any, 'readFile')
        .mockResolvedValue('');

      const result = await strategy.detectDistribution();
      expect(result).toBe(false);

      mockFileExists.mockRestore();
      mockCommandExists.mockRestore();
      mockReadFile.mockRestore();
    });
  });

  describe('installDocker', () => {
    it.skip('should execute Docker installation commands using dnf', async () => {
      // Mock all shell commands to avoid actual execution
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      // Mock the getPreferredPackageManager method
      const mockGetPreferredPackageManager = spyOn(strategy as any, 'getPreferredPackageManager')
        .mockResolvedValue('dnf');
      
      // Create a mock shell function that captures commands
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        
        // Return mock responses for specific commands
        if (command.includes('whoami')) {
          return { text: () => Promise.resolve('testuser\n') };
        }
        
        return Promise.resolve();
      }) as any;

      await strategy.installDocker();

      // Verify that key Docker installation commands were executed
      expect(mockShellCommands.some(cmd => cmd.includes('dnf update -y'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('dnf install -y docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl enable docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl start docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('usermod -aG docker'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('docker --version'))).toBe(true);

      // Restore mocks
      mockGetPreferredPackageManager.mockRestore();
      global.$ = originalShell;
    });

    it.skip('should execute Docker installation commands using yum when dnf is not available', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      // Mock the getPreferredPackageManager method to return yum
      const mockGetPreferredPackageManager = spyOn(strategy as any, 'getPreferredPackageManager')
        .mockResolvedValue('yum');
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        
        if (command.includes('whoami')) {
          return { text: () => Promise.resolve('testuser\n') };
        }
        
        return Promise.resolve();
      }) as any;

      await strategy.installDocker();

      expect(mockShellCommands.some(cmd => cmd.includes('yum update -y'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('yum install -y docker'))).toBe(true);

      mockGetPreferredPackageManager.mockRestore();
      global.$ = originalShell;
    });

    it.skip('should throw error when Docker installation fails', async () => {
      // Mock shell to throw error
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('Installation failed');
      }) as any;

      await expect(strategy.installDocker()).rejects.toThrow('Failed to install Docker on Amazon Linux');

      // Restore original shell
      global.$ = originalShell;
    });
  });

  describe('installPackages', () => {
    it.skip('should install packages using dnf', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      // Mock the getPreferredPackageManager method
      const mockGetPreferredPackageManager = spyOn(strategy as any, 'getPreferredPackageManager')
        .mockResolvedValue('dnf');
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.installPackages(['curl', 'wget', 'git']);

      expect(mockShellCommands.some(cmd => cmd.includes('dnf update -y'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('dnf install -y curl wget git'))).toBe(true);

      mockGetPreferredPackageManager.mockRestore();
      global.$ = originalShell;
    });

    it.skip('should install packages using yum when dnf is not available', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      const mockGetPreferredPackageManager = spyOn(strategy as any, 'getPreferredPackageManager')
        .mockResolvedValue('yum');
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.installPackages(['curl', 'wget']);

      expect(mockShellCommands.some(cmd => cmd.includes('yum update -y'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('yum install -y curl wget'))).toBe(true);

      mockGetPreferredPackageManager.mockRestore();
      global.$ = originalShell;
    });

    it('should do nothing when no packages are provided', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;
      
      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.installPackages([]);

      expect(mockShellCommands).toHaveLength(0);

      global.$ = originalShell;
    });

    it.skip('should throw error when package installation fails', async () => {
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('Package installation failed');
      }) as any;

      await expect(strategy.installPackages(['nonexistent-package'])).rejects.toThrow('Failed to install packages on Amazon Linux');

      global.$ = originalShell;
    });
  });

  describe('getPreferredPackageManager', () => {
    it('should return dnf when dnf command exists', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(true);
          return Promise.resolve(false);
        });

      const result = await (strategy as any).getPreferredPackageManager();
      expect(result).toBe('dnf');

      mockCommandExists.mockRestore();
    });

    it('should return yum when dnf command does not exist', async () => {
      const mockCommandExists = spyOn(strategy as any, 'commandExists')
        .mockImplementation((cmd: string) => {
          if (cmd === 'dnf') return Promise.resolve(false);
          return Promise.resolve(true);
        });

      const result = await (strategy as any).getPreferredPackageManager();
      expect(result).toBe('yum');

      mockCommandExists.mockRestore();
    });
  });

  describe('configureFirewall', () => {
    it.skip('should configure firewalld with required ports', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;

      // Mock the getPreferredPackageManager method
      const mockGetPreferredPackageManager = spyOn(strategy as any, 'getPreferredPackageManager')
        .mockResolvedValue('dnf');

      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.configureFirewall();

      // Check that firewalld is installed
      expect(mockShellCommands.some(cmd => cmd.includes('dnf update -y'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('dnf install -y firewalld'))).toBe(true);

      // Check that firewalld service is enabled and started
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl enable firewalld'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('systemctl start firewalld'))).toBe(true);

      // Check that required services are allowed
      expect(mockShellCommands.some(cmd => cmd.includes('firewall-cmd --permanent --add-service=ssh'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('firewall-cmd --permanent --add-service=http'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('firewall-cmd --permanent --add-service=https'))).toBe(true);

      // Check that firewall is reloaded and status is shown
      expect(mockShellCommands.some(cmd => cmd.includes('firewall-cmd --reload'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('firewall-cmd --list-all'))).toBe(true);

      mockGetPreferredPackageManager.mockRestore();
      global.$ = originalShell;
    });

    it.skip('should configure firewalld using yum when dnf is not available', async () => {
      const mockShellCommands: string[] = [];
      const originalShell = global.$ as any;

      const mockGetPreferredPackageManager = spyOn(strategy as any, 'getPreferredPackageManager')
        .mockResolvedValue('yum');

      global.$ = ((strings: TemplateStringsArray, ...values: any[]) => {
        const command = strings.reduce((acc, str, i) => {
          return acc + str + (values[i] || '');
        }, '');
        mockShellCommands.push(command);
        return Promise.resolve();
      }) as any;

      await strategy.configureFirewall();

      expect(mockShellCommands.some(cmd => cmd.includes('yum update -y'))).toBe(true);
      expect(mockShellCommands.some(cmd => cmd.includes('yum install -y firewalld'))).toBe(true);

      mockGetPreferredPackageManager.mockRestore();
      global.$ = originalShell;
    });

    it.skip('should throw error when firewall configuration fails', async () => {
      const originalShell = global.$ as any;
      global.$ = (() => {
        throw new Error('Firewalld installation failed');
      }) as any;

      await expect(strategy.configureFirewall()).rejects.toThrow('Failed to configure firewall on Amazon Linux');

      global.$ = originalShell;
    });
  });
});