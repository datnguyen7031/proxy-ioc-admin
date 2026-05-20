import 'dotenv/config';

function normalizeBaseUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url;
}

function normalizePrefix(value) {
  const prefix = value || '/api';
  const withSlash = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

export const config = {
  port: Number(process.env.PORT || 3000),
  host: process.env.HOST || '0.0.0.0',
  upstreamBaseUrl: normalizeBaseUrl(
    process.env.UPSTREAM_BASE_URL || 'http://ioc-admin.toaan.gov.vn/api',
  ),
  clientApiPrefix: normalizePrefix(process.env.CLIENT_API_PREFIX || '/api'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173',
  proxyTimeoutMs: Number(process.env.PROXY_TIMEOUT_MS || 60000),
  changeOrigin: String(process.env.CHANGE_ORIGIN || 'true').toLowerCase() !== 'false',
  logRequests: String(process.env.LOG_REQUESTS || 'true').toLowerCase() !== 'false',
};
