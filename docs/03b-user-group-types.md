# 03b. User Group Types (Loại nhóm / Vai trò)

Catalog các loại nhóm — đại diện vai trò (role) trong hệ thống. Mỗi `user_group` reference 1 loại nhóm qua `loai_nhom` (lưu id, không FK constraint).

Ví dụ loại nhóm:
- `ADMIN` — Quản trị viên
- `CA_TATC` — Chánh án TANDTC
- `PCA_TATC` — Phó Chánh án TANDTC
- `CA_TINH` — Chánh án Tỉnh
- `CA_KV` — Chánh án Khu vực
- `PCA_TINH` — Phó Chánh án Tỉnh
- `PCA_KV` — Phó Chánh án Khu vực
- `VUTRUONG` — Vụ trưởng
- `TPTATC` — Thẩm phán TATC

Base path: `/api/admin/user-group-types`
Permission: `GROUP_MGMT.{action}`.

| Endpoint | Method | Action | Mô tả |
|---|---|---|---|
| `/api/admin/user-group-types` | GET | VIEW | Danh sách loại nhóm |
| `/api/admin/user-group-types/{id}` | GET | VIEW | Chi tiết loại nhóm |
| `/api/admin/user-group-types` | POST | CREATE | Tạo loại nhóm |
| `/api/admin/user-group-types/{id}` | PUT | EDIT | Cập nhật |
| `/api/admin/user-group-types/{id}` | DELETE | DELETE | Xóa (soft) |

---

## GET `/api/admin/user-group-types` — Danh sách

**Query params**:
| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo `ma` hoặc `ten` (LIKE case-insensitive) |
| `hieuluc` | int | 0=inactive, 1=active. Bỏ trống = tất cả |
| `page` | int | mặc định 0 |
| `size` | int | mặc định 20, max 100 |

**Response 200**:
```json
{
  "data": {
    "data": [
      {
        "id": 3,
        "ma": "PCA_TATC",
        "ten": "Phó Chánh án TANDTC",
        "hieuluc": 1,
        "ngaytao": "2026-05-12T07:30:00",
        "nguoitao": "admin",
        "ngaycapnhat": null,
        "nguoicapnhat": null
      }
    ],
    "total": 9, "page": 0, "size": 20, "total_pages": 1
  }
}
```

---

## GET `/api/admin/user-group-types/{id}` — Chi tiết

**Response 200**:
```json
{
  "data": {
    "id": 3,
    "ma": "PCA_TATC",
    "ten": "Phó Chánh án TANDTC",
    "hieuluc": 1,
    "ngaytao": "...",
    "nguoitao": "...",
    "ngaycapnhat": "...",
    "nguoicapnhat": "..."
  }
}
```

**Response 404**: loại nhóm không tồn tại hoặc đã xóa.

---

## POST `/api/admin/user-group-types` — Tạo

**Body**:
```json
{
  "ma": "PCA_TATC",
  "ten": "Phó Chánh án TANDTC",
  "hieuluc": 1
}
```

Field:
- `ma` (required) — UNIQUE, không dấu, viết hoa (vd `PCA_TATC`)
- `ten` (required)
- `hieuluc` — mặc định 1

**Response 201**:
```json
{
  "data": {
    "message": "Tạo loại nhóm thành công",
    "id": 3,
    "ma": "PCA_TATC"
  }
}
```

**Response 400**: `ma`/`ten` rỗng, `hieuluc` không phải 0/1.
**Response 409 Conflict**: `ma` đã tồn tại.

---

## PUT `/api/admin/user-group-types/{id}` — Cập nhật

**Body** (field nullable = skip):
```json
{
  "ma": "PCA_TATC",
  "ten": "Phó Chánh án TANDTC (mới)",
  "hieuluc": 1
}
```

> Đổi `ma` cần unique check toàn bảng.
> Đổi `ma` ảnh hưởng tất cả `user_group` đang reference — BE chỉ đổi label catalog, ID giữ nguyên nên reference vẫn đúng.

**Response 200**:
```json
{ "data": { "message": "Cập nhật loại nhóm thành công", "id": 3 } }
```

**Response 409 Conflict**: `ma` mới trùng với loại nhóm khác.

---

## DELETE `/api/admin/user-group-types/{id}` — Xóa

Soft delete: set `ngayxoa = NOW()`.

**Response 200**:
```json
{ "data": { "message": "Xóa loại nhóm thành công", "id": 3 } }
```

⚠️ **Lưu ý**: Xóa loại nhóm KHÔNG cascade tới `user_group` đang reference. Cần đảm bảo không còn group nào trỏ về loại này trước khi xóa. (Hiện BE chưa check ràng buộc này — nên check thủ công.)

---

## Quan hệ với `user_group`

```
user_group_type (catalog)
   ↑ loai_nhom (BIGINT, không FK constraint)
user_group
   ↑ group_id
user_group_member  ← user
user_group_module
user_group_module_filter ← filter rules per (group, module, column)
```

Khi FE gọi `POST /api/admin/user-groups`:
- Truyền `loai_nhom_id` lấy từ `GET /api/admin/user-group-types`
- BE validate `loai_nhom_id` tồn tại + active + chưa xóa
