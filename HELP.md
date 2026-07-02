# OnMind-HAL - Technical Documentation

## Prerequisites

### Bun Runtime

```bash
curl -fsSL https://bun.com/install | bash
```

> **macOS with Homebrew**: `brew install oven-sh/bun/bun`  
> **Windows**: `powershell -c "irm bun.sh/install.ps1|iex"`

### System Requirements

#### Linux
- Distribution: Ubuntu 20.04+/Debian (even WSL), Arch Linux, Amazon Linux 2023
- Docker support (Podman experimental)
- Root or sudo access
- Network connectivity

#### macOS
- macOS 11.0+ (Big Sur or later)
- One of the following container runtimes:
  - **Colima** (Recommended): `brew install colima && colima start --cpu 4 --memory 8 --disk 70`
  - **Podman**: `brew install podman && podman machine init && podman machine start`
  - **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop)
- Homebrew package manager
- Network connectivity

> **Note for macOS**: HAL will automatically detect your container runtime. Firewall configuration is skipped on macOS, and DNS resolution uses `/etc/hosts` entries instead of dnsmasq.

#### Windows (Experimental)
- **MINGW64/Git Bash**: Experimental support for Windows with Git Bash
- **Prerequisites**: Git for Windows with Git Bash and Network connectivity (besides Docker Desktop)
- **Recommended**: Use WSL2 for full Linux compatibility instead

## Quick Start

### Linux / WSL

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

### macOS

1. **Install Container Runtime** (choose one):
   ```bash
   # Option 1: Colima (Recommended)
   brew install colima
   colima start --cpu 4 --memory 8 --disk 70
   
   # Option 2: Podman
   brew install podman
   podman machine init
   podman machine start
   
   # Option 3: Docker Desktop
   # Download from https://www.docker.com/products/docker-desktop
   ```

2. **Clone and Install**
   ```bash
   git clone https://github.com/kaesar/onmind-hal.git hal
   cd hal
   bun install
   ```

3. **Run Setup**
   ```bash
   bun run build
   bun run start
   ```

4. **Configure DNS** (after installation completes):
   
   Add entries to `/etc/hosts` for local DNS resolution:
   ```bash
   sudo nano /etc/hosts
   ```
   
   Add lines like:
   ```
   127.0.0.1 homelab.local
   127.0.0.1 portainer.homelab.local
   127.0.0.1 caddy.homelab.local
   # ... (HAL will show you the complete list)
   ```

> **macOS Notes**:  
- Firewall configuration is automatically skipped
- Services are accessible via localhost (127.0.0.1)
- Use the container runtime of your choice (Colima recommended for corporate environments)
- HAL will detect and use your installed runtime automatically
- **Important**: Colima needs at least 70GB disk space and 8GB RAM when installing all services. If you get "no space left" errors, recreate Colima with more resources: `colima delete && colima start --cpu 4 --memory 8 --disk 70`
- **Architecture Warning**: Some services (like Plane) may not work properly on ARM64 architecture due to Docker image compatibility. Consider using an x86_64 system for full compatibility.

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
│   ├── amazon.ts           # Amazon Linux implementation
│   └── macos.ts            # macOS implementation
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

templates/                  # YAML configuration templates
├── services/               # Service-specific templates
└── config/                 # System configuration templates

tests/                      # Test suite
├── unit/                   # Unit tests
└── integration/            # Integration tests
```

## Adding New Services

**Core vs. Optional Services**: Consider when defining a service, the third parameter in the `BaseService` constructor indicates if it's a core service (always installed) or an optional one.

Core services are automatically included in every setup, while optional services are presented to the user for selection during the interactive prompts. It's good to consider some aspects or steps:

- Include Enum for the new service in `src/core/types.ts`
- Create an implementation class for the new service, e.g. `src/services/optional/karate.ts`
- Register the new service in `src/services/factory.ts`
- Create template in `.yml` (YAML), e.g. `templates/services/myservice.yml`
- Update CLI prompts or display name in `src/cli/interface.ts`
- Update Cadddy configuration (subdomain/container/port) in `src/services/core/caddy.ts`
- Add validation if need it and include service in the list for `src/core/application.ts`
- Consider include new test, e.g. `tests/unit/services/myservice.test.ts`
- Consider check `README.md` to update documentation

For example, to add a new service like **MongoDB**, follow these steps...

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

Create `templates/services/mongodb.yml`:

```yaml
name: MongoDB Database Server
description: NoSQL document database

commands:
  install:
    - docker pull mongo:latest
  setup:
    - mkdir -p /opt/homelab/mongodb/data
  run: |
    docker run -d \
      --name mongodb \
      --network {{NETWORK_NAME}} \
      -p 27017:27017 \
      -v /opt/homelab/mongodb/data:/data/db \
      -e MONGO_INITDB_ROOT_USERNAME=admin \
      -e MONGO_INITDB_ROOT_PASSWORD={{STORAGE_PASSWORD}} \
      --restart=always \
      mongo:latest

variables:
  - NETWORK_NAME
  - STORAGE_PASSWORD

dependencies: []
```

> **Configuration Variables**: Variables like `{{NETWORK_NAME}}` and `{{STORAGE_PASSWORD}}` are dynamically replaced by the `TemplateEngine` using values from the `HomelabConfig` object, which is populated during the interactive setup.

### 5. Update CLI Interface

Add the service to `src/cli/interface.ts` in the service mapping:

```typescript
const serviceMap: Record<ServiceType, string> = {
  // ... existing services
  [ServiceType.MONGODB]: 'MongoDB'
};
```

### 6. Update CLI Prompts

Add the service to the optional services list in `src/cli/prompts.ts`:

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

### 7. Update Caddy Configuration

Add the service proxy mapping to `src/services/core/caddy.ts`:

```typescript
private getServiceProxyMappings(): string {
  const mappings = [
    // ... existing services
    'mongodb.{$DOMAIN} {\n  reverse_proxy mongodb:27017\n}'
  ];
  return mappings.join('\n\n');
}
```

### 8. Add Validation (If Needed)

If the service requires special validation, add it to `src/utils/validation.ts`:

```typescript
export function validateMongoDBPassword(password: string): void {
  // Add MongoDB-specific password validation
}
```

### 9. Create Tests

Create `tests/unit/services/mongodb.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { MongoDBService } from '../../../src/services/optional/mongodb.js';
// ... test implementation
```

### 10. Update Documentation

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

### Cleanup Script

If you need to remove all HAL services and start fresh:

```bash
# Stop and remove all HAL containers
docker ps -a --filter "name=caddy|dockhand|arcane|copyparty|rustfs|duckdb|postgresql|redis|mongodb|mariadb|scylladb|qdrant|kafka|rabbitmq|ollama|web|n8n|tooljet|kestra|keycloak|authelia|pocketid|apisix|etcd|k3d|codeserver|jupyterlab|floci|forge|dev|semaphore|sonarqube|trivy|karate|rapidoc|hoppscotch|k6|grafana|loki|prometheus|opensearch|coroot|redash|fluentbit|liquibase|uptimekuma|dozzle|registry|nexus|infisical|consul|vault|link|filestash|excalidraw|drawio|wisemapping|kroki|outline|grist|nocodb|directus|keystonejs|spark|medusa|twentycrm|calcom|huly|mattermost|jasperreports|stirlingpdf|libretranslate|orcarouter|litellm|anythingllm|opennotebooklm|hermes|goose|openclaw|openhuman|firecrawl|searxng|plausible|mailserver|zrok|ziti|cloudflared|wetty|rustdesk|seafile|copilot|surreal|docuseal|chat|adguard|listmonk|send|back|box|head|ntfy|immich|presenton" --format "{{.Names}}" | xargs -r docker rm -f

# Remove HAL network
docker network rm homelab-network 2>/dev/null || true

# Remove Docker images (optional)
docker images -q | xargs -r docker rmi -f

# Remove Docker volumes (optional)
docker volume ls --filter "name=data|work|conf|logs|plug" --format "{{.Name}}" | xargs -r docker volume rm

# Remove data directories (optional)
sudo rm -rf ~/ws/data
mkdir -p ~/ws/data
```

> Removes volumes and data directories are actions with focus just in cleanup, because you lose data

## Platform-Specific Notes

### macOS Development Environment

HAL on macOS provides a clean development environment without modifying your system:

**Container Runtime Detection:**
- Automatically detects Colima, Podman, or Docker Desktop
- No preference required - uses what you have installed
- Provides installation instructions if none found

**DNS Resolution:**
- Uses `/etc/hosts` instead of dnsmasq
- No system-level DNS configuration required
- Simple manual entries after installation

**Firewall:**
- Automatically skipped on macOS
- Not needed for local development
- Services accessible via localhost

**Recommended Setup for Corporate Environments:**
```bash
# Colima is recommended when Docker Desktop licensing is a concern
brew install colima
colima start --cpu 4 --memory 8 --disk 70

# Then run HAL
cd hal
bun run build
bun run start
```

**Example /etc/hosts Configuration:**
```
127.0.0.1 homelab.local
127.0.0.1 portainer.homelab.local
127.0.0.1 n8n.homelab.local
127.0.0.1 grafana.homelab.local
```

## Exposing HAL to the Internet
<!--
### Using FRP (Fast Reverse Proxy)

FRP allows you to expose your local HAL services to the internet through a VPS with a public IP. This is useful for:
- Accessing your homelab from anywhere
- Sharing services with team members
- Testing webhooks and external integrations
- Alternative to Cloudflare Tunnel or Tailscale

#### Prerequisites

1. **A VPS with public IP** (DigitalOcean, Linode, AWS EC2, etc.)
2. **Domain name** pointing to your VPS IP
3. **FRP Server (frps)** installed on your VPS

#### Step 1: Install FRP Server on VPS

SSH into your VPS and install frps:

```bash
# Download FRP (check latest version at https://github.com/fatedier/frp/releases)
wget https://github.com/fatedier/frp/releases/download/v0.52.3/frp_0.52.3_linux_amd64.tar.gz
tar -xzf frp_0.52.3_linux_amd64.tar.gz
cd frp_0.52.3_linux_amd64

# Create server configuration
cat > frps.ini << 'EOF'
[common]
bind_port = 7000
token = YOUR_SECRET_TOKEN_HERE
vhost_http_port = 80
vhost_https_port = 443
EOF

# Run FRP server (or create systemd service)
./frps -c frps.ini
```

**Create systemd service** (recommended for production):

```bash
sudo tee /etc/systemd/system/frps.service > /dev/null << 'EOF'
[Unit]
Description=FRP Server
After=network.target

[Service]
Type=simple
User=root
Restart=on-failure
RestartSec=5s
ExecStart=/root/frp_0.52.3_linux_amd64/frps -c /root/frp_0.52.3_linux_amd64/frps.ini

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable frps
sudo systemctl start frps
```

#### Step 2: Install FRP Client with HAL

When running HAL setup, select **FRP** from the optional services list.

#### Step 3: Configure FRP Client

After HAL installation completes, edit the FRP client configuration:

```bash
nano ~/ws/init/frpc.ini
```

Replace the placeholder configuration with:

```ini
[common]
server_addr = YOUR_VPS_IP
server_port = 7000
token = YOUR_SECRET_TOKEN_HERE

[web]
type = http
local_ip = caddy
local_port = 80
custom_domains = yourdomain.com,*.yourdomain.com

[web-tls]
type = https
local_ip = caddy
local_port = 443
custom_domains = yourdomain.com,*.yourdomain.com
```

**Configuration explained:**
- `server_addr`: Your VPS public IP address
- `server_port`: FRP server port (default 7000)
- `token`: Shared secret between client and server (must match)
- `local_ip`: Use `caddy` (container name in Docker network)
- `custom_domains`: Your domain and subdomains

#### Step 4: Restart FRP Client

```bash
docker restart frp
```

#### Step 5: Configure DNS

Point your domain to the VPS IP:

```
A    @              YOUR_VPS_IP
A    *              YOUR_VPS_IP
```

Or specific subdomains:

```
A    portainer      YOUR_VPS_IP
A    n8n            YOUR_VPS_IP
A    grafana        YOUR_VPS_IP
```

#### Step 6: Update Caddy Configuration

Edit your Caddyfile to use your public domain:

```bash
nano ~/ws/init/Caddyfile
```

Change from `.local` or `.lan` to your actual domain:

```
portainer.yourdomain.com {
    reverse_proxy portainer:9000
}

n8n.yourdomain.com {
    reverse_proxy n8n:5678
}

grafana.yourdomain.com {
    reverse_proxy grafana:3000
}
```

Restart Caddy:

```bash
docker restart caddy
```

### Platform Compatibility

| Platform  | FRP Support | Notes |
|-----------|-------------|-------|
| **Linux** | Full        | Direct network access, works perfectly |
| **WSL**   | Full        | Windows forwards ports, works like Linux |
| **macOS** | Limited     | Docker on localhost only, FRP can tunnel but requires port mapping |

**macOS Note**: On macOS, you need to configure FRP to use `127.0.0.1` as `local_ip` instead of container names, and ensure ports are exposed from Docker/Colima.

### Security Considerations

1. **Use strong tokens**: Generate secure random tokens for FRP
   ```bash
   openssl rand -base64 32
   ```

2. **Enable Authelia**: Use HAL's Authelia service for authentication
   ```
   *.yourdomain.com {
       forward_auth authelia:9091 {
           uri /api/verify?rd=https://auth.yourdomain.com
       }
       reverse_proxy {upstream}
   }
   ```

3. **Firewall on VPS**: Only open necessary ports
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 7000/tcp
   sudo ufw enable
   ```

4. **Monitor logs**: Check FRP server logs regularly
   ```bash
   sudo journalctl -u frps -f
   ```
-->
### Using Cloudflare Tunnel (Recommended for Beginners)

Cloudflare Tunnel is easier to set up and doesn't require a VPS. It's perfect for:

- Exposing services without a public IP
- No port forwarding configuration
- Automatic SSL/TLS certificates
- Built-in DDoS protection
- Free tier available

**Prerequisites:**
1. Cloudflare account (free)
2. Domain managed by Cloudflare (can use free domains)

**Setup with HAL:**

When running HAL setup, select **Cloudflare Tunnel** from the optional services list.

After installation, run the setup helper script:

```bash
cd hal
./scripts/setup-cloudflared.sh
```

The script will guide you through:
1. Authentication with Cloudflare
2. Creating a tunnel
3. Configuring DNS routes
4. Setting up service ingress rules

**Manual Setup (Alternative):**

If you prefer manual configuration:

```bash
# Step 1: Authenticate
docker run -v ~/.cloudflared:/home/nonroot/.cloudflared \
  cloudflare/cloudflared:latest tunnel login

# Step 2: Create tunnel
docker run -v ~/.cloudflared:/home/nonroot/.cloudflared \
  cloudflare/cloudflared:latest tunnel create homelab

# Step 3: Configure tunnel
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <TUNNEL_ID>
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  # Portainer
  - hostname: portainer.yourdomain.com
    service: http://portainer:9000
  
  # n8n
  - hostname: n8n.yourdomain.com
    service: http://n8n:5678
  
  # Grafana
  - hostname: grafana.yourdomain.com
    service: http://grafana:3000
  
  # Catch-all (required)
  - service: http_status:404
EOF

# Step 4: Route DNS (for each service)
docker run -v ~/.cloudflared:/home/nonroot/.cloudflared \
  cloudflare/cloudflared:latest tunnel route dns homelab portainer.yourdomain.com

# Step 5: Start tunnel
docker start cloudflared
```

**Configuration Tips:**

1. **Multiple services**: Add multiple hostname entries in `config.yml`
2. **Wildcard domains**: Use `*.yourdomain.com` for catch-all
3. **Internal services**: Reference containers by name (e.g., `http://portainer:9000`)
4. **HTTPS backends**: Use `https://` if service uses TLS internally

**Verify tunnel is working:**

```bash
# Check tunnel status
docker logs cloudflared

# List active tunnels
docker run -v ~/.cloudflared:/home/nonroot/.cloudflared \
  cloudflare/cloudflared:latest tunnel list

# Test access
curl https://portainer.yourdomain.com
```
<!--
#### Cloudflare Tunnel (Free)

To clarify the use with `cloudflared` (the Cloudflare Tunnel client), first lets install it. Example for **Linux**:

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

> For **macOS** you can install it with: `brew install cloudflared`  
> For **Windows** you can download [**Cloudflare Tunnel** binary](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe) and run it (from command line): `.\cloudflared-windows-amd64.exe tunnel ...`

Once installed it you can execute the next commands to authenticate, create the tunnel, configure it and run it:

```bash
cloudflared tunnel login
cloudflared tunnel create homelab
cloudflared tunnel route dns homelab subdomain.yourdomain.com
cloudflared tunnel run homelab
```

> Change `homelab` by your preference name

For setting with config file (`config.yml`) you can use a content like this:

```yml
tunnel: homelab
credentials-file: C:\Users\you\.cloudflared\YOUR_UUID.json

ingress:
  - hostname: subdomain.yourdomain.net
    service: http://localhost:80
  - service: http_status:404
```

> `YOUR_UUID.json` refers to the id given by cloudflare for the tunnel with the command `cloudflared tunnel create homelab`

Then, instead of `cloudflared tunnel run homelab` command, execute:

```bash
cloudflared tunnel --config config.yml run
```
-->
## Troubleshooting MINGW64 (Windows - Git Bash)

To fix **caddy** with the right path for **Git Bash** in **Windows**, run something like this:

```powershell
docker run -d \
  --name caddy \
  --network homelab-network \
  -p 80:80 \
  -p 443:443 \
  -v "C:\Users\youruser\ws\init\Caddyfile:/etc/caddy/Caddyfile" \
  -v "C:\Users\youruser\ws\data\caddy:/data" \
  caddy:latest
```

In the same way, for **copyparty** run something like this:

```powershell
docker run \
      -d \
      --name copyparty \
      --network homelab-network \
      -p 3923:3923 \
      -v "C:\Users\youruser\ws\data\copyparty:/w" \
      -v "C:\Users\youruser\ws\init:/cfg" \
      copyparty/ac:latest
```

> You can change `docker` by `podman` command (depends on your installation)

## Troubleshooting Ubuntu

### SSL Certificates for Local Domains

**OnMind-HAL automatically configures SSL certificates for local domains (.lan, .local) on Linux:**

1. **CA Certificate Generation**: HAL creates a custom Certificate Authority (CA)
2. **System Trust Store**: The CA is installed in `/usr/local/share/ca-certificates/`
3. **Automatic Certificates**: Caddy uses this CA to generate trusted certificates
4. **DNS Resolution**: dnsmasq resolves local domains to your server IP

**Verify SSL setup:**
```bash
# Check if CA certificate is installed
ls -la /usr/local/share/ca-certificates/homelab-ca.crt

# Test certificate trust
openssl s_client -connect localhost:443 -servername yourdomain.lan

# Check Caddy certificate generation
docker logs caddy | grep -i cert

# Test DNS resolution
nslookup yourdomain.lan 127.0.0.1
```

**If SSL still fails:**
```bash
# Regenerate CA certificate
sudo rm /usr/local/share/ca-certificates/homelab-ca.crt
sudo update-ca-certificates --fresh

# Restart HAL installation to regenerate CA
cd hal && bun run start

# Restart Caddy to regenerate certificates
docker restart caddy
```

**Browser certificate warnings:**
- First access may show security warning
- Click "Advanced" → "Proceed to site" (Chrome/Edge)
- Or "Advanced" → "Accept Risk" (Firefox)
- Certificate will be trusted after first acceptance

### Complete Environment Cleanup

**When HAL installation fails or you need a fresh start:**

1. Stop all containers
2. Remove all containers
3. Remove all images
4. Remove all volumes
5. Remove all networks (except defaults)
6. Clean Docker system completely
7. Remove HAL application data
8. Verify cleanup (if you want it)

This means, execute the next commands:

```bash
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker rmi $(docker images -q)
docker volume rm $(docker volume ls -q)
docker network rm $(docker network ls -q)
docker system prune -a --volumes -f
sudo rm -rf ~/ws/data/* ~/ws/init/*

docker ps -a
docker images
docker volume ls
docker network ls
```

**One-line complete cleanup:**
```bash
docker stop $(docker ps -aq) 2>/dev/null; docker rm $(docker ps -aq) 2>/dev/null; docker system prune -a --volumes -f; sudo rm -rf ~/ws/data/* ~/ws/init/*
```

**After cleanup, reinstall:**
```bash
cd hal
bun run start
```

### Firewall Issues (UFW)

**UFW already configured:**
```bash
# Check current UFW status
sudo ufw status

# If UFW is blocking HAL, temporarily disable
sudo ufw disable

# Run HAL installation
# HAL will reconfigure UFW properly

# Or manually add required ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**Reset UFW if needed:**
```bash
# Reset UFW to defaults (removes all rules)
sudo ufw --force reset

# Re-run HAL to reconfigure properly
cd hal && bun run start
```

**Sudo password required (exit code 100):**

**HAL** ejecuta comandos con `sudo` para configurar UFW. Si el usuario no tiene **passwordless sudo**, el proceso podria llegar a fallar con `ShellError: Failed with exit code 100` porque Bun no puede proveer una terminal interactiva para la contraseña.

**Soluciones:**

1. Simplemente reinicia la maquina y verifica ejecutando de nuevo.

2. **Passwordless sudo** (recomendado para automatización):
   ```bash
   echo "$USER ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/hal-automation
   sudo chmod 440 /etc/sudoers.d/hal-automation
   ```

3. **Cachear contraseña sudo** antes de ejecutar HAL:
   ```bash
   sudo -v && bun run start
   ```
   `sudo -v` extiende el timeout de sudo (15 min por defecto) sin ejecutar un comando.

### Docker Permission Issues

**User not in docker group (Common Issue):**
```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# CRITICAL: Must logout and login again, or restart session
# Option 1: Logout/login (recommended)
exit
# Then SSH back in

# Option 2: Refresh group membership without logout
newgrp docker

# Option 3: Restart the machine (most reliable)
sudo reboot

# Verify docker works without sudo
docker ps
docker version
```

**If docker commands still require sudo:**
```bash
# Check if user is in docker group
groups $USER
id $USER

# Verify docker group exists
getent group docker

# Re-add user to docker group
sudo usermod -aG docker $USER

# Check docker daemon status
sudo systemctl status docker
sudo systemctl start docker

# Fix docker socket permissions
sudo chmod 666 /var/run/docker.sock
```

### Podman - Privileged Ports

**Error: rootlessport cannot expose privileged port 80**

```bash
# Temporary (lost on reboot)
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80

# Permanent
echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

**For Docker Mailserver** (ports 25, 143, 587, 993):
```bash
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=25
```

### Podman - Short Image Names

**Error: short-name did not resolve to an alias**

```bash
# Manual pull with full name
podman pull docker.io/library/redis:7.2-alpine
```

### Port Conflicts (Common Issue)

**Identify what's using port 80:**
```bash
# Find process using port 80
sudo ss -tulpn | grep :80
sudo netstat -tulpn | grep :80
sudo lsof -i :80

# Check all running services
sudo systemctl list-units --type=service --state=running | grep -E "(http|web|nginx|apache)"

# Kill process using port 80 (replace PID)
sudo kill -9 <PID>

# Or find and stop unknown web services
sudo fuser -k 80/tcp
```

**Apache/httpd service conflict:**
```bash
# Stop and disable Apache/httpd service
sudo systemctl stop httpd apache2 nginx
sudo systemctl disable httpd apache2 nginx

# Check for snap packages
sudo snap list | grep -E "(apache|nginx|http)"
sudo snap remove <package-name>

# Check for other web servers
ps aux | grep -E "(httpd|apache|nginx|lighttpd)"

# Verify ports are free
sudo lsof -i :80
sudo lsof -i :443

# Restart Caddy after clearing ports
docker restart caddy
```

**Other web servers:**
```bash
# Stop nginx if running
sudo systemctl stop nginx
sudo systemctl disable nginx

# Check what's using ports 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Caddy Container Issues

**Permission issues:**
```bash
# Ensure Docker daemon is running
sudo systemctl status docker

# Check Caddy logs
docker logs caddy

# Restart Caddy with proper permissions
docker stop caddy
docker rm caddy
docker run -d --name caddy --network homelab-network -p 80:80 -p 443:443 -v ~/ws/init:/etc/caddy caddy:latest
```

**Network issues:**
```bash
# Recreate Docker network
docker network rm homelab-network
docker network create homelab-network

# Restart all containers
docker restart caddy portainer
```

**Client can't connect to server:**
```bash
# Check tunnel client logs
docker logs cloudflared

# Verify VPS firewall allows port 7000
sudo ufw status

# Test connection
telnet YOUR_VPS_IP 7000
```

**Services not accessible:**
```bash
# Verify Caddy is running
docker ps | grep caddy

# Check Caddy logs
docker logs caddy

# Verify DNS resolution
dig yourdomain.com
```

**SSL certificate issues:**
```bash
# Caddy auto-generates Let's Encrypt certs
docker logs caddy 2>&1 | grep -i cert
```

## Template Variables

OnMind-HAL usa un sistema de plantillas YAML (`.yml`) para definir la instalación y configuración de cada servicio. Las plantillas usan variables con la sintaxis `{{VARIABLE_NAME}}` que son reemplazadas dinámicamente por el `TemplateEngine` con valores del objeto `HomelabConfig`.

### Variables de expresioens y origen de los Valores

Las variables son proporcionadas por el usuario durante la configuración interactiva (`bun run start`) y almacenadas en `HomelabConfig`:

- **`NETWORK_NAME`**: Prompt `Enter container network name` (default: `homelab-network`)
- **`DOMAIN`**: Prompt `Enter your domain` (ej. `mini.lan`)
- **`STORAGE_PASSWORD`**: Prompt `Enter a storage/database password` (solo si se seleccionan servicios que lo requieren)
- **`DATA_PATH`**: Prompt `Enter data path` (default: `ws/data`)
- **`CONFIG_PATH`**: Prompt `Enter config path` (default: `ws/init`)
- **`IP`**: Detectado automáticamente o prompt `Enter server IP address`
- **`ADMIN_TOKEN`**: Generado automáticamente (32 caracteres alfanuméricos)
- **`SECRET_KEY`**, **`UTILS_SECRET`**: Hata ahora, exclusivos del servicio Outline — generados con `openssl rand -hex 32` en su propia sobrecarga (de `getTemplateContext()`).
- **`MAIL_USER`**: Prompt `Enter mail user` para Docker Mailserver (ej. `admin@mini.lan`)
- **`MAIL_PASSWORD`**: Prompt `Enter mail password` para Docker Mailserver

### Ejemplo de Template

```yaml
# templates/services/mongodb.yml
commands:
  run: |
    docker run -d \
      --name mongodb \
      --network {{NETWORK_NAME}} \
      -e MONGO_INITDB_ROOT_PASSWORD={{STORAGE_PASSWORD}} \
      mongo:latest

variables:
  - NETWORK_NAME
  - STORAGE_PASSWORD
```

### Post-Run Commands (`postRun`)

Además de `install`, `setup` y `run`, las plantillas pueden incluir una sección `postRun` con comandos que se ejecutan **después** de que el contenedor principal del servicio se haya iniciado:

```yaml
commands:
  install:
    - docker pull myimage:latest
  setup:
    - mkdir -p ~/{{DATA_PATH}}/myapp/data
  run: |
    docker run -d --name myapp ...
  postRun:
    - sleep 5 && docker exec myapp init-admin --password {{PASSWORD}}
```

**Características:**

- Los comandos `postRun` se ejecutan inmediatamente después de que el contenedor se inicia con `run`
- Son ideales para configuración inicial que requiere el contenedor en ejecución (crear usuarios, ejecutar migraciones, seed data)
- **Los errores en `postRun` no son fatales**: si falla, el servicio continúa funcionando y se muestra una advertencia. Esto permite que el contenedor principal esté operativo aunque haya pasos secundarios pendientes.

**Ejemplo real (Docker Mailserver):**

```yaml
postRun:
  - |
    for i in $(seq 1 6); do
      docker exec mailserver pgrep dovecot >/dev/null 2>&1 && break
      echo "  Waiting for mailserver to initialize... ($i/6)"
      sleep 10
    done
    printf "%s\n%s\n" "{{MAIL_PASSWORD}}" "{{MAIL_PASSWORD}}" | docker exec -i mailserver setup email add {{MAIL_USER}}
```

Este ejemplo espera hasta 60 segundos a que dovecot esté disponible dentro del contenedor antes de crear el admin, evitando errores por contenedor aún no inicializado.
```
