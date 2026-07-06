# 🚀 ProxiJob - Chuẩn Bị Deploy VPS (Changelog)

> **Ngày thực hiện:** 06/07/2026  
> **Mục tiêu:** Chuẩn bị toàn bộ cấu hình production để deploy ProxiJob Microservices lên VPS `180.93.59.204` với domain `api.proxijob.io.vn`

---

## 📁 Danh sách files đã thay đổi

### 1. `docker-compose.yml` — ĐÃ SỬA

**Trước:** Cấu hình cơ bản cho Development, không có restart policy, không health check.

**Sau:** Production-ready với các thay đổi:

```diff
  services:
    rabbitmq:
+     restart: unless-stopped
+     healthcheck:
+       test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
+       interval: 30s
+       timeout: 10s
+       retries: 5
+       start_period: 30s
+     deploy:
+       resources:
+         limits:
+           memory: 512M
+     logging:
+       driver: "json-file"
+       options:
+         max-size: "10m"
+         max-file: "3"

    identity-api:
-     - ASPNETCORE_ENVIRONMENT=Development
+     - ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT:-Production}
+     - JwtSettings__SecretKey=${JWT_SECRET_KEY}
+     - PaymentSettings__PublicBaseUrl=${PUBLIC_BASE_URL}
+     - Identity__PublicBaseUrl=${PUBLIC_BASE_URL}
+     restart: unless-stopped
+     healthcheck: ...
+     deploy: resources: limits: memory: 512M
+     logging: ...

    job-api:
-     - ASPNETCORE_ENVIRONMENT=Development
+     - ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT:-Production}
+     restart: unless-stopped
+     healthcheck: ...
+     deploy: resources: limits: memory: 512M

    management-api:
-     - ASPNETCORE_ENVIRONMENT=Development
+     - ASPNETCORE_ENVIRONMENT=${ASPNETCORE_ENVIRONMENT:-Production}
+     restart: unless-stopped
+     healthcheck: ...
+     deploy: resources: limits: memory: 512M
```

**Lý do:**
- `restart: unless-stopped` → Container tự khởi động lại khi VPS reboot hoặc crash
- `healthcheck` → Docker tự kiểm tra service có sống không, restart nếu chết
- `memory: 512M` → Giới hạn RAM tránh 1 service "ăn" hết RAM của VPS
- `logging max-size: 10m` → Log file tự xoay, không đầy ổ cứng
- `ASPNETCORE_ENVIRONMENT=Production` → .NET 8 sẽ đọc `appsettings.Production.json`

---

### 2. `.env` — ĐÃ SỬA

**Trước:**
```env
SUPABASE_CONNECTION_STRING=Host=aws-1-ap-southeast-1.pooler.supabase.com;...
RABBITMQ_DEFAULT_USER=guest
RABBITMQ_DEFAULT_PASS=guest
```

**Sau:**
```diff
+ ASPNETCORE_ENVIRONMENT=Production
+ PUBLIC_BASE_URL=https://api.proxijob.io.vn

  SUPABASE_CONNECTION_STRING=Host=aws-1-ap-southeast-1.pooler.supabase.com;...

- RABBITMQ_DEFAULT_USER=guest
- RABBITMQ_DEFAULT_PASS=guest
+ RABBITMQ_DEFAULT_USER=proxijob_admin
+ RABBITMQ_DEFAULT_PASS=Pr0x1J0b@RabbitMQ2026!

+ JWT_SECRET_KEY=ProxiJob_Hyperlocal_Employment_Platform_SecretKey_2026_SE184400!
```

**Lý do:**
- `guest/guest` là credentials mặc định, bất kỳ ai cũng biết → đổi sang `proxijob_admin` với password mạnh
- JWT Secret Key mặc định quá yếu → đổi sang key 64+ ký tự liên quan đến ProxiJob
- Thêm `PUBLIC_BASE_URL` để các service biết domain production

---

### 3. `appsettings.Production.json` — TẠO MỚI (x3 files)

**Files tạo mới:**
- `src/Identity/ProxiJob.Identity.API/appsettings.Production.json`
- `src/Job/ProxiJob.Job.API/appsettings.Production.json`
- `src/Management/ProxiJob.Management.API/appsettings.Production.json`

**Nội dung chính (Identity - đầy đủ nhất):**
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",           // Chỉ log Warning trở lên (giảm noise)
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning",
      "MassTransit": "Warning"
    }
  },
  "JwtSettings": {
    "SecretKey": "ProxiJob_Hyperlocal_..._SE184400!",
    "AccessTokenExpirationMinutes": 120,  // Tăng từ 60 → 120 phút
    "RefreshTokenExpirationDays": 14      // Tăng từ 7 → 14 ngày
  },
  "PaymentSettings": {
    "PublicBaseUrl": "https://api.proxijob.io.vn"  // Thay localhost
  },
  "Identity": {
    "PublicBaseUrl": "https://api.proxijob.io.vn"  // Thay localhost
  },
  "GrpcServices": {
    "Identity": "http://identity-api:5232"  // Docker internal network hostname
  }
}
```

**Lý do:**
- .NET 8 tự đọc file `appsettings.{Environment}.json` theo biến `ASPNETCORE_ENVIRONMENT`
- Khi đặt `Production`, nó merge `appsettings.json` + `appsettings.Production.json`
- Override các URL `localhost` → domain production hoặc Docker network hostname
- GrpcServices dùng `identity-api` (tên container) thay vì `localhost` vì các service chạy trong Docker network

---

### 4. `.dockerignore` — ĐÃ SỬA

**Trước:** 10 dòng cơ bản

**Sau:** Thêm nhiều exclusion:
```diff
  **/.git
  **/.github
  **/.vs
  **/.idea
  **/bin
  **/obj
  **/node_modules
  **/out
  **/dist
  **/.env
+ **/docs
+ **/images
+ **/*.md
+ **/stitch_proxijob_hyperlocal_employment_suite*
+ **/DbSequenceFixTemp
+ **/src/ProxiJob_Mobile
+ **/src/ProxiJob_Client
+ **/package.json
+ **/package-lock.json
+ **/run_backend.ps1
+ **/.agents
```

**Lý do:**
- Docker `build context` bao gồm TOÀN BỘ thư mục project khi build
- Mobile app (~100MB node_modules), docs, images hoàn toàn không cần khi build .NET
- Giảm từ ~500MB+ xuống còn ~50MB context → build nhanh hơn nhiều trên VPS

---

### 5. `deploy/nginx/api.proxijob.io.vn.conf` — TẠO MỚI

**Mô tả:** Cấu hình Nginx làm API Gateway / Reverse Proxy

**Routing map:**
```
Mobile App
   │
   ▼ HTTPS (443)
┌──────────────────────────────────────────────┐
│         Nginx (api.proxijob.io.vn)           │
│                                              │
│  /api/auth/*        → Identity API (:5231)   │
│  /api/student/*     → Identity API (:5231)   │
│  /api/plans/*       → Identity API (:5231)   │
│  /api/payments/*    → Identity API (:5231)   │
│  /api/business-profile/* → Identity (:5231)  │
│  /api/messages/*    → Identity API (:5231)   │
│  /api/public-cv/*   → Identity API (:5231)   │
│  /hub/chat          → Identity WS  (:5231)   │
│                                              │
│  /api/job-posts/*   → Job API      (:5021)   │
│  /api/shifts/*      → Job API      (:5021)   │
│  /api/applications/* → Job API     (:5021)   │
│  /api/categories/*  → Job API      (:5021)   │
│  /api/skills/*      → Job API      (:5021)   │
│                                              │
│  /api/employees/*   → Management   (:5057)   │
│  /api/timekeeping/* → Management   (:5057)   │
│  /api/qr-code/*     → Management   (:5057)   │
│  /api/schedules/*   → Management   (:5057)   │
│  /api/payrolls/*    → Management   (:5057)   │
└──────────────────────────────────────────────┘
```

**Tính năng:**
- HTTP → HTTPS redirect tự động
- WebSocket support cho SignalR Chat Hub
- Security headers (X-Frame-Options, X-XSS-Protection...)
- Upload file limit 20MB
- Health check endpoint `/health`

---

### 6. `deploy/deploy.sh` — TẠO MỚI

**Mô tả:** Script tự động deploy 5 bước trên VPS

| Bước | Hành động |
|------|-----------|
| 1 | Kiểm tra Docker đã cài chưa |
| 2 | Cài đặt Nginx + Certbot |
| 3 | `docker compose build` + `docker compose up -d` |
| 4 | Copy Nginx config → `/etc/nginx/sites-available/` → reload |
| 5 | `certbot --nginx -d api.proxijob.io.vn` → SSL tự động |

**Cách dùng:**
```bash
ssh root@180.93.59.204
cd /root/ProxiJob
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

---

### 7. `src/ProxiJob_Mobile/src/api/apiConfig.js` — ĐÃ SỬA

**Trước:** Luôn dùng localhost + port riêng cho mỗi service

**Sau:** Tự động detect môi trường:

```diff
+ const PRODUCTION_API_BASE_URL = 'https://api.proxijob.io.vn/api';
+ const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

- export const IDENTITY_API_BASE_URL = Platform.OS === 'web' 
-   ? 'http://localhost:5231/api' 
-   : `http://${hostIp}:5231/api`;
+ export const IDENTITY_API_BASE_URL = isDev
+   ? (Platform.OS === 'web' ? 'http://localhost:5231/api' : `http://${hostIp}:5231/api`)
+   : PRODUCTION_API_BASE_URL;

  // Tương tự cho JOB_API_BASE_URL và MANAGEMENT_API_BASE_URL
```

**Lý do:**
- Khi dev (`__DEV__ = true`): giữ nguyên localhost + port riêng → chạy local bình thường
- Khi build release (`__DEV__ = false`): tất cả 3 services đều gọi qua 1 domain `https://api.proxijob.io.vn/api`
- Nginx sẽ tự route đến đúng service dựa vào URL path

---

## 📱 Sau khi deploy xong

Mobile app **KHÔNG CẦN** thay đổi gì thêm! Khi build release APK/IPA, app sẽ tự động dùng production URL `https://api.proxijob.io.vn/api`.
