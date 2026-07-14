#!/bin/bash
# ==============================================
# ProxiJob Admin Web Client VPS Deployment Script
# Domain: proxijob.io.vn / admin.proxijob.io.vn
# ==============================================

set -e  # Dừng ngay nếu có lỗi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    🌐 ProxiJob Client Deployment Script      ║${NC}"
echo -e "${CYAN}║    Domain: proxijob.io.vn / admin.proxijob   ║${NC}"
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

SSL_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ ! -f "$SSL_PATH" ]; then
    echo -e "  ${YELLOW}⏳ Chưa phát hiện chứng chỉ SSL. Đang tạo cấu hình Nginx Bootstrap (HTTP-only) để xác thực...${NC}"
    
    cat <<EOF > /etc/nginx/sites-available/proxijob.io.vn
server {
    listen 80;
    server_name $DOMAIN admin.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "ProxiJob Client Bootstrapping...";
        add_header Content-Type text/plain;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/proxijob.io.vn /etc/nginx/sites-enabled/proxijob.io.vn
    # Xóa file default nếu có
    rm -f /etc/nginx/sites-enabled/default
    
    systemctl reload nginx
    
    echo -e "  ${YELLOW}📝 Đang xin chứng chỉ Let's Encrypt cho $DOMAIN và admin.$DOMAIN...${NC}"
    # Đăng ký chứng chỉ chung cho cả 2 domains
    certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" -d "admin.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Đăng ký đa tên miền thất bại. Đang thử đăng ký riêng tên miền gốc $DOMAIN...${NC}"
        certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Lỗi nghiêm trọng: Không thể lấy SSL Cert. Hãy kiểm tra DNS của $DOMAIN đã trỏ về IP này chưa.${NC}"
            exit 1
        fi
    fi
    echo -e "  ✅ SSL certificate đã được cấp thành công!"
fi

# Sao chép cấu hình Nginx chính thức
echo -e "  ${YELLOW}⚙️ Đang kích hoạt cấu hình Nginx Gateway chính thức...${NC}"
cp "$PROJECT_DIR/deploy/nginx/proxijob.io.vn.conf" /etc/nginx/sites-available/proxijob.io.vn
ln -sf /etc/nginx/sites-available/proxijob.io.vn /etc/nginx/sites-enabled/proxijob.io.vn

# Kiểm tra cú pháp Nginx và khởi động lại
nginx -t
systemctl reload nginx

echo ""
echo -e "${GREEN}🎉 QUY TRÌNH DEPLOY HOÀN TẤT THÀNH CÔNG! 🎉${NC}"
echo -e "🔗 Truy cập Website: ${CYAN}https://proxijob.io.vn${NC} hoặc ${CYAN}https://admin.proxijob.io.vn${NC}"
echo ""
