# HƯỚNG DẪN CẤU HÌNH GOOGLE SIGN-IN CHO PRODUCTION

Tài liệu này hướng dẫn cấu hình đăng nhập Google trên mobile app ProxiJob cho bản **production** (APK).

---

## TỔNG QUAN KIẾN TRÚC (Đã cập nhật - KHÔNG còn dùng Expo Proxy)

```
[Mobile App] → [System Browser] → [Google OAuth]
                                        ↓
                              redirect_uri = https://api.proxijob.io.vn/api/auth/google-callback
                                        ↓
                              [Backend HTML page đọc #id_token]
                                        ↓
                              redirect → proxijob://google-callback?id_token=xxx
                                        ↓
                              [App nhận token → gửi POST /api/auth/google]
```

**KHÔNG CÒN** phụ thuộc vào `auth.expo.io` (Expo proxy bên thứ 3).

---

## PHẦN 1: Thay đổi trong Code (Đã thực hiện)

### 1. Mobile - LoginScreen.js
* **File:** [LoginScreen.js](file:///d:/Proxijob/src/ProxiJob_Mobile/src/screens/LoginScreen.js)
* **Đã bỏ:**
  - `expo-auth-session` (proxy `useProxy: true`)
  - `makeRedirectUri({ useProxy: true })` → không còn redirect qua `auth.expo.io`
  - `Google.useAuthRequest` hook
  - Import `react-native-webview` (không cần WebView)
* **Giữ lại:**
  - `expo-web-browser` (`WebBrowser.openAuthSessionAsync`) cho fallback browser flow
  - `@react-native-google-signin/google-signin` cho native sign-in (ưu tiên #1)

### 2. Backend - AuthController.cs  
* **File:** [AuthController.cs](file:///d:/Proxijob/src/Identity/ProxiJob.Identity.API/Controllers/AuthController.cs)
* **Thêm mới:** Endpoint `GET /api/auth/google-callback`
  - Nhận redirect từ Google OAuth (id_token ở URL fragment)
  - Serve HTML page đọc fragment và redirect về `proxijob://google-callback?id_token=xxx`
  - Mobile app bắt redirect này và lấy token

### 3. EAS Build Config
* **File:** [eas.json](file:///d:/Proxijob/src/ProxiJob_Mobile/eas.json)
* **Thêm:** Profile `production` với `buildType: "apk"` và env variables

---

## PHẦN 2: Cấu hình Google Cloud Console (BẠN CẦN LÀM)

### Bước 1: Kiểm tra OAuth Client ID hiện tại

1. Truy cập [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Tìm Client ID: `761339432164-gbh4o77gocarke99gj3vk38tb9bkculi`
3. Kiểm tra **Application type** của nó (Web / Android / iOS)

### Bước 2: Cấu hình theo loại Client ID

#### Nếu Client ID hiện tại là loại **"Web application"**:
- Vào phần **Authorized redirect URIs**
- Thêm: `https://api.proxijob.io.vn/api/auth/google-callback`
- Nhấn **Save**

#### Nếu Client ID hiện tại là loại **"Android"**:
- Bạn cần tạo thêm 1 **Web application** Client ID:
  1. Bấm **Create Credentials** → **OAuth client ID**
  2. Chọn **Application type** = **Web application**
  3. Đặt tên: `ProxiJob Web (for mobile OAuth)`
  4. Thêm **Authorized redirect URIs**: `https://api.proxijob.io.vn/api/auth/google-callback`
  5. Nhấn **Create**
  6. **Copy Client ID mới** và gửi lại cho tôi để update trong code

### Bước 3: Tạo Android OAuth Client ID (cho Native Sign-In)

Tạo thêm 1 OAuth Client ID loại **Android** (nếu chưa có):
1. Bấm **Create Credentials** → **OAuth client ID**
2. Chọn **Application type** = **Android**
3. Điền:
   - **Package name:** `vn.io.proxijob`
   - **SHA-1 certificate fingerprint (Debug):** `E4:A9:49:03:47:36:C6:13:46:F6:2A:6C:BF:47:69:69:AC:B2:C7:72`
4. Nhấn **Create**

> **LƯU Ý:** SHA-1 ở trên là từ **debug keystore** của máy local. Khi build production qua EAS, cần thêm SHA-1 của **production keystore** nữa (xem Phần 3).

---

## PHẦN 3: Lấy SHA-1 Production (cho EAS Build)

### Cách 1: Từ EAS CLI (đề xuất)
```powershell
cd d:\Proxijob\src\ProxiJob_Mobile

# Đăng nhập EAS (nếu chưa)
npx eas-cli login

# Xem credentials (sẽ hiển thị SHA-1 production keystore)
npx eas-cli credentials -p android
```

### Cách 2: Từ file APK đã build
```powershell
# Nếu đã có file APK, dùng apksigner:
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\34.0.0\apksigner.bat" verify --print-certs .\Proxijob_version1.apk 2>&1 | Select-String "SHA-1"
```

### Cách 3: Build production rồi xem
```powershell
# Build production APK
npx eas-cli build -p android --profile production

# Sau khi build xong, xem SHA-1
npx eas-cli credentials -p android
```

**Sau khi có SHA-1 production**, vào Google Console → Android Client ID → thêm SHA-1 mới.

---

## PHẦN 4: Test Production

### Build APK Production
```powershell
cd d:\Proxijob\src\ProxiJob_Mobile
npx eas-cli build -p android --profile production
```

### Kiểm tra luồng đăng nhập
1. Cài APK production lên điện thoại
2. Bấm **"Tiếp tục với Google"**
3. Chọn vai trò (Sinh viên / Chủ quán)
4. Browser hệ thống mở ra → Chọn tài khoản Google
5. Tự redirect về app → Đăng nhập thành công

### Checklist xác nhận
- [ ] Không có redirect qua `auth.expo.io`
- [ ] Browser mở trực tiếp Google OAuth
- [ ] Redirect về `https://api.proxijob.io.vn/api/auth/google-callback`
- [ ] Tự chuyển về app ProxiJob (scheme `proxijob://`)
- [ ] Token gửi lên backend thành công
- [ ] User được tạo/đăng nhập đúng vai trò

---

## PHẦN 5: Deploy lên VPS

### Bước 1: Nén và gửi lên VPS
```powershell
cd d:\ProxiJob

# Nén mã nguồn
tar --exclude="node_modules" --exclude="bin" --exclude="obj" --exclude=".git" -czf ProxiJob.tar.gz src deploy docker-compose.yml .env

# Gửi lên VPS
scp ProxiJob.tar.gz root@180.93.59.204:/root/ProxiJob/
```

### Bước 2: Deploy trên VPS
```bash
ssh root@180.93.59.204
cd /root/ProxiJob
tar -xzf ProxiJob.tar.gz

# Deploy Identity API (để endpoint google-callback hoạt động)
chmod +x deploy/deploy_identity.sh
./deploy/deploy_identity.sh

# Deploy Landing Page (để cập nhật APK mới)
chmod +x deploy/deploy_landing.sh
./deploy/deploy_landing.sh
```

---

## THÔNG TIN SHA-1

| Loại | SHA-1 | Ghi chú |
|------|-------|---------|
| **Debug keystore** | `E4:A9:49:03:47:36:C6:13:46:F6:2A:6C:BF:47:69:69:AC:B2:C7:72` | Máy local (Windows) |
| **Production (EAS)** | _Cần chạy `eas credentials`_ | Keystore do EAS quản lý |
| **SHA-1 cũ (guide cũ)** | `4E:94:5F:88:A9:E4:2D:1E:6E:3E:0F:34:30:28:F9:09:C6:0B:F5:AE` | ⚠️ Không dùng nữa |
