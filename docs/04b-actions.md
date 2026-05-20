# 04b. Actions (Action quản trị cho UI tạo/sửa nhóm)

Base path: `/api/admin/actions`

| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/admin/actions` | GET | Danh sách actions group theo admin_module |

Dữ liệu actions là **master data tĩnh** (seed sẵn trong V2). Không có API tạo / sửa / xóa — FE chỉ cần GET để render form.

---

## GET `/api/admin/actions`

**Permission**: `@RequireAction(GROUP_MGMT, VIEW)` — quyền giống mở form quản trị nhóm.

**Headers**: chuẩn (Bearer token).

**Response 200**:
```json
{
  "status": 200,
  "success": true,
  "data": {
    "user_mgmt": [
      { "id": 1, "ma": "VIEW",           "ten": "Xem danh sách / chi tiết người dùng", "mo_ta": "Truy cập màn hình quản trị người dùng",            "is_destructive": 0 },
      { "id": 2, "ma": "CREATE",         "ten": "Thêm mới người dùng",                 "mo_ta": "Tạo tài khoản mới, gán nhóm, phân công nghiệp vụ", "is_destructive": 0 },
      { "id": 3, "ma": "EDIT",           "ten": "Cập nhật người dùng",                 "mo_ta": "Sửa thông tin / phân quyền nhóm / phụ trách",      "is_destructive": 0 },
      { "id": 4, "ma": "LOCK",           "ten": "Khóa / Mở khóa tài khoản",            "mo_ta": "Đảo hieuluc + account_status (LOCKED ↔ ACTIVE)",   "is_destructive": 1 },
      { "id": 5, "ma": "RESET_PASSWORD", "ten": "Reset mật khẩu",                      "mo_ta": "Sinh mật khẩu mới ngẫu nhiên",                     "is_destructive": 1 }
    ],
    "group_mgmt": [
      { "id": 6,  "ma": "VIEW",     "ten": "Xem danh sách / chi tiết nhóm",     "mo_ta": "Truy cập màn hình quản trị nhóm quyền",       "is_destructive": 0 },
      { "id": 7,  "ma": "CREATE",   "ten": "Thêm mới nhóm quyền",               "mo_ta": "Tạo nhóm + chọn module + cấu hình scope",     "is_destructive": 0 },
      { "id": 8,  "ma": "EDIT",     "ten": "Cập nhật nhóm / phân quyền module", "mo_ta": "Sửa nhóm, thêm/bớt module, cấu hình scope",   "is_destructive": 0 },
      { "id": 9,  "ma": "DELETE",   "ten": "Xóa nhóm quyền",                    "mo_ta": "Cấm xóa nhóm hệ thống (is_system=1)",         "is_destructive": 1 },
      { "id": 10, "ma": "ADD_USER", "ten": "Quản lý thành viên",                "mo_ta": "Thêm / xóa user trong nhóm",                  "is_destructive": 0 }
    ],
    "system_log": [
      { "id": 11, "ma": "VIEW",   "ten": "Xem nhật ký hệ thống", "mo_ta": "Truy cập màn hình audit_log",                "is_destructive": 0 },
      { "id": 12, "ma": "SEARCH", "ten": "Tra cứu nhật ký",      "mo_ta": "Filter theo username / action / khoảng tg", "is_destructive": 0 }
    ]
  }
}
```

### Field

- `id` (Integer) — action ID, dùng làm value khi submit `*_action_ids`.
- `ma` (String) — code action (`VIEW` | `CREATE` | `EDIT` | `LOCK` | `RESET_PASSWORD` | `DELETE` | `ADD_USER` | `SEARCH`).
- `ten` (String) — label hiển thị trên UI.
- `mo_ta` (String, nullable) — tooltip / mô tả chi tiết.
- `is_destructive` (Integer 0|1) — `1` = UI nên hiển thị confirm dialog trước khi enable / submit (dùng cho `DELETE`, `LOCK`, `RESET_PASSWORD`).

### Tính chất

- 3 nhóm `user_mgmt` / `group_mgmt` / `system_log` luôn return đầy đủ (không phụ thuộc data).
- Chỉ trả action có `hieuluc = 1` — ETL_MGMT actions không nằm trong API này (nếu cần riêng cho UI ETL admin sẽ làm endpoint khác sau).
- Order: theo `admin_module` rồi `ma` (ASC).

---

## Cách FE dùng trong form tạo/sửa user_group

1. Khi mở form: gọi song song
   - `GET /api/admin/module/options` → render section **Nghiệp vụ** (7 checkbox).
   - `GET /api/admin/actions` → render section **Quản trị** với 3 sub-section (Người dùng / Nhóm người dùng / Nhật ký hệ thống).

2. State client lưu 3 array tích chọn:
   ```js
   {
     user_mgmt_action_ids:  [...],
     group_mgmt_action_ids: [...],
     system_log_action_ids: [...]
   }
   ```

3. Submit qua `POST /api/admin/user-groups` hoặc `PUT /api/admin/user-groups/{id}` — body field name khớp 1-1 với response key (xem [03-user-groups.md](auth-api/03-user-groups.md)).

4. Khi load form **EDIT**: gọi `GET /api/admin/user-groups/{id}` để lấy `action_ids` đang gán → tách theo `admin_module` rồi tick sẵn checkbox.
