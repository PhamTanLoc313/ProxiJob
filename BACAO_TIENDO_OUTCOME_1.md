# BÁO CÁO TIẾN ĐỘ DỰ ÁN KHỞI NGHIỆP: PROXIJOB (MÔN EXE201)

---

## 1. BỐI CẢNH VÀ NGUYÊN NHÂN RA ĐỜI DỰ ÁN (PROBLEM & SOLUTION)

### 1.1. Bối cảnh thị trường và Thực trạng (Context)
* **Thực trạng phía Sinh viên:** Nhu cầu tìm kiếm việc làm bán thời gian (part-time) của sinh viên tại TP.HCM để trang trải chi phí sinh hoạt và tích lũy kinh nghiệm là cực kỳ lớn. Trong đó, phân khúc việc làm ngành F&B (Nhà hàng, quán cafe, quán ăn) luôn là lựa chọn hàng đầu nhờ thời gian linh hoạt và không đòi hỏi quá nhiều kinh nghiệm chuyên môn ban đầu. Tuy nhiên, sinh viên thường gặp khó khăn lớn về mặt địa lý khi chưa có phương tiện di chuyển cá nhân thuận lợi, dẫn đến việc ưu tiên tìm kiếm các công việc trong phạm vi cực gần nơi ở hoặc nơi học tập để tiết kiệm thời gian và chi phí đi lại.
* **Thực trạng phía Doanh nghiệp F&B:** Ngành F&B là một trong những ngành có tỷ lệ biến động nhân sự thuộc hàng cao nhất thị trường. Các cơ sở kinh doanh thường xuyên rơi vào tình trạng thiếu hụt nhân sự cục bộ, nhân viên xin nghỉ đột xuất hoặc quá tải vào các khung giờ cao điểm, các ngày lễ hội lớn. Do đó, nhu cầu tuyển dụng nhân sự làm việc ngay theo các ca gãy ngắn hạn là cực kỳ cấp thiết để đảm bảo vận hành liên tục và tránh thất thoát doanh thu.

### 1.2. Nỗi đau của thị trường & Khoảng trống giải pháp (Market Pain Points & Gap)
* **Hạn chế của các giải pháp hiện tại:** Hiện nay, việc kết nối tuyển dụng part-time chủ yếu diễn ra qua các hội nhóm tự phát trên mạng xã hội (Facebook, Zalo) hoặc tờ rơi dán trực tiếp trước cửa hàng.
  * **Đối với sinh viên:** Thông tin lừa đảo, "việc nhẹ lương cao" tràn lan, mô tả công việc mập mờ, không có cơ chế bảo vệ quyền lợi, chậm thanh toán lương (thường bị giam lương từ 2 đến 4 tuần) và tốn nhiều công sức để tìm kiếm một công việc phù hợp với lịch học.
  * **Đối với chủ quán:** Bài đăng tuyển trên mạng xã hội bị trôi rất nhanh, không tiếp cận đúng đối tượng mục tiêu, tỷ lệ hồ sơ ảo cao, mất nhiều thời gian phỏng vấn nhưng nhân sự lại dễ dàng bùng lịch và quan trọng nhất là **không thể tìm được nhân sự thay thế ngay lập tức** để lấp vào ca làm việc bị trống đột xuất.
* **Khoảng trống giải pháp (The Gap):** Thị trường đang thiếu hụt một giải pháp công nghệ chuyên biệt, có khả năng kết nối **Theo thời gian thực (Real-time)** và dựa trên **Vị trí địa lý siêu cục bộ (Hyper-local, Location-based)** để tối ưu hóa bài toán nhân sự tức thời cho ngành F&B trong bán kính ngắn.

### 1.3. Giải pháp đột phá từ ProxiJob (The Solution)
Để giải quyết triệt để các nỗi đau trên, dự án **ProxiJob** được ra đời với tư cách là một **Nền tảng kết nối việc làm F&B tức thời (Instant Hire) dựa trên vị trí siêu cục bộ dành riêng cho sinh viên**.

Không dừng lại ở mô hình lý thuyết, dự án đã hiện thực hóa giải pháp bằng việc **xây dựng và hoàn thiện trọn vẹn ứng dụng di động (Mobile App) cùng hệ thống quản trị Web ngay trong giai đoạn Outcome 1**. Nền tảng mang lại giá trị vượt trội thông qua:
* **Định vị siêu cục bộ (Hyper-local Geofencing):** Tự động quét, tính toán khoảng cách và hiển thị các ca làm việc còn trống xung quanh vị trí hiện tại của sinh viên (trong bán kính tối ưu), giúp họ tối ưu hóa thời gian và chi phí di chuyển.
* **Cơ chế Instant Hire (Ứng tuyển một chạm):** Tối giản hóa quy trình tuyển dụng rườm rà. Hệ thống hỗ trợ chủ cửa hàng đăng ca nhận người ngay và sinh viên có thể nhận ca làm việc chỉ trong vài phút thông qua giao diện Mobile App trực quan, tiện lợi.
* **Hệ thống hóa chấm công và theo dõi chi phí lương:** Hỗ trợ lưu trữ lịch sử làm việc, ghi nhận giờ công dựa trên GPS thực tế và tự động tính toán chi phí nhân sự phát sinh nhằm minh bạch hóa thù lao cho sinh viên và giúp chủ cửa hàng quản lý ngân sách vận hành tối ưu.

---

## 2. CHI TIẾT TIẾN ĐỘ 3 OUTCOMES CỐT LÕI

---

## OUTCOME 1: XÂY DỰNG SẢN PHẨM KHẢ DỤNG TỐI THIỂU (MVP APP DEVELOPMENT)

**Mục tiêu:** Thiết kế, lập trình và triển khai một phiên bản ứng dụng di động độc lập (Mobile App) dành cho Sinh viên và Doanh nghiệp kết hợp với hệ thống quản trị Web (`ProxiJob_Client`) nhằm giải quyết các tính năng cốt lõi. Dự án tuân thủ nghiêm ngặt mô hình **Khởi nghiệp tinh gọn (Lean Startup)**, tập trung tối đa vào các luồng nghiệp vụ tạo giá trị lớn nhất nhằm tối ưu hóa thời gian ra mắt thị trường và tiết kiệm chi phí vận hành hạ tầng VPS.

### 2.1. Kiến trúc hệ thống & Lựa chọn công nghệ

Hệ thống được thiết kế và xây dựng theo các tiêu chuẩn công nghiệp hiện đại nhằm đảm bảo hiệu năng cao, khả năng mở rộng tốt (Scalability), tính bảo mật thông tin và tối ưu hóa chi phí vận hành cho một dự án khởi nghiệp tinh gọn.

* **Kiến trúc phân tầng cốt lõi (Clean Architecture & CQRS):** 
  * Áp dụng **Clean Architecture** để tách biệt mã nguồn thành các lớp độc lập (Core, Application, Infrastructure, API). Điều này giúp dễ dàng bảo trì và mở rộng sản phẩm trong tương lai mà không ảnh hưởng lẫn nhau.
  * Kết hợp mô hình **CQRS** (Command Query Responsibility Segregation) để phân tách rõ ràng giữa các tác vụ đọc dữ liệu (Queries - như xem danh sách việc làm gần đây) và các tác vụ ghi dữ liệu (Commands - như ứng tuyển hoặc chấm công). Sự phân tách này giúp cải thiện tốc độ phản hồi đáng kể và tránh xung đột dữ liệu khi có nhiều người truy cập cùng lúc.
* **Mô hình dịch vụ phi tập trung (Microservices):** Backend hệ thống được chia nhỏ thành các dịch vụ độc lập bao gồm Dịch vụ định danh (Identity Service), Dịch vụ công việc (Job Service) và Dịch vụ quản lý (Management Service). Các dịch vụ này giao tiếp qua hai phương thức:
  * *Giao tiếp đồng bộ độ trễ thấp (gRPC):* Các dịch vụ truyền tin trực tiếp với nhau thông qua giao thức gRPC để tối ưu tốc độ xử lý các tác vụ quan trọng như đồng bộ trạng thái tài khoản và ghép ca làm việc (độ trễ dưới 1.2 giây).
  * *Giao tiếp bất đồng bộ (RabbitMQ):* Sử dụng RabbitMQ làm Event Bus trung gian để xử lý các sự kiện không cần chờ kết quả ngay lập tức (ví dụ: khi chủ quán duyệt ứng viên ở Job Service, một thông điệp sẽ được gửi ngầm qua RabbitMQ để tạo lịch trực ở Management Service), giúp hệ thống hoạt động mượt mượt mà và không bị tắc nghẽn.
* **Tầng dữ liệu đám mây (Cloud Database):** Hệ thống sử dụng giải pháp cơ sở dữ liệu quan hệ **Supabase (PostgreSQL Cloud)**. Việc lưu trữ dữ liệu tập trung trên đám mây giúp giảm tải gánh nặng lưu trữ cho máy chủ ứng dụng, bảo vệ an toàn dữ liệu và tối ưu hóa chi phí phần cứng trong giai đoạn đầu khởi nghiệp.
* **Đóng gói container và Triển khai hạ tầng (Docker & VPS):** 
  * Toàn bộ mã nguồn backend được đóng gói thành các container độc lập bằng **Docker** và quản lý tập trung bằng **Docker Compose**.
  * Hệ thống được triển khai thực tế trên máy chủ ảo **VPS Ubuntu 24.04 LTS**. Việc áp dụng cấu hình bỏ qua tệp tin thừa (`.dockerignore`) khi build giúp tối ưu hóa tối đa bộ nhớ đĩa và dung lượng RAM tiêu thụ trên máy chủ VPS.
  * **Nginx** được cấu hình làm Reverse Proxy đứng trước API Gateway, giúp định tuyến chính xác các yêu cầu từ Client đến dịch vụ tương ứng dưới tên miền chính thức `https://api.proxijob.io.vn`. Toàn bộ đường truyền dữ liệu được mã hóa an toàn qua giao thức **SSL/HTTPS** cấp bởi **Certbot (Let's Encrypt)**.

### 2.2. Các module và tính năng cốt lõi triển khai trong giai đoạn MVP

Hệ thống được tổ chức vận hành đồng bộ thông qua 3 module nghiệp vụ chính tại phía Backend:

#### A. Module Định danh & Quản lý Tài khoản (Identity Service - IAM API)
* **Xác thực người dùng:** Hỗ trợ quy trình Đăng ký và Đăng nhập an toàn thông qua cơ chế mã hóa mật khẩu và cấp phát **JWT Token**. Tích hợp tính năng làm mới token tự động (**Refresh Token**) để bảo vệ phiên làm việc mà không yêu cầu người dùng đăng nhập lại liên tục.
* **Phân quyền dựa trên vai trò:** Hệ thống nhận diện và phân tách rõ ràng quyền truy cập cũng như giao diện của hai nhóm đối tượng khách hàng:
  * *Sinh viên (Ứng viên):* Quản lý hồ sơ lý lịch, kỹ năng cá nhân, E-portfolio (hồ sơ năng lực điện tử), và theo dõi lịch sử ca làm.
  * *Doanh nghiệp (Chủ cửa hàng):* Quản lý thông tin thương hiệu, chọn lựa và nâng cấp các gói dịch vụ (Enterprise, Premium, Standard).
* **Bảo mật và Kiểm soát dữ liệu:** Áp dụng các bộ quy tắc kiểm tra nghiêm ngặt thông tin Căn cước công dân (CCCD) tại tầng Repository để đảm bảo tính xác thực, tránh tình trạng tài khoản ảo hoặc trùng lặp dữ liệu trong cơ sở dữ liệu.

#### B. Module Quản lý Tin tuyển dụng & Ghép ca trực (Personnel & Job Matching Service - Job API)
* **Đăng ca làm việc part-time:** Doanh nghiệp có thể tạo mới, chỉnh sửa thông tin chi tiết của tin tuyển dụng (bao gồm mức lương thỏa thuận theo giờ, yêu cầu công việc, thời gian ca trực gãy và địa điểm làm việc) hoặc thực hiện xóa tin đăng theo thời gian thực.
* **Tìm kiếm và Ứng tuyển theo vị trí:** Sinh viên có thể chủ động tìm kiếm các tin tuyển dụng đang hoạt động trong phạm vi gần xung quanh vị trí hiện tại dựa trên bộ lọc định vị thông minh và thực hiện ứng tuyển tức thì chỉ với một thao tác bấm (Apply).
* **Duyệt ứng viên nhận việc:** Chủ cửa hàng dễ dàng quản lý danh sách ứng viên nộp hồ sơ, xem chi tiết E-portfolio bảo chứng của sinh viên để đưa ra quyết định Phê duyệt (Approve) nhận việc hoặc Từ chối (Reject) hồ sơ một cách nhanh chóng.

#### C. Module Chấm công & Quản lý Chi phí Nhân sự (Schedule & Expense Tracking Service - Management API)
* **Bản đồ giám sát nhân sự Live:** Chủ cửa hàng có thể theo dõi vị trí chấm công thực tế của nhân viên trên bản đồ trực quan được tích hợp bằng Leaflet API trên trang quản trị Web Client. Hỗ trợ các phím tắt liên hệ nhanh (chức năng gọi điện và nhắn tin giả lập) giúp tăng cường khả năng giao tiếp nội bộ.
* **Quản lý nhân sự hỗn hợp (HRM & Roster):** Hỗ trợ lập lịch trực và theo dõi ca làm việc cho hai nhóm nhân sự:
  * *Nhân viên nội bộ cố định (Internal Staff):* Các nhân sự làm việc thường xuyên tại quán như thu ngân, pha chế.
  * *Nhân sự vãng lai tức thời (On-Demand Workers):* Sinh viên ứng tuyển ca trực ngắn hạn từ ứng dụng.
* **Chấm công thông minh dựa trên định vị (Geofencing GPS):** Sinh viên thực hiện Check-in và Check-out trực tiếp trên ứng dụng di động. Hệ thống sẽ so khớp tọa độ GPS thực tế của điện thoại với tọa độ cửa hàng. Nếu khoảng cách lớn hơn bán kính vùng an toàn quy định (mặc định 100m), ca làm việc sẽ được đưa vào danh sách nghi vấn (**Suspicious Timekeepings**) để chủ quán duyệt thủ công, giúp ngăn chặn tình trạng gian lận ngày công.
* **Theo dõi chi phí lương và Đối soát ngày công (Payroll Expense Tracking):** 
  * *Tự động tính chi phí lương tạm tính:* Hệ thống tự động ghi nhận thời gian làm việc thực tế của nhân viên từ dữ liệu Check-in/Check-out để tính toán chi phí lương tạm tính dựa trên đơn giá giờ công đã thỏa thuận (ví dụ: 35.000 đ/h).
  * *Phê duyệt chi phí tạm tính (Interim Approval):* Chủ doanh nghiệp đánh giá hiệu suất, số giờ làm việc, nhập điểm đánh giá (Rating từ 1-5 sao) cùng các phản hồi chi tiết để ghi nhận chi phí lương của nhân viên, đồng thời cập nhật điểm uy tín (reputation score) của sinh viên qua gRPC.
  * *Đối soát và Xác nhận nhận lương (Payment Confirmation):* Sau khi nhận thanh toán ngoài hệ thống (bằng tiền mặt hoặc chuyển khoản trực tiếp bên ngoài), sinh viên sẽ thực hiện xác nhận đã nhận đủ tiền ngay trên ứng dụng di động và đánh giá ngược lại chất lượng làm việc của doanh nghiệp, đưa trạng thái chi phí lương về mức Đã hoàn thành (Paid).
  * *Thống kê và Phân tích chi phí (Expense Analytics):* Dashboard dành cho doanh nghiệp cung cấp báo cáo chi phí lương tổng quan theo ngày, tuần hoặc tháng, hiển thị tổng số tiền đã chi trả, khoản tiền lương đang chờ duyệt công, và vẽ biểu đồ trực quan giúp doanh nghiệp tối ưu chi phí sử dụng nhân sự.

---

### 2.3. Chi tiết các chức năng trên giao diện sản phẩm thực tế

Để chứng minh sản phẩm đã được hiện thực hóa trọn vẹn chứ không chỉ dừng lại ở lý thuyết kiến trúc backend, dưới đây là chi tiết các chức năng đã lập trình thành công trên từng giao diện Client:

#### A. Phân hệ Ứng dụng Di động (Mobile App - React Native / Expo)

* **Đối với Sinh viên (Ứng viên):**
  * **Trang chủ tìm việc (StudentDashboard):** Bản đồ định vị GPS thời gian thực tự động quét và đánh dấu các ca làm việc trống xung quanh vị trí hiện tại. Sinh viên có thể lướt xem nhanh khoảng cách, mức thù lao của từng quán.
  * **Chi tiết công việc (JobDetailScreen):** Hiển thị đầy đủ thông tin mô tả, mức lương theo giờ (ví dụ: 35.000 đ/h), thời gian bắt đầu/kết thúc, địa điểm và nút ứng tuyển nhanh một chạm (Apply).
  * **Chấm công GPS (StudentCheckIn):** Màn hình xác minh vào/ra ca làm việc bằng định vị tọa độ GPS thực tế của điện thoại, kết hợp chức năng chụp ảnh khuôn mặt và quét QR Code tại cửa hàng để ghi công.
  * **Lịch biểu & Đối soát (StudentCalendar):** Quản lý toàn bộ lịch trình các ca trực sắp tới, các ca trực đã hoàn thành. Nút "Xác nhận nhận lương" hỗ trợ sinh viên đối soát với số tiền nhận được ngoài hệ thống và thực hiện chấm điểm đánh giá doanh nghiệp.
  * **Hồ sơ năng lực (StudentPortfolio):** Hiển thị E-Portfolio điện tử của sinh viên, bao gồm thông tin học vấn (trường, ngành học), danh sách kỹ năng nổi bật, và điểm uy tín trung bình (Reputation Score) được tích lũy từ các phản hồi của nhà tuyển dụng.
  * **Hộp thoại liên lạc (StudentChat):** Hỗ trợ chat nhắn tin trực tiếp với chủ cửa hàng để trao đổi thông tin công việc trước và trong ca trực.

* **Đối với Doanh nghiệp (Chủ cửa hàng F&B):**
  * **Đăng ca khẩn cấp (EmployerEmergencyPost):** Form đăng tin tuyển dụng tức thời, cho phép thiết lập nhanh mô tả, địa điểm, chọn ca gãy, nhập mức lương thù lao giờ và đẩy trực tiếp lên bản đồ tìm việc của sinh viên.
  * **Xét duyệt ứng viên (CandidateListScreen):** Hiển thị danh sách sinh viên đăng ký ca trực, cho phép xem chi tiết E-Portfolio và điểm uy tín của ứng viên để đưa ra quyết định duyệt nhận việc (Approve) hoặc từ chối (Reject) ngay trên app.
  * **Giám sát chấm công Live (EmployerMonitor):** Bản đồ Radar GPS live định vị vị trí của nhân sự vãng lai và nội bộ đang hoạt động trong ca trực, hỗ trợ nút liên hệ khẩn cấp.
  * **Quản trị HRM & Xếp ca (EmployerHRM & EmployerScheduling):** Quản lý hồ sơ nhân viên trong hệ thống và thiết lập lịch làm việc hàng tuần trực quan.
  * **Đối soát chấm công (EmployerApprovals):** Hiển thị lịch sử Check-in/Check-out của nhân viên, đối sánh tọa độ định vị để cảnh báo nếu nhân viên điểm danh ngoài Geofencing (bán kính >100m).
  * **Quản lý chi phí thù lao (PayrollSettlementScreen):** Bảng thống kê giờ công làm việc thực tế, tự động tính tổng tiền lương tạm tính của từng nhân sự, cho phép chủ quán duyệt chi phí và nhập điểm đánh giá (1-5 sao) về thái độ làm việc của sinh viên.

#### B. Phân hệ Giao diện Web Quản trị (ProxiJob Client Web)

* **Dành cho Doanh nghiệp (Vận hành trên Web):**
  * **Lập lịch trực (CreateWorkSchedule):** Hỗ trợ công cụ xếp ca trực trực quan bằng lịch biểu trên web.
  * **Hồ sơ doanh nghiệp (UserProfile & ViewProfile):** Xem và cập nhật chi tiết thông tin cửa hàng, hình ảnh đại diện và địa chỉ định vị GPS cơ sở.
* **Dành cho Quản trị viên hệ thống (Admin Portal):**
  * **Trang chủ quản trị (Dashboard):** Biểu đồ thống kê số lượng tài khoản đăng ký mới, số ca làm việc được tạo lập và tổng quan chi phí hoạt động trên toàn hệ thống.
  * **Quản lý người dùng (UserManagement):** Danh sách quản trị tài khoản sinh viên và doanh nghiệp, hỗ trợ phê duyệt xác minh tài khoản mới hoặc khóa các tài khoản vi phạm chính sách uy tín.
  * **Kiểm duyệt bài đăng (JobManagement):** Hệ thống lọc và duyệt tính hợp lệ của các bài đăng tuyển dụng từ chủ cửa hàng trước khi phân phối công khai trên bản đồ ứng dụng.
  * **Quản lý gói dịch vụ (Subscription & Payment Management):** Theo dõi lịch sử nâng cấp tài khoản của các doanh nghiệp (gói Standard, Premium, Enterprise) và xử lý xác nhận các yêu cầu thanh toán nâng cấp gói.

---

### 2.4. Trạng thái bàn giao sản phẩm thực tế (Deliverables Status)

Đến thời điểm hiện tại, sản phẩm MVP của dự án ProxiJob đã hoàn thành và đạt trạng thái sẵn sàng vận hành:

* **Backend & API:** Toàn bộ hệ thống API Gateway và các Microservices được triển khai chạy ổn định 24/7 tại địa chỉ `https://api.proxijob.io.vn`.
* **Cơ sở dữ liệu đám mây:** Cấu hình thành công Supabase Cloud (PostgreSQL), dữ liệu tài khoản, bài đăng tuyển dụng, thông tin ca trực và bảng chấm công thực tế được đồng bộ và lưu trữ an toàn theo thời gian thực.
* **Ứng dụng di động (Mobile App Client):** Hoàn thiện mã nguồn ứng dụng xây dựng trên React Native/Expo, đóng gói thành công tệp tin cài đặt trực tiếp dạng **`.apk` cho hệ điều hành Android** và kết nối thành công với máy chủ thực tế.
* **Trang quản trị Web Client (`ProxiJob_Client`):** Hoàn thiện giao diện web hỗ trợ chủ cửa hàng quản lý nhân sự, theo dõi vị trí chấm công của nhân viên trên bản đồ thời gian thực và thực hiện các chức năng duyệt tin tuyển dụng của quản trị viên.

---

## OUTCOME 2: KIỂM CHỨNG THỊ TRƯỜNG & KHÁCH HÀNG (MARKET VALIDATION)

*(Nội dung đang triển khai: Tiến hành phân phát file cài đặt `.apk` trực tiếp đến các nhóm sinh viên tại các trường Đại học khu vực TP.HCM và chủ các quán F&B quy mô vừa/nhỏ để thu thập dữ liệu thực tế về lượt tải, số ca đăng tuyển ban đầu, số lượt ứng tuyển thành công và khảo sát phản hồi từ người dùng thực tế nhằm cải tiến sản phẩm).*

---

## OUTCOME 3: DOANH THU & MÔ HÌNH TÀI CHÍNH (FINANCIAL VIABILITY)

*(Nội dung đang triển khai: Xây dựng chi tiết mô hình dòng tiền từ phí hoa hồng chiết khấu trên mỗi ca làm việc hoàn thành từ nhà tuyển dụng, tính toán chi phí cấu trúc vận hành hệ thống BOM bao gồm phí duy trì VPS máy chủ ảo, chi phí cơ sở dữ liệu đám mây Supabase, chi phí tiếp thị và xác định điểm hòa vốn của dự án).*
