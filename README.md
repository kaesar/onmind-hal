# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source applications using Docker containers. It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS).

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)

## Features

- **Automated Installation**: One-command setup for multiple services
- **Multi-Platform Support**: Ubuntu/Debian (even WSL), Arch Linux, Amazon Linux 2023, macOS
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS
- **Template-Based Configuration**: JSON templates for easy service customization
- **Rollback Support**: Some recovery from failed installations
- **Comprehensive Logging**: Detailed execution tracking and debugging

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Portainer**: Docker container management interface
- **Copyparty**: File sharing and management platform
- **DuckDB**: In-memory analytical database with web UI

### Optional Services

1. **PostgreSQL**: Relational database server (alternative to Oracle DB)
2. **Redis**: In-memory data store and cache
3. **MongoDB**: NoSQL database server
4. **MariaDB**: Relational database server
5. **Minio**: S3-compatible object storage
6. **Kafka**: Distributed streaming platform (with KRaft)
7. **RabbitMQ**: Message broker for distributed systems
8. **Ollama**: Server for your LLM
9. **n8n**: Workflow automation platform
10. **Kestra**: Orchestration and scheduling platform
11. **KeystoneJS**: Modern headless CMS and GraphQL API
12. **Cockpit-CMS**: Headless CMS with PHP Apache
13. **Authelia**: Authentication and authorization server
14. **LocalStack**: Local AWS cloud stack for development
15. **OneDev**: Self-hosted Git server with CI/CD
16. **SonarQube**: Code quality and security analysis (port 9002)
17. **Trivy**: Container security scanner (port 8087)
18. **RapiDoc**: WebComponent for OpenAPI Spec viewer
19. **Grafana**: Analytics and monitoring platform
20. **Loki**: Log aggregation system by Grafana Labs
21. **Fluent-Bit**: Lightweight log processor and forwarder
22. **Registry**: Private Docker container registry
23. **Nexus-Repository**: Universal artifact repository manager
24. **Vault**: Secrets and encryption management (HashiCorp)
25. **PsiTransfer**: File sharing platform (like WeTransfer)
26. **Excalidraw**: Virtual whiteboard for sketching diagrams
27. **Draw.io**: Web-based diagramming application
28. **Kroki**: API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.)
29. **Outline**: Team knowledge base and wiki
30. **Grist**: Modern spreadsheet with relational database capabilities
31. **NocoDB**: Open-source Airtable alternative - Smart spreadsheet
32. **JasperReports**: Business intelligence and reporting platform
33. **DocuSeal**: Document signing and PDF form filling platform
34. **LibreTranslate**: Free and open source machine translation API
35. **Docker-Mailserver**: Full-featured mail server (SMTP, IMAP, antispam, antivirus)
36. **FRP**: Fast Reverse Proxy client for secure tunneling to expose services to internet

> *Perhaps, I will consider includes in a future*: Vaultwarden (Bitwarden), Zulip, Jitsi

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

templates/                  # JSON configuration templates
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
