import express from 'express';
import { config } from './config.js';
import { createProxyHandler } from './proxy.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', true);

const allowedOrigins = config.corsOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const devOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+:\d+$/,
];

function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin) || devOriginPatterns.some((pattern) => pattern.test(origin));
}

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = allowedOrigins.includes('*');
  const matchedOrigin = isAllowedOrigin(requestOrigin);
  const allowOrigin = allowAnyOrigin ? '*' : matchedOrigin;

  res.setHeader('Vary', 'Origin');
  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization,Content-Type,X-App-Code,X-Requested-With,Accept,Origin',
  );

  if (!allowAnyOrigin && allowOrigin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

app.get('/health', (req, res) => {
  res.json({
    status: 200,
    success: true,
    data: {
      service: 'proxy-ioc-admin',
      upstream_base_url: config.upstreamBaseUrl.toString(),
      client_api_prefix: config.clientApiPrefix,
    },
  });
});

app.get('/__proxy/health', (req, res) => {
  res.json({
    status: 200,
    success: true,
    data: {
      service: 'proxy-ioc-admin',
      upstream_base_url: config.upstreamBaseUrl.toString(),
      client_api_prefix: config.clientApiPrefix,
    },
  });
});

app.get('/__proxy/config', (req, res) => {
  res.json({
    status: 200,
    success: true,
    data: {
      service: 'proxy-ioc-admin',
      host: config.host,
      port: config.port,
      upstream_base_url: config.upstreamBaseUrl.toString(),
      client_api_prefix: config.clientApiPrefix,
      cors_origin: config.corsOrigin,
      proxy_timeout_ms: config.proxyTimeoutMs,
      change_origin: config.changeOrigin,
      log_requests: config.logRequests,
    },
  });
});

app.use(
  createProxyHandler({
    upstreamBaseUrl: config.upstreamBaseUrl,
    clientApiPrefix: config.clientApiPrefix,
    proxyTimeoutMs: config.proxyTimeoutMs,
    changeOrigin: config.changeOrigin,
    logRequests: config.logRequests,
  }),
);

const server = app.listen(config.port, config.host, () => {
  console.log(`Proxy IOC Admin listening at http://${config.host}:${config.port}`);
  console.log(`Forwarding ${config.clientApiPrefix}/... to ${config.upstreamBaseUrl.toString()}/...`);
});

server.on('error', (error) => {
  console.error(`[server] failed to listen on ${config.host}:${config.port}: ${error.message}`);
  process.exitCode = 1;
});

process.on('uncaughtException', (error) => {
  console.error(`[process] uncaught exception: ${error.stack || error.message}`);
});

process.on('unhandledRejection', (reason) => {
  console.error('[process] unhandled rejection:', reason);
});
