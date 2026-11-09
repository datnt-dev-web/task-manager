# Đặc tả Yêu cầu Nghiệp vụ — Hệ thống Giao việc Nội bộ

| Thuộc tính | Giá trị |
| --- | --- |
| Tên dự án | Task Manager — Hệ thống giao việc nội bộ |
| Mã tài liệu | TM-BRD-001 |
| Phiên bản | 2.3 |
| Ngày cập nhật | 09/11/2026 |
| Người soạn | @Khanh Nguyen (BA) |
| Trạng thái | Bản nháp — chờ duyệt |

**Lịch sử thay đổi**

| Phiên bản | Ngày | Nội dung |
| --- | --- | --- |
| 1.0 | 09/11/2026 | Bản kế hoạch dự án ban đầu |
| 2.0 | 09/11/2026 | Chuẩn hóa thành tài liệu nghiệp vụ, bổ sung tính năng theo mô hình Jira |
| 2.1 | 09/11/2026 | Định hướng lại theo tiêu chí **dễ dùng**: chỉ tham khảo Jira, lược bỏ khái niệm phức tạp (Epic, Story, Sprint, Story point, cấu hình workflow); thuật ngữ tiếng Việt; bổ sung nguyên tắc trải nghiệm người dùng |
| 2.2 | 09/11/2026 | Chốt Q1: thêm vai trò **Người xem** (chỉ xem, không sửa); chốt Q2: **đăng nhập bằng tài khoản Google** ngay từ MVP; bổ sung thông tin môi trường triển khai `beta.hopphu.vn` |
| 2.3 | 09/11/2026 | Chốt Q5: nhân viên dùng **Gmail cá nhân** (không giới hạn tên miền); chốt Q6: `beta.hopphu.vn` là **môi trường chính thức** |
| 2.4 | 09/11/2026 | Cập nhật theo bản đã triển khai: đăng ký / đăng nhập **email + mật khẩu** (Google là đăng nhập nhanh), quên / đổi mật khẩu; rút còn **2 vai trò dự án: Admin và Thành viên** (bỏ Người xem); chỉ Quản trị viên tạo dự án; **quy trình duyệt** (Thành viên chuyển sang Chờ duyệt, Admin đưa vào Hoàn thành); bộ lọc bảng / danh sách mở rộng, tìm kiếm toàn hệ thống |

---

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Mô tả yêu cầu nghiệp vụ, chức năng và phi chức năng của hệ thống giao việc nội bộ, làm căn cứ để duyệt phạm vi, ước lượng, phát triển và nghiệm thu.

### 1.2 Định hướng sản phẩm

> **Đơn giản trước, đầy đủ sau.** Người mới vào dùng được ngay, không cần đào tạo.

Hệ thống tham khảo cách Jira tổ chức công việc (dự án → bảng → cột → thẻ công việc, mã công việc, kéo thả), nhưng **không** sao chép độ phức tạp của Jira. Mỗi tính năng phải trả lời được câu hỏi: *"Nhân viên không rành công nghệ có dùng được mà không cần hỏi ai không?"*

| Lấy từ Jira | Không lấy (hoặc để sau) |
| --- | --- |
| Mã công việc dễ nhắc (`MKT-12`) | Epic, Story, nhiều loại issue |
| Bảng Kanban kéo thả, đổi tên bảng/cột | Workflow có điều kiện, ánh xạ trạng thái ↔ cột |
| Màn hình chi tiết công việc, sửa trực tiếp | Màn hình cấu hình nhiều tầng, trường tùy chỉnh |
| Bộ lọc nhanh, tìm kiếm theo mã/tiêu đề | Ngôn ngữ truy vấn JQL |
| Bình luận, @nhắc tên, lịch sử thay đổi | Story point, sprint, burndown (giai đoạn sau) |

### 1.3 Phạm vi

| Trong phạm vi (MVP) | Ngoài phạm vi / giai đoạn sau |
| --- | --- |
| Đăng nhập bằng tài khoản Google, phân quyền đơn giản | Đăng ký công khai, nhiều tổ chức, đăng nhập Microsoft |
| Dự án, bảng Kanban, công việc, việc con | Sprint, backlog, story point |
| Rich text, bình luận, @nhắc tên, tệp đính kèm | Ứng dụng mobile native |
| Dạng Bảng, Danh sách, Việc của tôi | Lịch, Timeline/Gantt |
| Thông báo trong ứng dụng và email | Tích hợp Slack, Zalo, Google Calendar |
| Tổng quan dự án đơn giản | Báo cáo nâng cao, xuất Excel |
| Giao diện Sáng / Tối / Theo hệ thống | Đa ngôn ngữ (MVP chỉ tiếng Việt) |

### 1.4 Thuật ngữ

| Thuật ngữ | Ý nghĩa |
| --- | --- |
| Dự án | Nơi chứa công việc của một nhóm hoặc một mục tiêu; có **mã dự án** ngắn, ví dụ `MKT`, `HR` |
| Bảng | Màn hình hiển thị công việc theo cột (Kanban). Mỗi dự án có 1 bảng, đổi tên được |
| Cột | Một bước xử lý trên bảng, ví dụ "Cần làm", "Đang làm". **Cột chính là trạng thái** của công việc |
| Công việc | Một thẻ việc cần làm; có mã tự sinh, ví dụ `MKT-12` |
| Việc con | Việc nhỏ nằm trong một công việc, có thể giao cho người khác |
| Nhãn | Thẻ màu để phân loại công việc (ví dụ "Gấp khách hàng", "Nội bộ") |
| Người theo dõi | Người nhận thông báo khi công việc thay đổi |

---

## 2. Tổng quan nghiệp vụ

### 2.1 Vấn đề hiện tại

- Giao việc qua chat, email, bảng tính → thất lạc, không rõ ai phụ trách, không có lịch sử.
- Quản lý phải hỏi từng người để biết tiến độ.
- Trao đổi và tệp liên quan nằm rải rác nhiều nơi.

### 2.2 Mục tiêu nghiệp vụ

| Mã | Mục tiêu | Chỉ số đo |
| --- | --- | --- |
| BO-01 | Tập trung việc giao nhận vào một nơi | > 90% việc mới được tạo trên hệ thống sau 1 tháng |
| BO-02 | Mỗi người biết rõ việc của mình, hạn, mức ưu tiên | ≥ 80% thành viên đăng nhập hằng tuần |
| BO-03 | Quản lý nắm tiến độ không cần hỏi | Trang tổng quan dự án được dùng trong họp tuần |
| BO-04 | Dễ dùng, không cần đào tạo | Người mới tạo và giao việc đầu tiên trong < 3 phút |

### 2.3 Vai trò người dùng

Chỉ có **2 lớp, 4 vai trò**, dễ hiểu:

| Lớp | Vai trò | Được làm gì |
| --- | --- | --- |
| Hệ thống | Quản trị viên | Quản lý tài khoản nhân viên, **tạo dự án**, xem và có quyền Admin ở mọi dự án |
| Hệ thống | Người dùng | Vào các dự án mình được thêm; quyền trong từng dự án theo vai trò bên dưới |
| Dự án | Admin | Toàn quyền trong dự án: sửa dự án, bảng/cột, nhãn, thành viên; tạo / sửa / xóa / giao việc; **duyệt việc vào Hoàn thành** |
| Dự án | Thành viên | Xem toàn bộ dự án. Với **việc được giao cho mình**: bình luận, đính kèm tệp, chuyển trạng thái (tối đa tới **Chờ duyệt**). Không tạo / sửa / xóa việc |

Người tạo dự án tự động là Admin của dự án. Giao diện ẩn các nút mà người dùng không có quyền; API vẫn kiểm tra lại mọi thao tác.

### 2.4 Luồng sử dụng chính

```
Tạo dự án ──► Mời thành viên ──► Tạo công việc ──► Giao người & đặt hạn
                                                          │
Xem tổng quan ◄── Kéo sang "Hoàn thành" ◄── Trao đổi, đính kèm ◄── Nhận thông báo
```

---

## 3. Nguyên tắc trải nghiệm người dùng

Đây là yêu cầu bắt buộc, áp dụng cho mọi màn hình và là tiêu chí nghiệm thu.

| Mã | Nguyên tắc | Cách áp dụng |
| --- | --- | --- |
| UX-01 | Tạo việc nhanh nhất có thể | Chỉ **tiêu đề** là bắt buộc; gõ tiêu đề + Enter ngay trong cột là xong; các trường khác bổ sung sau |
| UX-02 | Mặc định thông minh | Dự án tạo sẵn bảng với 4 cột; công việc mặc định ưu tiên Trung bình, nằm ở cột đầu tiên |
| UX-03 | Sửa tại chỗ | Bấm vào trường nào sửa trường đó, tự lưu; không có nút "Chỉnh sửa" / "Lưu" riêng |
| UX-04 | Không quá 3 lần bấm | Mọi thao tác thường dùng (giao việc, đổi hạn, đổi trạng thái, bình luận) ≤ 3 lần bấm |
| UX-05 | Ngôn ngữ đời thường | Dùng tiếng Việt quen thuộc: "Công việc", "Người làm", "Hạn"; không dùng thuật ngữ như issue, epic, sprint |
| UX-06 | Hoàn tác được | Xóa, chuyển cột, đổi người làm đều hiện thông báo kèm nút **Hoàn tác** trong 5 giây |
| UX-07 | Màn hình trống có hướng dẫn | Khi chưa có dữ liệu, hiển thị lời gợi ý và nút hành động ("Tạo công việc đầu tiên") |
| UX-08 | Phản hồi tức thì | Kéo thả, đổi trạng thái hiển thị ngay, đồng bộ nền; lỗi thì hoàn lại và báo rõ lý do |
| UX-09 | Thông báo lỗi dễ hiểu | Nói rõ chuyện gì xảy ra và cần làm gì, không hiện mã lỗi kỹ thuật |
| UX-10 | Hướng dẫn lần đầu | Lần đăng nhập đầu tiên có 3–4 bước giới thiệu ngắn, bỏ qua được |

---

## 4. Yêu cầu chức năng

Mức ưu tiên: **M** – bắt buộc MVP · **S** – nên có nếu kịp · **C** – giai đoạn sau.

### 4.1 Tài khoản & đăng nhập (AUTH)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| AUTH-01 | Trang đăng nhập có form **email + mật khẩu** (có nút hiện/ẩn mật khẩu) và nút **"Tiếp tục với Google"** làm cách đăng nhập nhanh | M |
| AUTH-02 | **Đăng ký** bằng họ tên, email, mật khẩu (≥ 8 ký tự). Đăng nhập Google lần đầu với email chưa có cũng tự tạo tài khoản. Tài khoản mới là Thành viên, chưa thuộc dự án nào cho tới khi được thêm | M |
| AUTH-03 | Lần đăng nhập đầu tiên tự lấy họ tên, ảnh đại diện từ Google; trạng thái tài khoản chuyển từ "Đã mời" sang "Đang hoạt động" | M |
| AUTH-04 | Giữ đăng nhập 7 ngày trên thiết bị (không phải đăng nhập lại mỗi ngày); đăng xuất | M |
| AUTH-05 | Hồ sơ cá nhân: sửa tên hiển thị, chức danh; ảnh đại diện mặc định theo Google, đổi được | M |
| AUTH-06 | **Quên mật khẩu**: gửi liên kết đặt lại qua email (dùng 1 lần, hết hạn 30 phút). **Đặt / đổi mật khẩu** trong Cài đặt (tài khoản chỉ dùng Google đặt được mật khẩu mới); đổi xong các thiết bị khác bị đăng xuất | M |
| AUTH-07 | Giới hạn theo tên miền email công ty | W — không áp dụng vì nhân viên dùng Gmail cá nhân; kiểm soát bằng phân quyền dự án và khóa tài khoản |

**Quy tắc:**
- Mật khẩu chỉ lưu dạng băm (scrypt); token đặt lại mật khẩu chỉ lưu dạng băm. Form "Quên mật khẩu" luôn báo đã gửi để không lộ email nào có tài khoản.
- Không cho đăng ký trùng email đã có (kể cả tài khoản được mời) để tránh chiếm tài khoản khi chưa xác minh email.
- Có thể cố định một tài khoản Quản trị viên qua biến môi trường `INITIAL_ADMIN_EMAIL` + `INITIAL_ADMIN_PASSWORD` (chỉ đặt trên máy chủ, không đưa vào mã nguồn).
- Server phải xác minh ID token của Google (chữ ký, `aud` = Client ID của hệ thống, `email_verified = true`) trước khi tạo phiên.
- Liên kết tài khoản theo email; lần đầu lưu `google_id`, các lần sau đối chiếu theo `google_id`.
- Tài khoản bị vô hiệu hóa đăng nhập Google thành công vẫn bị từ chối vào hệ thống.
- Vì nhân viên dùng Gmail cá nhân (công ty không thu hồi được tài khoản Google), khi nhân viên nghỉ việc Quản trị viên **bắt buộc** vô hiệu hóa tài khoản trên hệ thống; mọi phiên đăng nhập của người đó bị hủy ngay.

### 4.2 Quản trị người dùng (ADM)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ADM-01 | Danh sách nhân viên, tìm theo tên/email | M |
| ADM-02 | Thêm nhân viên bằng email Google (một hoặc nhiều email); hệ thống gửi email mời kèm link tới trang đăng nhập | M |
| ADM-03 | Vô hiệu hóa / mở lại tài khoản (không xóa để giữ lịch sử) | M |
| ADM-04 | Cấp / bỏ quyền Quản trị viên | M |
| ADM-05 | Chuyển quyền Admin dự án khi người phụ trách nghỉ việc | M |

### 4.3 Dự án (PRJ)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| PRJ-01 | **Quản trị viên** tạo dự án: nhập **tên** (bắt buộc); **mã dự án** tự gợi ý từ tên (ví dụ "Marketing" → `MKT`), sửa được; mô tả, màu/biểu tượng (tùy chọn) | M |
| PRJ-02 | Sửa tên, mô tả, biểu tượng dự án | M |
| PRJ-03 | Lưu trữ dự án (ẩn khỏi danh sách, chỉ xem) và khôi phục | M |
| PRJ-04 | Thêm / gỡ thành viên, đổi vai trò (**Admin / Thành viên**) | M |
| PRJ-05 | Trang danh sách dự án: dự án của tôi, đánh dấu sao, xem gần đây | M |
| PRJ-06 | Quản lý nhãn của dự án: tên, màu (có sẵn bảng màu gợi ý) | M |
| PRJ-07 | Xóa dự án (chỉ Quản trị viên, phải gõ lại tên dự án để xác nhận) | S |

**Quy tắc:** mã dự án 2–6 ký tự in hoa, duy nhất, **không đổi được** sau khi đã có công việc. Dự án luôn có ít nhất 1 Admin.

### 4.4 Bảng & Cột (BRD)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| BRD-01 | Mỗi dự án có sẵn 1 bảng tên "Bảng công việc" với 4 cột: **Cần làm · Đang làm · Chờ duyệt · Hoàn thành** | M |
| BRD-02 | **Đổi tên bảng**: bấm trực tiếp vào tên bảng, gõ tên mới, Enter để lưu, Esc để hủy | M |
| BRD-03 | **Thêm, đổi tên, kéo đổi vị trí, xóa cột** ngay trên bảng (menu "…" ở đầu cột) | M |
| BRD-04 | Đánh dấu một cột là **cột Hoàn thành** (mặc định cột cuối); việc vào cột này được tính là đã xong | M |
| BRD-05 | Kéo thả công việc giữa các cột (đổi trạng thái) và trong cột (đổi thứ tự). **Chỉ Admin** được kéo việc vào hoặc ra khỏi cột Hoàn thành; Thành viên làm xong thì kéo sang **Chờ duyệt**. Cột đích hợp lệ sáng viền khi kéo | M |
| BRD-06 | Thẻ công việc hiển thị: mã, tiêu đề, ảnh người làm, hạn (đỏ nếu quá hạn), mức ưu tiên, nhãn, số việc con đã xong (ví dụ 2/5) | M |
| BRD-07 | Thêm nhanh công việc ở cuối mỗi cột: gõ tiêu đề + Enter | M |
| BRD-08 | Bộ lọc nhanh phía trên bảng: **Việc của tôi**, chọn người làm (bấm avatar), **nhãn, ưu tiên, hạn** (quá hạn / sắp đến hạn 3 ngày / không có hạn), ô tìm kiếm; nút "Xóa lọc" | M |
| BRD-09 | Giới hạn số việc trong cột (WIP), vượt thì cột đổi màu cảnh báo | C |
| BRD-10 | Nhiều bảng trong một dự án | C |

**Quy tắc:**
- Tên bảng: 1–100 ký tự; tên cột: 1–30 ký tự, không trùng trong cùng bảng; tự bỏ khoảng trắng thừa.
- Tối thiểu 2 cột, tối đa 10 cột; luôn có đúng 1 cột Hoàn thành.
- Xóa cột còn công việc → hệ thống hỏi chuyển các việc đó sang cột nào.
- Chỉ Admin dự án được đổi tên bảng và cấu hình cột; thay đổi hiển thị ngay cho mọi người và ghi vào lịch sử.

### 4.5 Công việc (TSK)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| TSK-01 | Tạo công việc: thêm nhanh trong cột (chỉ tiêu đề) hoặc nút **"+ Tạo"** trên thanh đầu trang (phím tắt `C`) | M |
| TSK-02 | Mã công việc tự sinh theo dự án (`MKT-1`, `MKT-2`…), không tái sử dụng | M |
| TSK-03 | Loại công việc: **Công việc** (mặc định) hoặc **Lỗi** — chỉ khác biểu tượng, giúp lọc | M |
| TSK-04 | Chi tiết công việc mở dạng cửa sổ bên trên bảng; có link riêng để chia sẻ (`/MKT-12`) | M |
| TSK-05 | Sửa tại chỗ mọi trường; tự lưu | M |
| TSK-06 | Mô tả soạn bằng **rich text** (mục 4.6) | M |
| TSK-07 | **Việc con**: thêm nhanh dạng danh sách, mỗi việc con có tick hoàn thành, có thể giao người và đặt hạn riêng | M |
| TSK-08 | Người theo dõi: tự thêm người tạo, người làm, người bình luận; ai cũng tự bấm "Theo dõi"/"Bỏ theo dõi" được | M |
| TSK-09 | Lịch sử thay đổi: ai đổi gì, lúc nào (ví dụ "Lan đổi hạn từ 10/11 sang 15/11") | M |
| TSK-10 | Sao chép link, nhân bản công việc | S |
| TSK-11 | Xóa công việc (**chỉ Admin**), có Hoàn tác; xóa việc cha thì xóa cả việc con | M |
| TSK-12 | Liên kết công việc liên quan | C |

**Thông tin của một công việc**

| Trường | Bắt buộc | Ghi chú | Mặc định |
| --- | --- | --- | --- |
| Tiêu đề | **Có** | 1–255 ký tự | — |
| Mô tả | Không | Rich text | Trống |
| Trạng thái (cột) | Có | Một cột của bảng | Cột đang thêm, hoặc cột đầu tiên |
| Người làm | Không | Một thành viên dự án | Chưa giao |
| Hạn | Không | Chọn ngày; có lựa chọn nhanh: Hôm nay, Ngày mai, Cuối tuần | — |
| Ưu tiên | Có | Khẩn cấp / Cao / Trung bình / Thấp | Trung bình |
| Nhãn | Không | Nhiều nhãn | — |
| Loại | Có | Công việc / Lỗi | Công việc |
| Người tạo | Có | Tự động | Người đang đăng nhập |
| Việc con, Tệp đính kèm | Không | Xem TSK-07, mục 4.8 | — |

### 4.6 Soạn thảo Rich text (RTE)

Dùng chung cho mô tả công việc, bình luận và mô tả dự án. Thanh công cụ gọn, chỉ hiện các nút phổ biến; nút ít dùng nằm trong menu "…".

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| RTE-01 | Đậm, nghiêng, gạch chân, gạch ngang, màu chữ, tô nền | M |
| RTE-02 | Tiêu đề (3 cỡ), trích dẫn, đường kẻ ngang | M |
| RTE-03 | Danh sách chấm, danh sách số, **checklist** | M |
| RTE-04 | Chèn link; dán URL tự thành link; gõ mã công việc (`MKT-12`) tự thành link | M |
| RTE-05 | Chèn ảnh bằng **dán (Ctrl+V)**, kéo thả hoặc chọn tệp | M |
| RTE-06 | **@nhắc tên** thành viên (gõ `@` hiện gợi ý) → người được nhắc nhận thông báo | M |
| RTE-07 | Khối code, bảng đơn giản | S |
| RTE-08 | Phím tắt quen thuộc (Ctrl+B, Ctrl+I, Ctrl+K) và gõ nhanh kiểu markdown (`#`, `-`, `[]`) | S |
| RTE-09 | Tự lưu nháp khi đang gõ; cảnh báo khi đóng mà chưa lưu | S |

**Quy tắc:** nội dung được làm sạch phía server trước khi lưu/hiển thị để chống mã độc (XSS); ảnh lưu thành tệp đính kèm, không nhúng trực tiếp vào nội dung.

### 4.7 Bình luận (CMT)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| CMT-01 | Viết bình luận rich text, Ctrl+Enter để gửi. Admin bình luận mọi việc; Thành viên bình luận việc được giao cho mình | M |
| CMT-02 | Sửa/xóa bình luận của mình (hiện "đã sửa"); Admin xóa được mọi bình luận | M |
| CMT-03 | Chuyển xem: Bình luận / Lịch sử / Tất cả | M |
| CMT-04 | Thả cảm xúc (emoji) vào bình luận | C |

### 4.8 Tệp đính kèm (ATT)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ATT-01 | Kéo thả hoặc chọn nhiều tệp tải lên cùng lúc, có thanh tiến trình | M |
| ATT-02 | Xem trước ảnh và PDF ngay trong hệ thống; loại khác thì tải xuống | M |
| ATT-03 | Xóa tệp (người tải lên hoặc Admin) | M |

**Quy tắc:** tối đa 10 MB/tệp; cho phép ảnh, PDF, Word, Excel, PowerPoint, txt, csv, zip; chỉ thành viên dự án mới tải được tệp.

### 4.9 Danh sách & Tìm kiếm (SRC)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| SRC-01 | **Dạng Danh sách**: xem công việc dạng bảng, bấm tiêu đề cột để sắp xếp, phân trang | M |
| SRC-02 | Dạng Danh sách lọc theo: người làm (của tôi / chưa giao / từng người), trạng thái, ưu tiên, nhãn, loại, hạn (quá hạn / sắp đến hạn / không có hạn); lọc và phân trang ở backend | M |
| SRC-03 | **Tìm kiếm** ở thanh đầu trang (phím tắt `/`) theo mã hoặc tiêu đề trong mọi dự án được xem, gợi ý kết quả khi đang gõ; chọn kết quả mở thẳng công việc | M |
| SRC-04 | Chọn nhiều công việc → đổi người làm, trạng thái, nhãn cùng lúc | S |
| SRC-05 | Lưu bộ lọc hay dùng | C |

### 4.10 Việc của tôi & Tổng quan (DSH)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| DSH-01 | **Trang chủ "Việc của tôi"** (trang mở đầu sau khi đăng nhập), chia nhóm: **Quá hạn · Hôm nay · Tuần này · Sau đó · Không có hạn** | M |
| DSH-02 | Tổng quan dự án: số việc theo cột, theo người làm, số việc quá hạn, % hoàn thành | M |
| DSH-03 | Biểu đồ việc tạo mới vs hoàn thành 30 ngày gần nhất | S |
| DSH-04 | Dạng Lịch tháng; Timeline | C |

### 4.11 Thông báo (NTF)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| NTF-01 | Chuông thông báo: số chưa đọc, bấm vào mở đúng công việc, "Đánh dấu đã đọc tất cả" | M |
| NTF-02 | Email thông báo cho các sự kiện quan trọng | M |
| NTF-03 | Cài đặt: bật/tắt email theo từng loại sự kiện | S |

| Sự kiện | Người nhận | Trong ứng dụng | Email |
| --- | --- | :---: | :---: |
| Được giao việc | Người làm mới | ✔ | ✔ |
| Được @nhắc tên | Người được nhắc | ✔ | ✔ |
| Sắp đến hạn (8:00 sáng, trước 1 ngày) | Người làm | ✔ | ✔ |
| Quá hạn | Người làm | ✔ | ✔ |
| Có bình luận mới | Người theo dõi | ✔ | — |
| Chuyển cột | Người theo dõi | ✔ | — |
| Được thêm vào dự án | Người được thêm | ✔ | ✔ |

Không gửi thông báo cho chính người thực hiện hành động.

### 4.12 Giao diện Sáng / Tối / Theo hệ thống (THM)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| THM-01 | Ba lựa chọn: **Sáng · Tối · Theo hệ thống**; đổi nhanh từ menu ảnh đại diện (góc phải trên) | M |
| THM-02 | Mặc định **Theo hệ thống**; khi máy đổi chế độ sáng/tối, ứng dụng đổi theo ngay không cần tải lại | M |
| THM-03 | Lựa chọn lưu vào tài khoản (dùng máy khác vẫn giữ) và lưu trên trình duyệt để mở trang lên đã đúng màu, không bị nháy trắng | M |
| THM-04 | Mọi màn hình, nội dung rich text, biểu đồ, thẻ công việc hiển thị rõ ở cả hai chế độ; độ tương phản đạt WCAG 2.1 AA | M |

### 4.13 Tiện ích giao diện khác (UI)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| UI-01 | Thanh bên trái: Việc của tôi, danh sách dự án (có sao), thu gọn được | M |
| UI-02 | Responsive: trên điện thoại (≥ 360px) xem việc, tạo việc, bình luận, đổi trạng thái được; bảng cuộn ngang theo cột | M |
| UI-03 | Phím tắt: `C` tạo việc, `/` tìm kiếm, `Esc` đóng cửa sổ | S |

---

## 5. Quy tắc nghiệp vụ

| Mã | Quy tắc |
| --- | --- |
| BR-01 | Người dùng chỉ thấy dự án mình tham gia; Quản trị viên thấy tất cả |
| BR-02 | Giao việc được cho Admin hoặc Thành viên của dự án (tài khoản chưa bị khóa). Gỡ thành viên → các việc chưa xong của họ về "Chưa giao" |
| BR-02a | Thành viên: mọi API tạo / sửa / xóa công việc, việc con, sprint trả lỗi 403; chỉ được bình luận, đính kèm tệp và chuyển trạng thái **việc được giao cho mình**, và không được đưa việc vào / ra cột Hoàn thành. Ai trong dự án cũng tự bấm "Theo dõi" được |
| BR-03 | Tài khoản bị vô hiệu hóa không đăng nhập được, không được giao việc mới, tên vẫn hiện trong lịch sử |
| BR-04 | Mã công việc là duy nhất, không đổi, không tái sử dụng |
| BR-05 | Việc con không có việc con cấp dưới (chỉ 1 cấp) |
| BR-06 | Công việc **quá hạn** khi hạn < hôm nay và chưa nằm ở cột Hoàn thành |
| BR-07 | Kéo việc vào cột Hoàn thành → ghi nhận thời điểm hoàn thành; kéo ra → xóa thời điểm này |
| BR-08 | Dự án lưu trữ chỉ xem, không gửi nhắc hạn |
| BR-09 | Mọi thao tác xóa là xóa mềm, khôi phục được trong 30 ngày (bởi Quản trị viên) |
| BR-10 | Thời gian lưu theo UTC, hiển thị theo giờ Việt Nam |

---

## 6. Ma trận phân quyền

| Chức năng | Quản trị viên | Admin dự án | Thành viên |
| --- | :---: | :---: | :---: |
| Quản lý tài khoản nhân viên | ✔ | — | — |
| Tạo dự án mới | ✔ | — | — |
| Sửa / lưu trữ dự án, quản lý thành viên, nhãn | ✔ | ✔ | — |
| Đổi tên bảng, thêm/sửa/xóa cột | ✔ | ✔ | — |
| Xem bảng, danh sách, lịch, chi tiết công việc, tổng quan | ✔ | ✔ | ✔ |
| Tạo, sửa, xóa công việc / việc con; lập sprint | ✔ | ✔ | — |
| Được giao việc | ✔ | ✔ | ✔ |
| Chuyển trạng thái (kéo thả) | ✔ | ✔ | Việc của mình, tới Chờ duyệt |
| Duyệt: đưa việc vào / ra cột Hoàn thành | ✔ | ✔ | — |
| Bình luận, tải tệp lên | ✔ | ✔ | Việc của mình |
| Xem bình luận, tải xuống tệp, theo dõi công việc | ✔ | ✔ | ✔ |
| Xóa bình luận / tệp của người khác | ✔ | ✔ | — |

Quyền phải được kiểm tra ở API cho mọi yêu cầu; ẩn nút trên giao diện chỉ là bổ sung.

---

## 7. Yêu cầu phi chức năng

| Mã | Nhóm | Yêu cầu |
| --- | --- | --- |
| NFR-01 | Hiệu năng | Mở bảng ≤ 500 việc dưới 2 giây; API phản hồi p95 < 300 ms; kéo thả phản hồi tức thì |
| NFR-02 | Quy mô | 300 người dùng, 50 người dùng đồng thời |
| NFR-03 | Bảo mật | Đăng nhập Google, xác minh ID token phía server; HTTPS bắt buộc; token phiên trong cookie httpOnly + Secure + SameSite; giới hạn tần suất gọi API đăng nhập; kiểm tra dữ liệu đầu vào; làm sạch rich text; theo OWASP Top 10 |
| NFR-04 | Sẵn sàng | Hoạt động ≥ 99% giờ hành chính; sao lưu CSDL hằng ngày, giữ 30 ngày |
| NFR-05 | Dễ dùng | Người mới tạo và giao việc đầu tiên < 3 phút không cần hướng dẫn (đo khi thí điểm) |
| NFR-06 | Tương thích | Chrome, Edge, Firefox, Safari bản mới; điện thoại ≥ 360px |
| NFR-07 | Khả năng tiếp cận | WCAG 2.1 AA cả chế độ sáng và tối; dùng được bằng bàn phím |
| NFR-08 | Bảo trì | Có lint, test cho nghiệp vụ backend (≥ 60%), migration CSDL có phiên bản |

---

## 8. Công nghệ

| Tầng | Công nghệ | Ghi chú |
| --- | --- | --- |
| Frontend | ReactJS (Vite), React Router | |
| Dữ liệu phía client | TanStack Query | Cache, cập nhật lạc quan khi kéo thả |
| Giao diện | Tailwind CSS + shadcn/ui | Theme sáng/tối bằng CSS variables |
| Kéo thả | dnd-kit | Hỗ trợ cảm ứng |
| Rich text | TipTap | Mention, checklist, ảnh |
| Backend | Node.js (LTS) + Express | REST API `/api/v1` |
| ORM | Sequelize | Migration, seeder bằng sequelize-cli |
| CSDL | PostgreSQL | Tìm kiếm full-text |
| Xác thực | Google OAuth 2.0 (`google-auth-library` hoặc `passport-google-oauth20`); sau đó cấp JWT access + refresh trong cookie httpOnly | bcrypt chỉ dùng cho tài khoản quản trị dự phòng |
| Tệp | Lưu trên máy chủ (MVP), có thể chuyển MinIO/S3 | Tải qua API có kiểm tra quyền |
| Email, nhắc hạn | Nodemailer + node-cron | |
| Triển khai | Docker Compose, Nginx, Let's Encrypt | Xem mục 8.1 |

### 8.1 Môi trường triển khai

| Thông tin | Giá trị |
| --- | --- |
| Môi trường | **Chính thức (production)** — nhóm thí điểm và toàn bộ nhân viên dùng chung tên miền này |
| Tên miền | `beta.hopphu.vn` |
| Máy chủ | VPS `103.175.146.251` |
| HTTPS | Chứng chỉ Let's Encrypt, tự gia hạn; chuyển hướng toàn bộ HTTP → HTTPS |
| Google OAuth | Authorized JavaScript origins: `https://beta.hopphu.vn` (và `http://localhost:5173`, `http://localhost` khi phát triển). Không cần Redirect URI — nút Google Identity Services trả ID token trực tiếp cho trang. |
| Thành phần | Nginx (reverse proxy, phục vụ frontend build) → container Node.js API → container PostgreSQL (không mở cổng ra ngoài) |
| Sao lưu | `pg_dump` hằng ngày, giữ 30 ngày, sao chép ra ngoài máy chủ |
| Kiểm thử trước khi phát hành | Do `beta.hopphu.vn` là bản chính thức, mọi thay đổi phải chạy thử trên môi trường dev cục bộ (Docker Compose giống production) và qua CI trước khi deploy; có thể bổ sung tên miền staging riêng sau |
| Phát hành | Deploy ngoài giờ hành chính; chạy migration có sao lưu CSDL ngay trước đó; giữ image phiên bản trước để quay lui |

**Yêu cầu an toàn máy chủ:** thông tin đăng nhập máy chủ, Client Secret của Google, mật khẩu CSDL **không** ghi trong tài liệu hay mã nguồn; lưu trong biến môi trường/secret của CI. Đăng nhập máy chủ bằng SSH key với người dùng riêng (không dùng `root`), tắt đăng nhập SSH bằng mật khẩu, bật tường lửa chỉ mở cổng 22, 80, 443.

---

## 9. Thiết kế dữ liệu sơ bộ

| Bảng | Trường chính | Ghi chú |
| --- | --- | --- |
| users | id, email (unique), google_id (unique, nullable), password_hash (nullable — chỉ tài khoản dự phòng), full_name, avatar_url, title, is_admin, status (invited/active/disabled), theme (light/dark/system), email_settings (jsonb), last_login_at | |
| auth_tokens | id, user_id, type (refresh), token_hash, expires_at, revoked_at | |
| projects | id, key, name, description, icon, color, task_counter, archived_at, deleted_at | |
| project_members | project_id, user_id, role (manager/member/viewer) | |
| boards | id, project_id, name | 1 bảng/dự án ở MVP; lưu tên bảng |
| board_columns | id, board_id, name, position, is_done | Cột = trạng thái |
| tasks | id, project_id, key, number, type (task/bug), title, description (jsonb), description_text, column_id, assignee_id, creator_id, priority, due_date, position, completed_at, deleted_at | |
| subtasks | id, task_id, title, is_done, assignee_id, due_date, position | |
| labels | id, project_id, name, color | |
| task_labels | task_id, label_id | |
| task_watchers | task_id, user_id | |
| comments | id, task_id, author_id, body (jsonb), edited_at, deleted_at | |
| attachments | id, task_id, uploaded_by, file_name, mime_type, size, storage_path | |
| notifications | id, user_id, type, actor_id, task_id, payload (jsonb), is_read, created_at | |
| activity_logs | id, project_id, task_id, actor_id, action, field, old_value, new_value, created_at | Lịch sử thay đổi |

**Chỉ mục:** `tasks(column_id, position)`, `tasks(assignee_id, due_date)`, `tasks(project_id)`, full-text trên tiêu đề/mô tả, `notifications(user_id, is_read)`, `activity_logs(task_id, created_at)`.

Mã công việc sinh bằng cách tăng `projects.task_counter` trong transaction có khóa dòng để không bị trùng khi nhiều người tạo cùng lúc.

---

## 10. Phạm vi phát hành & Lộ trình

| Giai đoạn | Nội dung |
| --- | --- |
| **MVP (tuần 12)** | Tất cả yêu cầu mức **M** |
| **Sau ra mắt (1–2 tháng)** | Yêu cầu mức **S**: nhân bản việc, sửa hàng loạt, khối code/bảng trong rich text, cài đặt email, biểu đồ |
| **Mở rộng** | Yêu cầu mức **C**: giới hạn tên miền email, lịch & timeline, nhiều bảng/dự án, WIP limit, sprint, liên kết việc, cập nhật thời gian thực, tích hợp Slack/Zalo |

| Tuần | Giai đoạn | Đầu ra |
| --- | --- | --- |
| 1–3 | Chuẩn bị | Duyệt tài liệu, wireframe & mockup (sáng + tối), thiết kế CSDL/API, dựng repo, CI/CD, cấu hình máy chủ `beta.hopphu.vn` (HTTPS, Docker), tạo Google OAuth Client |
| 4–5 | Sprint 1 | Đăng nhập Google, quản trị người dùng, dự án & thành viên (3 vai trò), khung giao diện, theme |
| 6–7 | Sprint 2 | Bảng kéo thả, đổi tên bảng/cột, công việc, việc con, rich text |
| 8–9 | Sprint 3 | Bình luận, @nhắc tên, tệp, lịch sử, danh sách & tìm kiếm |
| 9 | Thí điểm | Nhóm thí điểm bắt đầu dùng |
| 10–11 | Sprint 4 | Việc của tôi, tổng quan, thông báo, hướng dẫn lần đầu, sửa theo phản hồi |
| 12 | Ra mắt | Kiểm thử hồi quy, rà soát bảo mật, UAT, go-live |

Dự phòng 2 tuần nếu tốc độ đội thấp hơn kế hoạch (đánh giá lại sau Sprint 2).

---

## 11. Nhân sự

Đội tối thiểu 5 người cho 12 tuần; nếu 1–2 người làm, giãn lên 20–24 tuần.

| Vai trò | Số lượng | Trách nhiệm |
| --- | --- | --- |
| PM / BA | 1 | Phạm vi, backlog, làm việc với người dùng, nghiệm thu |
| UI/UX Designer | 1 (bán thời gian) | Wireframe, mockup, design system có màu sáng/tối, kiểm thử tính dễ dùng |
| Frontend (React) | 1–2 | Giao diện, kéo thả, rich text, theme, responsive |
| Backend (Node.js) | 1 | API Express, Sequelize, phân quyền, thông báo, tệp |
| QA | 1 (bán thời gian) | Kịch bản kiểm thử, hồi quy, UAT |

Quy trình: Scrum 2 tuần/sprint, họp đứng 15 phút mỗi ngày, demo và retro cuối sprint.

---

## 12. Giả định & Ràng buộc

- Công ty có SMTP/dịch vụ email để gửi thông báo.
- Mọi nhân viên có tài khoản Gmail cá nhân và cung cấp địa chỉ đó cho Quản trị viên.
- Công ty có quyền quản trị DNS của `hopphu.vn` để trỏ `beta.hopphu.vn` về `103.175.146.251`, và có tài khoản Google Cloud để tạo OAuth Client.
- Hệ thống chạy trên VPS có địa chỉ công khai (truy cập qua Internet, không bắt buộc VPN).
- Stack bắt buộc: Node.js + Express, PostgreSQL, Sequelize, ReactJS.
- MVP không dùng dịch vụ trả phí bên thứ ba.

---

## 13. Rủi ro

| Rủi ro | Mức độ | Cách giảm thiểu |
| --- | --- | --- |
| Phình phạm vi do muốn "giống Jira" | Cao | Mọi tính năng mới phải qua câu hỏi ở mục 1.2; chỉ xét sau tuần 12 |
| Người dùng thấy khó dùng, quay lại chat | Cao | Áp dụng nguyên tắc mục 3; thử nghiệm với 3–5 người thật từ bản mockup và từ tuần 9 |
| Kéo thả lỗi trên điện thoại | Trung bình | Dùng dnd-kit, làm thử ngay Sprint 2 |
| Rich text gây lỗ hổng XSS | Cao | Làm sạch phía server, giới hạn kích thước, ảnh lưu thành tệp riêng |
| Chế độ tối hiển thị không đồng đều | Trung bình | Dùng biến màu từ đầu; QA kiểm tra mọi màn hình ở cả hai chế độ |
| Lỗ hổng phân quyền, tải tệp | Cao | Kiểm tra quyền ở mọi API (đặc biệt chặn tạo/sửa và duyệt Hoàn thành với Thành viên), test tự động, rà soát bảo mật trước ra mắt |
| Lộ thông tin đăng nhập máy chủ / secret | Cao | Không lưu mật khẩu trong tài liệu, chat, mã nguồn; dùng SSH key, người dùng không phải root, secret trong biến môi trường; đổi mật khẩu ngay nếu đã chia sẻ |
| Google đăng nhập lỗi hoặc nhân viên mất tài khoản Google | Thấp | Tài khoản Quản trị viên dự phòng (AUTH-06); Quản trị viên đổi email liên kết cho nhân viên |
| Nhân viên nghỉ việc vẫn đăng nhập được bằng Gmail cá nhân | Cao | Quy trình nghỉ việc bắt buộc có bước vô hiệu hóa tài khoản; trang quản trị hiển thị ngày đăng nhập gần nhất để rà soát định kỳ |
| Lỗi khi deploy ảnh hưởng trực tiếp người dùng (không có staging) | Trung bình | CI chạy test bắt buộc, sao lưu trước migration, deploy ngoài giờ, giữ bản trước để quay lui |
| Trễ tiến độ | Trung bình | 2 tuần dự phòng; xem lại tốc độ sau mỗi sprint |

---

## 14. Tiêu chí nghiệm thu & thành công

**Nghiệm thu MVP**

- 100% yêu cầu mức M đạt kịch bản kiểm thử; không còn lỗi mức Nghiêm trọng/Cao.
- Đạt NFR-01, NFR-03, NFR-05, NFR-06, NFR-07 và 10 nguyên tắc UX ở mục 3.
- Kịch bản đầu–cuối chạy thông ở cả chế độ sáng và tối: tạo dự án → đổi tên bảng/cột → mời thành viên → tạo việc có mô tả rich text kèm ảnh → giao việc → người nhận thấy thông báo → kéo qua các cột → bình luận @nhắc tên → hoàn thành → xem tổng quan.

**Thành công sau 1 tháng ra mắt**

- ≥ 80% thành viên nhóm thí điểm đăng nhập mỗi tuần.
- > 90% việc mới được tạo trên hệ thống.
- Tải trang < 2 giây; không lỗi nghiêm trọng nào mở quá 48 giờ.
- Điểm hài lòng ≥ 4/5; ≥ 80% người dùng đánh giá "dễ dùng".

---

## 15. Vấn đề cần làm rõ

| # | Câu hỏi | Trạng thái |
| --- | --- | --- |
| Q1 | Có cần vai trò "Người xem"? | **Đã chốt (v2.4):** không — chỉ còn Admin và Thành viên; Thành viên xem được toàn dự án nhưng chỉ thao tác trên việc của mình |
| Q2 | Đăng nhập Google ngay từ MVP? | **Đã chốt:** có, đăng nhập bằng tài khoản Google |
| Q3 | Thời gian lưu trữ dữ liệu và giới hạn dung lượng tệp mỗi dự án? | Chờ IT |
| Q4 | Có nhóm nào cần làm theo sprint ngay không? | Chờ các trưởng nhóm |
| Q5 | Nhân viên dùng email công ty hay Gmail cá nhân? | **Đã chốt:** Gmail cá nhân, không giới hạn tên miền |
| Q6 | `beta.hopphu.vn` là thí điểm hay chính thức? | **Đã chốt:** môi trường chính thức |

---

## 16. Bước tiếp theo

- [ ] Duyệt tài liệu (TM-BRD-001 v2.3) và trả lời Q3–Q4 ở mục 15
- [ ] Thu thập danh sách Gmail cá nhân của nhân viên để Quản trị viên thêm vào hệ thống
- [ ] Đổi mật khẩu `root` của VPS (đã bị chia sẻ dạng văn bản), tạo người dùng deploy dùng SSH key, tắt đăng nhập bằng mật khẩu
- [ ] Trỏ DNS `beta.hopphu.vn` → `103.175.146.251`; cài Docker, Nginx, chứng chỉ HTTPS
- [ ] Tạo Google OAuth Client trên Google Cloud Console với origin và redirect URI ở mục 8.1
- [ ] Viết user story + tiêu chí chấp nhận cho Sprint 1–2
- [ ] Wireframe: Đăng nhập, Việc của tôi, Danh sách dự án, Bảng, Chi tiết công việc, Tổng quan, Cài đặt (sáng + tối)
- [ ] Thử wireframe với 3–5 nhân viên để kiểm tra tính dễ dùng
- [ ] Thiết kế ERD chi tiết và đặc tả API; dựng repo, CI/CD, staging
