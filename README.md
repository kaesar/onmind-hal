# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS). Thinked for professionals or techie individuals, as well, IT area, infraestucture (or DevSecOps), architecture and software development environments.

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

- **Automated Installation**: One-command setup for multiple services (even try `ufw` and `dnsmasq`)
- **Multi-Platform Support**: Ubuntu/Debian (even WSL2: Windows Subsystem for Linux), Arch Linux, Amazon Linux 2023, macOS, Windows (MINGW64/Git Bash - experimental)
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS and Linux
- **Template-Based Configuration**: YAML templates for easy service customization
- **Comprehensive Logging**: Detailed execution tracking for debugging
- **Podman as Alternative**: Docker-first but `podman` could be replace `docker` commands if you don't use Docker (experimental).

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Dockhand** (or **Portainer**): Docker container management interface
- **Copyparty**: File sharing and management platform

> When using Docker, **Dockhand** is automatically selected as the default management UI. When using Podman, **Portainer** is used instead. You can override this selection for Docker during configuration.

### Optional Services

1. **DuckDB**: In-memory analytical database with web UI
2. **PostgreSQL**: Relational database server (alternative to Oracle DB)
3. **Redis**: In-memory data store and cache
4. **MongoDB**: NoSQL database server
5. **MariaDB**: Relational database server
6. **ScyllaDB**: NoSQL Cassandra-compatible and DynamoDB-compatible database
7. **Apache-Ignite**: Distributed in-memory database with SQL and JDBC support
8. **RustFS**: High-performance S3-compatible distributed object storage
9. **Kafka**: Distributed streaming platform (with KRaft)
11. **RabbitMQ**: Message broker for distributed systems
12. **Ollama**: Server for your LLM
13. **Open-WebUI**: User-friendly web interface for Ollama
14. **Open-NotebookLM**: Open-source alternative to Google NotebookLM - ⚠️ *Requires API keys*
15. **n8n**: Workflow automation platform
16. **Kestra**: Orchestration and scheduling platform
17. **KeystoneJS**: Modern headless CMS and GraphQL API
18. **Keycloak**: Open-source identity and access management solution
19. **Authelia**: Authentication and authorization server
20. **PocketID**: OIDC provider with passkeys support
21. **Apache-APISIX**: Cloud-native API Gateway and microservices management
22. **Floci**: LocalStack alternative - AWS service emulator for local development
23. **LocalStack**: Local AWS cloud stack for development
24. **k3d**: Lightweight Kubernetes in Docker for local development
25. **OneDev**: Self-hosted Git server with CI/CD
26. **Semaphore-UI**: Modern UI for Ansible and shell automation
27. **Liquibase**: Database schema change management and version control
28. **SonarQube**: Code quality and security analysis (port 9002)
29. **Trivy**: Container security scanner (port 8087)
30. **RapiDoc**: WebComponent for OpenAPI Spec viewer
31. **Hoppscotch**: Open-source API development ecosystem (Postman alternative)
32. **Locust**: Open source load testing tool (K6/JMeter alternative)
33. **Grafana**: Analytics and monitoring platform
34. **Loki**: Log aggregation system by Grafana Labs
35. **OpenSearch**: Search and analytics engine (Elasticsearch alternative) - ⚠️ *Requires 2GB+ RAM*
36. **Redash**: SQL query editor and visualization platform
37. **Fluent-Bit**: Lightweight log processor and forwarder
38. **Uptime-Kuma**: Self-hosted uptime monitoring tool
39. **Dozzle**: Lightweight Docker log viewer and monitor
40. **Registry**: Private Docker container registry
41. **Nexus-Repository**: Universal artifact repository manager
42. **Infisical**: Open-source secret management platform
43. **Vault**: Secrets and encryption management (HashiCorp)
44. **Vaultwarden**: Self-hosted Bitwarden-compatible password manager
45. **BackVault**: Self-hosted backup solution for Vaultwarden/Bitwarden
46. **Linkwarden**: Self-hosted bookmark manager with tagging and archiving
47. **PsiTransfer**: File sharing platform (like WeTransfer)
48. **Excalidraw**: Virtual whiteboard for sketching diagrams
49. **Draw.io**: Web-based diagramming application
50. **Kroki**: API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.)
51. **Outline**: Team knowledge base and wiki
52. **Grist**: Modern spreadsheet with relational database capabilities
53. **NocoDB**: Open-source Airtable alternative - Smart spreadsheet
54. **Directus**: Open-source headless CMS and backend-as-a-service
55. **TwentyCRM**: Modern open-source CRM platform - ⚠️ *may have connectivity issues*
56. **MedusaJS**: Headless e-commerce platform (Shopify alternative) - ⚠️ *may have connectivity issues*
57. **Plane**: Modern project management platform (like Jira) - ⚠️ *May not work on ARM64 architecture*
58. **Huly**: All-in-one project management platform (like Jira + Notion + Slack)
59. **Mattermost**: Open-source team collaboration and messaging platform (like Slack)
60. **Cal.com**: Open-source scheduling platform (Calendly alternative)
61. **JasperReports**: Business intelligence and reporting platform
62. **Stirling-PDF**: Powerful locally hosted PDF manipulation tool
63. **LibreTranslate**: Free and open source machine translation API
64. **OrcaRouter-Lite**: Lightweight LLM router with multi-provider support
65. **LiteLLM**: LLM proxy with unified API for 100+ LLMs
66. **OpenClaw**: AI agent gateway for Claude Code, OpenAI Codex and more
67. **OpenJarvis**: AI assistant platform with Ollama backend
68. **Firecrawl**: Open-source web scraping API with JavaScript rendering
68. **Docker-Mailserver**: Full-featured mail server (SMTP, IMAP, antispam, antivirus)
69. **Kurrier**: Self-hosted email marketing and newsletter platform
70. **Zrok**: Zero-trust tunneling platform (NGROK alternative) with OpenZiti
71. **Cloudflare Tunnel**: Secure tunnel to expose services without opening ports - ⚠️ *Requires Cloudflare account and manual setup*
72. **Wetty**: Web-based SSH terminal for secure host access

> *Perhaps, I will consider includes in a future*: Jitsi, DocuSeal, FRP, Minio, Backstage, Beszel, Koffan

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
  ______
./ hal /
│
├─ src/
│  ├── cli/                    # Command-line interface
│  ├── core/                   # Core application logic
│  ├── distribution/           # OS-specific installation strategies
│  ├── services/               # Service implementations
│  ├── templates/              # Configuration template system
│  └── utils/                  # Utility modules
│ 
├─ templates/                  # YAML configuration templates
│  ├── services/               # Service-specific templates
│  └── config/                 # System configuration templates
│ 
└─ tests/                      # Test suite
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
