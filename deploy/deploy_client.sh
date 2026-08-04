#!/bin/bash
# ==============================================
# ProxiJob Web Client VPS Deployment Script
# Domains: proxijob.io.vn / app.proxijob.io.vn / admin.proxijob.io.vn
# ==============================================

set -e  # Dừng ngay nếu có lỗi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    🌐 ProxiJob Client Deployment Script      ║${NC}"
echo -e "${CYAN}║    Domain: app.proxijob / admin.proxijob     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

DOMAIN="proxijob.io.vn"
EMAIL="proxijob.team@gmail.com"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CLIENT_DIR="$PROJECT_DIR/src/ProxiJob_Client"
WWW_ROOT="/var/www/proxijob-client"

# ==============================================
# BƯỚC 1: Build mã nguồn tĩnh React App
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 1/2: Biên dịch React App tĩnh (Vite) ━━━${NC}"
mkdir -p "$WWW_ROOT"

if command -v npm &> /dev/null; then
    echo -e "  ✅ Tìm thấy NPM cục bộ. Đang tiến hành cài đặt & build..."
    cd "$CLIENT_DIR"
    npm install --quiet
    npm run build
else
    echo -e "  ⚠️ Không tìm thấy NPM trên VPS. Sử dụng Docker Container Node:20 để build..."
    docker run --rm \
      -v "$CLIENT_DIR:/app" \
      -w /app \
      node:20-alpine \
      sh -c "npm install --quiet && chmod -R +x node_modules/.bin && npm run build"
fi

# Sao chép file đã build vào thư mục phục vụ của Nginx
echo -e "  ${YELLOW}⏳ Đang sao chép file static vào thư mục $WWW_ROOT...${NC}"
rm -rf "$WWW_ROOT"/*
cp -r "$CLIENT_DIR/dist/"* "$WWW_ROOT/"
echo -e "  ✅ Đã sao chép các tệp tĩnh thành công."
echo ""

# ==============================================
# BƯỚC 2: Cấu hình Nginx & Chứng chỉ SSL/HTTPS
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 2/2: Cấu hình Nginx & Cấp chứng chỉ SSL/HTTPS ━━━${NC}"
mkdir -p /var/www/certbot

# Sao chép cấu hình Nginx chính thức
echo -e "  ${YELLOW}⚙️ Đang kích hoạt cấu hình Nginx Gateway chính thức...${NC}"
cp "$PROJECT_DIR/deploy/nginx/proxijob.io.vn.conf" /etc/nginx/sites-available/proxijob.io.vn
ln -sf /etc/nginx/sites-available/proxijob.io.vn /etc/nginx/sites-enabled/proxijob.io.vn
rm -f /etc/nginx/sites-enabled/default

systemctl reload nginx

# Đăng ký hoặc mở rộng SSL Certbot cho cả app.proxijob.io.vn, admin.proxijob.io.vn, proxijob.io.vn
echo -e "  ${YELLOW}📝 Đang đăng ký/cập nhật chứng chỉ SSL Certbot cho app.$DOMAIN, admin.$DOMAIN, $DOMAIN...${NC}"
certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" -d "app.$DOMAIN" -d "admin.$DOMAIN" --expand --non-interactive --agree-tos --email "$EMAIL" || true

nginx -t
systemctl reload nginx

echo ""
echo -e "${GREEN}🎉 QUY TRÌNH DEPLOY HOÀN TẤT THÀNH CÔNG! 🎉${NC}"
echo -e "🔗 Web Client App: ${CYAN}https://app.proxijob.io.vn${NC}"
echo -e "🔗 Admin Client: ${CYAN}https://admin.proxijob.io.vn${NC}"
echo ""
