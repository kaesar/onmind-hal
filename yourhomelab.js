#!/usr/bin/env bun
// ** First HomeLab Setup in One Script **
import inquirer from 'inquirer';
import { $ } from 'bun';
import { writeFileSync, mkdirSync } from 'fs';

// --- Helper Functions ---
async function runCommand(command, description = '') {
    console.log(description ? `${description}...` : `Running: ${command}`);
    
    try {
        await $`sh -c ${command}`;
    } catch (error) {
        throw new Error(`Command execution failed: ${error.message}`);
    }
}

async function runCommandQuiet(command) {
    try {
        const result = await $`sh -c ${command}`.quiet();
        return { 
            code: result.exitCode, 
            stdout: result.stdout.toString().trim(), 
            stderr: result.stderr.toString().trim() 
        };
    } catch (error) {
        return { 
            code: error.exitCode || -1, 
            stdout: '', 
            stderr: error.message 
        };
    }
}

// --- Configuration Collection ---
async function collectConfiguration() {
    console.log("🏠 Welcome to HomeLab Setup Script!");
    console.log("This script will help you set up your HomeLab environment with Docker containers.\n");

    const config = await inquirer.prompt([
        {
            type: 'input',
            name: 'ip',
            message: 'Enter your HomeLab IP address:',
            default: '192.168.1.2',
            validate: (input) => {
                const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
                return ipRegex.test(input) || 'Please enter a valid IP address';
            }
        },
        {
            type: 'input',
            name: 'domain',
            message: 'Enter your HomeLab base domain:',
            default: 'homelab.lan',
            validate: (input) => {
                return input.length > 0 || 'Domain cannot be empty';
            }
        },
        {
            type: 'input',
            name: 'networkName',
            message: 'Enter your Docker network name:',
            default: 'homelab',
            validate: (input) => {
                const networkRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
                return networkRegex.test(input) || 'Network name can only contain letters, numbers, hyphens, and underscores';
            }
        },
        {
            type: 'checkbox',
            name: 'services',
            message: 'Select optional services to install:',
            choices: [
                { name: 'n8n - Workflow automation platform', value: 'n8n' },
                { name: 'PostgreSQL - Database server', value: 'postgresql' },
                { name: 'Redis - In-memory data store', value: 'redis' },
                { name: 'MongoDB - NoSQL document database', value: 'mongodb' },
                { name: 'Minio - S3-compatible object storage', value: 'minio' },
                { name: 'Ollama - Local LLM server', value: 'ollama' }
            ]
        }
    ]);

    // Ask for PostgreSQL password if PostgreSQL is selected
    if (config.services.includes('postgresql')) {
        const pgConfig = await inquirer.prompt([
            {
                type: 'password',
                name: 'postgresPassword',
                message: 'Enter a password for PostgreSQL:',
                mask: '*',
                validate: (input) => {
                    return input.length >= 8 || 'Password must be at least 8 characters long';
                }
            }
        ]);
        config.postgresPassword = pgConfig.postgresPassword;
    }

    return config;
}

// --- Docker Commands Functions ---
function getCommands(config) {
    const { networkName, postgresPassword } = config;
    
    return {
        // Base System Setup
        install_essentials: `sudo apt update && sudo apt upgrade -y && sudo apt install curl wget git neovim -y`,
        set_hostname: `sudo hostnamectl set-hostname homelab && sudo systemctl restart systemd-hostnamed`,
        install_avahi: `sudo apt install avahi-daemon avahi-utils -y && sudo systemctl start avahi-daemon`,
        install_ssh: `sudo apt install openssh-server -y`,
        activate_ssh: `sudo systemctl start ssh && sudo systemctl enable ssh`,

        // Docker Installation
        install_docker_deps: `sudo apt install apt-transport-https ca-certificates software-properties-common -y`,
        add_docker_gpg_key: `curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg`,
        add_docker_repo: `echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`,
        install_docker_packages: `sudo apt update && sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y`,
        add_user_to_docker_group: `sudo usermod -aG docker $USER`,

        // Core Services
        docker_network_create: `docker network create ${networkName} || true`,
        
        // Portainer
        portainer_volume_create: `docker volume create portainer_data`,
        portainer_run: `docker run -d -p 9000:9000 -p 9444:9443 --name portainer --network ${networkName} --restart always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ce:latest`,

        // Caddy
        caddy_mkdir_wsconf: `mkdir -p ~/wsconf`,
        caddy_volume_create: `docker volume create caddy_data`,
        caddy_run: `docker run -d -p 80:80 -p 443:443 --name caddy --network ${networkName} --restart always -v $PWD/wsconf:/etc/caddy -v caddy_data:/data caddy`,
        caddy_install_ca_cert_1: `docker cp caddy:/data/caddy/pki/authorities/local/root.crt /tmp/caddy-root.crt`,
        caddy_install_ca_cert_2: `sudo cp /tmp/caddy-root.crt /usr/local/share/ca-certificates/caddy-root.crt`,
        caddy_install_ca_cert_3: `sudo update-ca-certificates`,

        // Copyparty
        copyparty_mkdir_wsroot: `mkdir -p ~/wsroot`,
        copyparty_run: `docker run -d -p 3923:3923 --name copyparty --network ${networkName} --restart always -v $PWD/wsroot:/w -v $PWD/wsconf:/cfg copyparty/ac:latest`,

        // Optional Services
        n8n_volume_create: `docker volume create n8n`,
        n8n_run: `docker run -d --name n8n --network ${networkName} --restart always -p 5678:5678 -v n8n:/home/node/.n8n n8nio/n8n`,

        postgres_volume_create: `docker volume create postgres`,
        postgres_run: `docker run -d -p 5432:5432 --name postgres --network ${networkName} --restart always -v postgres:/var/lib/postgresql/data -e POSTGRES_PASSWORD=${postgresPassword} -e PGDATA=/var/lib/postgresql/data/pgdata postgres:17.6`,

        redis_volume_create: `docker volume create redis`,
        redis_run: `docker run -d -p 6379:6379 --name redis --network ${networkName} --restart always -v redis:/data redis:latest`,

        mongodb_volume_create: `docker volume create mongodb`,
        mongodb_run: `docker run -d -p 27017:27017 --name mongodb --network ${networkName} --restart always -v mongodb:/data/db -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=homelab123 mongo:latest`,

        minio_volume_create: `docker volume create minio`,
        minio_run: `docker run -d -p 9001:9001 -p 9090:9090 --name minio --network ${networkName} --restart always -v minio:/data -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD=homelab123 minio/minio server /data --console-address ":9001"`,

        ollama_volume_create: `docker volume create ollama`,
        ollama_run: `docker run -d -p 11434:11434 --name ollama --network ${networkName} --restart always -v ollama:/root/.ollama ollama/ollama`,

        // dnsmasq
        install_dnsmasq: `sudo apt install dnsmasq -y`,
        restart_dnsmasq: `sudo systemctl restart dnsmasq`,

        // UFW Firewall
        install_ufw: `sudo apt install ufw -y`,
        ufw_reset: `sudo ufw --force reset`,
        ufw_default_deny: `sudo ufw default deny incoming`,
        ufw_default_allow: `sudo ufw default allow outgoing`,
        ufw_allow_ssh: `sudo ufw allow 22/tcp`,
        ufw_allow_http: `sudo ufw allow 80/tcp`,
        ufw_allow_https: `sudo ufw allow 443/tcp`,
        ufw_enable: `sudo ufw --force enable`
    };
}

// --- Configuration File Generators ---
function generateCaddyfile(config) {
    const { domain, services } = config;
    
    let caddyfileContent = `{
    local_certs
    admin off
}

${domain} {
    respond "Welcome to HomeLab" 200
    tls internal
}

portainer.${domain} {
    reverse_proxy portainer:9000
    tls internal
}

copyparty.${domain} {
    reverse_proxy copyparty:3923
    tls internal
}`;

    if (services.includes('n8n')) {
        caddyfileContent += `

n8n.${domain} {
    reverse_proxy n8n:5678
    tls internal
}`;
    }

    if (services.includes('minio')) {
        caddyfileContent += `

minio.${domain} {
    reverse_proxy minio:9001
    tls internal
}`;
    }

    if (services.includes('ollama')) {
        caddyfileContent += `

ollama.${domain} {
    reverse_proxy ollama:11434
    tls internal
}`;
    }
    
    return caddyfileContent;
}

function generateDnsmasqConf(config) {
    const { domain, ip, services } = config;
    
    let dnsmasqContent = `domain-needed
bogus-priv
expand-hosts
domain=${domain}
local=/${domain}/
address=/${domain}/${ip}
address=/portainer.${domain}/${ip}
address=/copyparty.${domain}/${ip}`;

    if (services.includes('n8n')) {
        dnsmasqContent += `\naddress=/n8n.${domain}/${ip}`;
    }

    if (services.includes('minio')) {
        dnsmasqContent += `\naddress=/minio.${domain}/${ip}`;
    }

    if (services.includes('ollama')) {
        dnsmasqContent += `\naddress=/ollama.${domain}/${ip}`;
    }

    dnsmasqContent += `\nlisten-address=${ip}\nbind-interfaces`;
    return dnsmasqContent;
}

function generateCopypartyConf() {
    return `[/]
  ./
  accs:
    rw: *`;
}

// --- Main Installation Logic ---
async function installHomeLab(config) {
    const commands = getCommands(config);
    const { services, domain } = config;

    try {
        console.log("\n🔧 Starting Base System Setup...");
        await runCommand(commands.install_essentials, "Installing essential packages");
        await runCommand(commands.set_hostname, "Setting hostname");
        await runCommand(commands.install_avahi, "Installing Avahi daemon");
        await runCommand(commands.install_ssh, "Installing SSH server");
        
        // Check SSH status and activate if needed
        const sshResult = await runCommandQuiet('sudo systemctl is-active ssh');
        if (sshResult.stdout.trim() !== 'active') {
            await runCommand(commands.activate_ssh, "Activating SSH service");
        }

        console.log("\n🐳 Installing Docker...");
        await runCommand(commands.install_docker_deps, "Installing Docker dependencies");
        await runCommand(commands.add_docker_gpg_key, "Adding Docker GPG key");
        await runCommand(commands.add_docker_repo, "Adding Docker repository");
        await runCommand(commands.install_docker_packages, "Installing Docker packages");
        await runCommand(commands.add_user_to_docker_group, "Adding user to Docker group");

        console.log("\n📦 Setting up Core Services...");
        await runCommand(commands.docker_network_create, "Creating Docker network");

        // Setup Portainer
        console.log("\n🔧 Setting up Portainer...");
        await runCommand(commands.portainer_volume_create, "Creating Portainer volume");
        await runCommand(commands.portainer_run, "Starting Portainer container");

        // Setup Caddy
        console.log("\n🌐 Setting up Caddy...");
        await runCommand(commands.caddy_mkdir_wsconf, "Creating Caddy config directory");
        
        // Generate and write Caddyfile
        const caddyfileContent = generateCaddyfile(config);
        try {
            mkdirSync('wsconf', { recursive: true });
            writeFileSync('wsconf/Caddyfile', caddyfileContent);
            console.log("✅ Caddyfile generated successfully");
        } catch (error) {
            console.error("❌ Failed to write Caddyfile:", error.message);
            throw error;
        }
        
        await runCommand(commands.caddy_volume_create, "Creating Caddy volume");
        await runCommand(commands.caddy_run, "Starting Caddy container");
        
        console.log("🔐 Installing Caddy CA certificate...");
        // Wait a bit for Caddy to generate certificates
        console.log("Waiting for Caddy to generate certificates...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            await runCommand(commands.caddy_install_ca_cert_1, "Copying CA certificate");
            await runCommand(commands.caddy_install_ca_cert_2, "Installing CA certificate");
            await runCommand(commands.caddy_install_ca_cert_3, "Updating CA certificates");
        } catch (error) {
            console.log("⚠️  CA certificate installation failed (this is optional)");
        }

        // Setup Copyparty
        console.log("\n📁 Setting up Copyparty...");
        await runCommand(commands.copyparty_mkdir_wsroot, "Creating Copyparty root directory");
        
        const copypartyConfContent = generateCopypartyConf();
        try {
            writeFileSync('wsconf/copyparty.conf', copypartyConfContent);
            console.log("✅ Copyparty config generated successfully");
        } catch (error) {
            console.error("❌ Failed to write Copyparty config:", error.message);
            throw error;
        }
        
        await runCommand(commands.copyparty_run, "Starting Copyparty container");

        // Setup dnsmasq
        console.log("\n🌐 Setting up dnsmasq...");
        await runCommand(commands.install_dnsmasq, "Installing dnsmasq");
        
        const dnsmasqConfContent = generateDnsmasqConf(config);
        try {
            // Write to temporary file first, then move with sudo
            writeFileSync('/tmp/dnsmasq.conf.homelab', dnsmasqConfContent);
            await runCommand('sudo cp /tmp/dnsmasq.conf.homelab /etc/dnsmasq.conf', "Installing dnsmasq configuration");
            await runCommand('sudo rm /tmp/dnsmasq.conf.homelab', "Cleaning up temporary file");
        } catch (error) {
            console.error("❌ Failed to configure dnsmasq:", error.message);
            throw error;
        }
        
        await runCommand(commands.restart_dnsmasq, "Restarting dnsmasq service");

        // Setup UFW Firewall
        console.log("\n🔥 Setting up UFW Firewall...");
        await runCommand(commands.install_ufw, "Installing UFW firewall");
        await runCommand(commands.ufw_reset, "Resetting UFW to defaults");
        await runCommand(commands.ufw_default_deny, "Setting default deny incoming");
        await runCommand(commands.ufw_default_allow, "Setting default allow outgoing");
        await runCommand(commands.ufw_allow_ssh, "Allowing SSH (port 22)");
        await runCommand(commands.ufw_allow_http, "Allowing HTTP (port 80)");
        await runCommand(commands.ufw_allow_https, "Allowing HTTPS (port 443)");
        await runCommand(commands.ufw_enable, "Enabling UFW firewall");

        // Setup optional services
        if (services.includes('n8n')) {
            console.log("\n🔄 Setting up n8n...");
            await runCommand(commands.n8n_volume_create, "Creating n8n volume");
            await runCommand(commands.n8n_run, "Starting n8n container");
        }

        if (services.includes('postgresql')) {
            console.log("\n🗄️  Setting up PostgreSQL...");
            await runCommand(commands.postgres_volume_create, "Creating PostgreSQL volume");
            await runCommand(commands.postgres_run, "Starting PostgreSQL container");
        }

        if (services.includes('redis')) {
            console.log("\n🔴 Setting up Redis...");
            await runCommand(commands.redis_volume_create, "Creating Redis volume");
            await runCommand(commands.redis_run, "Starting Redis container");
        }

        if (services.includes('mongodb')) {
            console.log("\n🍃 Setting up MongoDB...");
            await runCommand(commands.mongodb_volume_create, "Creating MongoDB volume");
            await runCommand(commands.mongodb_run, "Starting MongoDB container");
        }

        if (services.includes('minio')) {
            console.log("\n🪣 Setting up Minio...");
            await runCommand(commands.minio_volume_create, "Creating Minio volume");
            await runCommand(commands.minio_run, "Starting Minio container");
        }

        if (services.includes('ollama')) {
            console.log("\n🤖 Setting up Ollama...");
            await runCommand(commands.ollama_volume_create, "Creating Ollama volume");
            await runCommand(commands.ollama_run, "Starting Ollama container");
        }

        // Success message
        console.log("\n🎉 HomeLab setup completed successfully!");
        console.log("\n📋 Access Information:");
        console.log("═".repeat(50));
        console.log(`🏠 Main HomeLab: https://${domain}`);
        console.log(`🔧 Portainer: https://portainer.${domain}`);
        console.log(`📁 Copyparty: https://copyparty.${domain}`);
        
        if (services.includes('n8n')) {
            console.log(`🔄 n8n: https://n8n.${domain}`);
        }
        if (services.includes('postgresql')) {
            console.log(`🗄️  PostgreSQL: docker exec -it postgres psql -U postgres`);
        }
        if (services.includes('redis')) {
            console.log(`🔴 Redis: docker exec -it redis redis-cli`);
        }
        if (services.includes('mongodb')) {
            console.log(`🍃 MongoDB: docker exec -it mongodb mongosh admin -u admin -p homelab123`);
        }
        if (services.includes('minio')) {
            console.log(`🪣 Minio: https://minio.${domain} (admin/homelab123)`);
        }
        if (services.includes('ollama')) {
            console.log(`🤖 Ollama: https://ollama.${domain}`);
        }

        console.log("\n📝 Next Steps:");
        console.log("1. Configure your client's DNS to use this server");
        console.log("2. Install the Caddy CA certificate on client devices");
        console.log("3. Access your services using the URLs above");
        console.log("\n💡 Note: You may need to log out and back in for Docker group changes to take effect.");

    } catch (error) {
        console.error("\n❌ Installation failed:", error.message);
        console.log("\n🔄 You can retry the installation after fixing any issues.");
        process.exit(1);
    }
}

// --- Main Function ---
async function main() {
    try {
        // Collect configuration from user
        const config = await collectConfiguration();
        
        // Display configuration summary
        console.log("\n📋 Configuration Summary:");
        console.log("═".repeat(50));
        console.log(`🌐 IP Address: ${config.ip}`);
        console.log(`🏷️  Domain: ${config.domain}`);
        console.log(`🔗 Network: ${config.networkName}`);
        console.log(`📦 Services: ${config.services.length > 0 ? config.services.join(', ') : 'Core services only'}`);
        
        // Confirm installation
        const { confirmed } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message: 'Do you want to proceed with the installation?',
                default: true
            }
        ]);

        if (!confirmed) {
            console.log("❌ Installation cancelled by user.");
            process.exit(0);
        }

        // Start installation
        await installHomeLab(config);

    } catch (error) {
        console.error("❌ Fatal error:", error.message);
        process.exit(1);
    }
}

// Run the script
if (import.meta.main) {
    main();
}