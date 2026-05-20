# 02. User Management

Base path: `/api/admin/users`
Permission required: `USER_MGMT.{action}` (xem từng endpoint).

> **Convention path param**:
>
> - **`canbo_id`** — thao tác trên cán bộ (kể cả khi chưa có account). Bảng base: `gscm_dm_canbo`.
> - **`user_id`** — thao tác trên row đã tồn tại trong `users` (chỉ áp dụng khi đã activate account).
> - **`username`** — dùng riêng cho cache key.
>
> Flow chuẩn cho FE:
>
> 1. List → click row → `GET /api/admin/users/{canbo_id}` để xem detail (luôn dùng canbo_id).
> 2. Nếu `has_account=false` → enable nút "Tạo tài khoản" → `POST /api/admin/users` body `{canbo_id}`.
> 3. Nếu `has_account=true` → enable các nút Update/Reset/Lock — gọi với `user_id` từ response detail.

| Endpoint                                   | Method | Action         | Path param | Mô tả                                        |
| ------------------------------------------ | ------ | -------------- | ---------- | -------------------------------------------- |
| `/api/admin/users`                         | GET    | VIEW           | —          | Danh sách (base: canbo)                      |
| `/api/admin/users/{canboId}`               | GET    | VIEW           | `canbo_id` | Chi tiết — work cho cả canbo chưa có account |
| `/api/admin/users`                         | POST   | CREATE         | (body)     | Tạo tài khoản từ `canbo_id` + gán quyền      |
| `/api/admin/users/bulk`                    | POST   | CREATE         | (body)     | Bulk tạo tài khoản từ `canbo_ids`            |
| `/api/admin/users/{userId}/permissions`    | PUT    | EDIT           | `user_id`  | Cập nhật phân quyền                          |
| `/api/admin/users/{userId}/reset-password` | POST   | RESET_PASSWORD | `user_id`  | Reset password                               |
| `/api/admin/users/{userId}/lock`           | POST   | LOCK           | `user_id`  | Khóa tài khoản                               |
| `/api/admin/users/{userId}/unlock`         | POST   | LOCK           | `user_id`  | Mở khóa                                      |
| `/api/admin/users/{username}/cache`        | DELETE | EDIT           | `username` | Xóa cache quyền                              |

---

## GET `/api/admin/users` — Danh sách

**Base**: `gscm_dm_canbo` (master), LEFT JOIN `users`. Trả về toàn bộ canbo `hieuluc=1`,
đánh cờ `has_account=true` nếu có user row gắn với `canbo_id`.

**Query params** (tất cả optional):
| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo họ tên (LIKE) |
| `toaan_id` | long | ID tòa án (đơn vị công tác) |
| `machucvu` | string | Mã chức vụ |
| `machucdanh` | string | Mã chức danh |
| `account_status` | string | NOT_ACCOUNT \| PENDING_CHANGE_PASSWORD \| ACTIVE \| LOCKED \| RESET |
| `has_account` | string | `all` \| `yes` (có user row) \| `no` (chưa tạo tài khoản) — UI tab |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20, max 100 |

**Response 200** ([PageResponse](README.md#4-pagination-response--pageresponse)):

```json
{
  "data": {
    "data": [
      {
        "canbo_id": 100,
        "ma_canbo": "CB001",
        "ho_ten": "Nguyễn Văn A",
        "so_cccd": "012345678901",
        "don_vi_cong_tac": { "id": 5, "ten": "TAND TP. Hà Nội" },
        "don_vi_phu_trach": { "id": 12, "ten": "Phòng tổ chức" },
        "chuc_vu": { "ma": "TP", "ten": "Trưởng phòng" },
        "chuc_danh": { "ma": "TPCT", "ten": "Thẩm phán cao cấp" },
        "user_id": 1,
        "username": "nguyenvana",
        "has_account": true,
        "password_change": 2,
        "account_status": "ACTIVE"
      }
    ],
    "total": 40,
    "page": 0,
    "size": 20,
    "total_pages": 2
  }
}
```

---

## GET `/api/admin/users/{canboId}` — Chi tiết

Path param là **`canbo_id`** (KHÔNG phải user_id) — match với list endpoint.

Response trả `UserDetail` typed DTO record. Hai trạng thái:

**Case A — canbo đã có account** (`has_account=true`):

```json
{
  "data": {
    "user_id": 1,
    "username": "012345678901",
    "ho_ten": "Nguyễn Văn A",
    "ngay_sinh": "1980-01-15T00:00:00",
    "gioi_tinh": 1,
    "canbo_id": 100,
    "so_cccd": "012345678901",
    "don_vi_cong_tac": { "id": 5, "ten": "TAND tỉnh ABC" },
    "don_vi_phu_trach": { "id": 12, "ten": "Phòng tổ chức" },
    "chuc_vu": { "ma": "TP", "ten": "Trưởng phòng" },
    "chuc_danh": { "ma": "TPCT", "ten": "Thẩm phán cao cấp" },
    "account_status": "ACTIVE",
    "has_account": true,
    "password_change": 2,
    "hieuluc": 1,
    "permissions_by_app": [
      {
        "app_code": "IOC_WEB",
        "groups": [{ "id": 5, "ma_nhom": "nhom-001", "ten_nhom": "Nhóm 001" }],
        "phu_trach_vu_gdkt": [{ "id": 361, "ten": "Vụ A", "pham_vi": "ALL", "loaian": [] }],
        "phu_trach_toa_tinh": [
          { "id": 7, "ten": "TAND tỉnh Hậu Giang", "pham_vi": "CASE_TYPE", "loaian": [{ "id": 1, "ten": "Hình sự" }] }
        ],
        "phu_trach_toa_khu_vuc": [],
        "phu_trach_phong_ban": [{ "id": 1234, "ten": "Văn phòng", "pham_vi": "ALL", "loaian": [] }]
      },
      {
        "app_code": "IOC_MOBILE",
        "groups": [],
        "phu_trach_vu_gdkt": [],
        "phu_trach_toa_tinh": [],
        "phu_trach_toa_khu_vuc": [],
        "phu_trach_phong_ban": []
      }
    ]
  }
}
```

**Case B — canbo chưa activate** (`has_account=false`):

```json
{
  "data": {
    "user_id": null,
    "username": null,
    "ho_ten": "Phạm Đình Long",
    "ngay_sinh": "1954-10-14T23:00:00",
    "gioi_tinh": 1,
    "canbo_id": 36940,
    "so_cccd": null,
    "don_vi_cong_tac": { "id": 437, "ten": "Tòa án nhân dân huyện Phước Sơn" },
    "don_vi_phu_trach": null,
    "chuc_vu": null,
    "chuc_danh": { "ma": "HTND", "ten": "Hội thẩm nhân dân" },
    "account_status": null,
    "has_account": false,
    "password_change": null,
    "hieuluc": null,
    "permissions_by_app": [
      {
        "app_code": "IOC_WEB",
        "groups": [],
        "phu_trach_vu_gdkt": [],
        "phu_trach_toa_tinh": [],
        "phu_trach_toa_khu_vuc": [],
        "phu_trach_phong_ban": []
      },
      {
        "app_code": "IOC_MOBILE",
        "groups": [],
        "phu_trach_vu_gdkt": [],
        "phu_trach_toa_tinh": [],
        "phu_trach_toa_khu_vuc": [],
        "phu_trach_phong_ban": []
      }
    ]
  }
}
```

> **Quy tắc nullable** khi `has_account=false`: `user_id`, `username`, `account_status`, `password_change`, `hieuluc` đều `null`. Các trường canbo (`ho_ten`, `ngay_sinh`, `don_vi_*`, `chuc_*`) vẫn đầy đủ.
> `permissions_by_app` luôn có 2 entries (IOC_WEB + IOC_MOBILE) kể cả empty — FE render đủ section.
> `phu_trach_toa_khu_vuc` hiện trả empty (DB gộp tỉnh + khu vực vào cùng `pcatatc_phutrach_toatinh` — phân biệt sẽ được cập nhật sau dựa theo `toaan.loaitoa`).
> `gioi_tinh` là `Long` (1 = Nam, 2 = Nữ — theo dataitem). `ngay_sinh` là `LocalDateTime` ISO format.

**Response 404**: canbo_id không tồn tại trong `gscm_dm_canbo`.

---

## POST `/api/admin/users` — Tạo tài khoản single

User phải đang ở trạng thái `NOT_ACCOUNT`. BE auto-gen password (8 ký tự).
Username sẽ = `canbo.socccd`.

**Body** (`app_code` bắt buộc khi gán `group_id` hoặc bất kỳ `phu_trach_*`):

```json
{
  "canbo_id": 2115,
  "app_code": "IOC_WEB",
  "group_id": 5,
  "phu_trach_vu_gdkt": [
    { "id": 361, "pham_vi": "ALL", "loaian_ids": null },
    { "id": 362, "pham_vi": "CASE_TYPE", "loaian_ids": [1, 2, 3] }
  ],
  "phu_trach_toa_tinh": [{ "id": 7, "pham_vi": "ALL" }],
  "phu_trach_toa_khu_vuc": [{ "id": 71, "pham_vi": "ALL" }],
  "phu_trach_phong_ban": [{ "id": 1234, "pham_vi": "CASE_TYPE", "loaian_ids": [1, 2] }]
}
```

> `phu_trach_phong_ban`: phòng ban thuộc tòa tỉnh / khu vực — KHÁC `phu_trach_vu_gdkt` (Vụ TATC).
> Nếu chọn id thuộc Vụ GĐKT TATC sẽ bị reject.

**Response 201 Created**:

```json
{
  "data": {
    "message": "Tạo tài khoản thành công",
    "user_id": 1,
    "canbo_id": 2115,
    "username": "012345678901",
    "ho_ten": "Nguyễn Văn A",
    "password": "Aa1@xY7z"
  }
}
```

**Response 400**: canbo không tồn tại / không active / chưa có socccd / thiếu `app_code` khi có config quyền / `group_id` không thuộc `app_code` / phong_ban thuộc Vụ GĐKT.
**Response 409 Conflict**:

- _"Cán bộ đã có tài khoản (user_id=X). Dùng API cập nhật quyền hoặc reset password thay vì tạo mới."_ — canbo này đã activate.
- _"Username 'X' đã tồn tại (CCCD trùng cán bộ khác)"_ — edge case data dirty: 2 canbo có cùng socccd.

---

## POST `/api/admin/users/bulk` — Bulk tạo tài khoản

Chỉ set password + chuyển status, KHÔNG config group/phu_trach. Single transaction — fail 1 user → rollback cả batch.

**Body**:

```json
{ "canbo_ids": [2115, 2116, 2117] }
```

**Response 200**:

```json
{
  "data": {
    "message": "Tạo tài khoản thành công cho 3 user",
    "activated": 3,
    "results": [{ "user_id": 1, "canbo_id": 2115, "username": "012345678901", "ho_ten": "...", "password": "Aa1@xY7z" }]
  }
}
```

---

## PUT `/api/admin/users/{userId}/permissions` — Cập nhật phân quyền

User phải đã activated (status ≠ `NOT_ACCOUNT`).

**Semantics**:

- `null` = skip (giữ nguyên trên app này)
- `[]` = xoá hết (replace bằng empty)
- `[items]` = REPLACE (xóa cũ + insert mới) — chỉ trên `app_code` request gửi
- 2 mảng `phu_trach_toa_tinh` + `phu_trach_toa_khu_vuc` coupled (cùng bảng) — ANY non-null → replace cả 2

**Body**:

```json
{
  "app_code": "IOC_WEB",
  "group_id": 5,
  "phu_trach_vu_gdkt": [...],
  "phu_trach_toa_tinh": [...],
  "phu_trach_toa_khu_vuc": [...],
  "phu_trach_phong_ban": [...]
}
```

**Response 200**:

```json
{ "data": { "message": "Cập nhật phân quyền thành công", "user_id": 1, "app_code": "IOC_WEB" } }
```

---

## POST `/api/admin/users/{userId}/reset-password`

BE random password mới + set status = `RESET` + force user đổi MK lần login tiếp.

**Response 200**:

```json
{
  "data": {
    "message": "Password reset thành công. User phải đổi mật khẩu khi đăng nhập lại.",
    "user_id": 1,
    "new_password": "Bc2#mN9p"
  }
}
```

---

## POST `/api/admin/users/{userId}/lock` — Khóa tài khoản

**Body** (optional):

```json
{ "reason": "Vi phạm quy định bảo mật" }
```

Không truyền body → mặc định reason = "Admin khoá".

**Response 200**:

```json
{ "data": { "message": "Khóa tài khoản thành công", "user_id": 1 } }
```

Set `hieuluc=0`, `account_status=LOCKED`, ghi `locked_at` + `locked_reason`.

---

## POST `/api/admin/users/{userId}/unlock` — Mở khóa

**Response 200**:

```json
{ "data": { "message": "Mở khóa tài khoản thành công", "user_id": 1 } }
```

Set `hieuluc=1`, `account_status=ACTIVE`, reset `failed_login_count=0`.

---

## DELETE `/api/admin/users/{username}/cache` — Xóa cache quyền

Force user reload permission lần request kế. Dùng khi admin debug hoặc sau khi sửa permission ở DB trực tiếp.

**Response 200**:

```json
{ "data": { "message": "Permission cache đã được xóa cho: nguyenvana" } }
```
