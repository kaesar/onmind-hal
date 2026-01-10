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
- Docker support
- Root or sudo access
- Network connectivity

#### macOS
- macOS 11.0+ (Big Sur or later)
- One of the following container runtimes:
  - **Colima** (Recommended): `brew install colima && colima start`
  - **Podman**: `brew install podman && podman machine init && podman machine start`
  - **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop)
- Homebrew package manager
- Network connectivity

> **Note for macOS**: HAL will automatically detect your container runtime. Firewall configuration is skipped on macOS, and DNS resolution uses `/etc/hosts` entries instead of dnsmasq.

> Works for Windows? Yes, with Windows Subsystem for Linux (WSL), finally it's a Linux (with Ubuntu)

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
   colima start --cpu 4 --memory 8 --disk 60
   
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
> - Firewall configuration is automatically skipped
> - Services are accessible via localhost (127.0.0.1)
> - Use the container runtime of your choice (Colima recommended for corporate environments)
> - HAL will detect and use your installed runtime automatically
> - **Important**: Colima needs at least 60GB disk space and 8GB RAM when installing all services. If you get "no space left" errors, recreate Colima with more resources: `colima delete && colima start --cpu 4 --memory 8 --disk 60`

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

templates/                  # JSON configuration templates
├── services/               # Service-specific templates
└── config/                 # System configuration templates

tests/                      # Test suite
├── unit/                   # Unit tests
└── integration/            # Integration tests
```

## Adding New Services

**Core vs. Optional Services**: Consider when defining a service, the third parameter in the `BaseService` constructor indicates if it's a core service (always installed) or an optional one. Core services are automatically included in every setup, while optional services are presented to the user for selection during the interactive prompts.

To add a new service like **MongoDB**, follow these steps...

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

Create `templates/services/mongodb.json`:

```json
{
  "name": "MongoDB Database Server",
  "description": "NoSQL document database",
  "commands": {
    "install": [
      "docker pull mongo:latest"
    ],
    "setup": [
      "docker network create {{NETWORK_NAME}} || true",
      "mkdir -p /opt/homelab/mongodb/data"
    ],
    "run": "docker run -d --name mongodb --network {{NETWORK_NAME}} -p 27017:27017 -v /opt/homelab/mongodb/data:/data/db -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD={{MONGODB_PASSWORD}} mongo:latest"
  },
  "variables": ["NETWORK_NAME", "MONGODB_PASSWORD"],
  "dependencies": []
}
```

> **Configuration Variables**: Variables like `{{NETWORK_NAME}}` and `{{MONGODB_PASSWORD}}` are dynamically replaced by the `TemplateEngine` using values from the `HomelabConfig` object, which is populated during the interactive setup.

### 5. Update CLI Prompts (Optional)

If the service requires additional configuration, update `src/cli/prompts.ts`:

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

### 6. Add Validation (If Needed)

If the service requires special validation, add it to `src/utils/validation.ts`:

```typescript
export function validateMongoDBPassword(password: string): void {
  // Add MongoDB-specific password validation
}
```

### 7. Create Tests

Create `tests/unit/services/mongodb.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { MongoDBService } from '../../../src/services/optional/mongodb.js';
// ... test implementation
```

### 8. Update Documentation

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
docker ps -a --filter "name=caddy|portainer|copyparty|postgresql|redis|mongodb|mariadb|minio|kafka|rabbitmq|ollama|n8n|kestra|authelia|localstack|onedev|sonarqube|trivy|rapidoc|grafana|loki|fluentbit|registry|nexus|vault|psitransfer|excalidraw|kroki|outline|grist|nocodb|mailserver|cockpit" --format "{{.Names}}" | xargs -r docker rm -f

# Remove HAL network
docker network rm homelab-network 2>/dev/null || true

# Remove data directories (optional)
rm -rf ~/wsdata

# Remove Docker volumes (optional)
docker volume ls --filter "name=postgres_data|redis_data|rabbitmq_data|grafana_data" --format "{{.Name}}" | xargs -r docker volume rm
```

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
colima start --cpu 4 --memory 8 --disk 60

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
nano ~/wsconf/frpc.ini
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
nano ~/wsconf/Caddyfile
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

### Alternative Tunneling Solutions

#### Cloudflare Tunnel (Free)

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create homelab

# Configure tunnel
cloudflared tunnel route dns homelab yourdomain.com

# Run tunnel
cloudflared tunnel run homelab
```

#### Tailscale (Private VPN)

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Connect
sudo tailscale up

# Access via Tailscale IP (private, not public)
```

## Troubleshooting Ubuntu

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
docker run -d --name caddy --network homelab-network -p 80:80 -p 443:443 -v ~/wsconf:/etc/caddy caddy:latest
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
# Check FRP client logs
docker logs frp

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
# Check Caddy logs for certificate errors
docker logs caddy 2>&1 | grep -i cert

# Ensure port 80 and 443 are accessible from internet
```