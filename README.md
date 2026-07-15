# OnMind-HAL (Home Apps Labs)

**Home Apps Labs (OnMind-HAL)** is a comprehensive HomeLab setup or automation tool that deploys and manages a collection of open-source (or similiar) applications using Docker containers (chosen based on my expertise). It's designed for Virtual Machines, Cloud Instances, or Virtual Private Servers (VPS).

Thinked for professionals or techie individuals, as well, IT area and infraestucture (CloudOps or DevSecOps), architecture and software development environments. That's the reason to include first serveral services for infra (IT), but also some services for HomeLab (around 100+). 

I have tested the funtional flow and aceptance by myself trying installation en reinstall again and again, many but many times. The issues with containers and their repos are not about **HAL** (except some template).

> This started from my Article about making your HomeLab: [here](https://onmind.net/devops/es/YourHomeLab)  
> See other repos from my portfolio: [here](https://github.com/kaesar) 

## Features

Simply you can use docker or podman, setup ufw & dnsmasq (linux), caddy and cloudflared tunnel client. All of this and 100+ services/containers in an automation tool.

- **Automated Installation**: One-command setup for multiple services, around 100+ (even try `ufw` and `dnsmasq`, besides `caddy`)
- **Multi-Platform Support**: Ubuntu/Debian (even WSL2: Windows Subsystem for Linux), Arch Linux, Amazon Linux 2023, macOS, Windows (MINGW64/Git Bash - experimental)
- **Container Runtime Flexibility**: Docker, Colima, or Podman support on macOS and Linux
- **Template-Based Configuration**: YAML templates for easy technical service customization
- **Comprehensive Logging**: Detailed execution tracking for debugging
- **Podman as Alternative**: Docker-first but `podman` could replace `docker` commands if you don't use Docker (experimental).
- **Cloudflared Tunnel Support**: Setup for the Tunnel with Cloudflare client (`cloudflared`)

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
bun start
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

> **Default optional services** (enabled when `--list` is omitted): RustFS, PostgreSQL, Redis, Kafka, Tinyauth, Ntfy, Mailpit, Cloudflare Tunnel.

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
bun run src/main.ts --domain hal.lan --nolist jenkins,onedev,backstage,seafile,twentycrm,medusajs,huly,mailserver

bun run src/main.ts --list defaults,mongodb,mariadb,n8n,floci
```

> To install directly in Linux you can add `sudo` (at the beginning) for priviledges

## Services

### Core Services (Always Installed)

- **Caddy**: Reverse proxy and web server with automatic HTTPS
- **Dockhand** (Docker) or **Arcane** (Podman): Container management interface
- **Copyparty**: File sharing and management platform

> In script mode: **Dockhand** is selected for Docker, **Arcane** for Podman. In interactive mode, you can choose between Dockhand or Arcane (the user is `arcane` with `arcane-admin` to pass).

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
| 22 | **Tinyauth** | `tinyauth` | Lightweight OIDC authentication server with OAuth and LDAP support | 3011 |
| 23 | **PocketID** | `pocketid` | OIDC provider with passkeys support | 8093 |
| 24 | **Apache-APISIX** | `apisix` | Cloud-native API Gateway and microservices management | 9180 |
| 25 | **Floci** | `floci` | AWS service emulator for local development - LocalStack alternative | 4566 |
| 26 | **Floci-AZ** | `flociaz` | Azure service emulator for local development | 4567 |
| 27 | **Floci-GCP** | `flocigcp` | GCP service emulator for local development | 4568 |
| 28 | **k3d** | `k3d` | Lightweight Kubernetes in Docker for local development | 6444 |
| 29 | **Code-Server** | `codeserver` | Web-based VS Code IDE (code-server by Coder) | 3081 |
| 30 | **JupyterLab** | `jupyterlab` | Web-based interactive development environment (notebooks and code) | 3082 |
| 31 | **Forgejo** | `forgejo` | Self-hosted lightweight Git server with CI/CD (Gitea fork) | 3083 |
| 32 | **OneDev** | `onedev` | Self-hosted Git server with CI/CD | 6610 |
| 33 | **Jenkins** | `jenkins` | Automation server for building, testing, and deploying software | 8100 |
| 34 | **Semaphore-UI** | `semaphore` | Modern UI for Ansible and shell automation | 3002 |
| 35 | **Backstage** | `backstage` | Developer portal platform (Developer Portal by Spotify) | 7007 |
| 36 | **Liquibase** | `liquibase` | Database schema change management and version control | 8091 |
| 37 | **SonarQube** | `sonarqube` | Code quality and security analysis | 9002 |
| 38 | **Trivy** | `trivy` | Container security scanner | 8088 |
| 39 | **Karate** | `karate` | API, UI & performance test automation framework (VNC) | 5901 |
| 40 | **RapiDoc** | `rapidoc` | WebComponent for OpenAPI Spec viewer | 8085 |
| 41 | **Hoppscotch** | `hoppscotch` | Open-source API development ecosystem (Postman alternative) | 3080 |
| 42 | **K6** | `k6` | Open-source load testing tool by Grafana (OSS) Labs | 6565 |
| 43 | **Grafana** | `grafana` | Analytics and monitoring platform | 3001 |
| 44 | **Loki** | `loki` | Log aggregation system by Grafana Labs | 3100 |
| 45 | **Prometheus** | `prometheus` | Open-source systems monitoring and alerting toolkit | 9090 |
| 46 | **Fluent-Bit** | `fluentbit` | Lightweight log processor and forwarder | 2020 |
| 47 | **Coroot** | `coroot` | Open-source observability and monitoring platform | 8081 |
| 48 | **ReDash** | `redash` | SQL query editor and visualization platform | 5000 |
| 49 | **Uptime-Kuma** | `uptimekuma` | Self-hosted uptime monitoring tool | 3003 |
| 50 | **Dozzle** | `dozzle` | Lightweight Docker log viewer and monitor | 8097 |
| 51 | **Registry** | `registry` | Private Docker container registry | 5002 |
| 52 | **Nexus-Repository** | `nexus` | Universal artifact repository manager | 8098 |
| 53 | **Infisical** | `infisical` | Open-source secret management platform | 8096 |
| 54 | **Vault** | `vault` | Secrets and encryption management (HashiCorp) | 8200 |
| 55 | **Consul** | `consul` | Service discovery and configuration (HashiCorp) | 8500 |
| 56 | **Vaultwarden** | `vaultwarden` | Self-hosted Bitwarden-compatible password manager | 8222 |
| 57 | **Linkwarden** | `linkwarden` | Self-hosted bookmark manager with tagging and archiving | 3101 |
| 58 | **Shlink** | `shlink` | URL shortener with REST API and web interface | 8012 |
| 59 | **Send** | `send` | Simple, private file sharing with end-to-end encryption (Firefox Send fork) | 1880 |
| 60 | **Filestash** | `filestash` | Web-based file manager for any storage backend | 8334 |
| 61 | **Seafile** | `seafile` | Self-hosted file sync and share platform (Google Drive alternative) | 8016 |
| 62 | **Excalidraw** | `excalidraw` | Virtual whiteboard for sketching diagrams | 8082 |
| 63 | **Draw.io** | `drawio` | Web-based diagramming application | 8084 |
| 64 | **WiseMapping** | `wisemapping` | Web-based mind mapping tool (requires PostgreSQL) | 8095 |
| 65 | **Kroki** | `kroki` | API for generating diagrams (PlantUML, Mermaid, GraphViz, etc.) | 8086 |
| 66 | **Presenton** | `presenton` | Open-source AI presentation generator (Gamma/Canva alternative) | 5010 |
| 67 | **Slidev** | `slidev` | Presentation slides for developers (Markdown-based) | 3031 |
| 68 | **Outline** | `outline` | Team knowledge base and wiki | 3030 |
| 69 | **Grist** | `grist` | Modern spreadsheet with relational database capabilities | 8484 |
| 70 | **NocoDB** | `nocodb` | Open-source Airtable alternative - Smart spreadsheet | 8018 |
| 71 | **Directus** | `directus` | Open-source headless CMS and backend-as-a-service | 8055 |
| 72 | **InsForge** | `insforge` | Open-source backend platform for AI coding agents with database, auth, storage, and AI gateway | 7130 |
| 73 | **Apache Spark** | `spark` | Unified analytics engine for large-scale data processing | 9093, 7077 |
| 74 | **TwentyCRM** | `twentycrm` | Modern open-source CRM platform | 3021 |
| 75 | **Chatwoot** | `chatwoot` | Open-source customer engagement platform (Intercom/Zendesk alternative) | 3092 |
| 76 | **MedusaJS** | `medusajs` | Headless e-commerce platform (Shopify alternative) | 9003 |
| 77 | **Huly** | `huly` | All-in-one project management platform (like Jira + Notion + Slack) | 8087 |
| 78 | **Mattermost** | `mattermost` | Open-source team collaboration and messaging platform (like Slack) | 8065 |
| 79 | **Cal.com** | `calcom` | Open-source scheduling platform (Calendly alternative) | 3040 |
| 80 | **AdGuard-Home** | `adguard` | Network-wide ad and tracker blocking DNS server | 3004 |
| 81 | **JasperReports** | `jasperreports` | Business intelligence and reporting platform | 8014 |
| 82 | **DocuSeal** | `docuseal` | Open-source document signing and PDF form filling platform | 3009 |
| 83 | **Stirling-PDF** | `stirlingpdf` | Powerful locally hosted PDF manipulation tool | 8090 |
| 84 | **Pandoc-Web** | `pandocweb` | Web interface for Pandoc document converter | 8094 |
| 85 | **Calibre-Web** | `calibreweb` | Web-based ebook library management and reader | 8083 |
| 86 | **Immich** | `immich` | Self-hosted photo and video backup and management platform | 2283 |
| 87 | **LibreTranslate** | `libretranslate` | Free and open source machine translation API | 5001 |
| 88 | **LiteLLM** | `litellm` | LLM proxy with unified API for 100+ LLMs | 4000 |
| 89 | **AnythingLLM** | `anythingllm` | Multi-user AI platform with RAG, Agents, and local LLM support | 3007 |
| 90 | **LightRAG** | `lightrag` | Simple and fast graph-based Retrieval-Augmented Generation | 9621 |
| 91 | **Voicebox** | `voicebox` | Open-source AI voice studio with voice cloning, TTS, and dictation | 17493 |
| 92 | **CopilotKit** | `copilotkit` | Open-source AI agent runtime with multi-provider support | 4201 |
| 93 | **Goose** | `goose` | Open-source AI agent for code, workflows, and automation (AAIF/Linux Foundation) | 8300 |
| 94 | **Hermes** | `hermes` | Self-improving AI agent with persistent memory (Nous Research) | 8642 |
| 95 | **OpenClaw** | `openclaw` | AI agent gateway for Claude Code, OpenAI Codex and more | 18789 |
| 96 | **Firecrawl** | `firecrawl` | Open-source web scraping API with JavaScript rendering | 3008 |
| 97 | **SearXNG** | `searxng` | Privacy-respecting metasearch engine | 8011 |
| 98 | **Plausible** | `plausible` | Open-source web analytics platform (ClickHouse + PostgreSQL) | 3200 |
| 99 | **Ntfy** | `ntfy` | Self-hosted push notification server with pub/sub topics, iOS/Android apps, and attachments | 8005 |
| 100 | **Mailpit** | `mailpit` | Email testing tool for developers (fake SMTP server with web UI) | 8025 |
| 101 | **Docker-Mailserver** | `mailserver` | Full-featured mail server (SMTP, IMAP, antispam, antivirus) | 25 |
| 102 | **Listmonk** | `listmonk` | Self-hosted newsletter and mailing list manager | 9000 |
| 103 | **Cloudflare-Tunnel** | `cloudflared` | Secure tunnel to expose services without opening ports | — |
| 104 | **Headscale** | `headscale` | Self-hosted VPN server (Tailscale control server) with WireGuard | 8019 |
| 105 | **Wetty** | `wetty` | Web-based SSH terminal for secure host access | 3033 |
| 106 | **RustDesk-Server** | `rustdesk` | Open-source remote desktop server | 21115 |

<!--
> *Perhaps, I will consider includes in a future*: Karaf, Ignite, GoCD, 9router, Jitsi, PeerTube, Mastodon, Plane, FRP, BackVault, Koffan
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
