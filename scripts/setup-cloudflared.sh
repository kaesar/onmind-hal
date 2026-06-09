#!/bin/bash
# Cloudflare Tunnel Setup Helper for OnMind-HAL
# This script helps configure Cloudflare Tunnel after installation

set -e

echo "Cloudflare Tunnel Setup Helper"
echo "================================"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed or not in PATH"
    exit 1
fi

# Check if cloudflared image is available
if ! docker images | grep -q cloudflare/cloudflared; then
    echo "Pulling Cloudflare Tunnel image..."
    docker pull cloudflare/cloudflared:latest
fi

# Create config directory
mkdir -p ~/.cloudflared

echo "Step 1: Authenticate with Cloudflare"
echo "-------------------------------------"
echo "This will open your browser to authenticate with Cloudflare."
echo "Press Enter to continue..."
read -r

docker run --rm -v ~/.cloudflared:/home/nonroot/.cloudflared \
    cloudflare/cloudflared:latest tunnel login

if [ ! -f ~/.cloudflared/cert.pem ]; then
    echo "Authentication failed. cert.pem not found."
    exit 1
fi

echo "Authentication successful!"
echo ""

echo "Step 2: Create a tunnel"
echo "-----------------------"
echo "Enter a name for your tunnel (e.g., homelab):"
read -r TUNNEL_NAME

if [ -z "$TUNNEL_NAME" ]; then
    TUNNEL_NAME="homelab"
    echo "Using default name: $TUNNEL_NAME"
fi

docker run --rm -v ~/.cloudflared:/home/nonroot/.cloudflared \
    cloudflare/cloudflared:latest tunnel create "$TUNNEL_NAME"

# Get tunnel ID
TUNNEL_ID=$(docker run --rm -v ~/.cloudflared:/home/nonroot/.cloudflared \
    cloudflare/cloudflared:latest tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    echo "Failed to create tunnel"
    exit 1
fi

echo "Tunnel created successfully!"
echo "   Tunnel ID: $TUNNEL_ID"
echo ""

echo "Step 3: Configure ingress rules"
echo "--------------------------------"

CADDYFILE="$HOME/ws/init/Caddyfile"

# Build ingress YAML entries from Caddyfile
INGRESS=""
if [ -f "$CADDYFILE" ]; then
    echo "Detecting services from Caddyfile..."
    echo ""
    while IFS= read -r line; do
        if [[ "$line" =~ ^([a-zA-Z0-9_-]+)\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\ \{$ ]]; then
            subdomain=$(echo "$line" | awk -F. '{print $1}')
        fi
        if [[ "$line" =~ reverse_proxy\ ([a-zA-Z0-9_-]+):([0-9]+) ]]; then
            container="${BASH_REMATCH[1]}"
            port="${BASH_REMATCH[2]}"
            if [ -n "$subdomain" ] && [ -n "$container" ]; then
                INGRESS="${INGRESS}  # - hostname: $subdomain.YOUR_DOMAIN
  #   service: http://$container:$port
"
            fi
        fi
    done < "$CADDYFILE"
fi

cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/$TUNNEL_ID.json

ingress:
$(echo "$INGRESS" | sed 's/^/  /')
  # Catch-all rule (required)
  - service: http_status:404
EOF

echo "Configuration file created at ~/.cloudflared/config.yml"
echo ""
echo "Edit it to uncomment the services you want to expose and set your domain."
echo ""

echo "Step 4: Configure DNS routes (optional)"
echo "----------------------------------------"
echo "Do you want to create DNS routes for your services? (y/n):"
read -r SETUP_DNS

if [ "$SETUP_DNS" = "y" ]; then
    echo "Enter your Cloudflare domain (e.g., yourdomain.com):"
    read -r DOMAIN

    if [ -n "$DOMAIN" ]; then
        while IFS= read -r line; do
            if [[ "$line" =~ ^([a-zA-Z0-9_-]+)\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\ \{$ ]]; then
                subdomain=$(echo "$line" | awk -F. '{print $1}')
                echo ""
                echo "Create DNS route for $subdomain.$DOMAIN? (y/n):"
                read -r CREATE_ROUTE
                if [ "$CREATE_ROUTE" = "y" ]; then
                    docker run --rm -v ~/.cloudflared:/home/nonroot/.cloudflared \
                        cloudflare/cloudflared:latest tunnel route dns "$TUNNEL_NAME" "$subdomain.$DOMAIN"
                    echo "Route created: $subdomain.$DOMAIN"
                fi
            fi
        done < "$CADDYFILE"
    fi
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit ~/.cloudflared/config.yml and uncomment the services you want to expose"
echo "2. Start the tunnel:"
echo "   docker start cloudflared"
echo "3. Check tunnel status:"
echo "   docker logs cloudflared"
