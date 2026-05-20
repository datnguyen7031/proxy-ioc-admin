# 01. Authentication

Base path: `/auth`

| Endpoint                    | Method | Auth     | Mô tả                                             |
| --------------------------- | ------ | -------- | ------------------------------------------------- |
| `/api/auth/public-key`      | GET    | ❌       | Lấy RSA public key để mã hóa password phía client |
| `/api/auth/login`           | POST   | ❌       | Đăng nhập                                         |
| `/api/auth/refresh`         | POST   | ❌       | Làm mới access token                              |
| `/api/auth/profile`         | GET    | ✅       | Lấy thông tin user hiện tại                       |
| `/api/auth/change-password` | POST   | optional | Đổi mật khẩu                                      |
| `/api/auth/register`        | POST   | ❌       | Đăng ký (mock cho App Store)                      |

---

## GET `/api/auth/public-key`

**Response**:

```json
{ "status": 200, "success": true, "data": { "public_key": "-----BEGIN PUBLIC KEY-----\n..." } }
```

FE dùng public key này encrypt password (RSA) trước khi gửi `/login` và `/change-password`.

---

## POST `/api/auth/login`

**Headers**:

```
X-App-Code: IOC_WEB | IOC_MOBILE     # bắt buộc
```

**Body**:

```json
{
  "username": "admin",
  "password": "<RSA-encrypted-password>"
}
```

**Response 200** (login thành công — `BasicView` subset):

```json
{
  "status": 200,
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "user": {
      "username": "admin",
      "ho_ten": "...",
      "password_changed": 2,
      "account_status": "ACTIVE"
    }
  }
}
```

> Login response chỉ trả `BasicView` (subset fields). Full info xem `/profile` hoặc `/refresh`.

**Response 403** (lần đầu login, chưa đổi mật khẩu mặc định / sau reset):

```json
{
  "status": 403,
  "success": false,
  "message": "Tài khoản mới tạo, yêu cầu đổi mật khẩu lần đầu để đăng nhập",
  "data": {
    "must_change_password": true,
    "password_changed": 0,
    "username": "admin"
  }
}
```

→ FE redirect màn change-password.

**Response 401**: sai username/password hoặc thiếu/sai `X-App-Code`.

---

## POST `/api/auth/refresh`

**Body**:

```json
{ "refresh_token": "eyJhbGciOi..." }
```

**Response 200** (FullView — gồm groups + permissions nested + phụ trách):

```json
{
  "status": 200,
  "success": true,
  "data": {
    "access_token": "...",
    "refresh_token": "...",
    "user": {
      "user_id": 1,
      "username": "admin",
      "idthamphan": 100,
      "ho_ten": "...",
      "ngay_sinh": "1980-01-15T00:00:00",
      "password_changed": 2,
      "account_status": "ACTIVE",
      "groups": [
        {
          "group_id": 5,
          "ten_nhom": "Nhóm 001",
          "app_code": "IOC_WEB",
          "nghiep_vu": [{ "module_code": "VU_GDKT", "actions": ["VIEW"] }],
          "quan_tri": [{ "module_code": "USER_MGMT", "actions": ["VIEW", "CREATE", "EDIT", "LOCK"] }]
        }
      ],
      "don_vi_cong_tac": {
        "idtoaan": 1,
        "ten_ngangon": "TANDTC",
        "ten_tangangon": "TC",
        "ten_daydu": "Tòa án nhân dân tối cao",
        "idphongban": null
      },
      "chuc_vu": {
        "machucvu": "CA",
        "tenchucvu": "Chánh án",
        "machucdanh": "TPTATC",
        "tenchucdanh": "Thẩm phán TATC"
      }
    }
  }
}
```

> Quyền hạn nested trong từng `groups[i]`:
>
> - `nghiep_vu`: module nghiệp vụ (data modules từ `user_group_module`), implicit `actions: ["VIEW"]`.
> - `quan_tri`: module quản trị admin (USER_MGMT, GROUP_MGMT, SYSTEM_LOG, ETL_MGMT) từ `user_group_action` + `action_management`, kèm CRUD actions.
> - `app_code` per group — FE biết group thuộc app nào (1 user có thể là member của groups thuộc IOC_WEB + IOC_MOBILE).
> - Trả TẤT CẢ groups user là member (không filter theo app context).
>
> `app_code` request lấy từ refresh token claim — không cần truyền.

**Response 401**: refresh token hết hạn / sai / thiếu `app_code` claim.

---

## GET `/api/auth/profile`

**Headers**: `Authorization: Bearer <access_token>`

**Response 200** (FullView + phụ trách):

```json
{
  "status": 200,
  "success": true,
  "data": {
    "user_id": 1,
    "username": "admin",
    "idthamphan": 100,
    "ho_ten": "...",
    "ngay_sinh": "1980-01-15T00:00:00",
    "password_changed": 2,
    "account_status": "ACTIVE",
    "groups": [
      {
        "group_id": 5,
        "ten_nhom": "Nhóm 001",
        "app_code": "IOC_WEB",
        "nghiep_vu": [
          { "module_code": "VU_GDKT", "actions": ["VIEW"] }
        ],
        "quan_tri": [
          { "module_code": "USER_MGMT", "actions": ["VIEW", "CREATE", "EDIT", "LOCK", "RESET_PASSWORD"] }
        ]
      }
    ],
    "don_vi_cong_tac": {...},
    "chuc_vu": {...},
    "loai_an": [
      { "idloaian": 1, "tenloaian": "Hình sự", "kyhieu": "HS", "thutu": 1 }
    ],
    "vu_gdkt": [
      {
        "idphongban": 361,
        "tenphongban": "Vụ Giám đốc kiểm tra I",
        "pham_vi": "ALL",
        "loai_an": []
      },
      {
        "idphongban": 401,
        "tenphongban": "Vụ XYZ",
        "pham_vi": "CASE_TYPE",
        "loai_an": [
          { "idloaian": 1, "tenloaian": "Hình sự", "kyhieu": "HS", "thutu": 1 },
          { "idloaian": 2, "tenloaian": "Dân sự", "kyhieu": "DS", "thutu": 2 }
        ]
      }
    ],
    "toa_phu_trach": [
      {
        "idtoaan": 5,
        "tentoaan": "Tòa án ABC",
        "pham_vi": "CASE_TYPE",
        "loai_an": [
          { "idloaian": 3, "tenloaian": "Hôn nhân gia đình", "kyhieu": "HNGĐ", "thutu": 3 }
        ]
      }
    ],
    "phong_ban_phu_trach": [
      {
        "idphongban": 410,
        "tenphongban": "Phòng nghiệp vụ 1",
        "pham_vi": "ALL",
        "loai_an": []
      }
    ]
  }
}
```

### Schema fields

| Field                   | Type   | Mô tả                                                                     |
| ----------------------- | ------ | ------------------------------------------------------------------------- |
| `groups[].group_id`     | Long   | ID nhóm                                                                   |
| `groups[].ten_nhom`     | String | Tên nhóm hiển thị                                                         |
| `groups[].app_code`     | String | `IOC_WEB` / `IOC_MOBILE` — app nhóm thuộc về                              |
| `groups[].nghiep_vu[]`  | Array  | Module nghiệp vụ (data) — implicit `actions: ["VIEW"]`                    |
| `groups[].quan_tri[]`   | Array  | Module quản trị (admin) — kèm CRUD actions từ `user_group_action`         |
| `loai_an[]`             | Array  | Loại án phụ trách standalone (xuyên đơn vị, từ `pcatatc_phutrach_loaian`) |
| `vu_gdkt[]`             | Array  | Vụ GĐKT phụ trách — kèm `pham_vi` + `loai_an[]`                           |
| `toa_phu_trach[]`       | Array  | Tòa tỉnh + tòa khu vực phụ trách — kèm `pham_vi` + `loai_an[]`            |
| `phong_ban_phu_trach[]` | Array  | Phòng ban (con thuộc tòa) phụ trách — kèm `pham_vi` + `loai_an[]`         |

### Semantics phạm vi (`pham_vi`)

- `ALL`: user phụ trách toàn bộ loại án trong đơn vị đó. `loai_an` trả `[]` (không restrict).
- `CASE_TYPE`: user chỉ phụ trách các loại án trong `loai_an[]` (junction `*_loaian`).

Logic này được áp dụng ở BE qua placeholder `{#v_scope_filter}` (composite SQL filter tự build từ phụ trách).

### Lưu ý

- Trả TẤT CẢ groups user là member (không filter theo app hiện tại). FE tự lọc nếu cần.
- `nghiep_vu` / `quan_tri` rỗng nếu group chưa được gán module/action trong admin UI.
- `phong_ban_phu_trach`: phòng ban CON thuộc tòa (khác với `vu_gdkt` = phòng ban cấp TANDTC).
- Tòa tỉnh và tòa khu vực **gộp chung** trong `toa_phu_trach` (cùng bảng `pcatatc_phutrach_toatinh`). FE phân biệt qua `toaan.loaitoa` nếu cần.

---

## POST `/api/auth/change-password`

**Headers**: `Authorization: Bearer <access_token>` (optional — nếu chưa login thì truyền `username` trong body)

**Body**:

```json
{
  "username": "admin",
  "old_password": "<RSA-encrypted>",
  "new_password": "<RSA-encrypted>"
}
```

**Response 200**:

```json
{ "status": 200, "success": true, "data": { "message": "Đổi mật khẩu thành công" } }
```

**Response 400**: validation fail / mật khẩu cũ sai / mật khẩu mới trùng cũ.

---

## POST `/api/auth/register` (Mock — App Store review)

**Body**:

```json
{
  "username": "nguyenvana",
  "hoten": "Nguyễn Văn A",
  "email": "nguyenvana@example.com",
  "phone": "0901234567",
  "password": "P@ssw0rd123"
}
```

**Response 200**:

```json
{
  "status": 200,
  "success": true,
  "data": {
    "access_token": "mock_xxx",
    "refresh_token": "mock_refresh_xxx",
    "user": {
      "user_id": 1234567890,
      "username": "nguyenvana",
      "hoten": "...",
      "email": "...",
      "phone": "...",
      "role_code": "USER",
      "role_name": "Người dùng"
    },
    "message": "Đăng ký thành công"
  }
}
```

Không lưu DB — chỉ echo dữ liệu lại.
