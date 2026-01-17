# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS). Thinked for professionals or techie individuals, as well, IT area, infraestucture (or DevSecOps), architecture and software development environments.

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

- **Automated Installation**: One-command setup for multiple services (even try `ufw` and `dnsmasq`)
- **Multi-Platform Support**: Ubuntu/Debian (even WSL2: Windows Subsystem for Linux), Arch Linux, Amazon Linux 2023, macOS
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS and Linux
- **Template-Based Configuration**: YAML templates for easy service customization
- **Comprehensive Logging**: Detailed execution tracking for debugging
- **Podman as Alternative**: Docker-first but `podman` could be replace `docker` commands if you don't use Docker (experimental).

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
11. **Open-NotebookLM**: Open-source alternative to Google NotebookLM - ⚠️ *Requires API keys*
12. **n8n**: Workflow automation platform
13. **Kestra**: Orchestration and scheduling platform
14. **KeystoneJS**: Modern headless CMS and GraphQL API
15. **Keycloak**: Open-source identity and access management solution
16. **Authelia**: Authentication and authorization server
17. **PocketID**: OIDC provider with passkeys support
18. **LocalStack**: Local AWS cloud stack for development
19. **k3d**: Lightweight Kubernetes in Docker for local development
20. **OneDev**: Self-hosted Git server with CI/CD
21. **Semaphore-UI**: Modern UI for Ansible and shell automation
22. **Liquibase**: Database schema change management and version control
23. **SonarQube**: Code quality and security analysis (port 9002)
24. **Trivy**: Container security scanner (port 8087)
25. **RapiDoc**: WebComponent for OpenAPI Spec viewer
26. **Hoppscotch**: Open-source API development ecosystem (Postman alternative)
27. **Locust**: Open source load testing tool (K6/JMeter alternative)
28. **Grafana**: Analytics and monitoring platform
29. **Loki**: Log aggregation system by Grafana Labs
30. **Fluent-Bit**: Lightweight log processor and forwarder
31. **Uptime-Kuma**: Self-hosted uptime monitoring tool
32. **Registry**: Private Docker container registry
33. **Nexus-Repository**: Universal artifact repository manager
34. **Vault**: Secrets and encryption management (HashiCorp)
35. **Vaultwarden**: Self-hosted Bitwarden-compatible password manager
36. **PsiTransfer**: File sharing platform (like WeTransfer)
37. **Excalidraw**: Virtual whiteboard for sketching diagrams
38. **Draw.io**: Web-based diagramming application
39. **Kroki**: API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.)
40. **Outline**: Team knowledge base and wiki
41. **Grist**: Modern spreadsheet with relational database capabilities
42. **NocoDB**: Open-source Airtable alternative - Smart spreadsheet
43. **TwentyCRM**: Modern open-source CRM platform - ⚠️ *may have connectivity issues*
44. **MedusaJS**: Headless e-commerce platform (Shopify alternative) - ⚠️ *may have connectivity issues*
45. **Plane**: Modern project management platform (like Jira) - ⚠️ *May not work on ARM64 architecture*
46. **JasperReports**: Business intelligence and reporting platform
47. **Stirling-PDF**: Powerful locally hosted PDF manipulation tool
48. **LibreTranslate**: Free and open source machine translation API
49. **Docker-Mailserver**: Full-featured mail server (SMTP, IMAP, antispam, antivirus)
50. **FRP**: Fast Reverse Proxy client for secure tunneling to expose services to internet

> *Perhaps, I will consider includes in a future*: Zulip, Jitsi, DocuSeal, Cockpit-CMS, Koffan

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
> If you have inconvinients with an image consider could be connectivity by the moment. Besides, `podman` is more experimental.
