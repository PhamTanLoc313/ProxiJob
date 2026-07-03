# NHẬT KÝ CẬP NHẬT GIAO DIỆN & TÍNH NĂNG (CHANGELOG)
*Dự án: ProxiJob Mobile App*

Tài liệu này tổng hợp toàn bộ các cải tiến UI/UX chuyên nghiệp, tối ưu hóa hiệu năng, sửa lỗi hiển thị và chuẩn hóa dữ liệu đã được thực hiện trên ứng dụng ProxiJob dành cho cả phân hệ Học viên (Student) và Chủ quán (Employer).

---

## 1. PHÂN HỆ HỌC VIÊN (STUDENT)

### 1.1. Bản đồ chọn vị trí tương tác (Leaflet Webview) & Autocomplete
*   **Chi tiết**: Thay thế phần giao diện vòng tròn radar tĩnh minh họa bằng **Bản đồ tương tác 100%** sử dụng Leaflet WebView.
*   **Tính năng**: Người dùng có thể kéo thả ghim hoặc nhấp chuột vào bất cứ đâu trên bản đồ để định vị điểm tìm việc. Tích hợp thanh tìm kiếm gợi ý địa chỉ tự động (Autocomplete) giúp nhập liệu nhanh chóng.

### 1.2. Giải mã địa lý chính xác với Goong Map API
*   **Chi tiết**: Chuyển đổi toàn bộ logic giải mã địa lý ngược (Reverse Geocoding) sang hệ thống **Goong Geocoding API** (với API Key đã được nhúng).
*   **Kết quả**: Hiển thị chính xác tên ngõ hẻm, số nhà, tên đường thực tế tại Việt Nam thay vì chỉ hiển thị chung chung "Thành phố Hồ Chí Minh, Việt Nam".

### 1.3. Đồng bộ hóa múi giờ Việt Nam (GMT+7)
*   **Chi tiết**: Thiết kế lại cơ chế định dạng ngày giờ hiển thị trên danh sách công việc (`StudentDashboard.js`) và màn hình chi tiết (`JobDetailScreen.js`). 
*   **Kết quả**: Thay thế việc cắt chuỗi ISO cứng nhắc bằng việc parse trực tiếp qua đối tượng `Date` của Javascript giúp đồng bộ múi giờ, hiển thị đồng nhất định dạng ngày giờ chuẩn Việt Nam ở mọi màn hình.

### 1.4. Nhãn "TUYỂN GẤP" nhấp nháy đa màu theo ngành nghề
*   **Chi tiết**: Đồng bộ nhãn dán `🔥 TUYỂN GẤP` động theo màu ngành nghề (Category Colors) thay vì màu đỏ cố định. Thiết kế hiệu ứng heartbeat co giãn mượt mà (Breathing Scale/Opacity) không gây giật lag hoặc treo ứng dụng khi chuyển tab bộ lọc.

### 1.5. Duy trì trạng thái chế độ xem (List/Map) & Số trang phân trang
*   **Duy trì view**: Sử dụng `AsyncStorage` lưu lại lựa chọn xem bản đồ hoặc danh sách. Khi quay lại từ trang chi tiết, giao diện giữ nguyên chế độ xem của người dùng.
*   **Duy trì số trang (Pagination Page Persistence)**: Khắc phục lỗi quay về Trang 1 khi bấm nút Back từ chi tiết công việc bằng cách lưu trữ số trang vào biến toàn cục của module và chặn trigger tự động reset trang khi API tải dữ liệu. Người dùng được giữ đúng trang (ví dụ Trang 3) để tiếp tục duyệt.

### 1.6. Định vị lại nút GPS trên bản đồ Dashboard
*   **Chi tiết**: Di chuyển nút bấm `🎯 Định vị GPS` sang góc **dưới cùng bên trái (bottom-left)** trên bản đồ radar lớn để tránh đè lên cụm nút thu phóng mặc định của Leaflet.

---

## 2. PHÂN HỆ CHỦ QUÁN (EMPLOYER)

### 2.1. Quản lý Lịch biểu & Ca làm việc (Scheduling)
*   **Bộ chọn giờ cuộn chuyên nghiệp**: Tích hợp `CustomTimePickerModal` thay thế hoàn toàn ô nhập giờ bằng tay, giúp chủ quán vuốt chọn giờ/phút (bước nhảy 5 phút) mượt mà.
*   **Lồng ghép Modal tránh xung đột (Nested Modal)**: Khắc phục lỗi Modal chọn giờ bị hệ điều hành chặn không hiển thị bằng cách lồng trực tiếp component này vào cây phân nhánh bên trong Modal cha "Thêm ca làm việc mới".
*   **Ràng buộc ngày giờ thông minh**: Kiểm tra và hiển thị lỗi chữ màu đỏ trực tiếp dưới ô nhập (Inline errors):
    *   Tên ca làm không được trống.
    *   Giờ bắt đầu/Giờ kết thúc không được bỏ trống.
    *   Giờ kết thúc không được nhỏ hơn hoặc bằng giờ bắt đầu.

### 2.2. Đăng tin tuyển dụng ca gấp (Emergency Wizard Form)
*   **Chuyển đổi luồng biểu mẫu**: Di chuyển nút chuyển mạch bật/tắt `Chế độ Đăng ca gấp` sang **Bước 2 (Quyền lợi & Kỹ năng)** để chủ quán bật tắt ngay lúc nhập lương đề xuất.
*   **Xem trước mức lương thực tế (+30%)**: Khi bật chế độ ca gấp, hệ thống hiển thị một khung xem trước mức lương thực tế sau cộng 30% nổi bật. 
*   **Sửa lỗi nhân đôi hệ số lương**: Sửa đổi logic để không ghi đè mức lương gốc trong ô nhập liệu (nhập `35000` vẫn giữ `35000` thay vì bị đổi thành `45500`), tránh hiện tượng nhân 30% lần thứ hai. Hệ số +30% chỉ được nhân và gửi lên API khi bấm nút đăng tin cuối cùng.
*   **Địa chỉ tự động xuống dòng (Multiline Input)**: Chuyển đổi ô nhập địa chỉ thành ô nhập nhiều dòng (`multiline={true}` và chiều cao `64px`) giúp khắc phục lỗi biến mất chữ trên Android khi dùng thuộc tính selection.
*   **Chuẩn hóa danh sách kỹ năng**: Cấu hình danh sách 8 kỹ năng cốt lõi ngành F&B tĩnh trên giao diện giúp chủ quán lựa chọn nhanh chóng và chuẩn mực.

### 2.3. Quản lý Tin Đăng & Duyệt Yêu Cầu (Approvals)
*   **Modal Chỉnh sửa dạng Thẻ trung tâm (Centered Card)**: Chuyển đổi Modal Chỉnh sửa bài đăng từ dạng toàn màn hình chiếm dụng diện tích sang dạng **Thẻ bo tròn Premium (`borderRadius: 24`, rộng 94%, cao 92%) nổi trên lớp nền mờ tối**, đồng nhất với thiết kế chung.
*   **Sửa lỗi co rút ScrollView**: Khắc phục lỗi chiều cao ScrollView bị co lại về 0px trên Android bằng việc thiết lập `flex: 1` cho `KeyboardAvoidingView` bao ngoài.
*   **Nút tìm tọa độ thủ công**: Thêm nút bấm **"Tìm Tọa Độ"** tích hợp trực tiếp bên phải ô địa chỉ trong Modal Chỉnh sửa giúp giải mã địa chỉ thủ công và dời ghim bản đồ chính xác.

### 2.4. Quản lý Nhân sự (HRM)
*   **Ràng buộc thông tin nhân viên**: Không tắt âm thầm nút xác nhận. Khi bấm gửi, hệ thống kiểm tra và báo lỗi đỏ dưới các ô nhập liệu:
    *   Tên nhân viên, Số điện thoại, Vai trò không được bỏ trống.
    *   Số điện thoại bắt buộc phải bắt đầu bằng chữ số `0`, có độ dài chính xác là `10` hoặc `11` ký tự số, không chứa chữ cái hoặc ký tự đặc biệt.

### 2.5. Hộp thoại xác nhận xóa Premium (Custom Confirm Delete Modal)
*   **Chi tiết**: Thay thế hoàn toàn các hộp thoại `Alert.alert` mặc định của hệ thống bằng Modal tùy chỉnh cao cấp:
    *   Tích hợp icon Thùng rác đỏ đặt trên vòng tròn màu hồng nhạt dịu mắt `#FEE2E2`.
    *   Văn bản chi tiết in đậm tên ca làm hoặc tên tin tuyển dụng cần xóa.
    *   Cặp nút bấm bo góc bo tròn hiện đại (Hủy xám nhạt, Xóa đỏ đậm).
*   **Kết quả**: Áp dụng đồng bộ cho cả chức năng **Xóa ca làm việc** (màn hình Lịch biểu) và **Xóa tin đăng** (màn hình Quản lý tin đăng).

### 2.6. Quản lý Chi phí & Đối soát lương (Payroll Settlement)
*   **Chi tiết**: Loại bỏ hoàn toàn dòng UI **"Bộ lọc ca trực công nhật"** (Tất cả / Ca ngắn / Ca dài) khỏi màn hình Chi phí theo mong muốn tối giản của người dùng.
*   **Kết quả**: Danh sách bên dưới mặc định hiển thị tất cả các ca làm chờ thanh toán một cách đầy đủ và trọn vẹn nhất.

---

## 3. SỬA LỖI HIỂN THỊ CHUNG (UI/UX FIXES)

*   **Android Font Clipping**: Khắc phục lỗi chữ nhập vào trong ô `TextInput` bị cắt xén mất phần trên đầu chữ bằng cách thiết lập `includeFontPadding: false` kết hợp căn chỉnh lại khoảng cách đệm trên dưới (`paddingTop`/`paddingBottom`) của các input có dạng `premiumInput` và `modalPremiumInput`.
*   **Accent-Insensitive Search**: Tích hợp hàm loại bỏ dấu tiếng Việt tự động `removeAccents` vào chức năng lọc/tìm kiếm ứng viên, giúp nhà tuyển dụng tìm kiếm chính xác ứng viên bất kể gõ có dấu hay không dấu.
