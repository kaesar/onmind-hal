# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source applications using Docker containers. It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS).

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)

## Features

- **Automated Installation**: One-command setup for multiple services
- **Multi-Platform Support**: Ubuntu/Debian (even WSL), Arch Linux, Amazon Linux 2023, macOS
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS
- **Template-Based Configuration**: YAML templates for easy service customization
- **Rollback Support**: Some recovery from failed installations
- **Comprehensive Logging**: Detailed execution tracking and debugging

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Portainer**: Docker container management interface
- **Copyparty**: File sharing and management platform

### Optional Services

1. **DuckDB**: In-memory analytical database with web UI
2. **PostgreSQL**: Relational database server (alternative to Oracle DB)
3. **Redis**: In-memory data store and cache
4. **MongoDB**: NoSQL database server
5. **MariaDB**: Relational database server
6. **ScyllaDB**: NoSQL Cassandra-compatible and DynamoDB-compatible database
7. **Minio**: S3-compatible object storage
8. **Kafka**: Distributed streaming platform (with KRaft)
9. **RabbitMQ**: Message broker for distributed systems
10. **Ollama**: Server for your LLM
11. **n8n**: Workflow automation platform
12. **Kestra**: Orchestration and scheduling platform
13. **KeystoneJS**: Modern headless CMS and GraphQL API
14. **Cockpit-CMS**: Headless CMS with PHP Apache
15. **Authelia**: Authentication and authorization server
16. **LocalStack**: Local AWS cloud stack for development
17. **k3d**: Lightweight Kubernetes in Docker for local development
18. **OneDev**: Self-hosted Git server with CI/CD
19. **Semaphore-UI**: Modern UI for Ansible and shell automation
20. **Liquibase**: Database schema change management and version control
21. **SonarQube**: Code quality and security analysis (port 9002)
22. **Trivy**: Container security scanner (port 8087)
23. **RapiDoc**: WebComponent for OpenAPI Spec viewer
24. **Grafana**: Analytics and monitoring platform
25. **Loki**: Log aggregation system by Grafana Labs
26. **Fluent-Bit**: Lightweight log processor and forwarder
27. **Uptime-Kuma**: Self-hosted uptime monitoring tool
28. **Registry**: Private Docker container registry
29. **Nexus-Repository**: Universal artifact repository manager
30. **Vault**: Secrets and encryption management (HashiCorp)
31. **PsiTransfer**: File sharing platform (like WeTransfer)
32. **Excalidraw**: Virtual whiteboard for sketching diagrams
33. **Draw.io**: Web-based diagramming application
34. **Kroki**: API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.)
35. **Outline**: Team knowledge base and wiki
36. **Grist**: Modern spreadsheet with relational database capabilities
37. **NocoDB**: Open-source Airtable alternative - Smart spreadsheet
38. **Plane**: Modern project management platform (like Jira) ⚠️ *May not work on ARM64 architecture*
39. **JasperReports**: Business intelligence and reporting platform
40. **Stirling-PDF**: Powerful locally hosted PDF manipulation tool
41. **LibreTranslate**: Free and open source machine translation API
42. **Docker-Mailserver**: Full-featured mail server (SMTP, IMAP, antispam, antivirus)
43. **FRP**: Fast Reverse Proxy client for secure tunneling to expose services to internet

> *Perhaps, I will consider includes in a future*: Vaultwarden (Bitwarden), Zulip, Jitsi, DocuSeal

## Quick Start

```bash
# Install Bun runtime
curl -fsSL https://bun.com/install | bash

# Clone and setup HAL
git clone https://github.com/kaesar/onmind-hal.git hal
cd hal
bun install
bun run build
bun run start
```

Follow the interactive prompts to configure your HomeLab setup.

## Project Structure

```
src/
├── cli/                    # Command-line interface
├── core/                   # Core application logic
├── distribution/           # OS-specific installation strategies
├── services/               # Service implementations
├── templates/              # Configuration template system
└── utils/                  # Utility modules

templates/                  # YAML configuration templates
├── services/               # Service-specific templates
└── config/                 # System configuration templates

tests/                      # Test suite
├── unit/                   # Unit tests
└── integration/            # Integration tests
```

## Bun Runtime - Installation required

```bash
curl -fsSL https://bun.com/install | bash
```

> **macOS with Homebrew**: `brew install oven-sh/bun/bun`  
> **Windows**: `powershell -c "irm bun.sh/install.ps1|iex"`

## Documentation

For detailed installation instructions, development guides, and advanced configuration:

> **[Technical Documentation](HELP.md)**
