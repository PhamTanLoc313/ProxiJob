# 📱 Danh Sách Tính Năng Hiện Có - ProxiJob Mobile App

Tài liệu này tổng hợp toàn bộ các tính năng đã được xây dựng hoàn thiện trên ứng dụng di động **ProxiJob**, phục vụ cho bộ phận Marketing/Truyền thông nắm bắt và lên ý tưởng nội dung. 

Ngôn từ dưới đây được tối giản hóa kỹ thuật, tập trung vào **cách hoạt động** và **khả năng thực tế** của ứng dụng.

---

## 📌 I. Định Vị Nền Tảng & Các Chỉ Số Cam Kết (SLA)
ProxiJob là ứng dụng kết nối việc làm bán thời gian tức thời dựa trên vị trí siêu cục bộ (bán kính dưới 100m). Hệ thống vận hành dựa trên các thông số cam kết cốt lõi:
*   ⚡ **1.2 giây:** Tốc độ ghép ca làm việc giữa sinh viên và chủ quán.
*   📍 **100 mét:** Bán kính an toàn tối đa để quét việc và điểm danh tại chỗ.

---

## 👦 II. Phân Hệ Dành Cho Sinh Viên (Người Tìm Việc)

### 1. Hồ sơ năng lực & Đánh giá xếp hạng sao (E-Portfolio & Star Rating)
*   **Cách hoạt động:** Sinh viên đăng ký tài khoản, cập nhật thông tin cá nhân, trường học, chuyên ngành và các kỹ năng làm việc.
*   **Xếp hạng sao (Star Rating):** Hồ sơ hiển thị điểm đánh giá sao trung bình được tích lũy từ những đánh giá thực tế của các chủ quán sau mỗi ca trực hoàn thành.
*   *Mục đích:* Thay thế CV truyền thống bằng số sao uy tín trực quan. Số sao tích lũy càng cao thì sinh viên càng dễ được các chủ quán tin tưởng duyệt nhận ca tiếp theo.

### 2. Radar tìm việc quanh đây (GPS Job Radar)
*   **Cách hoạt động:** Sử dụng định vị GPS thực tế của thiết bị di động để quét và hiển thị tất cả các ca làm việc bán thời gian đang tuyển dụng trong bán kính gần.
*   **Bộ lọc thông minh:** Cho phép sinh viên lọc công việc theo danh mục (phục vụ, pha chế, kho vận, shipper...) và mức lương mong muốn theo giờ.
*   *Mục đích:* Giúp tìm việc sát sườn nơi ở/học tập, tối ưu hóa thời gian di chuyển (đặc biệt thích hợp cho sinh viên không có xe máy).

### 3. Điểm danh qua định vị và mã QR (GPS & QR Check-in/out)
*   **Cách hoạt động:** 
    *   Hệ thống dùng GPS của điện thoại đối chiếu xem sinh viên có đang đứng trong phạm vi bán kính 100m của quán hay không.
    *   Sinh viên quét mã QR do quán cung cấp trực tiếp tại địa điểm làm việc để điểm danh vào ca (Check-in) và ra ca (Check-out).
*   *Mục đích:* Điểm danh chính xác, nhanh chóng và chống gian lận vị trí hay thời gian làm việc.

### 4. Xác nhận nhận tiền, theo dõi thu nhập & Đánh giá chủ quán (Payment Confirmation, Earnings Tracking & Employer Rating)
*   **Xác nhận nhận tiền (Receipt Confirmation):** Sau khi ca làm việc kết thúc và chủ quán thực hiện chi trả lương bên ngoài, sinh viên sẽ tiến hành xác thực trên app xem mình thực tế đã nhận được tiền lương hay chưa.
*   **Đánh giá chủ quán (Rating & Comments):** Chỉ **sau khi đã xác nhận nhận tiền thành công**, sinh viên mới được mở khóa quyền chấm điểm xếp hạng từ 1 - 5 sao và viết nhận xét đánh giá chủ quán về thái độ ứng xử và môi trường làm việc của quán.
*   **Theo dõi thu nhập:** Xem chi tiết lịch sử ca trực đã làm, số giờ làm thực tế và tổng số tiền tích lũy được theo từng ca làm việc để chủ động kiểm soát tài chính.

---

## 🏪 III. Phân Hệ Dành Cho Chủ Quán (Nhà Tuyển Dụng)

### 1. Trang quản trị doanh nghiệp (Enterprise Dashboard)
*   **Cách hoạt động:** Giao diện quản trị dành riêng cho chủ quán để quản lý thông tin quán, theo dõi các ca trực, cấu hình thông tin hiển thị và bật tắt nhanh các chức năng (Xem gói dịch vụ, Xem thông tin quán, Đóng nhanh/Đăng xuất).

### 2. Trình tạo tin tuyển dụng nhanh (Wizard Job Posting)
*   **Cách hoạt động:** Biểu mẫu điền nhanh để đăng tin tuyển dụng ca làm việc gồm: Tiêu đề, ca trực (thời gian bắt đầu/kết thúc), mức lương theo giờ (ví dụ: 35.000 đ/h) và yêu cầu kỹ năng.
*   **Quản lý tin đăng:** Chủ quán có thể chỉnh sửa nội dung tin đăng hoặc xóa tin đăng trực tiếp từ màn hình danh sách khi đã tuyển đủ người hoặc thay đổi kế hoạch.

### 3. Duyệt ứng viên tức thời (Applicant Matching & Approval)
*   **Cách hoạt động:** Chủ quán xem danh sách các đơn ứng cử của sinh viên gửi tới ca trực, click xem nhanh Hồ sơ (E-Portfolio) và số sao đánh giá của sinh viên để bấm Duyệt (Approve) hoặc Từ chối (Reject).
*   **Tự động từ chối (Auto-Reject):** Khi ca trực đã tuyển đủ số lượng người cần thiết, hệ thống tự động từ chối các ứng viên còn lại ở trạng thái chờ duyệt.

### 4. Quản lý nhân sự HRM (HRM Panel)
*   **Cách hoạt động:** Hiển thị danh sách nhân sự làm việc tại quán và phân loại rõ ràng thành 2 nhóm:
    1.  *Nhân viên cố định (Internal Staff):* Nhân sự làm việc lâu dài do chủ quán tự thêm thủ công vào hệ thống.
    2.  *Nhân viên ca lẻ (On-Demand/External Workers):* Sinh viên ứng tuyển ca trực từ app ProxiJob, tự động liên kết vào danh sách sau khi chủ quán duyệt đơn tuyển dụng.
*   **Liên lạc nhanh:** Tích hợp nút gọi điện hoặc nhắn tin nhanh với nhân viên ngay trên giao diện để giải quyết sự cố hoặc điều phối công việc.

### 5. Radar giám sát vị trí chấm công (GPS Live Radar)
*   **Cách hoạt động:** Bản đồ định vị thời gian thực hiển thị vị trí của nhân sự khi họ thực hiện chấm công điểm danh. 
    *   Chấm xanh: Nhân viên chấm công trong phạm vi vùng an toàn (<100m quanh quán).
    *   Chấm đỏ: Nhân viên chấm công ngoài phạm vi 100m (chấm công đáng ngờ).
*   *Mục đích:* Giúp chủ quán giám sát nhân sự vãng lai làm việc đúng nơi quy định, hạn chế gian lận vị trí.

### 6. Theo dõi chi phí lương, đối soát biên lai & Đánh giá sinh viên (Expense Tracking & Student Rating)
*   **Theo dõi chi phí lương (Expense Tracking):** Hệ thống tự động tính toán tổng giờ công thực tế dựa trên thời gian Check-in/Check-out của nhân viên để hiển thị chi phí lương ca trực.
*   **Đối soát biên lai thanh toán (Transaction Receipt):** Chủ quán có thể điều chỉnh bảng lương (cộng tiền thưởng hoặc trừ tiền phạt kèm ghi chú lý do), tải lên ảnh biên lai chuyển khoản ngân hàng/ví điện tử bên ngoài (Transaction Photo) để đối soát dòng tiền và chốt trạng thái bảng lương là đã chi trả (Paid).
*   **Đánh giá sinh viên (Rating & Comments):** Khi chủ quán duyệt và chi trả lương cho ca trực, họ thực hiện chấm điểm xếp hạng từ 1 - 5 sao và để lại nhận xét đánh giá về thái độ, hiệu suất làm việc của sinh viên để tích lũy uy tín cho sinh viên trên hệ thống.

---

## 💳 IV. Hệ Thống Gói Cước Doanh Nghiệp (B2B Subscription Plans)
Chủ quán có thể đăng ký/nâng cấp tài khoản doanh nghiệp theo các gói cước để mở khóa các giới hạn tính năng vận hành:

1.  **Trial (Gói dùng thử - 0đ):** Được tự động kích hoạt cho tài khoản mới. Cho phép đăng tối đa **3 tin tuyển dụng** thử nghiệm. Không mở khóa các tính năng quản lý nhân sự HRM và chấm công.
2.  **PerShift (Gói đăng ca lẻ - 15.000đ/ca):** Cho phép đăng **1 tin tuyển ca lẻ** hoạt động trong 1 ngày. Giới hạn bán kính tìm kiếm tối đa là 3km. Không hỗ trợ quản lý nhân sự HRM.
3.  **Recruit (Gói tuyển dụng - 99.000đ/30 ngày):** Cho phép đăng tối đa **30 tin tuyển dụng**. Giới hạn bán kính tìm kiếm tối đa là 7km. Không mở khóa các tính năng quản lý nhân sự HRM và chấm công.
4.  **HRM Basic (Gói quản lý HRM cơ bản - 199.000đ/30 ngày):** Cho phép đăng tối đa **60 tin tuyển dụng**. Mở khóa tính năng quản lý nhân sự HRM, quản lý tối đa **15 nhân viên**, kích hoạt tối đa **1 mã QR chấm công** và bán kính tìm kiếm là 10km.
5.  **Enterprise (Gói doanh nghiệp toàn diện - 299.000đ/30 ngày):** Đăng tin **không giới hạn** (tối đa 9999 tin), ưu tiên hiển thị tin tuyển dụng trên đầu Radar tìm kiếm của sinh viên, **không giới hạn** số lượng nhân viên quản lý, **không giới hạn** mã QR chấm công hoạt động và không giới hạn bán kính tìm kiếm.

---

## 📂 V. Liên Kết Tài Liệu Kỹ Thuật Đọc Thêm
*   [PRODUCT_FEATURE_GUIDE.md](file:///d:/ProxiJob/PRODUCT_FEATURE_GUIDE.md) - Chi tiết kỹ thuật về trạng thái demo của từng tính năng.
*   [BUSINESS_PACKAGES_AND_FEATURES.md](file:///d:/ProxiJob/BUSINESS_PACKAGES_AND_FEATURES.md) - Cấu trúc cơ sở dữ liệu và phân bổ tính năng của các gói cước doanh nghiệp.
*   [PROJECT_EXECUTIVE_SUMMARY.md](file:///d:/ProxiJob/PROJECT_EXECUTIVE_SUMMARY.md) - Kiến trúc hệ thống và quy trình tích hợp API của ProxiJob.
