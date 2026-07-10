# HƯỚNG DẪN CẤP NHẬT CẤU HÌNH & BẢO MẬT ĐĂNG NHẬP GOOGLE

Tài liệu này tổng hợp lại các công việc bạn đã thực hiện sửa đổi trong mã nguồn và hướng dẫn cụ thể những việc người bạn (chủ sở hữu tài khoản Google API) cần làm để hoàn tất việc sửa lỗi đăng nhập bằng Google trên file APK.

---

## PHẦN 1: Những thay đổi bạn đã thực hiện trong Code (Local)

### 1. Cấu hình Backend (Identity API)
* **File chỉnh sửa:** [src/Identity/ProxiJob.Identity.API/appsettings.json](file:///d:/ProxiJob/src/Identity/ProxiJob.Identity.API/appsettings.json)
* **Nội dung:** Đã tích hợp cụm cấu hình gửi mail `SmtpSettings` (Gmail và mật khẩu ứng dụng) mà bạn cung cấp.
* **Mục đích:** Sửa lỗi không gửi được mail OTP khi người dùng chọn tính năng **Quên mật khẩu**.

### 2. Sửa bảo mật Google Login (Mobile App)
* **File chỉnh sửa:** [src/ProxiJob_Mobile/src/screens/LoginScreen.js](file:///d:/ProxiJob/src/ProxiJob_Mobile/src/screens/LoginScreen.js)
* **Nội dung:** 
  * Thay thế WebView nhúng (kém bảo mật, bắt nhập mật khẩu và bị Google chặn) bằng trình duyệt **WebBrowser bảo mật của hệ thống** (`expo-web-browser`).
  * Sửa lỗi hardcode địa chỉ redirect của Expo từ `@anonymous/ProxiJob_Mobile` thành lệnh gọi động `makeRedirectUri({ useProxy: true })` để lấy đúng thông tin dự án thực tế (`@proxijob-team/proxijob-mobile`).
* **Mục đích:** Khi chạy ở bản APK (hoặc bản thử nghiệm), nếu phát sinh lỗi native nó sẽ nhảy sang trình duyệt hệ thống và tự động nhận diện tài khoản Google có sẵn trên máy để đăng nhập luôn, đảm bảo an toàn tuyệt đối.

---

## PHẦN 2: Việc người bạn (Chủ tài khoản Google API) cần làm

Do mã Client ID Google `761339432164-...` được tạo bằng tài khoản Google của bạn của bạn, bạn cần gửi cho họ yêu cầu sau để họ thêm cấu hình:

### ✉️ Nội dung gửi cho bạn của bạn:
> "Cậu truy cập vào trang quản trị **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)** của dự án ProxiJob và thêm cấu hình này giúp tớ nhé:
>
> 1. Bấm nút **Create Credentials** ở trên cùng -> Chọn **OAuth client ID**.
> 2. Chọn **Application type** là **Android**.
> 3. Điền các thông tin sau:
>    * **Package name (Tên gói):** `vn.io.proxijob`
>    * **SHA-1 certificate fingerprint (Mã vân tay SHA-1):** `4E:94:5F:88:A9:E4:2D:1E:6E:3E:0F:34:30:28:F9:09:C6:0B:F5:AE`
> 4. Nhấn **Create** để lưu lại.
>
> *(Lưu ý: Không cần build lại app hay sửa code nữa, chỉ cần thêm mã này trên web Google Console là bản APK của tớ ở điện thoại sẽ tự động đăng nhập Google mượt mà luôn)*"

---

## PHẦN 3: Quy trình nén và Deploy bản mới lên VPS của bạn

Sau khi bạn của bạn đã cấu hình xong trên Google Console, và bạn đã có file APK mới nhất copy vào thư mục [src/ProxiJob_LandingPage/public/Proxijob_version1.apk](file:///d:/ProxiJob/src/ProxiJob_LandingPage/public/Proxijob_version1.apk):

### Bước 1: Thực hiện tại PowerShell máy Local (Windows)
```powershell
# 1. Di chuyển vào thư mục dự án
cd d:\ProxiJob

# 2. Nén toàn bộ mã nguồn sạch (đã loại bỏ thư mục rác)
tar --exclude="node_modules" --exclude="bin" --exclude="obj" --exclude=".git" -czf ProxiJob.tar.gz src deploy docker-compose.yml .env

# 3. Gửi file nén lên VPS qua SCP (Nhập mật khẩu VPS của bạn)
scp ProxiJob.tar.gz root@180.93.59.204:/root/ProxiJob/
```

### Bước 2: Thực hiện trên VPS (Linux)
```bash
# 1. Đăng nhập SSH vào VPS
ssh root@180.93.59.204

# 2. Di chuyển vào thư mục dự án
cd /root/ProxiJob

# 3. Giải nén đè file mới
tar -xzf ProxiJob.tar.gz

# 4. Deploy lại Landing Page để đưa file APK mới lên trang web
chmod +x deploy/deploy_landing.sh
./deploy/deploy_landing.sh
```
