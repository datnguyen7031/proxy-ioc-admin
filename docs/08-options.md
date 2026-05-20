# 08. Options (Bộ lọc / dropdown)

Tách 4 nhóm theo concern:

- `/api/v1/options/*` — nghiệp vụ (loại án, vụ GĐKT, đơn vị) cho các màn báo cáo end-user.
- `/api/admin/users/options/*` — admin filter màn quản lý người dùng + dropdown khi gán phụ trách.
- `/api/admin/user-groups/options/*` — admin filter màn quản lý nhóm.
- `/api/admin/module/options` — danh sách module nghiệp vụ cho form tạo/sửa nhóm.

---

## A. Nghiệp vụ — `/api/v1/options`

| Endpoint                         | Mô tả                                      |
| -------------------------------- | ------------------------------------------ |
| `GET /api/v1/options/loai-an`    | Danh sách loại án active (filter `search`) |
| `GET /api/v1/options/loai-trinh` | Danh sách loại trình (filter `search`)     |
| `GET /api/v1/options/don-vi`     | Danh sách tòa án (filter `search`)         |
| `GET /api/v1/options/vu-gdkt`    | Danh sách Vụ GĐKT + assigned info          |
| `GET /api/v1/options/loai-an/me` | Loại án theo quyền user hiện tại           |

### `GET /api/v1/options/loai-an?search=...`

```json
{
  "data": [{ "idloaian": 1, "tenloaian": "Hình sự", "thutu": 1, "trangthai": 1, "tenviettat": null, "kyhieu": "HS" }]
}
```

### `GET /api/v1/options/loai-trinh?search=...`

```json
{ "data": [{ "loaitrinh": "LDV", "description": "Trình lãnh đạo vụ" }] }
```

### `GET /api/v1/options/don-vi?search=...`

```json
{ "data": [{ "id": 1, "ten": "TAND TP. Hà Nội" }] }
```

### `GET /api/v1/options/vu-gdkt?search=...`

Mỗi item là phongban (Vụ GĐKT) có flag assigned cho thẩm phán nào:

```json
{
  "data": [
    {
      "idphongban": 361,
      "tenphongban": "Vụ A",
      "assigned_canbo_id": 100,
      "assigned_hoten": "Nguyễn Văn A",
      "allow_choose": false
    }
  ]
}
```

### `GET /api/v1/options/loai-an/me`

```json
{
  "data": [
    {
      "idloaian": 1,
      "tenloaian": "Hình sự",
      "thutu": 1,
      "kyhieu": "HS",
      "tenviettat": null,
      "active_modules": ["VU_GDKT", "GIAIQUYET_PCA"]
    }
  ]
}
```

`active_modules` = danh sách module mà user có quyền truy cập với loại án này.

---

## B. Admin user filter — `/api/admin/users/options`

Permission: `USER_MGMT.VIEW`.

| Endpoint                                   | Mô tả                                 | Use case                     |
| ------------------------------------------ | ------------------------------------- | ---------------------------- |
| `GET /api/admin/users/options/filter`      | Combined 4 dropdown cho màn list user | Mount màn list               |
| `GET /api/admin/users/options/loai-an`     | Loại án + entry "Tất cả"              | Filter loại án               |
| `GET /api/admin/users/options/vu-gdkt`     | 7 phòng ban Vụ GĐKT TATC              | Form gán phụ trách Vụ GĐKT   |
| `GET /api/admin/users/options/toa-tinh`    | Tòa cấp tỉnh (loaitoa=CAPTINH)        | Form gán phụ trách tòa tỉnh  |
| `GET /api/admin/users/options/toa-khu-vuc` | Tòa khu vực thuộc 1 tòa tỉnh          | Form gán phụ trách khu vực   |
| `GET /api/admin/users/options/phong-ban`   | Phòng ban thuộc 1 tòa                 | Form gán phụ trách phòng ban |

### B.1 — `GET /api/admin/users/options/filter`

Trả 4 list cho dropdown màn list user. Mỗi dropdown có search param riêng — bỏ trống = list đó trả full.

**Query params** (tất cả optional):
| Param | Mô tả |
|---|---|
| `don_vi_q` | Tìm tên đơn vị (LIKE) |
| `chuc_vu_q` | Tìm trong mã + tên chức vụ |
| `chuc_danh_q` | Tìm trong mã + tên chức danh |
| `account_status_q` | Tìm trong code + label account_status |

**Response 200**:

```json
{
  "data": {
    "don_vi": [{ "id": 1, "ten": "TAND TP. Hà Nội" }],
    "chuc_vu": [{ "ma": "CA", "ten": "Chánh án" }],
    "chuc_danh": [{ "ma": "TPTC", "ten": "Thẩm phán cao cấp" }],
    "account_status": [
      { "code": "ACTIVE", "label": "Đang hoạt động" },
      { "code": "LOCKED", "label": "Đã khóa" },
      { "code": "PENDING_CHANGE_PASSWORD", "label": "Chờ đổi mật khẩu" },
      { "code": "RESET", "label": "Đã reset mật khẩu" },
      { "code": "NOT_ACCOUNT", "label": "Chưa có tài khoản" }
    ]
  }
}
```

### B.2 — `GET /api/admin/users/options/loai-an`

```json
{
  "data": [
    { "id": 0, "ten": "Tất cả" },
    { "id": 1, "ten": "Hình sự" }
  ]
}
```

FE: `selected.id === 0` → không filter loại án.

### B.3 — `GET /api/admin/users/options/vu-gdkt?search=...`

Phòng ban Vụ GĐKT TATC — query view MySQL `vw_dm_phongban WHERE flag_vgdkttatc = 1 AND hieuluc = 1`. `search` LIKE theo `tenphongban` / `tenviettat`.

```json
{
  "data": [
    { "id": 361, "ten": "Vụ Giám đốc kiểm tra I" },
    { "id": 362, "ten": "Vụ Giám đốc kiểm tra II" }
  ]
}
```

### B.4 — `GET /api/admin/users/options/toa-tinh?search=...`

Tòa cấp tỉnh — query view MySQL `vw_dm_toaan WHERE loaitoa = 'CAPTINH'`. `search` LIKE theo `ten_ngangon` / `ten_daydu` / `ma`.

```json
{
  "data": [
    { "id": 7, "ten": "Tòa án nhân dân thành phố Đà Nẵng" },
    { "id": 8, "ten": "Tòa án nhân dân tỉnh Hà Giang" }
  ]
}
```

### B.5 — `GET /api/admin/users/options/toa-khu-vuc?toa_tinh_id=...&search=...`

Tòa khu vực thuộc 1 tòa tỉnh — query view MySQL `vw_dm_toaan WHERE loaitoa = 'CAPHUYEN' AND idtoatinh = :toa_tinh_id`. **`toa_tinh_id` bắt buộc** (= `idtoaan` của tòa tỉnh, lấy từ B.4).

```json
{
  "data": [
    { "id": 1710, "ten": "Tòa án nhân dân Khu vực 1 - Đà Nẵng" },
    { "id": 1711, "ten": "Tòa án nhân dân Khu vực 2 - Đà Nẵng" }
  ]
}
```

### B.6 — `GET /api/admin/users/options/phong-ban?toaan_id=...&search=...`

Phòng ban thuộc 1 tòa cụ thể (tòa tỉnh hoặc khu vực). Loại trừ Vụ GĐKT TATC. **`toaan_id` bắt buộc.**

```json
{
  "data": [
    { "id": 1234, "ten": "Văn phòng" },
    { "id": 1235, "ten": "Phòng tổ chức" }
  ]
}
```

### Flow FE form tạo/cập nhật tài khoản

```
1. Mount form:
   - GET /options/vu-gdkt          → 7 vụ
   - GET /options/toa-tinh         → 65 tòa tỉnh
   - User chưa chọn tòa tỉnh → khu vực dropdown disabled
   - User chưa chọn tòa → phòng ban dropdown disabled

2. User search "Tòa tỉnh":
   - GET /options/toa-tinh?search=Hau Giang → filter

3. User chọn 1 tòa tỉnh "TAND tỉnh Hậu Giang" (id=15):
   - GET /options/toa-khu-vuc?toa_tinh_id=15 → list khu vực
   - User search trong khu vực → ?toa_tinh_id=15&search=khu vuc 1

4. User chọn khu vực hoặc tòa tỉnh để xem phòng ban:
   - GET /options/phong-ban?toaan_id=<id_khu_vuc> → phòng ban thuộc tòa đó

5. Submit:
   POST /api/admin/users  hoặc  PUT /api/admin/users/{id}/permissions
   body: { phu_trach_vu_gdkt, phu_trach_toa_tinh, phu_trach_toa_khu_vuc, phu_trach_phong_ban }
```

---

## C. Admin group filter — `/api/admin/user-groups/options`

Permission: `GROUP_MGMT.VIEW`.

### `GET /api/admin/user-groups/options/filter`

Cho màn chi tiết nhóm (filter members). Schema giống `/api/admin/users/options/filter` nhưng KHÔNG có `account_status`.

**Query params**:
| Param | Mô tả |
|---|---|
| `don_vi_q` | Tìm tên đơn vị (LIKE) |
| `chuc_vu_q` | Tìm trong mã + tên chức vụ |
| `chuc_danh_q` | Tìm trong mã + tên chức danh |

**Response 200**:

```json
{
  "data": {
    "don_vi":    [...],
    "chuc_vu":   [...],
    "chuc_danh": [...]
  }
}
```

> **Đã gỡ:** endpoint `GET /api/admin/user-groups/options/permission-config` không còn tồn tại. Sau refactor V5, filter rule (data scope) là catalog theo `loai_nhom` (vai trò), không config per-group qua UI nữa — nên các constants `scope_types/filter_types/scope_sources` không còn dùng.

---

## D. Module options — `/api/admin/module/options`

Permission: `GROUP_MGMT.VIEW`.

### `GET /api/admin/module/options`

Trả list module nghiệp vụ active — clean shape `{id, module_code, module_name}` để FE render section "Nghiệp vụ" (7 checkbox) trong form tạo/sửa user_group.

```json
{
  "data": [
    { "id": 1, "module_code": "VU_GDKT", "module_name": "Vụ Giám đốc kiểm tra" },
    { "id": 2, "module_code": "GIAIQUYET_PCA", "module_name": "Giải quyết của PCA" },
    { "id": 3, "module_code": "GIAIQUYET_TPTATC", "module_name": "Giải quyết của TPTATC" },
    { "id": 4, "module_code": "GIAIQUYET_STPT", "module_name": "Giải quyết Sơ thẩm, Phúc thẩm" },
    { "id": 5, "module_code": "GDTTT_CAPTINH", "module_name": "Thủ tục Giám đốc thẩm cấp tỉnh" },
    { "id": 6, "module_code": "VAN_PHONG", "module_name": "Văn phòng" },
    { "id": 7, "module_code": "TINHHINH_SDPM", "module_name": "Tình hình sử dụng phần mềm" }
  ]
}
```

### Cách dùng cùng `/api/admin/actions`

Khi mount form tạo/sửa user_group, gọi song song:

- `GET /api/admin/module/options` → render checkbox **Nghiệp vụ** (7 cái).
- `GET /api/admin/actions` → render 3 sub-section **Quản trị** (xem [04b-actions.md](../04b-actions.md)).

Submit qua `POST /api/admin/user-groups` (xem [03-user-groups.md](03-user-groups.md)) — body cần `module_ids` (từ API này) + 3 `*_action_ids` (từ `/api/admin/actions`).
