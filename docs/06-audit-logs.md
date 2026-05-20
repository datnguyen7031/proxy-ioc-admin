# 06. Audit Logs (Nhật ký hệ thống)

Base path: `/api/admin/audit-logs`
Permission: `SYSTEM_LOG.VIEW`.

UI có 3 tab: **Truy cập** / **Thao tác** / **Lỗi phát sinh** — tách thành 3 endpoint search + 3 endpoint options riêng.

| Endpoint                                   | Method | Tab UI        | Mô tả                                          |
| ------------------------------------------ | ------ | ------------- | ---------------------------------------------- |
| `/api/admin/audit-logs/access`             | GET    | Truy cập      | Log đăng nhập / đăng xuất / đổi mật khẩu       |
| `/api/admin/audit-logs/operations`         | GET    | Thao tác      | Log CRUD / quản lý (chỉ SUCCESS)               |
| `/api/admin/audit-logs/errors`             | GET    | Lỗi phát sinh | Log FAILED/DENIED hoặc HTTP ≥ 400              |
| `/api/admin/audit-logs/options/access`     | GET    | Truy cập      | Options dropdown: `groups`, `don_vi`           |
| `/api/admin/audit-logs/options/operations` | GET    | Thao tác      | Options dropdown: `target_types`, `actions`    |
| `/api/admin/audit-logs/options/errors`     | GET    | Lỗi phát sinh | Options dropdown: `target_types`, `severities` |
| `/api/admin/audit-logs/{id}`               | GET    | Detail        | Chi tiết 1 bản ghi                             |

> Sort mặc định: `created_at DESC`. Pagination: `page=0`, `size=20`.
> Search/filter sử dụng JOIN `audit_log → users → gscm_dm_canbo → gscm_dm_toaan`.
> Tên người dùng = `COALESCE(canbo.hoten, users.hoten)` — fallback `users.hoten` cho admin user (canbo_id NULL).

---

## GET `/api/admin/audit-logs/access` — Tab Truy cập

Filter: `action IN (LOGIN, LOGIN_FAILED, LOGOUT, CHANGE_PASSWORD)`.

**Query params**:
| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Tìm trong **tài khoản** (`audit_log.username`) HOẶC **tên người dùng** (`COALESCE(canbo.hoten, users.hoten)`) — LIKE, case-insensitive |
| `group_id` | long | ID nhóm người dùng (filter `user_groups_snapshot` CSV theo `ma_nhom`) |
| `toaan_id` | long | ID đơn vị công tác (toaan). Admin user (canbo_id NULL) **vẫn hiển thị** kể cả khi filter |
| `from` | iso-datetime | Từ ngày (`yyyy-MM-dd'T'HH:mm:ss`) |
| `to` | iso-datetime | Đến ngày |
| `page`, `size` | int | mặc định 0, 20 |

**Response 200**:

```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "username": "admin",
        "hoten": "Nguyễn Văn A",
        "don_vi_cong_tac": "TAND tỉnh Hà Nội",
        "action": "LOGIN",
        "action_label": "Đăng nhập",
        "status": "SUCCESS",
        "status_label": "Thành công",
        "app_code": "IOC_WEB",
        "ip_address": "192.168.1.5",
        "user_agent": "Mozilla/5.0...",
        "user_groups_snapshot": "super-admin,nhom-001",
        "user_groups_label": "Quản trị hệ thống, Nhóm 001",
        "created_at": "2026-04-20T08:30:00"
      }
    ],
    "total": 100,
    "page": 0,
    "size": 20,
    "total_pages": 5
  }
}
```

---

## GET `/api/admin/audit-logs/operations` — Tab Thao tác

Filter: `action NOT IN (LOGIN/LOGIN_FAILED/LOGOUT/SEARCH_AUDIT/VIEW_AUDIT_DETAIL/VIEW_MODULE_DATA)` AND `status = 'SUCCESS'`.

**Query params**:
| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Tìm trong **tài khoản** HOẶC **tên người dùng** (LIKE, case-insensitive) |
| `target_type` | string | `USER` \| `GROUP` \| `MODULE` \| `REPORT` \| `AUDIT` |
| `action` | string | Action code (CREATE_USER, EDIT_GROUP, DELETE_GROUP, ...) |
| `from`, `to` | iso-datetime | Khoảng thời gian |
| `page`, `size` | int | mặc định 0, 20 |

**Response 200**:

```json
{
  "data": {
    "data": [
      {
        "id": 5,
        "username": "admin",
        "hoten": "Nguyễn Văn A",
        "target_type": "USER",
        "target_type_label": "Người dùng",
        "target_id": "100",
        "action": "EDIT_USER",
        "action_label": "Cập nhật tài khoản",
        "changed_fields": "ho_ten,account_status",
        "response_status": 200,
        "duration_ms": 45,
        "created_at": "2026-04-20T08:30:00"
      }
    ],
    "total": 50,
    "page": 0,
    "size": 20,
    "total_pages": 3
  }
}
```

---

## GET `/api/admin/audit-logs/errors` — Tab Lỗi phát sinh

Filter: `status IN ('FAILED','DENIED')` OR `response_status >= 400`.

**Query params**:
| Param | Type | Mô tả |
|---|---|---|
| `q` | string | Tìm trong username / tên người dùng / `error_message` / `endpoint` (LIKE) |
| `target_type` | string | `USER` \| `GROUP` \| `MODULE` \| `REPORT` \| `AUDIT` |
| `severity` | string | `INFO` (Thấp) \| `WARN` (Trung bình) \| `CRITICAL` (Cao) — optional |
| `from`, `to` | iso-datetime | Khoảng thời gian |
| `page`, `size` | int | mặc định 0, 20 |

**Response 200**:

```json
{
  "data": {
    "data": [
      {
        "id": 8,
        "username": "test_user",
        "hoten": "Trần Thị B",
        "response_status": 500,
        "target_type": "USER",
        "target_type_label": "Người dùng",
        "severity": "CRITICAL",
        "severity_label": "Cao",
        "status": "FAILED",
        "status_label": "Thất bại",
        "action": "CREATE_USER",
        "action_label": "Tạo tài khoản",
        "http_method": "POST",
        "endpoint": "/api/admin/users",
        "error_message": "INTERNAL SERVER ERROR — duplicate canbo_id",
        "created_at": "2026-04-20T08:30:00"
      }
    ],
    "total": 12,
    "page": 0,
    "size": 20,
    "total_pages": 1
  }
}
```

---

## GET `/api/admin/audit-logs/options/access` — Options tab Truy cập

Trả 2 dropdown: nhóm người dùng + đơn vị công tác.

**Response 200**:

```json
{
  "data": {
    "groups": [
      { "value": 1, "label": "Quản trị hệ thống" },
      { "value": 2, "label": "Nhóm 001" }
    ],
    "don_vi": [
      { "value": 1, "label": "TAND tỉnh Hà Nội" },
      { "value": 2, "label": "TAND huyện Hoàn Kiếm" }
    ]
  }
}
```

- `groups`: lấy từ `UserGroupRepository.findAllActive()` — tất cả nhóm active, không lọc theo `app_code`.
- `don_vi`: lấy từ `ToaAnRepository.search(null)` — tất cả toaan.

---

## GET `/api/admin/audit-logs/options/operations` — Options tab Thao tác

Trả 2 dropdown: loại tác động + tác động. Hardcode từ constants `AuditLabel`.

**Response 200**:

```json
{
  "data": {
    "target_types": [
      { "value": "USER", "label": "Người dùng" },
      { "value": "GROUP", "label": "Nhóm người dùng" },
      { "value": "MODULE", "label": "Chức năng" },
      { "value": "REPORT", "label": "Báo cáo" },
      { "value": "AUDIT", "label": "Nhật ký" }
    ],
    "actions": [
      { "value": "LOGIN", "label": "Đăng nhập" },
      { "value": "CREATE_USER", "label": "Tạo tài khoản" },
      { "value": "EDIT_USER", "label": "Cập nhật tài khoản" }
    ]
  }
}
```

- `actions`: trả **toàn bộ** action codes (không filter exclude). FE tự loại bỏ option không phù hợp nếu cần.

---

## GET `/api/admin/audit-logs/options/errors` — Options tab Lỗi phát sinh

Trả 2 dropdown: loại tài nguyên + mức độ lỗi.

**Response 200**:

```json
{
  "data": {
    "target_types": [
      { "value": "USER", "label": "Người dùng" },
      { "value": "GROUP", "label": "Nhóm người dùng" },
      { "value": "MODULE", "label": "Chức năng" },
      { "value": "REPORT", "label": "Báo cáo" },
      { "value": "AUDIT", "label": "Nhật ký" }
    ],
    "severities": [
      { "value": "INFO", "label": "Thấp" },
      { "value": "WARN", "label": "Trung bình" },
      { "value": "CRITICAL", "label": "Cao" }
    ]
  }
}
```

---

## GET `/api/admin/audit-logs/{id}` — Chi tiết

Trả `AuditLogDetail` DTO (KHÔNG expose `hostname`/`app_version` nội bộ). Bao gồm label tiếng Việt cho `action`, `target_type`, `severity`, `status`.

**Response 200**:

```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "user_id": 1,
    "user_groups_snapshot": "super-admin",
    "action": "EDIT_USER",
    "action_label": "Cập nhật tài khoản",
    "admin_module": "USER_MGMT",
    "app_code": "IOC_WEB",
    "target_type": "USER",
    "target_type_label": "Người dùng",
    "target_id": "100",
    "severity": "INFO",
    "severity_label": "Thấp",
    "is_security_event": 0,
    "request_id": "abc-123",
    "session_id": "sess-456",
    "http_method": "PUT",
    "endpoint": "/api/admin/users/100/permissions",
    "request_body": "{...}",
    "response_status": 200,
    "duration_ms": 45,
    "old_values": "{...}",
    "new_values": "{...}",
    "changed_fields": "account_status,hieuluc",
    "ip_address": "192.168.1.5",
    "user_agent": "Mozilla/5.0...",
    "status": "SUCCESS",
    "status_label": "Thành công",
    "error_message": null,
    "metadata": null,
    "created_at": "2026-04-20T08:30:00"
  }
}
```

**Response 404**:

```json
{ "status": 404, "success": false, "message": "Audit log không tồn tại: id=1234" }
```

---

## Breaking changes (so với version trước)

| Endpoint      | Thay đổi                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `/access`     | `username` → `q` (search wider, bao gồm cả tên); thêm `toaan_id`; response thêm `hoten`, `don_vi_cong_tac` |
| `/operations` | `username` → `q` (search wider); response thêm `hoten`                                                     |
| `/errors`     | `q` search wider (thêm `canbo.hoten`/`users.hoten`); response thêm `hoten`                                 |
| `/options`    | **Xoá**, tách thành `/options/access`, `/options/operations`, `/options/errors`                            |
