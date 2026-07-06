# 📘 Hướng Dẫn Tổng Hợp: Quy Trình Deploy Backend VPS & Xuất File APK Mobile

Dự án: **ProxiJob - Hyperlocal Employment Platform**  
Ngày cập nhật: **06/07/2026**

---

## 🗺️ 1. Mô Hình Kiến Trúc Hệ Thống (Production)

Hệ thống được cấu hình chạy trên **VPS IP: 180.93.59.204** sử dụng **Domain: api.proxijob.io.vn**.

```
                           [ 📱 Mobile App (APK) ]
                                      │
                                      ▼ HTTPS (Cổng 443)
                      ┌────────────────────────────────┐
                      │    Nginx (api.proxijob.io.vn)  │ (Môi trường VPS)
                      └───────────────┬────────────────┘
                                      │ (Proxy nội bộ)
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  🔐 Identity Service │   │    💼 Job Service    │   │  📋 Management API   │
│      (Cổng 5231)     │   │      (Cổng 5021)     │   │      (Cổng 5057)     │
└──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘
           │ (gRPC :5232)             │                          │
           └───────────┬──────────────┴──────────────────────────┘
                       ▼
            [ 🐰 RabbitMQ (Cổng 5672) ]
                       │
                       ▼
          [ ☁️ Supabase Cloud (Postgres) ]
```

---

## 💻 2. Phần 1: Các Bước Đã Triển Khai Backend Lên VPS

### Bước 1: Chuẩn bị Source Code dưới máy local
Chúng ta đã tối ưu hóa mã nguồn .NET 8 trước khi đẩy lên VPS:
* Tạo các file cấu hình `appsettings.Production.json` cho cả 3 microservices để tự động kết nối qua mạng Docker nội bộ.
* Chỉnh sửa file `.dockerignore` loại bỏ các thư mục nặng như `node_modules` của Mobile, tài liệu `docs` để giảm dung lượng file nén khi upload lên VPS từ ~500MB xuống chỉ còn ~50MB.
* Cập nhật file `docker-compose.yml` tối ưu hóa tài nguyên (giới hạn RAM 512MB mỗi container, cấu hình tự động khởi động lại container `unless-stopped`, ghi log xoay vòng chống đầy ổ cứng).

### Bước 2: Tải Source Code lên VPS
Đứng ở máy Windows, mở CMD và chạy lệnh để truyền file:
```bash
scp -r "D:\ProxiJob" root@180.93.59.204:/root/
```

### Bước 3: Cài đặt Docker & Docker Compose trên Ubuntu VPS
SSH vào VPS (`ssh root@180.93.59.204`) và cài đặt môi trường Docker bản chuẩn của Ubuntu:
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-v2
```

### Bước 4: Chạy Kịch Bản Kích Hoạt Tự Động (Nginx + SSL + Docker)
Chúng ta đã viết một deploy script thông minh [deploy.sh](file:///d:/ProxiJob/deploy/deploy.sh) để xử lý lỗi "con gà - quả trứng" khi xin SSL Certbot.
1. Script tạo một Nginx Bootstrap chỉ chạy cổng 80 để Certbot xác thực tên miền.
2. Certbot lấy chứng chỉ SSL thành công và lưu vào thư mục hệ thống.
3. Script ghi đè cấu hình Nginx API Gateway chính thức cổng 443 (HTTPS) sử dụng chứng chỉ bảo mật vừa lấy.
4. Kích hoạt toàn bộ Docker microservices chạy ngầm ổn định.

Lệnh đã chạy trên VPS:
```bash
cd /root/ProxiJob
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

---

## 📱 3. Phần 2: Các Bước Cấu Hình & Xuất File APK Test (Mobile)

### Bước 1: Cấu hình Endpoint Tự Động
* Trong file [apiConfig.js](file:///d:/ProxiJob/src/ProxiJob_Mobile/src/api/apiConfig.js), mã nguồn đã được cấu hình tự động:
  * Khi chạy thử nghiệm ở máy local (`__DEV__ = true`): Gọi API thông qua IP máy tính của bạn dev.
  * Khi build ra file cài đặt APK (`__DEV__ = false`): Tự động chuyển toàn bộ API kết nối về API Gateway HTTPS của VPS `https://api.proxijob.io.vn/api`.
* Cập nhật file [src/ProxiJob_Mobile/.env](file:///d:/ProxiJob/src/ProxiJob_Mobile/.env) trỏ cứng biến môi trường:
  ```env
  EXPO_PUBLIC_API_BASE_URL=https://api.proxijob.io.vn/api
  ```

### Bước 2: Cấu hình `app.json` của Expo
Bổ sung gói package Android và thẻ cập nhật OTA vào file [app.json](file:///d:/ProxiJob/src/ProxiJob_Mobile/app.json) mà không làm ảnh hưởng đến các plugin ảnh/camera có sẵn:
```json
"android": {
  "package": "com.team04.proxijob",
  "softwareKeyboardLayoutMode": "resize",
  "adaptiveIcon": { ... }
},
"updates": {
  "fallbackToCacheTimeout": 0
}
```

### Bước 3: Tạo File Cấu Hình Xuất APK [eas.json](file:///d:/ProxiJob/src/ProxiJob_Mobile/eas.json)
Thiết lập profile `preview` cấu hình kiểu xuất ra file cài đặt `.apk` trực tiếp:
```json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```

### Bước 4: Liên Kết Dự Án Lên Cloud Expo (Thực hiện trên máy local)
Mở Terminal tại thư mục `src/ProxiJob_Mobile` và chạy các lệnh:
1. **Cài đặt công cụ EAS toàn hệ thống:**
   ```bash
   npm install -g eas-cli
   ```
2. **Đăng nhập Expo thông qua trình duyệt:**
   ```bash
   eas login
   ```
3. **Liên kết mã nguồn với dự án trên trang Expo:**
   ```bash
   npx eas-cli@latest init --id b670a2a5-ddd7-4aab-ac0e-ef5bb8b63bbd
   ```
   *(Chọn Đồng ý (y) khi hệ thống hỏi có muốn đồng bộ Project slug thành `proxijob-mobile` không).*

### Bước 5: Ra Lệnh Build Xuất File APK
```bash
eas build --platform android --profile preview
```
*(Đồng ý (y) cho phép hệ thống tạo Android Keystore mới khi được hỏi).*

---

## 🔍 4. Quy Trình Kiểm Thử & Kiểm Tra

Sau khi quá trình biên dịch APK trên Expo hoàn tất, quy trình test sẽ như sau:

### 1. Truy cập Link Web để tải APK
Trên trang quản trị [Expo Dashboard (Builds)](https://expo.dev/accounts/congloc313/projects/proxijob-mobile/builds):
* Chờ lượt build trên cùng chuyển sang trạng thái màu xanh lá cây (**Finished**).
* Dùng điện thoại Android quét mã QR hiển thị trên màn hình để tải file `.apk` về điện thoại cài đặt.

### 2. Kiểm tra tính thông suốt của Backend qua các link Swagger
Truy cập vào các đường dẫn sau từ trình duyệt để chắc chắn các service backend đang chạy tốt:
* 🔐 Identity Service: [https://api.proxijob.io.vn/swagger](https://api.proxijob.io.vn/swagger)
* 💼 Job Service: [https://api.proxijob.io.vn/job/swagger](https://api.proxijob.io.vn/job/swagger)
* 📋 Management Service: [https://api.proxijob.io.vn/management/swagger](https://api.proxijob.io.vn/management/swagger)

### 3. Xem log chạy thực tế trên VPS (Khi test app)
Trong khi test app trên điện thoại (đăng ký, đăng nhập, nộp đơn ứng tuyển), bạn có thể gõ lệnh này trên VPS để theo dõi các API được gọi trong thời gian thực:
```bash
docker compose -f /root/ProxiJob/docker-compose.yml logs -f
```
