# Task Manager — Hệ thống giao việc nội bộ

Đặc tả nghiệp vụ: [spec.md](spec.md) (mã yêu cầu như `BRD-02`, `TSK-05` được ghi chú ngay trong code).

| Phần | Công nghệ |
| --- | --- |
| Backend | Node.js 20+, Express 5, Sequelize 6, PostgreSQL 17, Zod, JWT (cookie httpOnly), Google Identity |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query, React Router, dnd-kit, TipTap, font Be Vietnam Pro (tự host) |

## Chạy trên máy dev

```bash
# 1. PostgreSQL (cổng 5434)
docker compose up -d

# 2. Backend — http://localhost:4000/api/v1
cd backend
cp .env.example .env          # đặt JWT_ACCESS_SECRET, INITIAL_ADMIN_EMAIL, GOOGLE_CLIENT_ID
npm install
npm run db:migrate && npm run db:seed
npm run dev

# 3. Frontend — http://localhost:5173 (proxy /api sang backend)
cd frontend
cp .env.example .env          # đặt VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Làm lại database dev từ đầu: `npm run db:reset` (trong `backend/`).

Chưa có Google Client ID? Giữ `ALLOW_DEV_LOGIN=true` (backend) và `VITE_ENABLE_DEV_LOGIN=true` (frontend) để đăng nhập bằng email đã có trong hệ thống. **Không bao giờ bật ở production** — backend sẽ từ chối khởi động.

## Kiến trúc backend: Route → Controller → Service → Repository → Model

```
backend/src/
├── config/          env (kiểm tra bằng Zod khi khởi động), database
├── models/          Sequelize model + quan hệ — chỉ mô tả dữ liệu
├── repositories/    lớp DUY NHẤT truy cập model; truy vấn phức tạp nằm ở đây
├── services/        nghiệp vụ & quy tắc (BR-xx), kiểm tra quyền qua ProjectAccessService
├── controllers/     chỉ xử lý HTTP: đọc req.valid, gọi service, trả JSON/cookie
├── validators/      schema Zod cho params/query/body (thông điệp tiếng Việt)
├── routes/v1/       khai báo endpoint + middleware
├── middlewares/     authenticate, requireAdmin, validate, errorHandler
├── integrations/    dịch vụ bên ngoài: Google, lưu tệp (ổ đĩa → có thể đổi S3), SMTP
├── jobs/            tác vụ định kỳ (nhắc hạn 8:00)
├── database/        migrations, seeders
├── container.js     composition root — khởi tạo và nối các lớp (DI thủ công)
├── app.js           cấu hình Express
└── server.js        khởi động, tắt an toàn
```

Quy tắc phụ thuộc: mỗi lớp chỉ gọi lớp ngay dưới nó. Service không `require` model; controller không chứa nghiệp vụ.

- **Phân quyền**: mọi tài nguyên thuộc dự án đi qua `ProjectAccessService.assert(user, projectId, minRole)`. Người ngoài dự án nhận 404, Người xem nhận 403 với mọi thao tác ghi, dự án lưu trữ chỉ đọc.
- **Transaction**: service dùng `unitOfWork.run(async (transaction) => …)` và truyền `{ transaction }` xuống repository.
- **Lỗi**: ném `AppError.badRequest/forbidden/notFound/conflict(...)`; `errorHandler` chuẩn hóa thành `{ error: { code, message, details? } }`.
- **Thứ tự kéo thả**: `position` là số thực; chèn giữa = trung bình cộng, tự đánh số lại cột khi khoảng cách quá nhỏ.

**Thêm một module mới** (ví dụ thông báo): model + migration → repository → service → controller → validator → route → đăng ký trong `container.js` và `routes/index.js`.

## Kiến trúc frontend: Clean Architecture + Atomic Design

```
frontend/src/
├── domain/            THUẦN TypeScript: entity + quy tắc (quá hạn, phân quyền, gợi ý mã dự án…)
├── infrastructure/    HTTP client (tự refresh token), các module gọi API
├── application/       use-case dạng hook (TanStack Query), optimistic update, theme, thông báo
├── components/
│   ├── ui/            shadcn/ui — sinh bởi CLI, hạn chế sửa tay
│   ├── atoms/         phần tử nhỏ nhất: UserAvatar, PriorityIcon, TaskKey, LabelChip…
│   ├── molecules/     ghép atoms: InlineEditText, AssigneePicker, DueDatePicker, ThemeSwitcher…
│   ├── organisms/     khối có nghiệp vụ: KanbanBoard, TaskDetailDialog, RichTextEditor…
│   └── templates/     khung trang: AppLayout, AuthLayout, PageHeader
├── pages/             ghép template + organism, nối với hook của application
├── app/               providers, router (lazy load từng trang), RequireAuth
├── config/ lib/       biến môi trường, tiện ích
```

Chiều phụ thuộc (chỉ hướng vào trong):

```
pages → templates → organisms → molecules → atoms → ui
  └──────────────┬─────────────┘
           application → infrastructure → domain
```

- `atoms`/`molecules` chỉ nhận props, **không** gọi hook dữ liệu → dễ tái sử dụng và test.
- `organisms`/`pages` dùng hook từ `application`, không gọi `infrastructure` trực tiếp.
- `domain` không import React, axios hay thư viện UI.
- Thêm component shadcn: `npx shadcn@latest add <tên>`.

## Kiểm thử

- API: `npm run test:smoke` trong `backend/` (cần API đang chạy với `ALLOW_DEV_LOGIN=true`) — 107 bước: phân quyền, kéo thả, việc con, tệp, @nhắc tên, thông báo, nhắc hạn, lịch sử, nhãn, sprint/backlog, lịch, kho tệp… Chạy lặp được trên cùng database. CI chạy tự động.
- Frontend: `npm run typecheck` và `npm run build`.

## Đã có

- Đăng nhập Google, quản trị nhân viên, dự án & 3 vai trò (Quản lý / Thành viên / Người xem)
- Dạng xem **Bảng** (kéo thả thẻ và kéo thả sắp xếp cột, đổi tên bảng/cột), **Backlog & Sprint**, **Danh sách**, **Lịch** (kéo thả để đổi hạn)
- Sprint: tạo, bắt đầu (mỗi dự án 1 sprint chạy), hoàn thành (chuyển việc dở về backlog/sprint sau); khi có sprint chạy bảng chỉ hiện việc của sprint
- Công việc, việc con, nhãn (quản lý + gắn nhãn), tệp đính kèm (kiểm tra magic bytes), rich text (checklist, dán ảnh, @nhắc tên), bình luận, người theo dõi
- **Lịch sử thay đổi** từng công việc (ai, khi nào, trường nào, cũ → mới)
- **Kho tệp tập trung** (trang Tệp đính kèm + tab Tệp trong dự án): tìm theo tên, lọc dự án/loại tệp/tệp của tôi, xem trước ảnh & PDF; mỗi tệp ghi rõ thuộc công việc nào, bấm là mở đúng công việc
- Thông báo trong ứng dụng + email, nhắc hạn 8:00 hằng ngày, Việc của tôi, cài đặt cá nhân, giao diện Sáng/Tối/Hệ thống
- Docker + Nginx + CI/CD — xem [deploy/DEPLOY.md](deploy/DEPLOY.md)

## Còn lại theo spec

- Dòng hoạt động cấp dự án (AUD-03), báo cáo sprint & burndown (SPR-07/08)
- Hướng dẫn lần đầu (UX-10), sửa hàng loạt (SRC-04)
- Gom email trong 5 phút (NTF-04), biểu đồ tổng quan dự án (DSH-02/03)
