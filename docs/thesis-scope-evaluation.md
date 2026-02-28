# Đánh giá mức độ đáp ứng phạm vi chức năng & công nghệ (VLU Renting Project)

## 1) Kết luận nhanh
Dự án hiện đã đi qua giai đoạn “nền tảng”, đang ở mức **đáp ứng khá tốt** so với đề tài khóa luận, với nhiều hạng mục đã hoàn thiện ở cả backend và frontend.

Đánh giá tổng quan hiện tại:
- **Đạt/khá rõ**: kiến trúc FE-BE tách biệt, NestJS + React/Next, PostgreSQL, JWT/role guard, CRUD bài đăng, duyệt/ẩn bài, quản trị danh mục (loại phòng/tiện ích), kiểm duyệt review ở admin, profile API, AI assistant MVP (local + cloud hook).
- **Còn khoảng trống**: bản đồ trực quan mới ở mức iframe/map query (chưa có lớp marker động chuẩn map layer), chatbot AI chưa phải LLM hội thoại đầy đủ theo ngữ cảnh dài.

> Mức hoàn thiện đề xuất cho báo cáo: **~75-85% phạm vi mục tiêu**, tùy tiêu chí chấm về “AI thực thụ” và “map data layer”.

---

## 2) Đối chiếu theo phạm vi chức năng

## 2.1 Module Sinh viên

### 2.1.1 Đăng ký, đăng nhập
- **Đáp ứng tốt**: có API đăng ký/đăng nhập backend, tích hợp xác thực token và session frontend.

### 2.1.2 Tìm kiếm cơ bản (khu vực, quận, tên đường)
- **Đáp ứng tốt**: có tìm theo từ khóa, địa chỉ và lọc trực tiếp tại trang listings.

### 2.1.3 Tìm kiếm nâng cao
- **Đáp ứng khá tốt**: hỗ trợ giá, diện tích, loại phòng, tiện ích, cơ sở (`CS1/CS2/CS3`), trạng thái (`available/rented`), video và một số tiêu chí bổ sung từ trợ lý AI.
- **Khoảng trống còn lại**: chuẩn hóa thêm bộ lọc “số người ở” từ `max_occupancy` theo đúng yêu cầu nghiệp vụ nếu hội đồng yêu cầu tách riêng.

### 2.1.4 Tìm kiếm trực quan bản đồ
- **Đáp ứng một phần**: đã có bản đồ nhúng theo tọa độ/địa chỉ và chọn nhanh theo tin.
- **Chưa đạt mức đầy đủ**: chưa có bản đồ marker động dạng data layer (Google Maps JS API/Leaflet cluster + popup card).

### 2.1.5 Xem chi tiết tin đăng
- **Đáp ứng tốt**: có chi tiết bài đăng, review, thông tin liên quan; dữ liệu `videoUrl` đã được bổ sung trong luồng.

### 2.1.6 Quản lý tài khoản (cập nhật thông tin cá nhân)
- **Đáp ứng khá tốt**: đã có API profile và luồng cập nhật profile.

### 2.1.7 Hệ thống đánh giá
- **Đáp ứng tốt**: tạo/sửa/xem review; phía admin có luồng moderation.

---

## 2.2 Module Chủ trọ

### 2.2.1 Đăng ký, đăng nhập
- **Đáp ứng tốt** qua module auth dùng role.

### 2.2.2 Quản lý tin đăng (tạo/sửa/xóa/ẩn-hiện)
- **Đáp ứng tốt**: có luồng tạo/sửa/xóa; trạng thái tin được quản lý cùng quy trình duyệt admin.

### 2.2.3 Cập nhật trạng thái còn phòng/đã cho thuê
- **Đáp ứng khá tốt**: đã có trường `availability` và hiển thị ở listing/listing card.
- **Khuyến nghị**: chuẩn hóa thêm UX edit nhanh trạng thái trong danh sách bài đăng nếu cần demo nghiệp vụ mạnh hơn.

### 2.2.4 Quản lý tài khoản liên hệ
- **Đáp ứng một phần**: đã có profile update, cần rà soát sâu các trường liên hệ chuyên biệt cho chủ trọ theo biểu mẫu khóa luận.

### 2.2.5 Xem đánh giá nhà trọ của mình
- **Đáp ứng một phần**: có dữ liệu review theo bài; nên bổ sung dashboard tổng hợp theo landlord để tăng tính thuyết phục.

---

## 2.3 Module Quản trị viên

### 2.3.1 Đăng nhập trang quản trị riêng
- **Đáp ứng tốt**: có khu vực admin và phân quyền theo role/guard.

### 2.3.2 Quản lý tài khoản (xem DS, phân quyền, khóa/mở)
- **Đáp ứng một phần**: đã có xem danh sách user, bật/tắt hoạt động.
- **Khoảng trống**: phân quyền chi tiết/đổi role nâng cao chưa phải luồng đầy đủ.

### 2.3.3 Quản lý tin đăng (duyệt/gỡ vi phạm)
- **Đáp ứng tốt**: có duyệt/từ chối/ẩn.

### 2.3.4 Quản lý đánh giá vi phạm, spam
- **Đáp ứng**: đã có moderation review ở admin.

### 2.3.5 Quản lý danh mục (tiện ích, loại phòng)
- **Đáp ứng**: đã có CRUD danh mục trong admin catalog.

---

## 2.4 Module Chatbot AI

- **Đáp ứng mức MVP tốt**: trợ lý AI local parser hỗ trợ tiếng Việt tự nhiên, parse tiêu chí và áp lọc tự động.
- **Đáp ứng cloud theo lộ trình**: có cơ chế cloud hook ưu tiên Dialogflow/OpenAI và fallback local parser.
- **Giới hạn hiện tại**: chưa phải chatbot AI hội thoại sâu theo ngữ cảnh dài/knowledge base đầy đủ.

---

## 3) Đối chiếu công nghệ/phương pháp

- **Kiến trúc FE-BE tách biệt**: ✅ Có (`client` / `server`).
- **Backend NestJS**: ✅ Có.
- **Frontend ReactJS**: ✅ Có (Next.js).
- **CSDL PostgreSQL**: ✅ Có (`typeorm` + `pg`).
- **Xác thực JWT**: ✅ Có (strategy/guard, token flow).
- **Chatbot AI**: ⚠️ Mức MVP đã có (local + cloud hook), chưa đạt cấp “AI hội thoại nâng cao”.
- **Google Maps API**: ⚠️ Mới mức nhúng/query; chưa triển khai map layer marker động hoàn chỉnh.

---

## 4) Đánh giá tổng thể dưới góc nhìn GVHD

Nếu lấy bản hiện tại để báo cáo/tiền nghiệm thu:
- Dự án có thể được đánh giá ở mức **khá**, khoảng **75-85%** phạm vi mục tiêu.
- Điểm mạnh: kiến trúc rõ, luồng nghiệp vụ chính đầy đủ, admin moderation + catalog đã có, AI assistant MVP đã vận hành được, build/test ổn định.
- Điểm cần nâng cấp để “chốt điểm cao”: bản đồ marker động theo dữ liệu phòng, chatbot AI ngữ cảnh sâu, dashboard tổng hợp cho landlord/admin nâng cao.

---

## 5) Gợi ý ưu tiên hoàn thiện (theo thứ tự)

1. **Map trực quan data-layer**
   - Dùng Google Maps JS API/Leaflet để render marker từ API posts.
   - Có popup card + đồng bộ click marker ↔ danh sách.

2. **Nâng AI từ MVP lên chatbot thực thụ**
   - Giữ parser local làm fallback.
   - Bổ sung memory ngữ cảnh ngắn + prompt guard + retrieval FAQ/chính sách thuê trọ.

3. **Báo cáo tổng hợp cho landlord/admin**
   - KPI theo tin đăng, tỷ lệ lấp đầy, số review, số lượt quan tâm.

4. **Chuẩn hóa full UX cho trường nghiệp vụ mới**
   - `campus`, `availability`, `videoUrl`, `max_occupancy` xuất hiện đồng nhất trên create/edit/list/detail/filter.

---

## 6) Trạng thái kỹ thuật hiện tại

- `server`: build/test unit ổn định.
- `client`: build production ổn định, TypeScript pass.
- Codebase phù hợp để phát triển sprint nâng cao mà không cần refactor lớn ngay lập tức.

---

## 7) Ma trận tính năng theo phạm vi khóa luận

| Phân hệ | Mã | Tính năng | Trạng thái hiện tại |
|---|---|---|---|
| Sinh viên | SV-01 | Đăng ký/đăng nhập | Đã hoàn thiện |
| Sinh viên | SV-02 | Tìm kiếm cơ bản | Đã hoàn thiện |
| Sinh viên | SV-03 | Tìm kiếm nâng cao (giá, diện tích, loại, tiện ích) | Đã hoàn thiện khá tốt |
| Sinh viên | SV-04 | Lọc CS1/CS2/CS3 | Đã có, cần polish thêm UX |
| Sinh viên | SV-05 | Lọc trạng thái còn phòng/đã cho thuê | Đã có, cần polish thêm UX |
| Sinh viên | SV-06 | Bản đồ trực quan marker động | Chưa hoàn thiện |
| Sinh viên | SV-07 | Xem chi tiết + video | Đã hoàn thiện cơ bản |
| Sinh viên | SV-08 | Quản lý profile | Đã hoàn thiện khá tốt |
| Chủ trọ | CT-01 | Quản lý tin đăng CRUD | Đã hoàn thiện |
| Chủ trọ | CT-02 | Cập nhật trạng thái còn phòng | Đã có trường + hiển thị, cần UX nhanh |
| Chủ trọ | CT-03 | Theo dõi review tin của mình | Đáp ứng một phần |
| Admin | AD-01 | Duyệt/ẩn/từ chối tin | Đã hoàn thiện |
| Admin | AD-02 | Quản lý category/amenity | Đã hoàn thiện |
| Admin | AD-03 | Kiểm duyệt/xóa review | Đã hoàn thiện |
| AI/Chat | AI-01 | Chat realtime người dùng | Đã hoàn thiện cơ bản |
| AI/Chat | AI-02 | Trợ lý AI parse + lọc | Đã hoàn thiện mức MVP |
| AI/Chat | AI-03 | Chatbot NLP/LLM nâng cao | Chưa hoàn thiện |
| Nền tảng | PL-01 | FE-BE tách biệt + JWT + PostgreSQL | Đã hoàn thiện |

### Ghi chú cho báo cáo
- Có thể quy đổi trạng thái thành thang điểm 0 / 0.5 / 1 để vẽ biểu đồ đáp ứng phạm vi.
- Nên trình bày rõ 2 hạng mục còn thiếu trọng tâm: **Map marker động** và **AI hội thoại nâng cao**.
