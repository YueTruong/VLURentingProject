# Phụ lục: Hướng dẫn khởi tạo, setup và cài dependencies dự án VLU Renting

Tài liệu này giúp bạn setup dự án từ đầu trên máy local và cài đủ các package cần thiết cho cả frontend và backend.

---

## 1) Tổng quan kiến trúc

Repo là monorepo gồm 2 phần chính:

- `client/`: Frontend Next.js + React
- `server/`: Backend NestJS + TypeORM + PostgreSQL

Ngoài ra có:

- `docs/`: tài liệu
- `ai/fine-tune/`: mẫu dữ liệu fine-tune
- `scripts/`: script tiện ích (ví dụ validate JSONL)

---

## 2) Yêu cầu hệ thống

Cài sẵn trước khi bắt đầu:

- **Node.js** >= 20
- **npm** >= 10
- **PostgreSQL** (local hoặc cloud, ví dụ Neon)
- (Khuyến nghị) Git Bash / WSL nếu dùng Windows

Kiểm tra nhanh:

```bash
node -v
npm -v
psql --version
```

---

## 3) Clone và chuẩn bị repo

```bash
git clone <REPO_URL>
cd VLURentingProject
```

Nếu bạn làm việc theo nhánh riêng:

```bash
git checkout -b <your-branch>
```

---

## 4) Cài dependencies cho từng workspace

> Dự án dùng mô hình cài riêng cho `client` và `server`.

### 4.1 Frontend

```bash
cd client
npm install
```

### 4.2 Backend

```bash
cd ../server
npm install
```

---

## 5) Tạo file môi trường (.env)

Từ root repo:

```bash
cp server/.env.example server/.env
cp client/env.local.example client/.env.local
```

### 5.1 Biến môi trường backend cần chú ý

Trong `server/.env`:

- Database:
  - Dùng **1 trong 2 cách**:
    - `DATABASE_URL` (khuyến nghị cho Neon/cloud)
    - hoặc `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (local)
- JWT:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN`
- AI:
  - `AI_PROVIDER`
  - `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`
  - (nếu dùng Dialogflow) `DIALOGFLOW_WEBHOOK_URL`, `DIALOGFLOW_TOKEN`
- Cloudinary:
  - `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 5.2 Biến môi trường frontend cần chú ý

Trong `client/.env.local`:

- `NEXT_PUBLIC_API_URL=http://localhost:3001`
- hoặc fallback `NEXT_PUBLIC_BACKEND_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_ENABLE_CLOUD_AI`

---

## 6) Khởi chạy dự án local

Mở 2 terminal:

### Terminal A: Backend

```bash
cd server
npm run start:dev
```

Mặc định API: `http://localhost:3001`

### Terminal B: Frontend

```bash
cd client
npm run dev
```

Mặc định web app: `http://localhost:3000`

---

## 7) Hướng dẫn cài các dependencies/thư viện thường dùng

### 7.1 Cài mới package cho frontend

```bash
cd client
npm install <package-name>
```

Ví dụ:

```bash
npm install axios react-hot-toast leaflet
```

Cài dev dependency:

```bash
npm install -D <package-name>
```

Ví dụ:

```bash
npm install -D @types/node @types/react eslint typescript
```

### 7.2 Cài mới package cho backend

```bash
cd server
npm install <package-name>
```

Ví dụ:

```bash
npm install @nestjs/config class-validator class-transformer
```

Cài dev dependency:

```bash
npm install -D <package-name>
```

Ví dụ:

```bash
npm install -D @types/express jest ts-jest @types/jest
```

### 7.3 Cài package ở root repo (nếu cần script chung)

```bash
cd <repo-root>
npm install <package-name>
```

> Chỉ dùng khi package phục vụ script/tooling ở root (ví dụ script validate chung).

---

## 8) Các lệnh kiểm tra chất lượng khuyến nghị

### Frontend

```bash
cd client
npm run lint
npm run build
```

### Backend

```bash
cd server
npm run lint
npm run build
npm run test
```

---

## 9) Fine-tune scaffold (nếu dùng AI)

Repo có sẵn file mẫu tại `ai/fine-tune/` và script validate JSONL.

Chạy từ root:

```bash
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/train.example.jsonl
node scripts/validate-finetune-jsonl.mjs ai/fine-tune/validation.example.jsonl
```

---

## 10) Các lỗi setup phổ biến và cách xử lý

### Lỗi không kết nối DB

- Kiểm tra lại bạn đang dùng `DATABASE_URL` hay `DB_*`.
- Nếu có cả 2, backend thường ưu tiên `DATABASE_URL`.
- Kiểm tra quyền user DB và schema/table tồn tại.

### Lỗi CORS / gọi API sai host

- Đồng bộ `NEXT_PUBLIC_API_URL` với cổng backend thật (`3001`).

### Lỗi package/lockfile

```bash
rm -rf node_modules package-lock.json
npm install
```

(Thực hiện riêng trong `client` hoặc `server` để tránh ảnh hưởng workspace còn lại.)

### Lỗi TypeScript

- Chạy `npm run build` để thấy lỗi đầy đủ.
- Kiểm tra các file khai báo type (`*.d.ts`) trong dự án nếu liên quan thư viện ngoài.

---

## 11) Quy trình gợi ý cho thành viên mới

1. Clone repo và checkout nhánh cá nhân.
2. Cài dependencies cho `client` và `server`.
3. Tạo `.env` từ file mẫu.
4. Chạy backend + frontend local.
5. Chạy lint/build/test trước khi push.
6. Mở PR kèm mô tả thay đổi và kết quả test.

---

## 12) Ghi chú bảo mật

- Không commit file `.env` thật.
- Không hardcode API key/secrets trong code.
- Dùng biến môi trường riêng cho dev/staging/prod.
