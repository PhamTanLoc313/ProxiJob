#!/bin/bash
# ==============================================
# ProxiJob Landing Page VPS Deployment Script
# Domain: proxijob.io.vn
# ==============================================

set -e  # Dừng ngay nếu có lỗi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    🌐 ProxiJob Landing Page Deployment       ║${NC}"
echo -e "${CYAN}║    Domain: proxijob.io.vn                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LANDING_DIR="$PROJECT_DIR/src/ProxiJob_LandingPage"
WWW_ROOT="/var/www/proxijob-landing"

# ==============================================
# BƯỚC 1: Build mã nguồn tĩnh React App
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 1/2: Biên dịch Landing Page tĩnh (Vite) ━━━${NC}"
mkdir -p "$WWW_ROOT"

if command -v npm &> /dev/null; then
    echo -e "  ✅ Tìm thấy NPM cục bộ. Đang tiến hành cài đặt & build..."
    cd "$LANDING_DIR"
    npm install --quiet
    npm run build
else
    echo -e "  ⚠️ Không tìm thấy NPM trên VPS. Sử dụng Docker Container Node:20 để build..."
    docker run --rm \
      -v "$LANDING_DIR:/app" \
      -w /app \
      node:20-alpine \
      sh -c "npm install --quiet && chmod -R +x node_modules/.bin && npm run build"
fi

# Sao chép file đã build vào thư mục phục vụ của Nginx
echo -e "  ${YELLOW}⏳ Đang sao chép file static vào thư mục $WWW_ROOT...${NC}"
rm -rf "$WWW_ROOT"/*
cp -r "$LANDING_DIR/dist/"* "$WWW_ROOT/"
echo -e "  ✅ Đã sao chép các tệp tĩnh (bao gồm cả file APK) thành công."
echo ""

# ==============================================
# BƯỚC 2: Cập nhật cấu hình Nginx Gateway
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 2/2: Cấu hình Nginx Gateway ━━━${NC}"
cp "$PROJECT_DIR/deploy/nginx/proxijob.io.vn.conf" /etc/nginx/sites-available/proxijob.io.vn
ln -sf /etc/nginx/sites-available/proxijob.io.vn /etc/nginx/sites-enabled/proxijob.io.vn

# Kiểm tra cú pháp Nginx và reload
nginx -t
systemctl reload nginx

echo ""
echo -e "${GREEN}🎉 QUY TRÌNH DEPLOY LANDING PAGE HOÀN TẤT THÀNH CÔNG! 🎉${NC}"
echo -e "🔗 Truy cập Landing Page: ${CYAN}https://proxijob.io.vn${NC}"
echo -e "🔗 Truy cập Admin Client: ${CYAN}https://admin.proxijob.io.vn${NC}"
echo ""
