#!/bin/bash
# Cloudflare Tunnel Setup Helper for OnMind-HAL
# This script configures Cloudflare Tunnel via container CLI
#
# Usage: bash scripts/setup-cloudflared.sh [config_path]
#   config_path: Optional path for cloudflared config (default: ~/ws/init)

set -e

CONFIG_PATH="${1:-$HOME/ws/init}"
CLOUDFLARED_DIR="$CONFIG_PATH/cloudflared"
RUNTIME="docker"

# Detect container runtime
if command -v podman &> /dev/null; then
    RUNTIME="podman"
fi

echo "Cloudflare Tunnel Setup Helper"
echo "================================"
echo "Config directory: $CLOUDFLARED_DIR"
echo "Runtime: $RUNTIME"
echo ""

# Check if runtime is available
if ! command -v $RUNTIME &> /dev/null; then
    echo "$RUNTIME is not installed or not in PATH"
    exit 1
fi

# Check if cloudflared image is available
if ! $RUNTIME images | grep -q cloudflare/cloudflared; then
    echo "Pulling Cloudflare Tunnel image..."
    $RUNTIME pull cloudflare/cloudflared:latest
fi

# Create config directory
mkdir -p "$CLOUDFLARED_DIR"

# Check if already authenticated — exit early if cert.pem exists
if [ -f "$CLOUDFLARED_DIR/cert.pem" ]; then
    echo "✓ Cloudflare already authenticated (cert.pem exists)"
    echo ""
    echo "To reconfigure, delete $CLOUDFLARED_DIR/cert.pem and run again."
    exit 0
fi

echo "Step 1: Authenticate with Cloudflare"
echo "-------------------------------------"
echo "A URL will appear. Open it in your browser to authenticate."
echo "Press Enter to continue..."
read -r

$RUNTIME run --rm --user root -v "$CLOUDFLARED_DIR":/root/.cloudflared \
    cloudflare/cloudflared:latest tunnel login

if [ ! -f "$CLOUDFLARED_DIR/cert.pem" ]; then
    echo "Authentication failed. cert.pem not found."
    exit 1
fi

echo "✓ Authentication successful!"
echo ""

echo "Step 2: Create a tunnel"
echo "-----------------------"
read -p "Tunnel name (default: homelab): " TUNNEL_NAME
TUNNEL_NAME="${TUNNEL_NAME:-homelab}"

CREATE_OUTPUT=$($RUNTIME run --rm --user root -v "$CLOUDFLARED_DIR":/root/.cloudflared \
    cloudflare/cloudflared:latest tunnel create "$TUNNEL_NAME" 2>&1)

echo "$CREATE_OUTPUT"

# Extract tunnel ID
TUNNEL_ID=$(echo "$CREATE_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
    echo "Failed to create tunnel"
    exit 1
fi

echo ""
echo "✓ Tunnel created: $TUNNEL_ID"
echo ""

echo "Step 3: Route DNS to tunnel"
echo "---------------------------"
read -p "Domain (e.g., homelab.example.com): " DOMAIN

if [ -n "$DOMAIN" ]; then
    $RUNTIME run --rm --user root -v "$CLOUDFLARED_DIR":/root/.cloudflared \
        cloudflare/cloudflared:latest tunnel route dns "$TUNNEL_NAME" "$DOMAIN" 2>&1 || \
        echo "⚠️  DNS route may already exist or will be configured manually"
    echo "✓ DNS route configured for $DOMAIN"

    # Route wildcard so all subdomains resolve through the tunnel
    $RUNTIME run --rm --user root -v "$CLOUDFLARED_DIR":/root/.cloudflared \
        cloudflare/cloudflared:latest tunnel route dns "$TUNNEL_NAME" "*.$DOMAIN" 2>&1 || \
        echo "⚠️  Wildcard DNS route may already exist"
    echo "✓ Wildcard DNS route configured for *.$DOMAIN"
else
    echo "⚠️  No domain provided. Run later: cloudflared tunnel route dns $TUNNEL_NAME <domain>"
fi

echo ""

echo "Step 4: Update config.yml"
echo "-------------------------"

if [ -f "$CLOUDFLARED_DIR/config.yml" ]; then
    sed -i "s/^tunnel: .*/tunnel: $TUNNEL_ID/" "$CLOUDFLARED_DIR/config.yml"
    sed -i "s|^credentials-file: .*|credentials-file: /etc/cloudflared/$TUNNEL_ID.json|" "$CLOUDFLARED_DIR/config.yml"
    echo "✓ config.yml updated with tunnel ID"
else
    echo "⚠️  config.yml not found. Run the HAL installer first to generate it."
fi

echo ""

echo "Step 5: Restart cloudflared"
echo "---------------------------"
$RUNTIME restart cloudflared 2>/dev/null || echo "Container not running"

echo ""
echo "Setup complete!"
echo ""
echo "Tunnel ID: $TUNNEL_ID"
echo "Config: $CLOUDFLARED_DIR/config.yml"
echo ""
echo "Routes in config.yml will sync to Cloudflare automatically."
echo "To add more routes, edit: $CLOUDFLARED_DIR/config.yml"
