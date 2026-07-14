# HƯỚNG DẪN CẤU HÌNH ĐĂNG NHẬP GOOGLE CHO PROXIJOB

## ⚠️ QUAN TRỌNG: Người quản lý Google Cloud Console cần làm 3 việc sau

Tất cả 3 bước dưới đây **bắt buộc** phải thực hiện trên trang [Google Cloud Console](https://console.cloud.google.com) của dự án chứa Client ID `761339432164-...`. Không có thay đổi code nào có thể thay thế được.

---

### BƯỚC 1: Cấu hình OAuth Consent Screen (Màn hình đồng ý)

1. Vào **APIs & Services** → **OAuth consent screen**
2. Kiểm tra trạng thái:
   - Nếu đang ở trạng thái **Testing**: Nhấn **ADD USERS** và thêm email `congloc313@gmail.com` (và các email khác cần test) vào danh sách Test Users
   - HOẶC nhấn **PUBLISH APP** để chuyển sang trạng thái **In Production** (cho phép tất cả tài khoản Google đăng nhập)

### BƯỚC 2: Thêm Authorized Redirect URI vào Web Client ID

1. Vào **APIs & Services** → **Credentials**
2. Tìm và nhấp vào **OAuth 2.0 Client ID** loại **Web Application** (cái có ID bắt đầu bằng `761339432164-...`)
3. Trong phần **Authorized redirect URIs**, nhấn **ADD URI** và thêm:
   ```
   https://api.proxijob.io.vn/api/auth/google-callback
   ```
4. Nhấn **Save**

### BƯỚC 3: Tạo Android Client ID (Quan trọng nhất)

1. Vẫn ở trang **Credentials**, nhấn **CREATE CREDENTIALS** → **OAuth client ID**
2. Chọn **Application type**: **Android**
3. Điền thông tin:
   - **Name**: `ProxiJob Android`
   - **Package name**: `vn.io.proxijob`
   - **SHA-1 certificate fingerprint**: `4E:94:5F:88:A9:E4:2D:1E:6E:3E:0F:34:30:28:F9:09:C6:0B:F5:AE`
4. Nhấn **Create**

---

## ✉️ Tin nhắn mẫu gửi cho bạn (Copy & Paste)

> Cậu ơi, cấu hình giúp tớ 3 thứ trên Google Cloud Console của dự án ProxiJob nhé:
>
> **1. OAuth Consent Screen**: Thêm email `congloc313@gmail.com` vào Test Users (hoặc Publish App)
>
> **2. Web Client ID** (cái `761339432164-...`): Thêm redirect URI `https://api.proxijob.io.vn/api/auth/google-callback`
>
> **3. Tạo Android Client ID mới**:
> - Package name: `vn.io.proxijob`
> - SHA-1: `4E:94:5F:88:A9:E4:2D:1E:6E:3E:0F:34:30:28:F9:09:C6:0B:F5:AE`
>
> Làm xong 3 cái này là app tớ đăng nhập Google được liền, không cần sửa code gì thêm!

---

## Kết quả sau khi cấu hình

- **Bước 3 hoàn tất** → App sẽ hiện hộp thoại chọn tài khoản Google native (UX mượt nhất)
- **Bước 2 hoàn tất** → Nếu native thất bại, WebBrowser fallback sẽ hoạt động
- **Bước 1 hoàn tất** → Tài khoản Google của bạn được phép đăng nhập thay vì bị chặn

---

## Các thay đổi code đã thực hiện (Tham khảo)

### Backend (Identity API)
- **appsettings.json**: Thêm cấu hình SMTP để gửi mail OTP (Quên mật khẩu)
- **StudentProfileController.cs**: Sửa lỗi 500 → 404 khi user mới chưa có hồ sơ sinh viên
- **BusinessProfileController.cs**: Sửa lỗi tương tự cho hồ sơ doanh nghiệp
- **AuthController.cs**: Endpoint `google-callback` trả về trang HTML chuyển hướng về app

### Mobile App
- **LoginScreen.js**: Thay WebView bằng WebBrowser bảo mật, sửa redirect URI

---

## Quy trình Deploy

### Tại Local (PowerShell)
```powershell
cd d:\ProxiJob

# Nén code
tar --exclude="node_modules" --exclude="bin" --exclude="obj" --exclude=".git" -czf ProxiJob.tar.gz src deploy docker-compose.yml .env

# Upload lên VPS
scp ProxiJob.tar.gz root@180.93.59.204:/root/ProxiJob/
```

### Tại VPS (SSH)
```bash
cd /root/ProxiJob
tar -xzf ProxiJob.tar.gz

# Deploy Backend
chmod +x deploy/deploy.sh
./deploy/deploy.sh

# Deploy Landing Page
chmod +x deploy/deploy_landing.sh
./deploy/deploy_landing.sh
```
