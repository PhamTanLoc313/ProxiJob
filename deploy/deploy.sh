#!/bin/bash
# ==============================================
# ProxiJob VPS Deployment Script
# Server: 180.93.59.204 (Ubuntu 24.04 LTS)
# Domain: api.proxijob.io.vn
# ==============================================
# 
# Hướng dẫn sử dụng:
#   1. SSH vào VPS: ssh root@180.93.59.204
#   2. Upload toàn bộ thư mục ProxiJob lên VPS (dùng SFTP/SCP)
#   3. cd /root/ProxiJob (hoặc nơi đã upload)
#   4. chmod +x deploy/deploy.sh
#   5. ./deploy/deploy.sh
#
# Script sẽ tự động:
#   - Cài đặt Nginx, Certbot
#   - Build & khởi chạy Docker containers
#   - Cấu hình Nginx reverse proxy
#   - Cấp chứng chỉ SSL/HTTPS
# ==============================================

set -e  # Dừng ngay nếu có lỗi

# --- Colors for output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     🚀 ProxiJob VPS Deployment Script       ║${NC}"
echo -e "${CYAN}║     Server: 180.93.59.204                    ║${NC}"
echo -e "${CYAN}║     Domain: api.proxijob.io.vn               ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""

DOMAIN="api.proxijob.io.vn"
EMAIL="proxijob.team@gmail.com"  # Email cho Certbot - đổi nếu cần
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${YELLOW}📁 Project directory: ${PROJECT_DIR}${NC}"
echo ""

# ==============================================
# BƯỚC 1: Kiểm tra Docker
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 1/5: Kiểm tra Docker ━━━${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker chưa được cài đặt! Vui lòng cài Docker trước.${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose chưa được cài đặt!${NC}"
    exit 1
fi

echo -e "  ✅ Docker version: $(docker --version)"
echo -e "  ✅ Docker Compose version: $(docker compose version --short 2>/dev/null || echo 'OK')"
echo ""

# ==============================================
# BƯỚC 2: Cài đặt Nginx & Certbot
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 2/5: Cài đặt Nginx & Certbot ━━━${NC}"

apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx curl > /dev/null 2>&1

echo -e "  ✅ Nginx version: $(nginx -v 2>&1 | cut -d'/' -f2)"
echo -e "  ✅ Certbot installed"
echo ""

# ==============================================
# BƯỚC 3: Build & Khởi chạy Docker Containers
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 3/5: Build & Khởi chạy Docker Containers ━━━${NC}"
echo -e "  ${YELLOW}⏳ Đang build .NET 8 images (lần đầu sẽ mất 5-10 phút)...${NC}"

cd "$PROJECT_DIR"

# Build all services
docker compose build --no-cache 2>&1 | tail -5

# Start all services
docker compose up -d

echo ""
echo -e "  ${YELLOW}⏳ Đợi services khởi động (30 giây)...${NC}"
sleep 30

# Kiểm tra trạng thái
echo -e "  📊 Trạng thái containers:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""

# ==============================================
# BƯỚC 4 & 5: Cấu hình Nginx & Cấp chứng chỉ SSL/HTTPS
# ==============================================
echo -e "${GREEN}━━━ BƯỚC 4 & 5: Cấu hình Nginx & Cấp chứng chỉ SSL/HTTPS ━━━${NC}"

# Tạo thư mục cho Certbot challenge
mkdir -p /var/www/certbot

SSL_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"

if [ ! -f "$SSL_PATH" ]; then
    echo -e "  ${YELLOW}⏳ Chưa phát hiện chứng chỉ SSL. Đang tạo cấu hình Nginx Bootstrap (HTTP-only) để xin cấp SSL...${NC}"
    
    # Tạo cấu hình tạm thời chỉ chạy cổng 80 để xin SSL
    cat <<EOF > /etc/nginx/sites-available/api.proxijob.io.vn
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 "ProxiJob Bootstrapping...";
        add_header Content-Type text/plain;
    }
}
EOF

    # Kích hoạt cấu hình tạm thời
    ln -sf /etc/nginx/sites-available/api.proxijob.io.vn /etc/nginx/sites-enabled/api.proxijob.io.vn
    rm -f /etc/nginx/sites-enabled/default
    
    # Reload Nginx
    systemctl reload nginx
    
    echo -e "  ${YELLOW}📝 Đang xin chứng chỉ Let's Encrypt cho $DOMAIN...${NC}"
    certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Lỗi xin cấp SSL! Hãy chắc chắn tên miền $DOMAIN đã trỏ về IP 180.93.59.204.${NC}"
        echo -e "${RED}Hãy chạy lại lệnh này sau khi sửa DNS: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN${NC}"
        exit 1
    fi
    echo -e "  ✅ SSL certificate đã được cấp thành công!"
fi

# Copy cấu hình Nginx chính thức (đã bật sẵn cấu hình SSL)
echo -e "  ${YELLOW}⚙️ Đang cấu hình Nginx API Gateway chính thức...${NC}"
cp "$PROJECT_DIR/deploy/nginx/api.proxijob.io.vn.conf" /etc/nginx/sites-available/api.proxijob.io.vn
ln -sf /etc/nginx/sites-available/api.proxijob.io.vn /etc/nginx/sites-enabled/api.proxijob.io.vn

# Test cấu hình Nginx chính thức
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Cấu hình Nginx Gateway chính thức có lỗi! Vui lòng kiểm tra lại.${NC}"
    exit 1
fi

# Reload Nginx áp dụng cấu hình chính thức
systemctl reload nginx
echo -e "  ✅ Nginx API Gateway (HTTPS) đã hoạt động!"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║               🎉 DEPLOYMENT HOÀN TẤT! 🎉              ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║  🌐 API Gateway:  https://api.proxijob.io.vn           ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║  📖 Swagger UI:                                        ║${NC}"
echo -e "${CYAN}║    Identity: https://api.proxijob.io.vn/swagger        ║${NC}"
echo -e "${CYAN}║    Job:      https://api.proxijob.io.vn/job/swagger    ║${NC}"
echo -e "${CYAN}║    Mgmt:     https://api.proxijob.io.vn/management/swagger${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║  🐰 RabbitMQ:  http://180.93.59.204:15672              ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║  📱 Mobile Base URL:                                   ║${NC}"
echo -e "${CYAN}║    https://api.proxijob.io.vn                          ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================
# Kiểm tra nhanh API
# ==============================================
echo -e "${GREEN}━━━ Quick Health Check ━━━${NC}"
echo ""

# Test Identity API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5231/swagger/index.html 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ✅ Identity API (port 5231): OK"
else
    echo -e "  ⚠️  Identity API (port 5231): HTTP $HTTP_CODE"
fi

# Test Job API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5021/swagger/index.html 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ✅ Job API (port 5021): OK"
else
    echo -e "  ⚠️  Job API (port 5021): HTTP $HTTP_CODE"
fi

# Test Management API
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5057/swagger/index.html 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ✅ Management API (port 5057): OK"
else
    echo -e "  ⚠️  Management API (port 5057): HTTP $HTTP_CODE"
fi

echo ""
echo -e "${GREEN}🚀 Hệ thống ProxiJob đã sẵn sàng phục vụ!${NC}"
echo -e "${YELLOW}📱 Thông báo cho Dev Mobile cập nhật Base URL:${NC}"
echo -e "${YELLOW}   IDENTITY: https://api.proxijob.io.vn/api${NC}"
echo -e "${YELLOW}   JOB:      https://api.proxijob.io.vn/api${NC}"
echo -e "${YELLOW}   MGMT:     https://api.proxijob.io.vn/api${NC}"
echo ""
