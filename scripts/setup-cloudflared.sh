#!/bin/bash
# Cloudflare Tunnel Setup Helper for OnMind-HAL
# This script helps configure Cloudflare Tunnel after installation

set -e

echo "🔧 Cloudflare Tunnel Setup Helper"
echo "=================================="
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

# Check if cloudflared image is available
if ! docker images | grep -q cloudflare/cloudflared; then
    echo "📥 Pulling Cloudflare Tunnel image..."
    docker pull cloudflare/cloudflared:latest
fi

# Create config directory
mkdir -p ~/.cloudflared

echo "Step 1: Authenticate with Cloudflare"
echo "-------------------------------------"
echo "This will open your browser to authenticate with Cloudflare."
echo "Press Enter to continue..."
read

docker run --rm -v ~/.cloudflared:/home/nonroot/.cloudflared \
    cloudflare/cloudflared:latest tunnel login

if [ ! -f ~/.cloudflared/cert.pem ]; then
    echo "❌ Authentication failed. cert.pem not found."
    exit 1
fi

echo "✅ Authentication successful!"
echo ""

echo "Step 2: Create a tunnel"
echo "-----------------------"
echo "Enter a name for your tunnel (e.g., homelab):"
read TUNNEL_NAME

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
    echo "❌ Failed to create tunnel"
    exit 1
fi

echo "✅ Tunnel created successfully!"
echo "   Tunnel ID: $TUNNEL_ID"
echo ""

echo "Step 3: Configure tunnel"
echo "------------------------"
echo "Creating config.yml..."

cat > ~/.cloudflared/config.yml <<EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/$TUNNEL_ID.json

# Ingress rules - configure your services here
ingress:
  # Example: Portainer
  # - hostname: portainer.yourdomain.com
  #   service: http://portainer:9000
  
  # Example: n8n
  # - hostname: n8n.yourdomain.com
  #   service: http://n8n:5678
  
  # Catch-all rule (required)
  - service: http_status:404
EOF

echo "✅ Configuration file created at ~/.cloudflared/config.yml"
echo ""

echo "Step 4: Configure DNS routes"
echo "-----------------------------"
echo "Enter your domain (e.g., yourdomain.com):"
read DOMAIN

if [ -n "$DOMAIN" ]; then
    echo "Enter subdomain for a service (e.g., portainer):"
    read SUBDOMAIN
    
    if [ -n "$SUBDOMAIN" ]; then
        docker run --rm -v ~/.cloudflared:/home/nonroot/.cloudflared \
            cloudflare/cloudflared:latest tunnel route dns "$TUNNEL_NAME" "$SUBDOMAIN.$DOMAIN"
        echo "✅ DNS route created: $SUBDOMAIN.$DOMAIN"
    fi
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit ~/.cloudflared/config.yml to add your services"
echo "2. Add DNS routes for each service:"
echo "   docker run -v ~/.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared:latest tunnel route dns $TUNNEL_NAME subdomain.yourdomain.com"
echo "3. Start the tunnel:"
echo "   docker start cloudflared"
echo ""
echo "📖 Documentation: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/"
