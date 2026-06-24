# proxy-ioc-admin

Node.js Express proxy bridge cho IOC Admin API. Project này chạy trên máy có VPN, nhận request từ client nội bộ rồi forward sang upstream:

```txt
http://ioc-admin.toaan.gov.vn/api
```

Proxy giữ nguyên method, query string, body stream và các header quan trọng như `Authorization`, `Content-Type`, `X-App-Code`.

## Cài đặt

```bash
pnpm install
cp .env.example .env
pnpm start
```

Mặc định server listen trên `0.0.0.0:3000` để máy khác trong LAN có thể gọi vào.

## Chạy theo từng project

Project có sẵn 2 env local:

- `.env.ioc-admin`: proxy IOC Admin, tương đương `.env.example` hiện tại.
- `.env.ioc-webapp`: proxy toàn bộ endpoint sang `http://dremio.toaan.gov.vn`.

```bash
pnpm start:ioc-admin
pnpm start:ioc-webapp
```

Khi dev có watch mode:

```bash
pnpm dev:ioc-admin
pnpm dev:ioc-webapp
```

## Cấu hình

```env
PORT=3000
HOST=0.0.0.0
UPSTREAM_BASE_URL=http://ioc-admin.toaan.gov.vn/api
CLIENT_API_PREFIX=/api
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
PROXY_TIMEOUT_MS=60000
CHANGE_ORIGIN=true
LOG_REQUESTS=true
# Optional. Leave empty to proxy all configured IOC Admin endpoints from docs/.
# PROXY_ENDPOINTS=/api/auth/*,/api/admin/users*,/api/admin/user-groups*
```

Với cấu hình mặc định:

```txt
Client gọi:  http://<vpn-machine-ip>:3000/api/auth/login
Proxy gọi:   http://ioc-admin.toaan.gov.vn/api/auth/login
```

Nếu client gọi không có prefix `/api`, ví dụ `/auth/login`, proxy vẫn map vào upstream base:

```txt
Client gọi:  http://<vpn-machine-ip>:3000/auth/login
Proxy gọi:   http://ioc-admin.toaan.gov.vn/api/auth/login
```

## Health check

```bash
curl http://localhost:3000/health
```

## Endpoint theo docs

Các nhóm API trong [`docs/`](docs/) được cấu hình mặc định và proxy nguyên trạng:

- `/api/auth/*`
- `/api/admin/users*`
- `/api/admin/user-groups*`
- `/api/admin/user-group-types*`
- `/api/admin/modules*`
- `/api/admin/actions*`
- `/api/admin/audit-logs*`
- `/api/admin/users/options*`
- `/api/admin/user-groups/options*`
- `/api/admin/module/options`
- `/api/v1/options*`
- `/api/admin/system*` hoặc `/admin/system*`

Nếu cần giới hạn hoặc mở rộng danh sách endpoint được proxy, cấu hình env `PROXY_ENDPOINTS` bằng danh sách pattern phân tách bởi dấu phẩy. Pattern hỗ trợ exact path và wildcard ở cuối:

```env
PROXY_ENDPOINTS=/api/auth/*,/api/admin/users*,/api/admin/audit-logs*
```

Request không khớp endpoint đã cấu hình sẽ trả `404 Endpoint chưa được cấu hình để proxy`.

## Forward port cho client khác

Trên máy có VPN:

```bash
pnpm start
```

Sau đó client trong cùng mạng gọi:

```txt
http://<ip-may-co-vpn>:3000/api/...
```

Nếu dùng firewall, mở inbound TCP port `3000` hoặc đổi `PORT` trong `.env`.
