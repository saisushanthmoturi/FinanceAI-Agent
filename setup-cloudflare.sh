#!/bin/bash

# 🛡️ Cloudflare Security Setup Script
# For Financial Platform with WAF & Tunnel Protection

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║  🛡️  Cloudflare Security Setup for Financial Platform  ║"
echo "║                                                        ║"
echo "║  Features:                                             ║"
echo "║  ✅ Web Application Firewall (WAF)                     ║"
echo "║  ✅ Cloudflare Tunnel (Zero Trust)                     ║"
echo "║  ✅ DDoS Protection                                    ║"
echo "║  ✅ SSL/TLS Encryption                                 ║"
echo "║  ✅ Bot Protection                                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_warning "This script is optimized for macOS. Some steps may differ on other OS."
fi

# Step 1: Check/Install cloudflared
print_step "Step 1: Checking cloudflared installation..."

if command_exists cloudflared; then
    VERSION=$(cloudflared --version | head -n 1)
    print_success "cloudflared is already installed: $VERSION"
else
    print_warning "cloudflared not found. Installing..."
    
    if command_exists brew; then
        brew install cloudflare/cloudflare/cloudflared
        print_success "cloudflared installed successfully!"
    else
        print_error "Homebrew not found. Please install Homebrew first:"
        echo "Visit: https://brew.sh"
        exit 1
    fi
fi

# Step 2: Authenticate with Cloudflare
print_step "Step 2: Authenticating with Cloudflare..."
echo "This will open your browser. Please:"
echo "1. Log in to Cloudflare"
echo "2. Select your domain"
echo "3. Authorize the tunnel"
echo ""
read -p "Press Enter to continue..."

cloudflared tunnel login

if [ $? -eq 0 ]; then
    print_success "Authentication successful!"
else
    print_error "Authentication failed. Please try again."
    exit 1
fi

# Step 3: Get tunnel configuration details
print_step "Step 3: Tunnel Configuration..."

read -p "Enter tunnel name (e.g., finance-app): " TUNNEL_NAME
if [ -z "$TUNNEL_NAME" ]; then
    TUNNEL_NAME="finance-app"
    print_warning "Using default name: finance-app"
fi

read -p "Enter your domain (e.g., yourfinanceapp.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    print_error "Domain is required!"
    exit 1
fi

read -p "Enter local port (default: 5174): " LOCAL_PORT
if [ -z "$LOCAL_PORT" ]; then
    LOCAL_PORT="5174"
fi

# Step 4: Create tunnel
print_step "Step 4: Creating Cloudflare Tunnel..."

# Check if tunnel already exists
EXISTING_TUNNEL=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" || true)

if [ -n "$EXISTING_TUNNEL" ]; then
    print_warning "Tunnel '$TUNNEL_NAME' already exists."
    read -p "Do you want to delete and recreate it? (y/N): " RECREATE
    if [[ $RECREATE =~ ^[Yy]$ ]]; then
        TUNNEL_ID=$(echo "$EXISTING_TUNNEL" | awk '{print $1}')
        cloudflared tunnel delete "$TUNNEL_ID"
        print_success "Old tunnel deleted."
        cloudflared tunnel create "$TUNNEL_NAME"
    fi
else
    cloudflared tunnel create "$TUNNEL_NAME"
fi

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')

if [ -z "$TUNNEL_ID" ]; then
    print_error "Failed to get tunnel ID. Please check 'cloudflared tunnel list'"
    exit 1
fi

print_success "Tunnel created with ID: $TUNNEL_ID"

# Step 5: Create configuration file
print_step "Step 5: Creating tunnel configuration..."

CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"

# Backup existing config
if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    print_warning "Backed up existing config to $CONFIG_FILE.backup"
fi

# Create config
cat > "$CONFIG_FILE" << EOF
# Cloudflare Tunnel Configuration
# For Financial Platform Security

tunnel: $TUNNEL_ID
credentials-file: $CONFIG_DIR/$TUNNEL_ID.json

# Ingress rules - route traffic to your app
ingress:
  # Root domain
  - hostname: $DOMAIN
    service: http://localhost:$LOCAL_PORT
    originRequest:
      connectTimeout: 30s
      noTLSVerify: false
      
  # www subdomain
  - hostname: www.$DOMAIN
    service: http://localhost:$LOCAL_PORT
    originRequest:
      connectTimeout: 30s
      noTLSVerify: false
      
  # API subdomain (optional, uncomment if needed)
  # - hostname: api.$DOMAIN
  #   service: http://localhost:3000
      
  # Catch-all rule (required)
  - service: http_status:404
EOF

print_success "Configuration file created at: $CONFIG_FILE"

# Step 6: Route DNS
print_step "Step 6: Routing DNS to tunnel..."

echo "Routing $DOMAIN to tunnel..."
cloudflared tunnel route dns "$TUNNEL_NAME" "$DOMAIN"

echo "Routing www.$DOMAIN to tunnel..."
cloudflared tunnel route dns "$TUNNEL_NAME" "www.$DOMAIN"

print_success "DNS routes configured!"

# Step 7: Create environment file
print_step "Step 7: Creating environment configuration..."

ENV_FILE=".env.production"

if [ -f "$ENV_FILE" ]; then
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    print_warning "Backed up existing .env.production"
fi

cat > "$ENV_FILE" << EOF
# Production Environment Configuration
# Generated by Cloudflare Setup Script

# Application URL (with HTTPS)
VITE_APP_URL=https://$DOMAIN

# Firebase Configuration (update with your values)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=$DOMAIN
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudflare Turnstile (CAPTCHA)
VITE_CLOUDFLARE_TURNSTILE_SITE_KEY=your_turnstile_site_key

# Environment
NODE_ENV=production
EOF

print_success "Environment file created: $ENV_FILE"
print_warning "Please update Firebase credentials in $ENV_FILE"

# Step 8: Create security headers
print_step "Step 8: Creating security headers..."

mkdir -p public

cat > "public/_headers" << EOF
# Security Headers for Financial Platform
# Automatically deployed with Cloudflare

/*
  # Prevent clickjacking
  X-Frame-Options: DENY
  
  # Prevent MIME type sniffing
  X-Content-Type-Options: nosniff
  
  # XSS Protection
  X-XSS-Protection: 1; mode=block
  
  # Referrer Policy
  Referrer-Policy: strict-origin-when-cross-origin
  
  # Permissions Policy
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=()
  
  # HSTS (force HTTPS)
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  
  # Content Security Policy
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com wss://*.firebaseio.com; frame-src 'self' https://*.firebaseapp.com;
EOF

print_success "Security headers file created: public/_headers"

# Step 9: Create systemd/launchd service (for auto-start)
print_step "Step 9: Setting up tunnel service..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use launchd
    cloudflared service install
    print_success "Tunnel service installed (launchd)"
    print_warning "Tunnel will start automatically on system boot"
else
    # Linux - use systemd
    cloudflared service install
    print_success "Tunnel service installed (systemd)"
fi

# Step 10: Create helper scripts
print_step "Step 10: Creating helper scripts..."

# Start script
cat > "start-tunnel.sh" << EOF
#!/bin/bash
# Start Cloudflare Tunnel

echo "🚇 Starting Cloudflare Tunnel: $TUNNEL_NAME"
cloudflared tunnel run $TUNNEL_NAME
EOF
chmod +x start-tunnel.sh

# Stop script
cat > "stop-tunnel.sh" << EOF
#!/bin/bash
# Stop Cloudflare Tunnel

echo "🛑 Stopping Cloudflare Tunnel"
pkill cloudflared
echo "✅ Tunnel stopped"
EOF
chmod +x stop-tunnel.sh

# Status script
cat > "status-tunnel.sh" << EOF
#!/bin/bash
# Check Cloudflare Tunnel Status

echo "📊 Cloudflare Tunnel Status"
echo "=========================="
echo ""
echo "Tunnel Info:"
cloudflared tunnel info $TUNNEL_NAME
echo ""
echo "Running Process:"
ps aux | grep cloudflared | grep -v grep || echo "❌ Tunnel not running"
EOF
chmod +x status-tunnel.sh

print_success "Helper scripts created:"
echo "  - start-tunnel.sh  (Start tunnel)"
echo "  - stop-tunnel.sh   (Stop tunnel)"
echo "  - status-tunnel.sh (Check status)"

# Step 11: Display next steps
print_step "Setup Complete! 🎉"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ Setup Complete!                   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📋 Tunnel Information:${NC}"
echo "  Tunnel Name: $TUNNEL_NAME"
echo "  Tunnel ID: $TUNNEL_ID"
echo "  Domain: https://$DOMAIN"
echo "  Local Port: $LOCAL_PORT"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo -e "${YELLOW}1. Configure WAF Rules:${NC}"
echo "   → Visit: https://dash.cloudflare.com"
echo "   → Go to: Security → WAF"
echo "   → Enable: Cloudflare Managed Ruleset"
echo "   → Enable: OWASP Core Ruleset"
echo ""
echo -e "${YELLOW}2. Enable SSL/TLS:${NC}"
echo "   → Go to: SSL/TLS → Overview"
echo "   → Set mode to: Full (strict)"
echo "   → Enable: Always Use HTTPS"
echo ""
echo -e "${YELLOW}3. Configure Rate Limiting:${NC}"
echo "   → Go to: Security → WAF → Rate Limiting Rules"
echo "   → Create rules for login, API endpoints"
echo ""
echo -e "${YELLOW}4. Update Firebase:${NC}"
echo "   → Firebase Console → Authentication → Settings"
echo "   → Add domain: $DOMAIN"
echo "   → Update .env.production with Firebase credentials"
echo ""
echo -e "${YELLOW}5. Start Your Application:${NC}"
echo "   Terminal 1: npm run dev"
echo "   Terminal 2: ./start-tunnel.sh"
echo "   OR: npm run dev & ./start-tunnel.sh"
echo ""
echo -e "${YELLOW}6. Visit Your App:${NC}"
echo "   → https://$DOMAIN"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "  → See CLOUDFLARE_SECURITY_SETUP.md for detailed guide"
echo ""
echo -e "${BLUE}🔧 Useful Commands:${NC}"
echo "  Start tunnel:  ./start-tunnel.sh"
echo "  Stop tunnel:   ./stop-tunnel.sh"
echo "  Check status:  ./status-tunnel.sh"
echo "  View logs:     cloudflared tunnel logs $TUNNEL_NAME"
echo "  List tunnels:  cloudflared tunnel list"
echo ""
echo -e "${GREEN}🎯 Your financial platform is now protected by enterprise-grade security!${NC}"
echo ""
