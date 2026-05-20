import express from 'express';
import { config } from './config.js';
import { createProxyHandler } from './proxy.js';
import cors from 'cors'


const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
}))

app.disable('x-powered-by');
app.set('trust proxy', true);

app.use((req, res, next) => {
  const allowedOrigins = config.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = allowedOrigins.includes('*');
  const matchedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin);

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', allowAnyOrigin ? '*' : matchedOrigin || allowedOrigins[0] || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization,Content-Type,X-App-Code,X-Requested-With,Accept,Origin',
  );

  if (!allowAnyOrigin) {
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

app.use(
  createProxyHandler({
    upstreamBaseUrl: config.upstreamBaseUrl,
    clientApiPrefix: config.clientApiPrefix,
    proxyTimeoutMs: config.proxyTimeoutMs,
    changeOrigin: config.changeOrigin,
    logRequests: config.logRequests,
  }),
);

app.listen(config.port, config.host, () => {
  console.log(`Proxy IOC Admin listening at http://${config.host}:${config.port}`);
  console.log(`Forwarding ${config.clientApiPrefix}/... to ${config.upstreamBaseUrl.toString()}/...`);
});
