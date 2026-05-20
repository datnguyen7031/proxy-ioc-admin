# 07. System (Cache & Health)

Base path: `/admin/system`
Permission: tất cả endpoint cần `is_system_admin = 1` hoặc tương đương.

| Endpoint | Method | Mô tả |
|---|---|---|
| `/admin/system/cache/status` | GET | Trạng thái caches (size, loaded) |
| `/admin/system/cache/clear` | POST | Xóa toàn bộ caches |
| `/admin/system/cache/etl/reload` | POST | Reload ETL scripts từ DB |
| `/admin/system/cache/kybaocao/reload` | POST | Reload kỳ báo cáo |
| `/admin/system/cache/kybaocao/clear` | POST | Xóa cache kỳ báo cáo |
| `/admin/system/cache/options/reload` | POST | Reload options master |
| `/admin/system/cache/options/clear` | POST | Xóa cache options |
| `/admin/system/cache/permissions/clear` | POST | Xóa toàn bộ permission cache |
| `/admin/system/cache/permissions/clear/{username}` | POST | Xóa permission cache 1 user |
| `/admin/system/cache/detail-count/clear` | POST | Xóa toàn bộ detail-count cache |
| `/admin/system/cache/detail-count/clear/{module}` | POST | Xóa detail-count theo module |

---

## GET `/admin/system/cache/status`

**Response 200**:
```json
{
  "data": {
    "etl": { "loaded": true, "sum_scripts": 25, "detail_scripts": 12, "total": 37 },
    "kybaocao": { "loaded": true, "size": 3 },
    "options": { ... },
    "permissions": { "active_users": 8 },
    "detail_count": { "modules": 5 }
  }
}
```

---

## POST endpoints — đều trả format chung

```json
{ "data": { "message": "...", "cleared": <count|null>, "loaded": <bool|null> } }
```

VD `POST /admin/system/cache/etl/reload`:
```json
{ "data": { "message": "ETL scripts reloaded thành công", "loaded": true, "sum_scripts": 25, "detail_scripts": 12 } }
```

VD `POST /admin/system/cache/permissions/clear/admin`:
```json
{ "data": { "message": "Đã xoá permission cache cho user: admin" } }
```

Các endpoint cache thường dùng khi:
- Sau khi sửa data master/permissions trong DB trực tiếp.
- Debug: ép reload để thấy data mới ngay.
- Cleanup khi memory phình.
