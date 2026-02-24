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
