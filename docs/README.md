# API Documentation — Index

Tài liệu tổng hợp endpoint cho FE ghép trước. Mỗi file tách theo domain.

> **Cập nhật mới**: toàn bộ JSON contract đã chuyển sang **`snake_case`** (Jackson global SNAKE_CASE strategy).
> Xem [snake-case-migration.md](../../../markdown/snake-case-migration.md) cho danh sách field rename.

| File | Domain | Base path |
|---|---|---|
| [01-auth.md](01-auth.md) | Authentication | `/auth` |
| [02-users.md](02-users.md) | Quản lý người dùng | `/api/admin/users` |
| [03-user-groups.md](03-user-groups.md) | Quản lý nhóm quyền | `/api/admin/user-groups` |
| [04-modules.md](04-modules.md) | Quản lý module nghiệp vụ | `/api/admin/modules` |
| [04b-actions.md](04b-actions.md) | Action catalog cho form nhóm | `/api/admin/actions` |
| [05-etl-reports.md](05-etl-reports.md) | Quản lý ETL script | `/api/admin/etl-reports` |
| [06-audit-logs.md](06-audit-logs.md) | Nhật ký hệ thống (3 tab) | `/api/admin/audit-logs` |
| [07-system.md](07-system.md) | Cache / health admin | `/api/admin/system` |
| [08-options.md](08-options.md) | Bộ lọc / dropdown options | `/api/admin/users/options`, `/api/admin/user-groups/options`, `/api/v1/options` |
| [09-business-reports.md](09-business-reports.md) | 7 module nghiệp vụ (báo cáo) | `/api/v1/{periodic}/{module}` |

---

## Convention chung

### 1. Headers chuẩn cho mọi authenticated request
```
Authorization: Bearer <access_token>
X-App-Code:    IOC_WEB | IOC_MOBILE     # chỉ bắt buộc ở /auth/login
Content-Type:  application/json
```

### 2. Response wrapper — `BaseResponse<T>`
Mọi endpoint đều bọc trong:
```json
{
  "status": 200,
  "success": true,
  "data": <T>,
  "message": "..."
}
```

### 3. Error response
```json
{
  "status": 400,
  "success": false,
  "message": "Mô tả lỗi"
}
```
| Code | Khi nào | Ví dụ message |
|---|---|---|
| `400` | Input sai / validation fail (Bean Validation `@NotBlank`) | "module_code bắt buộc", "pham_vi không hợp lệ: XXX" |
| `401` | Token thiếu / hết hạn / sai mật khẩu | "Tên đăng nhập hoặc mật khẩu không đúng" |
| `403` | Không đủ quyền (`@RequireAction`) hoặc cần đổi mật khẩu | "Tài khoản mới tạo, yêu cầu đổi mật khẩu..." |
| `404` | Resource không tồn tại | "User không tồn tại: id=5" |
| `409` | UNIQUE violation, hoặc resource có dependency | "Username 'X' đã tồn tại", "Không thể xoá nhóm còn user (số: 5)", "Không thể xoá module còn ETL active (số: 2)" |
| `429` | Vượt rate limit | (tự động) |
| `500` | Unhandled exception (bug) | (BE log full stack) |
| `503` | Dremio / DB không phản hồi | "Không thể kết nối đến máy chủ dữ liệu (Dremio)" |

### 4. Pagination response — `PageResponse`
```json
{
  "data": [ ... ],
  "total": 100,
  "page": 0,
  "size": 20,
  "total_pages": 5
}
```
- `page` 0-based (page đầu = 0).
- `total_pages` = ceil(total / size).
- Default `size = 20` ([Common.DEFAULT_PAGE_SIZE_STR](../../../src/main/java/com/tandtc/ioc/api/util/constants/Common.java)).
- Trong wrapper `BaseResponse.data` (data lồng trong data).

### 5. Naming convention — 100% snake_case
- **Request body** (DTO): snake_case (`app_code`, `ten_nhom`, `ho_ten`, `old_password`, `refresh_token`).
- **Response body**: snake_case (`access_token`, `user_id`, `account_status`, `total_pages`, ...).
- **Query params**: snake_case (`toaan_id`, `account_status`, `from_date`, `to_date`, `filter_type`).
- **Path params**: `{userId}`, `{id}`, `{periodic}`.

Field tiếng Việt single-word (không có underscore) giữ nguyên: `username`, `password`, `hoten`, `ngaysinh`, `idphongban`, `idtoaan`, `idloaian`, `machucvu`, `machucdanh`, `tenphongban`, `socccd`, `kyhieu`, `hieuluc`, `loaitrinh`...

### 6. Multi-app scoping (`app_code`)
- Các API tạo/sửa group + permission yêu cầu `app_code` ∈ `{IOC_WEB, IOC_MOBILE}` trong body.
- `app_code` đại diện cho app mà entry áp dụng (web vs mobile permissions độc lập).
- `app_code` immutable sau khi create — update bị bỏ qua.

### 7. Soft-delete
Bảng có `ngayxoa`: `user_group`, `users`, `etl_ioc_report`, `modules`. Active query auto-filter `ngayxoa IS NULL`. FE không cần xử lý — BE đã filter sẵn.

### 8. Audit
Mọi action quan trọng được log vào `audit_log`. FE không cần làm gì — BE tự ghi qua `@Loggable` aspect.

### 9. Rate limit
Hầu hết endpoint có rate limit:
- Auth: 5 req/60s/IP (login, change-password)
- Read: 60 req/60s/USERNAME
- Write: 20 req/60s/USERNAME

Nếu vượt → 429 Too Many Requests.
