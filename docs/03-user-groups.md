# 03. User Groups (Nhóm quyền)

Base path: `/api/admin/user-groups`
Permission: `GROUP_MGMT.{action}`.

| Endpoint                                       | Method | Action   | Mô tả                           |
| ---------------------------------------------- | ------ | -------- | ------------------------------- |
| `/api/admin/user-groups`                       | GET    | VIEW     | Danh sách nhóm                  |
| `/api/admin/user-groups/{id}`                  | GET    | VIEW     | Chi tiết nhóm + members         |
| `/api/admin/user-groups`                       | POST   | CREATE   | Tạo nhóm                        |
| `/api/admin/user-groups/{id}`                  | PUT    | EDIT     | Cập nhật nhóm                   |
| `/api/admin/user-groups/{id}`                  | DELETE | DELETE   | Xoá nhóm (soft)                 |
| `/api/admin/user-groups/{id}/candidates`       | GET    | ADD_USER | Danh sách user để thêm vào nhóm |
| `/api/admin/user-groups/{id}/members`          | POST   | ADD_USER | Thêm user vào nhóm              |
| `/api/admin/user-groups/{id}/members/{userId}` | DELETE | ADD_USER | Xoá user khỏi nhóm              |

---

## GET `/api/admin/user-groups` — Danh sách

**Query params**:
| Param | Type | Mô tả |
|---|---|---|
| `app_code` | string | `IOC_WEB` \| `IOC_MOBILE`. Bỏ trống = tất cả app |
| `search` | string | Tìm theo tên nhóm (LIKE) |
| `hieuluc` | int | 0=disabled, 1=active |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20, max 40 |

**Response 200**:

```json
{
  "data": {
    "data": [{ "id": 1, "ma_nhom": "super-admin", "ten_nhom": "Quản trị hệ thống", "app_code": "IOC_WEB" }],
    "total": 1,
    "page": 0,
    "size": 20,
    "total_pages": 1
  }
}
```

---

## GET `/api/admin/user-groups/{id}` — Chi tiết

**Query params** (filter members):
| Param | Mô tả |
|---|---|
| `search` | Họ tên thành viên (LIKE) |
| `toaan_id` | ID đơn vị công tác |
| `machucvu` | Mã chức vụ |
| `machucdanh` | Mã chức danh |
| `page`, `size` | Pagination members (max 40) |

**Response 200**:

```json
{
  "data": {
    "group": {
      "id": 1,
      "ma_nhom": "super-admin",
      "ten_nhom": "Quản trị hệ thống",
      "app_code": "IOC_WEB",
      "is_system": 1,
      "hieuluc": 1,
      "loai_nhom_id": 1,
      "loai_nhom_ma": "ADMIN",
      "loai_nhom_ten": "Quản trị hệ thống",
      "ngaytao": "2026-01-01T00:00:00",
      "nguoitao": "admin",
      "ngaycapnhat": null,
      "nguoicapnhat": null
    },
    "actions": [{ "action_id": 1, "ma": "VIEW", "ten": "Xem ds người dùng", "admin_module": "USER_MGMT" }],
    "modules": [{ "module_id": 1, "module_code": "VU_GDKT", "module_name": "Vụ GĐKT" }],
    "members": {
      "data": [
        {
          "id": 1,
          "ho_ten": "...",
          "don_vi_cong_tac": "...",
          "don_vi_phu_trach": "...",
          "chuc_vu": "...",
          "chuc_danh": "...",
          "in_group": true
        }
      ],
      "total": 1,
      "page": 0,
      "size": 20,
      "total_pages": 1
    }
  }
}
```

---

## POST `/api/admin/user-groups` — Tạo nhóm

`ma_nhom` BE tự sinh từ `ten_nhom` (slugify). UNIQUE theo `(ma_nhom, app_code)`.

Yêu cầu `loai_nhom_id` — FK tới `user_group_type` (vai trò: ADMIN, CA_TATC, PCA_TATC...). Xem `/api/admin/user-group-types`.

**Body**:

```json
{
  "ten_nhom": "Nhóm 001",
  "app_code": "IOC_WEB",
  "loai_nhom_id": 3,
  "module_ids": [1, 2, 3, 4],
  "user_mgmt_action_ids": [1, 2, 3],
  "group_mgmt_action_ids": [6, 7],
  "system_log_action_ids": [11]
}
```

### Field `loai_nhom_id`

Bắt buộc khi tạo. Reference `user_group_type.id`. BE validate: tồn tại + `hieuluc=1` + chưa xoá.

### Filter rules KHÔNG config ở đây

Sau refactor V5, filter rule (data scope) là **catalog theo `loai_nhom`** (vai trò), không config per-group. Group chỉ gán `loai_nhom_id` → tự inherit filter rules của role đó. Config filter rules qua `PUT /api/admin/user-group-types/{id}/module-filters` (xem [03b-user-group-types.md](03b-user-group-types.md)).

**Response 201**:

```json
{
  "data": {
    "message": "Tạo nhóm thành công",
    "id": 5,
    "ma_nhom": "nhom-001",
    "app_code": "IOC_WEB"
  }
}
```

**Response 400**: `app_code` thiếu/sai, `ten_nhom` rỗng, `loai_nhom_id` thiếu/không tồn tại.
**Response 409 Conflict**: `ma_nhom` đã tồn tại trên cùng `app_code` _(BE tự slugify từ `ten_nhom`)_.

---

## PUT `/api/admin/user-groups/{id}` — Cập nhật

**Body** (mọi field nullable = skip):

```json
{
  "ten_nhom": "Nhóm 001 v2",
  "loai_nhom_id": 4,
  "module_ids": [1, 2, 3],
  "user_mgmt_action_ids": [...],
  "group_mgmt_action_ids": [...],
  "system_log_action_ids": [...]
}
```

> `app_code` immutable — gửi cũng bị ignore.
> `loai_nhom_id` cho phép đổi (đổi vai trò group → inherit filter rules của role mới).
> Action sync: nếu BẤT KỲ 1 trong 3 `*_action_ids` non-null (kể cả `[]`) → BE merge cả 3 + REPLACE actions của nhóm. Nếu cả 3 đều `null` → skip.
> `module_ids` sync: null = skip; non-null = REPLACE modules của nhóm.
> Sau khi sync actions/modules thay đổi → BE evict permission cache của tất cả member.

**Response 200**:

```json
{ "data": { "message": "Cập nhật nhóm thành công", "id": 5, "ma_nhom": "nhom-001-v2" } }
```

**Response 400**: nhóm hệ thống (`is_system=1`) không cho sửa.

---

## DELETE `/api/admin/user-groups/{id}` — Xoá nhóm

Soft-delete: set `ngayxoa = NOW()`, đổi `ma_nhom` → `{ma_nhom}_del_{ts}` để giải phóng UNIQUE.

**Response 200**:

```json
{ "data": { "message": "Xóa nhóm thành công", "id": 5 } }
```

**Response 400**: Nhóm hệ thống (`is_system=1`) không cho xoá.
**Response 409 Conflict**: Nhóm còn member — _"Không thể xoá nhóm còn user. Vui lòng xoá toàn bộ thành viên khỏi nhóm trước. (số thành viên hiện tại: 5)"_

---

## GET `/api/admin/user-groups/{id}/candidates` — DS user để thêm

Trả về toàn bộ user active + cờ `in_group` cho `group_id` này.

**Query params**: giống `/{id}` (search, toaan_id, machucvu, machucdanh, page, size).

**Response 200** (PageResponse):

```json
{
  "data": {
    "data": [
      {
        "id": 10,
        "ho_ten": "...",
        "don_vi_cong_tac": "...",
        "don_vi_phu_trach": "...",
        "chuc_vu": "...",
        "chuc_danh": "...",
        "in_group": false
      }
    ],
    "total": 100,
    "page": 0,
    "size": 20,
    "total_pages": 5
  }
}
```

FE dùng cờ `in_group` để disable checkbox user đã trong nhóm.

---

## POST `/api/admin/user-groups/{id}/members` — Thêm user vào nhóm

Bulk add. User đã có sẽ skip (idempotent).

**Body**:

```json
{ "user_ids": [1, 2, 3] }
```

**Response 201**:

```json
{
  "data": {
    "message": "Thêm user vào nhóm thành công",
    "group_id": 5,
    "added": 2,
    "skipped_existing": 1,
    "user_ids": [1, 2]
  }
}
```

**Response 400**: nhóm đã xoá / disabled, hoặc `user_ids` rỗng.

---

## DELETE `/api/admin/user-groups/{id}/members/{userId}` — Xoá user khỏi nhóm

**Response 200**:

```json
{ "data": { "message": "Xóa user khỏi nhóm thành công", "group_id": 5, "user_id": 1 } }
```

**Response 404**: user không thuộc nhóm.
