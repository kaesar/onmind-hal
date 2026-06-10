# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS). Thinked for professionals or techie individuals, as well, IT area and infraestucture (CloudOps or DevSecOps), architecture and software development environments. That's the reason to include first serveral services for infra (IT), but also some services for HomeLab (around 80+). 

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

- **Automated Installation**: One-command setup for multiple services, around 80+ (even try `ufw` and `dnsmasq`)
- **Multi-Platform Support**: Ubuntu/Debian (even WSL2: Windows Subsystem for Linux), Arch Linux, Amazon Linux 2023, macOS, Windows (MINGW64/Git Bash - experimental)
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS and Linux
- **Template-Based Configuration**: YAML templates for easy technical service customization
- **Comprehensive Logging**: Detailed execution tracking for debugging
- **Podman as Alternative**: Docker-first but `podman` could be replace `docker` commands if you don't use Docker (experimental).

> Many services couldn't fit in a machine, then consider it's limits.  
> For all services you need a serious machine (like a server) at least with 32GB+.

## Quick Start

Just install **Bun** runtime, then clone **OnMind-HAL** to install modules, build and start. Open a terminal and execute next lines:

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

| # | Service | Description | Port |
|---|---------|-------------|------|
| 1 | **RustFS** | High-performance S3-compatible distributed object storage | 9001 |
| 2 | **DuckDB** | In-memory analytical database with web UI | 4214 |
| 3 | **PostgreSQL** | Relational database server | 5432 |
| 4 | **Redis** | In-memory data store and cache | 6379 |
| 5 | **MongoDB** | NoSQL database server | 27017 |
| 6 | **MariaDB** | Relational database server | 3306 |
| 7 | **ScyllaDB** | NoSQL Cassandra-compatible and DynamoDB-compatible database | 9042 |
| 8 | **OpenSearch** | Search and analytics engine (Elasticsearch alternative) | 5601 |
| 9 | **Kafka** | Distributed streaming platform (with KRaft) | 9092 |
| 10 | **Kafka UI** | Web UI for managing Apache Kafka clusters | 8080 |
| 11 | **RabbitMQ** | Message broker for distributed systems | 15672 |
| 12 | **Ollama** | Server for your LLM | 11434 |
| 13 | **Open-WebUI** | User-friendly web interface for Ollama | 3010 |
| 14 | **Open-NotebookLM** | Open-source alternative to Google NotebookLM | 3090 |
| 15 | **n8n** | Workflow automation platform | 5678 |
| 16 | **ToolJet** | Open-source low-code platform for building internal tools | 3084 |
| 17 | **Kestra** | Orchestration and scheduling platform | 8089 |
| 18 | **KeystoneJS** | Modern headless CMS and GraphQL API | 3090 |
| 19 | **Keycloak** | Open-source identity and access management solution | 8092 |
| 20 | **Authelia** | Authentication and authorization server | 9091 |
| 21 | **PocketID** | OIDC provider with passkeys support | 8093 |
| 22 | **Apache-APISIX** | Cloud-native API Gateway and microservices management | 9180 |
| 23 | **Floci** | AWS service emulator for local development - LocalStack alternative | 4566 |
| 24 | **Floci-AZ** | Azure service emulator for local development | 4567 |
| 25 | **Floci-GCP** | GCP service emulator for local development | 4568 |
| 26 | **k3d** | Lightweight Kubernetes in Docker for local development | 6444 |
| 27 | **Code Server** | Web-based VS Code IDE (code-server by Coder) | 3081 |
| 28 | **JupyterLab** | Web-based interactive development environment (notebooks and code) | 3082 |
| 29 | **OneDev** | Self-hosted Git server with CI/CD | 6610 |
| 30 | **Semaphore-UI** | Modern UI for Ansible and shell automation | 3002 |
| 31 | **Liquibase** | Database schema change management and version control | 8091 |
| 32 | **SonarQube** | Code quality and security analysis | 9002 |
| 33 | **Trivy** | Container security scanner | 8088 |
| 34 | **Karate** | API, UI & performance test automation framework (VNC) | 5901 |
| 35 | **RapiDoc** | WebComponent for OpenAPI Spec viewer | 8085 |
| 36 | **Hoppscotch** | Open-source API development ecosystem (Postman alternative) | 3080 |
| 37 | **K6-OSS** | Open-source load testing tool by Grafana Labs | 6565 |
| 38 | **Grafana** | Analytics and monitoring platform | 3001 |
| 39 | **Loki** | Log aggregation system by Grafana Labs | 3100 |
| 40 | **Coroot** | Open-source observability and monitoring platform | 8081 |
| 41 | **ReDash** | SQL query editor and visualization platform | 5000 |
| 42 | **Fluent-Bit** | Lightweight log processor and forwarder | 2020 |
| 43 | **Uptime-Kuma** | Self-hosted uptime monitoring tool | 3003 |
| 44 | **Dozzle** | Lightweight Docker log viewer and monitor | 8097 |
| 45 | **Registry** | Private Docker container registry | 5000 |
| 46 | **Nexus-Repository** | Universal artifact repository manager | 8098 |
| 47 | **Infisical** | Open-source secret management platform | 8096 |
| 48 | **Vault** | Secrets and encryption management (HashiCorp) | 8200 |
| 49 | **Consul** | Service discovery and configuration (HashiCorp) | 8500 |
| 50 | **Vaultwarden** | Self-hosted Bitwarden-compatible password manager | 8222 |
| 51 | **Linkwarden** | Self-hosted bookmark manager with tagging and archiving | 3101 |
| 52 | **PsiTransfer** | File sharing platform (like WeTransfer) | 3005 |
| 53 | **Filestash** | Web-based file manager for any storage backend | 8334 |
| 54 | **Excalidraw** | Virtual whiteboard for sketching diagrams | 8082 |
| 55 | **Draw.io** | Web-based diagramming application | 8084 |
| 56 | **WiseMapping** | Web-based mind mapping tool (requires PostgreSQL) | 8095 |
| 57 | **Kroki** | API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.) | 8086 |
| 58 | **Outline** | Team knowledge base and wiki | 3030 |
| 59 | **Grist** | Modern spreadsheet with relational database capabilities | 8484 |
| 60 | **NocoDB** | Open-source Airtable alternative - Smart spreadsheet | 8083 |
| 61 | **Directus** | Open-source headless CMS and backend-as-a-service | 8055 |
| 62 | **TwentyCRM** | Modern open-source CRM platform | 3021 |
| 63 | **MedusaJS** | Headless e-commerce platform (Shopify alternative) | 9003 |
| 64 | **Huly** | All-in-one project management platform (like Jira + Notion + Slack) | 8087 |
| 65 | **Mattermost** | Open-source team collaboration and messaging platform (like Slack) | 8065 |
| 66 | **Cal.com** | Open-source scheduling platform (Calendly alternative) | 3040 |
| 67 | **JasperReports** | Business intelligence and reporting platform | 8081 |
| 68 | **Stirling-PDF** | Powerful locally hosted PDF manipulation tool | 8090 |
| 69 | **LibreTranslate** | Free and open source machine translation API | 5001 |
| 70 | **OrcaRouter-Lite** | Lightweight LLM router with multi-provider support | 8000 |
| 71 | **LiteLLM** | LLM proxy with unified API for 100+ LLMs | 4000 |
| 72 | **AnythingLLM** | Multi-user AI platform with RAG, Agents, and local LLM support | 3001 |
| 73 | **Hermes-Agent** | Self-improving AI agent with persistent memory (Nous Research) | 8642 |
| 74 | **OpenClaw** | AI agent gateway for Claude Code, OpenAI Codex and more | 18789 |
| 75 | **OpenHuman** | Open-source AI agent platform with Rust core | 7788 |
| 76 | **OpenJarvis** | AI assistant platform with Ollama backend | 8000 |
| 77 | **Firecrawl** | Open-source web scraping API with JavaScript rendering | 3002 |
| 78 | **SearXNG** | Privacy-respecting metasearch engine | 8080 |
| 79 | **Docker-Mailserver** | Full-featured mail server (SMTP, IMAP, antispam, antivirus) | 25 |
| 80 | **Kurrier** | Self-hosted email marketing and newsletter platform | 3031 |
| 81 | **Zrok** | Zero-trust tunneling platform (NGROK alternative) with OpenZiti | 18080, 8081, 8082 |
| 82 | **Cloudflare-Tunnel** | Secure tunnel to expose services without opening ports ⚠️ | — |
| 83 | **Wetty** | Web-based SSH terminal for secure host access | 3033 |
| 84 | **RustDesk-Server** | Open-source remote desktop server | 21115 |

> *Perhaps, I will consider includes in a future*: Seafile, Jitsi, DocuSeal, Immich, PeerTube, Mastodon, Plane, FRP, Backstage, Ignite, Locust, Beszel, BackVault, Koffan

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
