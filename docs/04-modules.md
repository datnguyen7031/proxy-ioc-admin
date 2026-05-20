# 04. Modules (Module nghiệp vụ)

Base path: `/api/admin/modules`
Permission: `GROUP_MGMT.{action}`.

| Endpoint | Method | Action | Mô tả |
|---|---|---|---|
| `/api/admin/modules` | GET | VIEW | Danh sách module active |
| `/api/admin/modules` | POST | CREATE | Tạo module |
| `/api/admin/modules/{moduleId}` | PUT | EDIT | Cập nhật module |
| `/api/admin/modules/{moduleId}` | DELETE | DELETE | Xoá module (soft) |

---

## GET `/api/admin/modules`

**Response 200**:
```json
{
  "data": [
    {
      "id": 1,
      "module_code": "VU_GDKT",
      "module_name": "Vụ GĐKT",
      "ngaytao": "2026-01-01T00:00:00",
      "ngaycapnhat": null
    }
  ]
}
```

Chỉ trả module chưa xoá (`ngayxoa IS NULL`).

---

## POST `/api/admin/modules`

**Body**:
```json
{
  "module_code": "VGDKT_NEW",
  "module_name": "Module mới"
}
```

**Response 200**:
```json
{ "data": { "message": "Tạo module thành công", "module_code": "VGDKT_NEW" } }
```

**Response 400**: `module_code` hoặc `module_name` rỗng.
**Response 409 Conflict**: `module_code` đã tồn tại (UNIQUE).

---

## PUT `/api/admin/modules/{moduleId}`

**Body** (field nullable = skip):
```json
{
  "module_code": "VGDKT_v2",
  "module_name": "Vụ GĐKT (mới)"
}
```

**Response 200**:
```json
{ "data": { "message": "Cập nhật module thành công", "module_id": 1 } }
```

Sau update: BE evict toàn bộ permission cache (vì module có thể ảnh hưởng quyền).

---

## DELETE `/api/admin/modules/{moduleId}` — Xoá soft

Set `ngayxoa = NOW()`. **Reject** nếu còn liên kết:

**Response 409 Conflict**:
- *"Không thể xoá module còn được nhóm tham chiếu. Vui lòng gỡ module khỏi tất cả nhóm trước. (số nhóm: 3)"*
- *"Không thể xoá module còn ETL script active. Vui lòng xoá hết ETL script của module trước. (số script: 2)"*

**Response 200**:
```json
{ "data": { "message": "Xóa module thành công", "module_id": 1 } }
```

Sau delete: BE evict permission cache.
