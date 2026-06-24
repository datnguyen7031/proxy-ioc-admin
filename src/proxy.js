import http from 'node:http';
import https from 'node:https';
import { pipeline } from 'node:stream';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const BODYLESS_METHODS = new Set(['GET', 'HEAD']);

function joinPaths(basePath, requestPath) {
  const base = basePath.replace(/\/+$/, '');
  const child = requestPath.replace(/^\/+/, '');
  if (!child) {
    return base || '/';
  }
  return `${base}/${child}`;
}

function stripClientPrefix(pathname, clientApiPrefix) {
  if (clientApiPrefix === '/') {
    return pathname;
  }

  if (pathname === clientApiPrefix) {
    return '/';
  }

  if (pathname.startsWith(`${clientApiPrefix}/`)) {
    return pathname.slice(clientApiPrefix.length) || '/';
  }

  return pathname;
}

function buildTargetUrl(req, options) {
  const incomingUrl = new URL(req.originalUrl || req.url, 'http://proxy.local');
  const upstreamUrl = new URL(options.upstreamBaseUrl.toString());
  const strippedPath = stripClientPrefix(incomingUrl.pathname, options.clientApiPrefix);

  upstreamUrl.pathname = joinPaths(options.upstreamBaseUrl.pathname, strippedPath);
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl;
}

function buildForwardHeaders(req, targetUrl, options) {
  const headers = {};

  for (const [name, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      headers[name] = value;
    }
  }

  if (options.changeOrigin) {
    headers.host = targetUrl.host;
  }

  headers['x-forwarded-host'] = req.headers.host || '';
  headers['x-forwarded-proto'] = req.protocol || 'http';
  headers['x-forwarded-for'] = [
    req.headers['x-forwarded-for'],
    req.socket.remoteAddress,
  ]
    .filter(Boolean)
    .join(', ');

  return headers;
}

function writeProxyError(res, status, message, detail, targetUrl) {
  if (res.headersSent) {
    res.destroy();
    return;
  }

  res.status(status).json({
    status,
    success: false,
    message,
    data: {
      ...(detail ? { detail } : {}),
      ...(targetUrl ? { upstream_url: targetUrl.toString() } : {}),
    },
  });
}

export function createProxyHandler(options) {
  return function proxyHandler(req, res) {
    const incomingUrl = new URL(req.originalUrl || req.url, 'http://proxy.local');

    if (options.endpointMatcher && !options.endpointMatcher(incomingUrl.pathname)) {
      writeProxyError(
        res,
        404,
        'Endpoint chưa được cấu hình để proxy',
        { path: incomingUrl.pathname },
        null,
      );
      return;
    }

    const targetUrl = buildTargetUrl(req, options);
    const client = targetUrl.protocol === 'https:' ? https : http;
    const startedAt = Date.now();

    if (options.logRequests) {
      console.log(`[proxy] ${req.method} ${req.originalUrl} -> ${targetUrl.toString()}`);
    }

    const upstreamReq = client.request(
      targetUrl,
      {
        method: req.method,
        headers: buildForwardHeaders(req, targetUrl, options),
        timeout: options.proxyTimeoutMs,
      },
      (upstreamRes) => {
        res.statusCode = upstreamRes.statusCode || 502;

        for (const [name, value] of Object.entries(upstreamRes.headers)) {
          if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase()) && value !== undefined) {
            res.setHeader(name, value);
          }
        }

        if (options.logRequests) {
          const duration = Date.now() - startedAt;
          console.log(`[proxy] ${upstreamRes.statusCode} ${req.method} ${req.originalUrl} ${duration}ms`);
        }

        pipeline(upstreamRes, res, (error) => {
          if (error && options.logRequests) {
            console.error(`[proxy] response stream failed: ${error.message}`);
          }
        });
      },
    );

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error(`Upstream timeout after ${options.proxyTimeoutMs}ms`));
    });

    upstreamReq.on('error', (error) => {
      const status = error.code === 'ETIMEDOUT' ? 504 : 502;
      if (options.logRequests) {
        console.error(
          `[proxy] ${status} ${req.method} ${req.originalUrl} -> ${targetUrl.toString()}: ${error.message}`,
        );
      }
      writeProxyError(
        res,
        status,
        'Không thể kết nối tới IOC Admin upstream',
        { code: error.code, message: error.message },
        targetUrl,
      );
    });

    req.on('aborted', () => {
      upstreamReq.destroy();
    });

    if (BODYLESS_METHODS.has(req.method)) {
      upstreamReq.end();
      return;
    }

    pipeline(req, upstreamReq, (error) => {
      if (error && !res.headersSent) {
        if (options.logRequests) {
          console.error(`[proxy] request stream failed: ${error.message}`);
        }
        writeProxyError(
          res,
          502,
          'Không thể gửi request body tới IOC Admin upstream',
          { message: error.message },
          targetUrl,
        );
      }
    });
  };
}
