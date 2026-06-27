# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS).

Thinked for professionals or techie individuals, as well, IT area and infraestucture (CloudOps or DevSecOps), architecture and software development environments. That's the reason to include first serveral services for infra (IT), but also some services for HomeLab (around 100+). 

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

- **Automated Installation**: One-command setup for multiple services, around 100+ (even try `ufw` and `dnsmasq`)
- **Multi-Platform Support**: Ubuntu/Debian (even WSL2: Windows Subsystem for Linux), Arch Linux, Amazon Linux 2023, macOS, Windows (MINGW64/Git Bash - experimental)
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS and Linux
- **Template-Based Configuration**: YAML templates for easy technical service customization
- **Comprehensive Logging**: Detailed execution tracking for debugging
- **Podman as Alternative**: Docker-first but `podman` could replace `docker` commands if you don't use Docker (experimental).

> Many services couldn't fit in a machine, consider it's limits (memory, disk, CPU's).  
> For all services you need a serious machine (like a server) at least with 32GB+.

## Quick Start

Just install **Bun** runtime, then clone **OnMind-HAL** to install modules, build and start. Then, open a terminal and execute next lines:

```bash
curl -fsSL https://bun.com/install | bash
```

> **macOS with Homebrew**: `brew install oven-sh/bun/bun`  
> **Windows**: `powershell -c "irm bun.sh/install.ps1|iex"`

```bash
git clone https://github.com/kaesar/onmind-hal.git hal
cd hal
bun install
bun run build
bun run start
```

> Follow the interactive prompts to configure your HomeLab setup.  
> Docker is required, then previously install it (or Podman experimental).

### Non-Interactive Mode (Script)

You can skip all prompts by providing flags:

```bash
bun run src/main.ts [--ip <address>] [--domain <domain>] [--list <services>] [--password <password>]
```

- **`--ip`** (optional): Server IP address. Auto-detected if omitted. Must be a valid IPv4 address.
- **`--domain`** (optional): Domain name (default: `homelab.lan`).
- **`--list`** (optional): Comma-separated list of service names (lowercase, e.g. `postgresql,redis,grafana`). Uses pre-selected defaults if omitted.
- **`--nolist`** (optional): Comma-separated list of service names to exclude. It has priority over `--list` and replace it.
- **`--password`** (optional): Database/Storage password in base64. If omitted but PostgreSQL/MariaDB/MongoDB are selected, a password is generated as `Admin<YY>!` (YY = last two digits of current year).
- **`--help`**: Show usage information.

> **Default optional services** (enabled when `--list` is omitted): RustFS, PostgreSQL, Redis, Kafka, PocketID, Ntfy, Docker Mailserver, Infisical, Cloudflare Tunnel.

<!--
Examples:

```bash
# Custom IP only
bun run src/main.ts --ip 192.168.1.100

# Custom IP + domain
bun run src/main.ts --ip 192.168.1.100 --domain myhomelab.local

# Custom IP + domain + specific services
bun run src/main.ts --ip 192.168.1.100 --domain myhomelab.local --list postgresql,redis,kafka

# Auto-detected IP + services (no --ip needed)
bun run src/main.ts --list postgresql,redis

# Services + explicit password
bun run src/main.ts --ip 192.168.1.100 --list postgresql,redis --password MySecr3t!
```
-->
Examples:

```bash
bun run src/main.ts --domain myhomelab.lan

bun run src/main.ts --list defaults,n8n,floci
```

> To install directly in Linux you can add `sudo` (at the beginning) for priviledges

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Dockhand** (or **Portainer**): Docker container management interface
- **Copyparty**: File sharing and management platform

> **Dockhand** is automatically selected as the default management UI. **Portainer** is the alternative. You can override this selection during interactive configuration (not for script mode).

### Optional Services

| # | Service | Code | Description | Port |
|---|---------|------|-------------|------|
| 1 | **RustFS** | `rustfs` | High-performance S3-compatible distributed object storage | 9004 |
| 2 | **DuckDB** | `duckdb` | In-memory analytical database with web UI | 4214 |
| 3 | **PostgreSQL** | `postgresql` | Relational database server | 5432 |
| 4 | **Redis** | `redis` | In-memory data store and cache | 6379 |
| 5 | **MongoDB** | `mongodb` | NoSQL database server | 27017 |
| 6 | **MariaDB** | `mariadb` | Relational database server | 3306 |
| 7 | **ScyllaDB** | `scylladb` | NoSQL Cassandra-compatible and DynamoDB-compatible database | 9042 |
| 8 | **OpenSearch** | `opensearch` | Search and analytics engine (Elasticsearch alternative) | 5601 |
| 9 | **Qdrant** | `qdrant` | Vector database for AI and RAG applications | 6333 |
| 10 | **Kafka** | `kafka` | Distributed streaming platform (with KRaft) | 9092 |
| 11 | **Kafka UI** | `kafkaui` | Web UI for managing Apache Kafka clusters | 8080 |
| 12 | **RabbitMQ** | `rabbitmq` | Message broker for distributed systems | 15672 |
| 13 | **Ollama** | `ollama` | Server for your LLM | 11434 |
| 14 | **Open-WebUI** | `openwebui` | User-friendly web interface for Ollama | 3010 |
| 15 | **Open-NotebookLM** | `opennotebooklm` | Open-source alternative to Google NotebookLM | 3091 |
| 16 | **n8n** | `n8n` | Workflow automation platform | 5678 |
| 17 | **ToolJet** | `tooljet` | Open-source low-code platform for building internal tools | 3084 |
| 18 | **Kestra** | `kestra` | Orchestration and scheduling platform | 8089 |
| 19 | **KeystoneJS** | `keystonejs` | Modern headless CMS and GraphQL API | 3090 |
| 20 | **Keycloak** | `keycloak` | Open-source identity and access management solution | 8092 |
| 21 | **Authelia** | `authelia` | Authentication and authorization server | 9091 |
| 22 | **PocketID** | `pocketid` | OIDC provider with passkeys support | 8093 |
| 23 | **Apache-APISIX** | `apisix` | Cloud-native API Gateway and microservices management | 9180 |
| 24 | **Floci** | `floci` | AWS service emulator for local development - LocalStack alternative | 4566 |
| 25 | **Floci-AZ** | `flociaz` | Azure service emulator for local development | 4567 |
| 26 | **Floci-GCP** | `flocigcp` | GCP service emulator for local development | 4568 |
| 27 | **k3d** | `k3d` | Lightweight Kubernetes in Docker for local development | 6444 |
| 28 | **Code-Server** | `codeserver` | Web-based VS Code IDE (code-server by Coder) | 3081 |
| 29 | **JupyterLab** | `jupyterlab` | Web-based interactive development environment (notebooks and code) | 3082 |
| 30 | **Forgejo** | `forgejo` | Self-hosted lightweight Git server with CI/CD (Gitea fork) | 3083 |
| 31 | **OneDev** | `onedev` | Self-hosted Git server with CI/CD | 6610 |
| 32 | **Semaphore-UI** | `semaphore` | Modern UI for Ansible and shell automation | 3002 |
| 33 | **Backstage** | `backstage` | Developer portal platform (Developer Portal by Spotify) | 7007 |
| 34 | **Liquibase** | `liquibase` | Database schema change management and version control | 8091 |
| 35 | **SonarQube** | `sonarqube` | Code quality and security analysis | 9002 |
| 36 | **Trivy** | `trivy` | Container security scanner | 8088 |
| 37 | **Karate** | `karate` | API, UI & performance test automation framework (VNC) | 5901 |
| 38 | **RapiDoc** | `rapidoc` | WebComponent for OpenAPI Spec viewer | 8085 |
| 39 | **Hoppscotch** | `hoppscotch` | Open-source API development ecosystem (Postman alternative) | 3080 |
| 40 | **K6-OSS** | `k6` | Open-source load testing tool by Grafana Labs | 6565 |
| 41 | **Grafana** | `grafana` | Analytics and monitoring platform | 3001 |
| 42 | **Loki** | `loki` | Log aggregation system by Grafana Labs | 3100 |
| 43 | **Prometheus** | `prometheus` | Open-source systems monitoring and alerting toolkit | 9090 |
| 44 | **Fluent-Bit** | `fluentbit` | Lightweight log processor and forwarder | 2020 |
| 45 | **Coroot** | `coroot` | Open-source observability and monitoring platform | 8081 |
| 46 | **ReDash** | `redash` | SQL query editor and visualization platform | 5000 |
| 47 | **Uptime-Kuma** | `uptimekuma` | Self-hosted uptime monitoring tool | 3003 |
| 48 | **Dozzle** | `dozzle` | Lightweight Docker log viewer and monitor | 8097 |
| 49 | **Registry** | `registry` | Private Docker container registry | 5002 |
| 50 | **Nexus-Repository** | `nexus` | Universal artifact repository manager | 8098 |
| 51 | **Infisical** | `infisical` | Open-source secret management platform | 8096 |
| 52 | **Vault** | `vault` | Secrets and encryption management (HashiCorp) | 8200 |
| 53 | **Consul** | `consul` | Service discovery and configuration (HashiCorp) | 8500 |
| 54 | **Vaultwarden** | `vaultwarden` | Self-hosted Bitwarden-compatible password manager | 8222 |
| 55 | **Linkwarden** | `linkwarden` | Self-hosted bookmark manager with tagging and archiving | 3101 |
| 56 | **Shlink** | `shlink` | URL shortener with REST API and web interface | 8012 |
| 57 | **Send** | `send` | Simple, private file sharing with end-to-end encryption (Firefox Send fork) | 1880 |
| 58 | **Filestash** | `filestash` | Web-based file manager for any storage backend | 8334 |
| 59 | **Seafile** | `seafile` | Self-hosted file sync and share platform (Google Drive alternative) | 8016 |
| 60 | **Excalidraw** | `excalidraw` | Virtual whiteboard for sketching diagrams | 8082 |
| 61 | **Draw.io** | `drawio` | Web-based diagramming application | 8084 |
| 62 | **WiseMapping** | `wisemapping` | Web-based mind mapping tool (requires PostgreSQL) | 8095 |
| 63 | **Kroki** | `kroki` | API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.) | 8086 |
| 64 | **Presenton** | `presenton` | Open-source AI presentation generator (Gamma/Canva alternative) | 5010 |
| 65 | **Slidev** | `slidev` | Presentation slides for developers (Markdown-based) | 3031 |
| 66 | **Outline** | `outline` | Team knowledge base and wiki | 3030 |
| 67 | **Grist** | `grist` | Modern spreadsheet with relational database capabilities | 8484 |
| 68 | **NocoDB** | `nocodb` | Open-source Airtable alternative - Smart spreadsheet | 8018 |
| 69 | **Directus** | `directus` | Open-source headless CMS and backend-as-a-service | 8055 |
| 70 | **InsForge** | `insforge` | Open-source backend platform for AI coding agents with database, auth, storage, and AI gateway | 7130 |
| 71 | **Apache Spark** | `spark` | Unified analytics engine for large-scale data processing | 9093, 7077 |
| 72 | **TwentyCRM** | `twentycrm` | Modern open-source CRM platform | 3021 |
| 73 | **Chatwoot** | `chatwoot` | Open-source customer engagement platform (Intercom/Zendesk alternative) | 3092 |
| 74 | **MedusaJS** | `medusajs` | Headless e-commerce platform (Shopify alternative) | 9003 |
| 75 | **Huly** | `huly` | All-in-one project management platform (like Jira + Notion + Slack) | 8087 |
| 76 | **Mattermost** | `mattermost` | Open-source team collaboration and messaging platform (like Slack) | 8065 |
| 77 | **Cal.com** | `calcom` | Open-source scheduling platform (Calendly alternative) | 3040 |
| 78 | **AdGuard-Home** | `adguard` | Network-wide ad and tracker blocking DNS server | 3004 |
| 79 | **JasperReports** | `jasperreports` | Business intelligence and reporting platform | 8014 |
| 80 | **DocuSeal** | `docuseal` | Open-source document signing and PDF form filling platform | 3009 |
| 81 | **Stirling-PDF** | `stirlingpdf` | Powerful locally hosted PDF manipulation tool | 8090 |
| 82 | **Pandoc-Web** | `pandocweb` | Web interface for Pandoc document converter | 8094 |
| 83 | **Calibre-Web** | `calibreweb` | Web-based ebook library management and reader | 8083 |
| 84 | **Immich** | `immich` | Self-hosted photo and video backup and management platform | 2283 |
| 85 | **LibreTranslate** | `libretranslate` | Free and open source machine translation API | 5001 |
| 86 | **OrcaRouter-Lite** | `orcarouterlite` | Lightweight LLM router with multi-provider support | 8000 |
| 87 | **LiteLLM** | `litellm` | LLM proxy with unified API for 100+ LLMs | 4000 |
| 88 | **AnythingLLM** | `anythingllm` | Multi-user AI platform with RAG, Agents, and local LLM support | 3007 |
| 89 | **Voicebox** | `voicebox` | Open-source AI voice studio with voice cloning, TTS, and dictation | 17493 |
| 90 | **CopilotKit** | `copilotkit` | Open-source AI agent runtime with multi-provider support | 4201 |
| 91 | **Goose** | `goose` | Open-source AI agent for code, workflows, and automation (AAIF/Linux Foundation) | 8300 |
| 92 | **Hermes** | `hermes` | Self-improving AI agent with persistent memory (Nous Research) | 8642 |
| 93 | **OpenClaw** | `openclaw` | AI agent gateway for Claude Code, OpenAI Codex and more | 18789 |
| 94 | **OpenHuman** | `openhuman` | Open-source AI agent platform with Rust core | 7788 |
| 95 | **Firecrawl** | `firecrawl` | Open-source web scraping API with JavaScript rendering | 3008 |
| 96 | **SearXNG** | `searxng` | Privacy-respecting metasearch engine | 8011 |
| 97 | **Plausible** | `plausible` | Open-source web analytics platform (ClickHouse + PostgreSQL) | 3200 |
| 98 | **Ntfy** | `ntfy` | Self-hosted push notification server with pub/sub topics, iOS/Android apps, and attachments | 8005 |
| 99 | **Docker-Mailserver** | `mailserver` | Full-featured mail server (SMTP, IMAP, antispam, antivirus) | 25 |
| 100 | **Listmonk** | `listmonk` | Self-hosted newsletter and mailing list manager | 9000 |
| 101 | **Cloudflare-Tunnel** | `cloudflared` | Secure tunnel to expose services without opening ports | — |
| 102 | **Headscale** | `headscale` | Self-hosted VPN server (Tailscale control server) with WireGuard | 8019 |
| 103 | **Wetty** | `wetty` | Web-based SSH terminal for secure host access | 3033 |
| 104 | **RustDesk-Server** | `rustdesk` | Open-source remote desktop server | 21115 |

<!--
> *Perhaps, I will consider includes in a future*: Jitsi, PeerTube, Mastodon, Plane, FRP, BackVault, Koffan
-->
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

## Documentation

For detailed installation instructions, development guides, and advanced configuration:

> **[Technical Documentation](HELP.md)**  
> If you have inconvinients with an image consider could be connectivity by the moment. Besides, `podman` is more experimental.
