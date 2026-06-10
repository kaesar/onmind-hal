# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS). Thinked for professionals or techie individuals, as well, IT area and infraestucture (CloudOps or DevSecOps), architecture and software development environments. That's the reason to include first serveral services for infra (IT), but also some services for HomeLab (around 90). 

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

- **Automated Installation**: One-command setup for multiple services, around 90 (even try `ufw` and `dnsmasq`)
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
> Docker is required, then previously install it (or Podman experimental).

### Non-Interactive Mode (Script)

You can skip all prompts by providing an IP address as the first argument:

```bash
bun run src/main.ts <IP> [--domain <domain>] [--list <services>] [--password <password>]
```

- **IP** (required, positional): Triggers non-interactive mode. Must be a valid IPv4 address.
- **`--domain`** (optional): Domain name (default: `homelab.lan`).
- **`--list`** (optional): Comma-separated list of service names (lowercase, e.g. `postgresql,redis,grafana`). Uses pre-selected defaults if omitted.
- **`--password`** (optional): Database/Storage password in base64. If omitted but PostgreSQL/MariaDB/MongoDB are selected, a password is generated as `Admin<YY>!` (YY = last two digits of current year).

Examples:
```bash
# IP only — all defaults
bun run src/main.ts 192.168.1.100

# IP + custom domain
bun run src/main.ts 192.168.1.100 --domain myhomelab.local

# IP + domain + specific services
bun run src/main.ts 192.168.1.100 --domain myhomelab.local --list postgresql,redis,kafka

# IP + services + explicit password
bun run src/main.ts 192.168.1.100 --list postgresql,redis --password MySecr3t!
```

> To install directly in Linux you can add `sudo` (at the beginning) for priviledges

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Dockhand** (or **Portainer**): Docker container management interface
- **Copyparty**: File sharing and management platform

> When using Docker, **Dockhand** is automatically selected as the default management UI. When using Podman, **Portainer** is used instead. You can override this selection for Docker during configuration.

### Optional Services

| # | Service | Name | Description | Port |
|---|---------|------|-------------|------|
| 1 | **RustFS** | `rustfs` | High-performance S3-compatible distributed object storage | 9001 |
| 2 | **DuckDB** | `duckdb` | In-memory analytical database with web UI | 4214 |
| 3 | **PostgreSQL** | `postgresql` | Relational database server | 5432 |
| 4 | **Redis** | `redis` | In-memory data store and cache | 6379 |
| 5 | **MongoDB** | `mongodb` | NoSQL database server | 27017 |
| 6 | **MariaDB** | `mariadb` | Relational database server | 3306 |
| 7 | **ScyllaDB** | `scylladb` | NoSQL Cassandra-compatible and DynamoDB-compatible database | 9042 |
| 8 | **OpenSearch** | `opensearch` | Search and analytics engine (Elasticsearch alternative) | 5601 |
| 9 | **Kafka** | `kafka` | Distributed streaming platform (with KRaft) | 9092 |
| 10 | **Kafka UI** | `kafkaui` | Web UI for managing Apache Kafka clusters | 8080 |
| 11 | **RabbitMQ** | `rabbitmq` | Message broker for distributed systems | 15672 |
| 12 | **Ollama** | `ollama` | Server for your LLM | 11434 |
| 13 | **Open-WebUI** | `openwebui` | User-friendly web interface for Ollama | 3010 |
| 14 | **Open-NotebookLM** | `opennotebooklm` | Open-source alternative to Google NotebookLM | 3090 |
| 15 | **n8n** | `n8n` | Workflow automation platform | 5678 |
| 16 | **ToolJet** | `tooljet` | Open-source low-code platform for building internal tools | 3084 |
| 17 | **Kestra** | `kestra` | Orchestration and scheduling platform | 8089 |
| 18 | **KeystoneJS** | `keystonejs` | Modern headless CMS and GraphQL API | 3090 |
| 19 | **Keycloak** | `keycloak` | Open-source identity and access management solution | 8092 |
| 20 | **Authelia** | `authelia` | Authentication and authorization server | 9091 |
| 21 | **PocketID** | `pocketid` | OIDC provider with passkeys support | 8093 |
| 22 | **Apache-APISIX** | `apisix` | Cloud-native API Gateway and microservices management | 9180 |
| 23 | **Floci** | `floci` | AWS service emulator for local development - LocalStack alternative | 4566 |
| 24 | **Floci-AZ** | `flociaz` | Azure service emulator for local development | 4567 |
| 25 | **Floci-GCP** | `flocigcp` | GCP service emulator for local development | 4568 |
| 26 | **k3d** | `k3d` | Lightweight Kubernetes in Docker for local development | 6444 |
| 27 | **Code-Server** | `codeserver` | Web-based VS Code IDE (code-server by Coder) | 3081 |
| 28 | **JupyterLab** | `jupyterlab` | Web-based interactive development environment (notebooks and code) | 3082 |
| 29 | **OneDev** | `onedev` | Self-hosted Git server with CI/CD | 6610 |
| 30 | **Semaphore-UI** | `semaphore` | Modern UI for Ansible and shell automation | 3002 |
| 31 | **Liquibase** | `liquibase` | Database schema change management and version control | 8091 |
| 32 | **SonarQube** | `sonarqube` | Code quality and security analysis | 9002 |
| 33 | **Trivy** | `trivy` | Container security scanner | 8088 |
| 34 | **Karate** | `karate` | API, UI & performance test automation framework (VNC) | 5901 |
| 35 | **RapiDoc** | `rapidoc` | WebComponent for OpenAPI Spec viewer | 8085 |
| 36 | **Hoppscotch** | `hoppscotch` | Open-source API development ecosystem (Postman alternative) | 3080 |
| 37 | **K6-OSS** | `k6` | Open-source load testing tool by Grafana Labs | 6565 |
| 38 | **Grafana** | `grafana` | Analytics and monitoring platform | 3001 |
| 39 | **Loki** | `loki` | Log aggregation system by Grafana Labs | 3100 |
| 40 | **Coroot** | `coroot` | Open-source observability and monitoring platform | 8081 |
| 41 | **ReDash** | `redash` | SQL query editor and visualization platform | 5000 |
| 42 | **Fluent-Bit** | `fluentbit` | Lightweight log processor and forwarder | 2020 |
| 43 | **Uptime-Kuma** | `uptimekuma` | Self-hosted uptime monitoring tool | 3003 |
| 44 | **Dozzle** | `dozzle` | Lightweight Docker log viewer and monitor | 8097 |
| 45 | **Registry** | `registry` | Private Docker container registry | 5000 |
| 46 | **Nexus-Repository** | `nexus` | Universal artifact repository manager | 8098 |
| 47 | **Infisical** | `infisical` | Open-source secret management platform | 8096 |
| 48 | **Vault** | `vault` | Secrets and encryption management (HashiCorp) | 8200 |
| 49 | **Consul** | `consul` | Service discovery and configuration (HashiCorp) | 8500 |
| 50 | **Vaultwarden** | `vaultwarden` | Self-hosted Bitwarden-compatible password manager | 8222 |
| 51 | **Linkwarden** | `linkwarden` | Self-hosted bookmark manager with tagging and archiving | 3101 |
| 52 | **Shlink** | `shlink` | URL shortener with REST API and web interface | 8080 |
| 53 | **PsiTransfer** | `psitransfer` | File sharing platform (like WeTransfer) | 3005 |
| 54 | **Filestash** | `filestash` | Web-based file manager for any storage backend | 8334 |
| 55 | **Excalidraw** | `excalidraw` | Virtual whiteboard for sketching diagrams | 8082 |
| 56 | **Draw.io** | `drawio` | Web-based diagramming application | 8084 |
| 57 | **WiseMapping** | `wisemapping` | Web-based mind mapping tool (requires PostgreSQL) | 8095 |
| 58 | **Kroki** | `kroki` | API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.) | 8086 |
| 59 | **Outline** | `outline` | Team knowledge base and wiki | 3030 |
| 60 | **Grist** | `grist` | Modern spreadsheet with relational database capabilities | 8484 |
| 61 | **NocoDB** | `nocodb` | Open-source Airtable alternative - Smart spreadsheet | 8083 |
| 62 | **Directus** | `directus` | Open-source headless CMS and backend-as-a-service | 8055 |
| 63 | **TwentyCRM** | `twentycrm` | Modern open-source CRM platform | 3021 |
| 64 | **MedusaJS** | `medusajs` | Headless e-commerce platform (Shopify alternative) | 9003 |
| 65 | **Huly** | `huly` | All-in-one project management platform (like Jira + Notion + Slack) | 8087 |
| 66 | **Mattermost** | `mattermost` | Open-source team collaboration and messaging platform (like Slack) | 8065 |
| 67 | **Cal.diy** | `caldiy` | Open-source scheduling platform (MIT licensed, community edition) | 3040 |
| 68 | **AdGuard-Home** | `adguard` | Network-wide ad and tracker blocking DNS server | 3000 |
| 69 | **JasperReports** | `jasperreports` | Business intelligence and reporting platform | 8081 |
| 70 | **Stirling-PDF** | `stirlingpdf` | Powerful locally hosted PDF manipulation tool | 8090 |
| 71 | **LibreTranslate** | `libretranslate` | Free and open source machine translation API | 5001 |
| 72 | **OrcaRouter-Lite** | `orcarouterlite` | Lightweight LLM router with multi-provider support | 8000 |
| 73 | **LiteLLM** | `litellm` | LLM proxy with unified API for 100+ LLMs | 4000 |
| 74 | **AnythingLLM** | `anythingllm` | Multi-user AI platform with RAG, Agents, and local LLM support | 3001 |
| 75 | **Goose** | `goose` | Open-source AI agent for code, workflows, and automation (AAIF/Linux Foundation) | 8300 |
| 76 | **Hermes** | `hermes` | Self-improving AI agent with persistent memory (Nous Research) | 8642 |
| 77 | **OpenClaw** | `openclaw` | AI agent gateway for Claude Code, OpenAI Codex and more | 18789 |
| 78 | **OpenHuman** | `openhuman` | Open-source AI agent platform with Rust core | 7788 |
| 79 | **OpenJarvis** | `openjarvis` | AI assistant platform with Ollama backend | 8010 |
| 80 | **Firecrawl** | `firecrawl` | Open-source web scraping API with JavaScript rendering | 3002 |
| 81 | **SearXNG** | `searxng` | Privacy-respecting metasearch engine | 8080 |
| 82 | **Plausible** | `plausible` | Open-source web analytics platform (ClickHouse + PostgreSQL) | 3200 |
| 83 | **Docker-Mailserver** | `mailserver` | Full-featured mail server (SMTP, IMAP, antispam, antivirus) | 25 |
| 84 | **Kurrier** | `kurrier` | Self-hosted email marketing and newsletter platform | 3031 |
| 85 | **Zrok** | `zrok` | Zero-trust tunneling platform (NGROK alternative) with OpenZiti | 18080, 8081, 8082 |
| 86 | **Cloudflare-Tunnel** | `cloudflared` | Secure tunnel to expose services without opening ports ⚠️ | — |
| 87 | **Wetty** | `wetty` | Web-based SSH terminal for secure host access | 3033 |
| 88 | **RustDesk-Server** | `rustdesk` | Open-source remote desktop server | 21115 |

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
