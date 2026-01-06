# Home Apps Labs (OnMind-HAL)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source applications using Docker containers. It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS).

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)

## Features

- **Automated Installation**: One-command setup for multiple services
- **Multi-Distribution Support**: Ubuntu/Debian (even WSL), Arch Linux, Amazon Linux 2023
- **Template-Based Configuration**: JSON templates for easy service customization
- **Rollback Support**: Some recovery from failed installations
- **Comprehensive Logging**: Detailed execution tracking and debugging

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Portainer**: Docker container management interface
- **Copyparty**: File sharing and management platform

### Optional Services

1. **Cockpit-CMS**: Headless CMS powered by FrankenPHP (PHP + Caddy)
2. **PostgreSQL**: Relational database server (alternative to Oracle DB)
3. **Redis**: In-memory data store and cache
4. **MongoDB**: NoSQL database server
5. **MariaDB**: Relational database server
6. **Minio**: S3-compatible object storage
7. **Kafka**: Distributed streaming platform (with KRaft)
8. **RabbitMQ**: Message broker for distributed systems
9. **Ollama**: Server for your LLM
10. **n8n**: Workflow automation platform
11. **Kestra**: Orchestration and scheduling platform
12. **Authelia**: Authentication and authorization server
13. **LocalStack**: Local AWS cloud stack for development
14. **OneDev**: Self-hosted Git server with CI/CD
15. **SonarQube**: Code quality and security analysis
16. **Trivy**: Container security scanner
17. **RapiDoc**: WebComponent for OpenAPI Spec viewer
18. **Grafana**: Analytics and monitoring platform
19. **Loki**: Log aggregation system by Grafana Labs
20. **Fluent-Bit**: Lightweight log processor and forwarder
21. **Registry**: Private Docker container registry
22. **Nexus-Repository**: Universal artifact repository manager
23. **Vault**: Secrets and encryption management (HashiCorp)
24. **PsiTransfer**: File sharing platform (like WeTransfer)
25. **Excalidraw**: Virtual whiteboard for sketching diagrams
26. **Kroki**: API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.)
27. **Outline**: Team knowledge base and wiki
28. **Grist**: Modern spreadsheet with relational database capabilities
29. **NocoDB**: Open-source Airtable alternative - Smart spreadsheet
30. **Docker-Mailserver**: Full-featured mail server (SMTP, IMAP, antispam, antivirus)

> *Perhaps, I will consider includes in a future*: Vaultwarden (Bitwarden), Draw.io, Zulip (or Rocket.Chat), Jitsi

## Prerequisites

### Bun Runtime

```bash
curl -fsSL https://bun.com/install | bash
```

> **macOS with Homebrew**: `brew install oven-sh/bun/bun`  
> **Windows**: `powershell -c "irm bun.sh/install.ps1|iex"`

### System Requirements

- Linux distribution: Ubuntu 20.04+/Debian (even WSL), Arch Linux, Amazon Linux 2023
- Docker support
- Root or sudo access
- Network connectivity

> Works for Windows? Yes, with Windows Subsystem for Linux (WSL), finally it's a Linux (with Ubuntu)

## Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/kaesar/onmind-hal.git hal
   cd hal
   bun install
   ```

2. **Run Setup**
   ```bash
   bun run build
   bun run start
   ```

3. **Follow Interactive Prompts**
   - Enter server IP address
   - Configure domain name
   - Select optional services
   - Set database password (if needed)

## Project Structure

```
src/
├── cli/                    # Command-line interface
│   ├── interface.ts        # Main CLI orchestration
│   └── prompts.ts          # User input collection and validation
├── core/                   # Core application logic
│   ├── application.ts      # Main application orchestrator
│   ├── config.ts           # Configuration file management
│   └── types.ts            # TypeScript interfaces and enums
├── distribution/           # OS-specific installation strategies
│   ├── strategy.ts         # Base distribution strategy
│   ├── ubuntu.ts           # Ubuntu-specific implementation
│   ├── arch.ts             # Arch Linux implementation
│   └── amazon.ts           # Amazon Linux implementation
├── services/               # Service implementations
│   ├── base.ts             # Base service class
│   ├── factory.ts          # Service factory pattern
│   ├── core/               # Core services (Caddy, Portainer, etc.)
│   └── optional/           # Optional services (n8n, PostgreSQL, etc.)
├── templates/              # Configuration template system
│   ├── engine.ts           # Template processing engine
│   ├── loader.ts           # Template file loading
│   └── validator.ts        # Template validation
└── utils/                  # Utility modules
    ├── errors.ts           # Error handling and recovery
    ├── logger.ts           # Logging and execution tracking
    ├── shell.ts            # Shell command execution
    └── validation.ts       # Input validation and security

templates/                  # JSON configuration templates
├── services/               # Service-specific templates
└── config/                 # System configuration templates

tests/                      # Test suite
├── unit/                   # Unit tests
└── integration/            # Integration tests
```

## Adding New Services

**Core vs. Optional Services**: Consider when defining a service, the third parameter in the `BaseService` constructor indicates if it's a core service (always installed) or an optional one. Core services are automatically included in every setup, while optional services are presented to the user for selection during the interactive prompts.

To add a new service like **MongoDB**, follow these steps...

### 1. Define Service Type

Add the new service to the enum in `src/core/types.ts`:

```typescript
export enum ServiceType {
  // ... existing services
  MONGODB = 'mongodb'
}
```

### 2. Create Service Implementation

Create `src/services/optional/mongodb.ts`:

```typescript
import { ServiceType, HomelabConfig } from '../../core/types.js';
import { ServiceInstallationError } from '../../utils/errors.js';
import { TemplateEngine } from '../../templates/engine.js';
import { BaseService } from '../base.js';

export class MongoDBService extends BaseService {
  constructor(config: HomelabConfig, templateEngine: TemplateEngine) {
    super(
      'MongoDB',
      ServiceType.MONGODB,
      false, // not a core service
      [], // dependencies (e.g., [ServiceType.POSTGRESQL] if it depends on PostgreSQL)
      config,
      templateEngine
    );
  }

  // The getAccessUrl() method provides the URL for accessing the service,
  // which is used by the CLI to inform the user after successful installation.

  async install(): Promise<void> {
    try {
      await this.executeTemplate('services/mongodb');
      this.logger.info('✅ MongoDB installed successfully');
    } catch (error) {
      throw new ServiceInstallationError(
        ServiceType.MONGODB,
        `Installation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  getAccessUrl(): string {
    return `mongodb://${this.config.ip}:27017`;
  }
}
```

### 3. Update Service Factory

Add the new service to `src/services/factory.ts`:

```typescript
import { MongoDBService } from './optional/mongodb.js';

export class ServiceFactory {
  static createService(serviceType: ServiceType, config: HomelabConfig, templateEngine: TemplateEngine): Service {
    switch (serviceType) {
      // ... existing cases
      case ServiceType.MONGODB:
        return new MongoDBService(config, templateEngine);
      default:
        throw new ServiceInstallationError(serviceType, `Unknown service type: ${serviceType}`);
    }
  }
}
```

### 4. Create Service Template

Create `templates/services/mongodb.json`:

```json
{
  "name": "MongoDB Database Server",
  "description": "NoSQL document database",
  "commands": {
    "install": [
      "docker pull mongo:latest"
    ],
    "setup": [
      "docker network create {{NETWORK_NAME}} || true",
      "mkdir -p /opt/homelab/mongodb/data"
    ],
    "run": "docker run -d --name mongodb --network {{NETWORK_NAME}} -p 27017:27017 -v /opt/homelab/mongodb/data:/data/db -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD={{MONGODB_PASSWORD}} mongo:latest"
  },
  "variables": ["NETWORK_NAME", "MONGODB_PASSWORD"],
  "dependencies": []
}
```

> **Configuration Variables**: Variables like `{{NETWORK_NAME}}` and `{{MONGODB_PASSWORD}}` are dynamically replaced by the `TemplateEngine` using values from the `HomelabConfig` object, which is populated during the interactive setup.

### 5. Update CLI Prompts (Optional)

If the service requires additional configuration, update `src/cli/prompts.ts`:

```typescript
export async function promptForOptionalServices(): Promise<ServiceType[]> {
  const optionalServices = [
    // ... existing services
    {
      name: 'MongoDB - NoSQL document database',
      value: ServiceType.MONGODB,
      short: 'MongoDB'
    }
  ];
  // ... rest of function
}
```

### 6. Add Validation (If Needed)

If the service requires special validation, add it to `src/utils/validation.ts`:

```typescript
export function validateMongoDBPassword(password: string): void {
  // Add MongoDB-specific password validation
}
```

### 7. Create Tests

Create `tests/unit/services/mongodb.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { MongoDBService } from '../../../src/services/optional/mongodb.js';
// ... test implementation
```

### 8. Update Documentation

Add the service to the README.md services list and any specific configuration notes.

## Development

### Running Tests and Build

```bash
# All tests
bun test

# Specific test file
bun test tests/unit/services/mongodb.test.ts

# With coverage
bun test --coverage

# Building the Project
bun build
```
