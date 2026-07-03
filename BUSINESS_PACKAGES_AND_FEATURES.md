# BẢN ĐỒ CÁC GÓI SUBSCRIPTION VÀ TÍNH NĂNG NGHIỆP VỤ DOANH NGHIỆP (B2B SUBSCRIPTIONS & FEATURES)

Tài liệu này tập trung mô tả chi tiết hệ thống **Gói cước (B2B Subscription Plans)** hiện tại, cách kiểm soát tính năng nghiệp vụ của doanh nghiệp (Business Features) thông qua Subscription, và đề xuất định hình lại các gói cước để giải quyết vấn đề thiếu hụt/bất hợp lý của tính năng trong các gói hiện tại.

---

## I. CẤU TRÚC CHI TIẾT CÁC GÓI SUBSCRIPTION HIỆN TẠI
Trong mã nguồn hiện tại (cụ thể tại [IdentityDataSeeder.cs](file:///d:/ProxiJob/src/Identity/ProxiJob.Identity.Infrastructure/Data/IdentityDataSeeder.cs) và model [Subscription.cs](file:///d:/ProxiJob/src/Identity/ProxiJob.Identity.Domain/Models/Subscription.cs)), các gói Subscription được định nghĩa gồm các thông số kỹ thuật sau:

### 1. Định nghĩa các trường dữ liệu của Gói (Subscription Schema)
*   `Name`: Tên gói cước (`Trial`, `PerShift`, `Basic`, `Standard`, `Premium`).
*   `Price`: Giá tiền của gói (VND).
*   `BillingType`: Hình thức thanh toán (`PerShift` - thanh toán theo ca đăng, `Monthly` - thanh toán theo tháng).
*   `JobPostLimit`: Giới hạn số lượng tin tuyển dụng được đăng trong chu kỳ gói.
*   `DurationDays`: Số ngày hiệu lực của gói.
*   `HasPriorityDisplay` (Ưu tiên hiển thị): Tin tuyển dụng của gói này sẽ được đẩy lên đầu radar tìm kiếm của sinh viên.
*   `HasHrManagement` (Quản lý nhân sự): Mở khóa các tính năng quản lý lịch làm việc, chấm công và bảng lương.

### 2. Thông số chi tiết các Gói hiện tại trong hệ thống

| Tên Gói (`SubscriptionName`) | Đơn giá (VND) | Hạn dùng (Ngày) | Giới hạn đăng tin (`JobPostLimit`) | Quyền Ưu tiên hiển thị (`HasPriorityDisplay`) | Quyền Quản lý nhân sự (`HasHrManagement`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Trial** (Mặc định) | 0 đ | Vô hạn | **3 tin đăng** | ❌ Không | ❌ Không |
| **PerShift** (Đăng lẻ) | 15.000 đ | 1 | **1 tin đăng** | ❌ Không | ❌ Không |
| **Basic** | 99.000 đ | 30 | **15 tin đăng** | ❌ Không | ❌ Không |
| **Standard** | 199.000 đ | 30 | **999 tin đăng** | ❌ Không | ❌ Không |
| **Premium** | 299.000 đ | 30 | **999 tin đăng** | ✅ Có | ✅ Có |

> [!NOTE]
> *   **Gói Trial**: Áp dụng tự động cho tài khoản doanh nghiệp mới tạo để đăng thử tối đa 3 tin (giới hạn định nghĩa ở `BusinessQuotaConstants.FreeTrialJobPostLimit`).
> *   **Gói Premium**: Là gói duy nhất hiện tại cho phép mở khóa các tính năng quản lý nhân sự chuyên sâu (HRM), điểm danh và tính lương.

---

## II. BẢN ĐỒ TÍNH NĂNG NGHIỆP VỤ DOANH NGHIỆP HIỆN TẠI & PHÂN BỔ TRÊN SUBSCRIPTION
Dưới đây là chi tiết tất cả các tính năng nghiệp vụ mà một tài khoản doanh nghiệp có thể thực hiện trên hệ thống, kèm theo trạng thái ánh xạ gói cước hiện tại:

### 1. Phân hệ Tuyển dụng & Đăng tin (Recruitment Module)
*   **Tạo tin tuyển dụng kèm ca làm việc (Job Shifts)**:
    *   *Mô tả:* Nhập tiêu đề, vị trí, yêu cầu kỹ năng, mô tả công việc và tạo các ca làm việc (Shifts) cụ thể (giờ bắt đầu/kết thúc, mức lương theo giờ, số lượng cần tuyển).
    *   *Kiểm soát gói:* Cho phép ở tất cả các gói (bao gồm cả Trial). Tổng số lượng tin đăng được kiểm soát qua `JobPostQuotaService.cs`.
*   **Phê duyệt & Từ chối đơn ứng tuyển (Applications)**:
    *   *Mô tả:* Xem danh sách sinh viên ứng tuyển vào từng ca, xem Portfolio của họ và chọn Duyệt (Approve) hoặc Từ chối (Reject).
    *   *Quy tắc nghiệp vụ:* Duyệt đơn ứng tuyển sẽ trừ 1 slot còn trống của ca làm việc. Nếu slots về 0, toàn bộ đơn ứng tuyển pending khác của ca đó sẽ tự động bị từ chối (`Auto-Reject`).
    *   *Kiểm soát gói:* Hoạt động trên mọi gói.

### 2. Phân hệ Quản lý Nhân sự (HRM Module)
> [!IMPORTANT]
> Toàn bộ các tính năng dưới đây về mặt nghiệp vụ thuộc về **Management Service** và hiện tại chỉ được mở khóa khi doanh nghiệp mua gói **Premium** (`HasHrManagement == true`).

*   **Quản lý Danh sách Nhân sự**:
    *   *Mô tả:* Xem danh sách nhân viên của cơ sở, phân loại thành:
        1.  *Nhân viên cố định (Internal Staff):* Nhân sự làm việc lâu dài do chủ quán tự thêm.
        2.  *Nhân viên ca lẻ (Vãng lai - External/On-Demand Workers):* Tự động liên kết khi phê duyệt đơn ứng tuyển của sinh viên từ Job Service.
*   **Lên lịch làm việc (Work Schedule)**:
    *   *Mô tả:* Phân lịch làm việc theo ngày cho nhân viên. Hệ thống tự động ngăn chặn nếu phát hiện lịch trực trùng giờ (overlapping schedules) của nhân viên đó.
*   **Cấu hình vùng chấm công (Geofencing QR)**:
    *   *Mô tả:* Tạo mã QR chấm công duy nhất có thời hạn và thiết lập tọa độ (Latitude, Longitude) kèm bán kính an toàn cho phép điểm danh (Allowed Radius - mặc định 100m).
*   **Bản đồ Radar Giám sát Chấm công (GPS Live Radar)**:
    *   *Mô tả:* Bản đồ định vị hiển thị chấm xanh (Vùng an toàn) và chấm đỏ (Vùng nghi vấn) của nhân viên khi thực hiện điểm danh ra/vào ca.
    *   *Kiểm soát gói:* Hệ thống đánh dấu trạng thái chấm công là `Suspicious` nếu vượt quá bán kính cấu hình, chủ quán có thể phê duyệt hoặc bác bỏ thủ công.
*   **Tính toán & Xác nhận quyết toán lương (Payroll & Payout Tracking)**:
    *   *Mô tả:* Tổng hợp giờ công thực tế dựa trên dữ liệu Check-in/Check-out của nhân viên để tính toán bảng lương chi tiết.
    *   *Quy tắc nghiệp vụ:* Cho phép chủ quán thêm tiền thưởng hoặc tiền phạt (Adjustment), đính kèm ảnh chụp biên lai giao dịch chuyển khoản bên ngoài (`TransactionPhoto` - ví dụ như ảnh chụp bill ngân hàng/ví điện tử) và chốt trạng thái bảng lương là đã thanh toán (`Status = Paid`) để hiển thị theo dõi trên Dashboard. Tính năng này chỉ dùng để ghi nhận và đối chiếu công nợ lương, không trực tiếp thực hiện giao dịch chuyển tiền điện tử qua tài khoản ngân hàng/MoMo thật.

---

## III. NHỮNG TÍNH NĂNG CÒN THIẾU HOẶC CHƯA HỢP LÝ TRÊN CÁC GÓI HIỆN TẠI
Qua rà soát mã nguồn, cấu trúc gói cước Subscription hiện tại đang gặp một số **bất cập và thiếu sót**:

1.  **Khoảng cách quá lớn giữa Standard (199k) và Premium (299k)**:
    *   Gói Standard cho phép đăng không giới hạn tin (999 tin/tháng) nhưng hoàn toàn không có bất kỳ tính năng quản lý nhân sự hay chấm công nào.
    *   Chỉ cần thêm 100.000 đ nâng lên Premium, doanh nghiệp vừa được đăng tin không giới hạn, vừa được ưu tiên hiển thị, vừa có trọn bộ HRM/Timekeeping/Payroll cho không giới hạn nhân viên.
2.  **Thiếu giới hạn số lượng nhân viên quản lý (Employee Limit)**:
    *   Gói Premium hiện tại cho phép quản lý **không giới hạn nhân viên cố định**. Điều này không tối ưu doanh thu đối với các chuỗi cửa hàng hoặc quán lớn có hàng trăm nhân sự.
3.  **Thiếu giới hạn số lượng mã QR Code chấm công / Chi nhánh**:
    *   Chưa có cơ chế giới hạn số lượng QR Code chấm công hoạt động cùng lúc. Doanh nghiệp có thể tạo bao nhiêu mã QR chấm công tùy ý, dẫn đến việc quản lý nhiều chi nhánh "lậu" trên cùng một gói giá rẻ.
4.  **Hồ sơ quyết toán lương (Payroll Transaction Tracking)**:
    *   Hệ thống cho phép lưu ảnh chụp giao dịch (`TransactionPhoto`) khi chủ quán xác nhận đã thanh toán lương cho nhân viên. Điều này chỉ mang tính chất ghi nhận trên Dashboard để đối chiếu công nợ chứ chưa tích hợp tự động qua các cổng thanh toán ngân hàng hay ví điện tử thật.

---

## IV. BẢN THẢO XÂY DỰNG LẠI CÁC GÓI SUBSCRIPTION (RESTRUCTURING PROPOSAL)

Để giải quyết các vấn đề trên, dưới đây là bản thảo tái cấu trúc lại các gói Subscription hợp lý hơn, tối ưu hóa giá trị thương mại:

### 1. Bảng ma trận Gói cước mới đề xuất

| Thông số / Quyền hạn | Trial (Miễn phí) | Gói Tuyển Dụng (Recruit) | Gói Quản Lý (HRM Basic) | Gói Toàn Diện (Enterprise) |
| :--- | :---: | :---: | :---: | :---: |
| **Mục tiêu hướng tới** | Trải nghiệm thử | Quán nhỏ tự vận hành | Quán trung bình có quy trình | Chuỗi cửa hàng lớn |
| **Giá tiền (Đề xuất)** | 0 đ | 99.000 đ / tháng | 249.000 đ / tháng | 499.000 đ / tháng |
| **Giới hạn đăng tin / tháng** | 3 tin | **30 tin** | ❌ Không hỗ trợ | **Không giới hạn** |
| **Số nhân viên tối đa** | ❌ Không hỗ trợ | ❌ Không hỗ trợ | **Tối đa 15 nhân viên** | **Không giới hạn** |
| **Số mã QR Chấm công active** | ❌ Không | ❌ Không | **1 mã QR** | **Nhiều chi nhánh / Nhiều QR** |
| **Hiển thị ưu tiên (Priority)** | ❌ Không | ❌ Không | ❌ Không | ✅ Có |
| **Quyết toán lương (Xác nhận & lưu bill)** | ❌ Không | ❌ Không | ✅ Hỗ trợ (Dashboard) | ✅ Hỗ trợ (Dashboard) |

### 2. Các thay đổi cần thực hiện trong mã nguồn để áp dụng gói mới:

*   **Bước 1: Cập nhật Cấu trúc DB và Constants**:
    *   Bổ sung các trường giới hạn vào model `Subscription` tại [Subscription.cs](file:///d:/ProxiJob/src/Identity/ProxiJob.Identity.Domain/Models/Subscription.cs):
        *   `MaxEmployees`: Giới hạn số nhân viên quản lý.
        *   `MaxActiveQrs`: Giới hạn số mã QR hoạt động cùng lúc.
    *   Cập nhật lại seeder dữ liệu các gói tại [IdentityDataSeeder.cs](file:///d:/ProxiJob/src/Identity/ProxiJob.Identity.Infrastructure/Data/IdentityDataSeeder.cs).
*   **Bước 2: Triển khai Middleware kiểm soát quyền tại Management API**:
    *   Viết Authorization Filter kiểm tra thông tin Subscription từ JWT Claim gửi kèm. Nếu user gọi API quản lý nhân sự nhưng gói không có quyền `HasHrManagement` hoặc vượt quá `MaxEmployees` đã cấu hình, trả về lỗi `403 Forbidden`.
*   **Bước 3: Validate số lượng khi tạo Nhân viên/QR Code**:
    *   Trong `CreateEmployeeCommandHandler`, đếm số lượng nhân viên hiện tại của quán. Nếu `count >= maxEmployees`, ném lỗi ngoại lệ ngăn chặn tạo mới.
    *   Trong `GenerateQrCodeCommandHandler`, đếm số lượng QR Code đang kích hoạt (`IsActive == true`). Nếu vượt quá `MaxActiveQrs` của gói, từ chối tạo QR mới.
