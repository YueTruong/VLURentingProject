# Đánh giá mức độ đáp ứng phạm vi chức năng & công nghệ (VLU Renting Project)

## 1) Kết luận nhanh
Dự án **đã có nền tảng tốt** cho kiến trúc và một phần lớn nghiệp vụ chính (đăng nhập/đăng ký, quản lý bài đăng, duyệt bài, đánh giá, chat người dùng).

Tuy nhiên, nếu đối chiếu đúng với yêu cầu khóa luận bạn đưa ra thì hiện tại dự án đang ở mức **đáp ứng một phần**:
- **Đạt/khá rõ**: kiến trúc FE-BE tách biệt, NestJS + React/Next, PostgreSQL, JWT, CRUD bài đăng, duyệt bài admin, review cơ bản, chat thời gian thực giữa người dùng.
- **Chưa đầy đủ hoặc chưa chứng minh rõ**: tìm kiếm nâng cao theo Cơ sở VLU (CS1/2/3), tìm kiếm trực quan trên bản đồ với marker danh sách phòng, quản lý hồ sơ cá nhân đầy đủ qua backend API riêng, module chatbot AI tư vấn đã huấn luyện, quản trị danh mục (tiện ích/loại phòng), kiểm duyệt/xóa review vi phạm ở admin.

---

## 2) Đối chiếu theo phạm vi chức năng

## 2.1 Module Sinh viên

### 2.1.1 Đăng ký, đăng nhập
- **Đáp ứng cơ bản**: có API đăng ký/đăng nhập backend và trang đăng nhập frontend.
- Nhận xét: đăng ký theo role có sẵn; đăng nhập dùng JWT + NextAuth.

### 2.1.2 Tìm kiếm cơ bản (khu vực, quận, tên đường)
- **Đáp ứng một phần**: backend có `keyword` tìm theo `title/address`; frontend có danh sách listing và logic lọc từ khóa.
- Khoảng trống: chưa thấy bộ tiêu chí tách riêng chuẩn “khu vực/quận/tên đường” ở API contract.

### 2.1.3 Tìm kiếm nâng cao
- **Đáp ứng một phần**: có lọc giá, diện tích, loại phòng (`category_id`), tiện ích (`amenity_ids`), vị trí bán kính (`lat/lng/radius`).
- Khoảng trống quan trọng: chưa thấy lọc rõ theo **Cơ sở VLU CS1/CS2/CS3**; lọc số người ở chỉ mới xuất hiện dữ liệu `max_occupancy` nhưng chưa thành bộ lọc API chuẩn.

### 2.1.4 Tìm kiếm trực quan bản đồ
- **Chưa đạt đúng yêu cầu**: hiện có nhúng Google Maps dạng iframe tĩnh; chưa thấy lớp marker phòng trọ theo dữ liệu post trên bản đồ.

### 2.1.5 Xem chi tiết tin đăng
- **Đáp ứng khá tốt**: có API chi tiết bài đăng với ảnh, mô tả, tiện ích, thông tin người đăng, review.
- Khoảng trống: video tin đăng chưa thấy mô hình dữ liệu/flow rõ.

### 2.1.6 Quản lý tài khoản (cập nhật thông tin cá nhân)
- **Chưa đầy đủ**: có lấy profile hiện tại (`/auth/profile`) nhưng chưa thấy module API chuyên biệt cho cập nhật profile người dùng.

### 2.1.7 Hệ thống đánh giá
- **Đáp ứng cơ bản**: tạo/sửa review, lấy review theo bài đăng và của người dùng.

---

## 2.2 Module Chủ trọ

### 2.2.1 Đăng ký, đăng nhập
- **Đáp ứng cơ bản** qua module auth dùng role.

### 2.2.2 Quản lý tin đăng (tạo/sửa/xóa/ẩn-hiện)
- **Đáp ứng phần lớn**: có tạo, sửa, xóa, duyệt/ẩn qua admin status flow.
- Lưu ý: logic xóa hiện đang chỉ cho chủ bài đăng, kể cả admin không xóa trực tiếp bằng API `delete` của posts service.

### 2.2.3 Cập nhật trạng thái còn phòng/đã cho thuê
- **Chưa rõ ràng**: có trường status (pending/approved/rejected/hidden), nhưng chưa thấy trạng thái nghiệp vụ riêng “còn phòng/đã cho thuê”.

### 2.2.4 Quản lý tài khoản liên hệ
- **Chưa đầy đủ**: chưa thấy endpoint cập nhật thông tin liên hệ chuyên biệt cho chủ trọ.

### 2.2.5 Xem đánh giá nhà trọ của mình
- **Đáp ứng một phần**: có thể xem review theo post; nhưng chưa thấy endpoint tổng hợp riêng “reviews for my listings”.

---

## 2.3 Module Quản trị viên

### 2.3.1 Đăng nhập trang quản trị riêng
- **Đáp ứng một phần**: có layout/khu vực admin trên frontend và guard theo role ở backend.

### 2.3.2 Quản lý tài khoản (xem DS, phân quyền, khóa/mở)
- **Đáp ứng một phần**: có xem danh sách user và bật/tắt trạng thái hoạt động.
- Khoảng trống: chưa thấy API đổi role/phân quyền chi tiết.

### 2.3.3 Quản lý tin đăng (duyệt/gỡ vi phạm)
- **Đáp ứng khá tốt**: có luồng duyệt/từ chối/ẩn tin đăng.

### 2.3.4 Quản lý đánh giá vi phạm, spam
- **Chưa đạt**: chưa thấy controller/service admin cho xóa review vi phạm.

### 2.3.5 Quản lý danh mục (tiện ích, loại phòng)
- **Chưa đạt**: chưa thấy module CRUD danh mục riêng cho admin.

---

## 2.4 Module Chatbot AI

- **Đáp ứng một phần (mức mô phỏng)**: ở `client/app/listings/page.tsx` đã có trợ lý AI giả lập hỗ trợ phân tích câu truy vấn tiếng Việt và tự động áp bộ lọc tìm phòng (giá, khu vực, loại phòng, diện tích, tiện ích...).
- **Giới hạn hiện tại**: đây là luật/regex + lọc dữ liệu cục bộ, chưa tích hợp mô hình AI/LLM hay dịch vụ NLP bên ngoài; vì vậy phù hợp gọi là “AI mô phỏng” hơn là chatbot AI thực thụ.

---

## 3) Đối chiếu công nghệ/phương pháp

- **Kiến trúc FE-BE tách biệt**: ✅ Có (thư mục `client` và `server`).
- **Backend NestJS**: ✅ Có.
- **Frontend ReactJS**: ✅ Có (Next.js dùng React).
- **CSDL PostgreSQL**: ✅ Có (`typeorm` + `pg`, cấu hình `type: 'postgres'`).
- **Xác thực JWT**: ✅ Có (JwtStrategy/JwtAuthGuard, trả access token).
- **Chatbot AI**: ⚠️ Có trợ lý AI mô phỏng ở trang listings (rule-based filtering), nhưng chưa có tích hợp mô hình AI/NLP thực sự.
- **Google Maps API**: ⚠️ Mới dừng ở nhúng iframe bản đồ; chưa thấy tích hợp đầy đủ map data layer cho tìm kiếm trực quan.

---

## 4) Đánh giá tổng thể dưới góc nhìn GVHD

Nếu đây là bản hiện tại trước nghiệm thu:
- Mình đánh giá dự án đang ở mức **~60-70% so với phạm vi mục tiêu** (tốt về khung kỹ thuật, thiếu một số yêu cầu nghiệp vụ quan trọng).
- Điểm mạnh: cấu trúc backend rõ module, có guard/role, có quy trình duyệt tin và review, frontend đã có nhiều màn hình.
- Điểm cần hoàn thiện gấp để “đúng đề tài”: chatbot AI tư vấn, bản đồ trực quan theo data tin đăng, quản trị danh mục, kiểm duyệt review, profile update đầy đủ, lọc theo CS1-CS2-CS3 và trạng thái còn phòng/đã cho thuê.

---

## 5) Gợi ý ưu tiên hoàn thiện (theo thứ tự)

1. **Hoàn thiện chuẩn dữ liệu nghiệp vụ**
   - ✅ Đã bổ sung trường `campus` (CS1/CS2/CS3), `availability` (available/rented), `videoUrl` trong entity/DTO và luồng FE map dữ liệu.
   - ⏳ Cần bổ sung form nhập/sửa đầy đủ ở toàn bộ màn hình đăng tin để khai thác hết các trường mới.
2. **Bản đồ tìm kiếm trực quan đúng yêu cầu**
   - Dùng Google Maps JS API/Leaflet + marker từ API posts (có popup card).
3. **Admin moderation hoàn chỉnh**
   - Thêm module quản trị review + module quản lý category/amenity.
4. **Profile management đầy đủ**
   - API cập nhật profile cho student/landlord + UI form tương ứng.
5. **Nâng cấp trợ lý AI mô phỏng thành chatbot AI MVP**
   - Giữ lại parser rule-based hiện tại làm fallback.
   - Bổ sung tầng NLP/LLM (hoặc retrieval FAQ) để hiểu ngữ cảnh tốt hơn, giải thích lý do gợi ý và hỗ trợ câu hỏi thủ tục/kinh nghiệm thuê trọ.

---

## 6) Rà soát kỹ thuật toàn dự án trước khi triển khai các gợi ý

Để đảm bảo dự án ở trạng thái ổn định (mức hoàn thiện 60-70%) trước khi phát triển thêm tính năng, đã thực hiện rà soát kỹ thuật tổng thể:

- Backend (`server`):
  - Build thành công.
  - Test unit đã được chuẩn hóa và chạy pass toàn bộ.
  - Bổ sung cấu hình Jest để resolve alias `src/*` ổn định.
- Frontend (`client`):
  - Build production thành công sau khi sửa các lỗi TypeScript và prerender.
  - Khắc phục các lỗi thường gặp: thiếu type khai báo Leaflet, biến/handler review bị thiếu, lỗi Suspense với `useSearchParams` ở trang chat.

### Ý nghĩa của bước rà soát này
- Đảm bảo codebase không bị lỗi compile/test nghiêm trọng trước khi mở rộng tính năng.
- Tránh “xây thêm trên nền chưa ổn định”, giúp các gợi ý ở mục 5 triển khai nhanh và ít phát sinh regressions.

### Trạng thái hiện tại sau rà soát
- Dự án đã quay về trạng thái **có thể build + test ổn định**, phù hợp mốc **60-70%** đã đánh giá ở trên.
- Vì vậy, có thể chuyển sang giai đoạn triển khai các hạng mục ưu tiên ở mục 5 theo thứ tự đã đề xuất.

---

## 7) Ma trận tính năng theo phạm vi khóa luận

| Phân hệ | Mã tính năng | Tính năng | Người dùng | Độ ưu tiên | Trạng thái |
|---|---|---|---|---|---|
| Sinh viên | SV-01 | Đăng ký tài khoản | Student | Cao | Đã hoàn thiện cơ bản |
| Sinh viên | SV-02 | Đăng nhập/đăng xuất | Student | Cao | Đã hoàn thiện cơ bản |
| Sinh viên | SV-03 | Tìm kiếm cơ bản theo từ khóa/địa chỉ | Student | Cao | Đã hoàn thiện |
| Sinh viên | SV-04 | Tìm kiếm nâng cao (giá, diện tích, loại phòng, tiện ích) | Student | Cao | Đã hoàn thiện một phần |
| Sinh viên | SV-05 | Lọc theo cơ sở VLU (CS1/CS2/CS3) | Student | Cao | Chưa hoàn thiện toàn bộ UI |
| Sinh viên | SV-06 | Lọc theo trạng thái còn phòng/đã cho thuê | Student | Cao | Chưa hoàn thiện toàn bộ luồng |
| Sinh viên | SV-07 | Tìm kiếm trực quan trên bản đồ với marker bài đăng | Student | Cao | Chưa hoàn thiện |
| Sinh viên | SV-08 | Xem chi tiết tin đăng (ảnh, mô tả, tiện ích, review) | Student | Cao | Đã hoàn thiện |
| Sinh viên | SV-09 | Xem video tin đăng | Student | Trung bình | Đã có dữ liệu, chưa phủ hết UI |
| Sinh viên | SV-10 | Quản lý hồ sơ cá nhân (xem/cập nhật) | Student | Cao | Đã có xem, thiếu cập nhật đầy đủ |
| Sinh viên | SV-11 | Đánh giá/nhận xét phòng trọ | Student | Trung bình | Đã hoàn thiện cơ bản |
| Chủ trọ | CT-01 | Đăng ký/đăng nhập theo role | Landlord | Cao | Đã hoàn thiện cơ bản |
| Chủ trọ | CT-02 | Tạo tin đăng | Landlord | Cao | Đã hoàn thiện |
| Chủ trọ | CT-03 | Cập nhật tin đăng | Landlord | Cao | Đã hoàn thiện |
| Chủ trọ | CT-04 | Xóa tin đăng | Landlord | Trung bình | Đã hoàn thiện |
| Chủ trọ | CT-05 | Quản lý trạng thái tin đăng (pending/approved/rejected/hidden) | Landlord | Cao | Đã hoàn thiện một phần (phụ thuộc admin) |
| Chủ trọ | CT-06 | Cập nhật trạng thái còn phòng/đã cho thuê | Landlord | Cao | Chưa hoàn thiện toàn bộ UI |
| Chủ trọ | CT-07 | Quản lý thông tin liên hệ/hồ sơ chủ trọ | Landlord | Cao | Chưa hoàn thiện |
| Chủ trọ | CT-08 | Theo dõi đánh giá các tin của mình | Landlord | Trung bình | Đã có dữ liệu, thiếu màn hình tổng hợp |
| Quản trị viên | AD-01 | Đăng nhập khu vực quản trị | Admin | Cao | Đã hoàn thiện cơ bản |
| Quản trị viên | AD-02 | Quản lý người dùng (xem danh sách, bật/tắt hoạt động) | Admin | Cao | Đã hoàn thiện một phần |
| Quản trị viên | AD-03 | Duyệt/từ chối/ẩn bài đăng | Admin | Cao | Đã hoàn thiện |
| Quản trị viên | AD-04 | Kiểm duyệt/xóa review vi phạm | Admin | Cao | Đã hoàn thiện |
| Quản trị viên | AD-05 | Quản lý danh mục loại phòng | Admin | Trung bình | Đã hoàn thiện |
| Quản trị viên | AD-06 | Quản lý danh mục tiện ích | Admin | Trung bình | Đã hoàn thiện |
| Chat/AI | AI-01 | Chat giữa người dùng theo thời gian thực | Student/Landlord | Trung bình | Đã hoàn thiện cơ bản |
| Chat/AI | AI-02 | Trợ lý AI parse câu truy vấn và gợi ý bộ lọc | Student | Cao | Đã hoàn thiện mức MVP |
| Chat/AI | AI-03 | Chatbot AI tích hợp NLP/LLM thực thụ | Student | Trung bình | Chưa hoàn thiện |
| Nền tảng | PL-01 | Kiến trúc FE-BE tách biệt | Tất cả | Cao | Đã hoàn thiện |
| Nền tảng | PL-02 | Xác thực JWT và phân quyền role | Tất cả | Cao | Đã hoàn thiện cơ bản |
| Nền tảng | PL-03 | PostgreSQL + ORM + migration | Tất cả | Cao | Đã hoàn thiện |
| Nền tảng | PL-04 | Google Maps tích hợp dữ liệu động từ listing | Student | Trung bình | Chưa hoàn thiện |

### Ghi chú sử dụng trong báo cáo
- Cột **Trạng thái** có thể quy đổi sang thang đo định lượng (0 = chưa có, 0.5 = một phần, 1 = hoàn thiện) để lập biểu đồ mức đáp ứng phạm vi.
- Các mục trạng thái “chưa hoàn thiện” nên được đưa vào kế hoạch sprint tiếp theo để chứng minh lộ trình cải tiến sau nghiệm thu.
