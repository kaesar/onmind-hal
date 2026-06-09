# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS). Thinked for professionals or techie individuals, as well, IT area, infraestucture (or DevSecOps), architecture and software development environments.

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

- **Automated Installation**: One-command setup for multiple services, around 80+ (even try `ufw` and `dnsmasq`)
- **Multi-Platform Support**: Ubuntu/Debian (even WSL2: Windows Subsystem for Linux), Arch Linux, Amazon Linux 2023, macOS, Windows (MINGW64/Git Bash - experimental)
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS and Linux
- **Template-Based Configuration**: YAML templates for easy technical service customization
- **Comprehensive Logging**: Detailed execution tracking for debugging
- **Podman as Alternative**: Docker-first but `podman` could be replace `docker` commands if you don't use Docker (experimental).

> Many services couldn't fit in a machine, then consider it's limits

## Quick Start

Just install **Bun** runtime, then clone **OnMind-HAL** to install modules, build and start. Example:

```bash
curl -fsSL https://bun.com/install | bash

git clone https://github.com/kaesar/onmind-hal.git hal
cd hal
bun install
bun run build
bun run start
```

> Follow the interactive prompts to configure your HomeLab setup.

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Dockhand** (or **Portainer**): Docker container management interface
- **Copyparty**: File sharing and management platform

> When using Docker, **Dockhand** is automatically selected as the default management UI. When using Podman, **Portainer** is used instead. You can override this selection for Docker during configuration.

### Optional Services

1. **RustFS**: High-performance S3-compatible distributed object storage
2. **DuckDB**: In-memory analytical database with web UI
3. **PostgreSQL**: Relational database server (alternative to Oracle DB)
4. **Redis**: In-memory data store and cache
5. **MongoDB**: NoSQL database server
6. **MariaDB**: Relational database server
7. **ScyllaDB**: NoSQL Cassandra-compatible and DynamoDB-compatible database
8. **Apache-Ignite**: Distributed in-memory database with SQL and JDBC support
9. **Kafka**: Distributed streaming platform (with KRaft)
10. **Kafka UI**: Web UI for managing Apache Kafka clusters
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
32. **Locust**: Open source load testing tool (JMeter alternative)
33. **K6-OSS**: Open-source load testing tool by Grafana Labs (port 6565)
34. **Grafana**: Analytics and monitoring platform
35. **Loki**: Log aggregation system by Grafana Labs
36. **OpenSearch**: Search and analytics engine (Elasticsearch alternative) - ⚠️ *Requires 2GB+ RAM*
37. **Coroot**: Open-source observability and monitoring platform (port 8081)
38. **ReDash**: SQL query editor and visualization platform
39. **Fluent-Bit**: Lightweight log processor and forwarder
40. **Uptime-Kuma**: Self-hosted uptime monitoring tool
41. **Dozzle**: Lightweight Docker log viewer and monitor
42. **Registry**: Private Docker container registry
43. **Nexus-Repository**: Universal artifact repository manager
44. **Infisical**: Open-source secret management platform
45. **Vault**: Secrets and encryption management (HashiCorp)
46. **Consul**: Service discovery and configuration (HashiCorp) (port 8500)
47. **Vaultwarden**: Self-hosted Bitwarden-compatible password manager
48. **BackVault**: Self-hosted backup solution for Vaultwarden/Bitwarden
49. **Linkwarden**: Self-hosted bookmark manager with tagging and archiving
50. **PsiTransfer**: File sharing platform (like WeTransfer)
51. **Filestash**: Web-based file manager for any storage backend
52. **Excalidraw**: Virtual whiteboard for sketching diagrams
53. **Draw.io**: Web-based diagramming application
54. **WiseMapping**: Web-based mind mapping tool (requires PostgreSQL) (port 8095)
55. **Kroki**: API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.)
56. **Outline**: Team knowledge base and wiki
57. **Grist**: Modern spreadsheet with relational database capabilities
58. **NocoDB**: Open-source Airtable alternative - Smart spreadsheet
59. **Directus**: Open-source headless CMS and backend-as-a-service
60. **TwentyCRM**: Modern open-source CRM platform - ⚠️ *may have connectivity issues*
61. **MedusaJS**: Headless e-commerce platform (Shopify alternative) - ⚠️ *may have connectivity issues*
62. **Huly**: All-in-one project management platform (like Jira + Notion + Slack)
63. **Mattermost**: Open-source team collaboration and messaging platform (like Slack)
64. **Cal.com**: Open-source scheduling platform (Calendly alternative)
65. **JasperReports**: Business intelligence and reporting platform
66. **Stirling-PDF**: Powerful locally hosted PDF manipulation tool
67. **LibreTranslate**: Free and open source machine translation API
68. **OrcaRouter-Lite**: Lightweight LLM router with multi-provider support
69. **LiteLLM**: LLM proxy with unified API for 100+ LLMs
70. **AnythingLLM**: Multi-user AI platform with RAG, Agents, and local LLM support
71. **Hermes Agent**: Self-improving AI agent with persistent memory (Nous Research) - ⚠️ *Requires API key*
72. **OpenClaw**: AI agent gateway for Claude Code, OpenAI Codex and more
73. **OpenHuman**: Open-source AI agent platform with Rust core
74. **OpenJarvis**: AI assistant platform with Ollama backend
75. **Firecrawl**: Open-source web scraping API with JavaScript rendering
76. **SearXNG**: Privacy-respecting metasearch engine
77. **Docker-Mailserver**: Full-featured mail server (SMTP, IMAP, antispam, antivirus)
78. **Kurrier**: Self-hosted email marketing and newsletter platform
79. **Zrok**: Zero-trust tunneling platform (NGROK alternative) with OpenZiti
80. **Cloudflare Tunnel**: Secure tunnel to expose services without opening ports - ⚠️ *Requires Cloudflare account and manual setup*
81. **Wetty**: Web-based SSH terminal for secure host access
82. **RustDesk Server**: Open-source remote desktop server

> *Perhaps, I will consider includes in a future*: Jitsi, DocuSeal, FRP, Minio, Backstage, Beszel, Koffan

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
