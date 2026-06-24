export const DEFAULT_PROXY_ENDPOINTS = [
  '/api/auth/*',
  '/api/admin/users*',
  '/api/admin/user-groups*',
  '/api/admin/user-group-types*',
  '/api/admin/modules*',
  '/api/admin/actions*',
  '/api/admin/audit-logs*',
  '/api/admin/users/options*',
  '/api/admin/user-groups/options*',
  '/api/admin/module/options',
  '/api/v1/options*',
  '/api/admin/system*',
  '/admin/system*',
];

function normalizeEndpointPattern(value) {
  const pattern = String(value || '').trim();
  if (!pattern) {
    return null;
  }

  const hasWildcard = pattern.endsWith('*');
  const path = hasWildcard ? pattern.slice(0, -1) : pattern;
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  const normalizedPath = hasWildcard ? withSlash : withSlash.replace(/\/+$/, '') || '/';

  return `${normalizedPath}${hasWildcard ? '*' : ''}`;
}

export function parseEndpointPatterns(value, fallback = DEFAULT_PROXY_ENDPOINTS) {
  const source = value
    ? String(value)
        .split(',')
        .map(normalizeEndpointPattern)
        .filter(Boolean)
    : fallback.map(normalizeEndpointPattern).filter(Boolean);

  return [...new Set(source)];
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

function addClientPrefix(pathname, clientApiPrefix) {
  if (clientApiPrefix === '/') {
    return pathname;
  }

  const child = pathname.replace(/^\/+/, '');
  return `${clientApiPrefix}/${child}`.replace(/\/+$/, '') || clientApiPrefix;
}

function patternMatches(pattern, pathname) {
  if (pattern.endsWith('*')) {
    return pathname.startsWith(pattern.slice(0, -1));
  }

  return pathname === pattern;
}

export function createEndpointMatcher(endpointPatterns, clientApiPrefix) {
  return function endpointMatcher(pathname) {
    const candidates = new Set([
      pathname,
      stripClientPrefix(pathname, clientApiPrefix),
      addClientPrefix(stripClientPrefix(pathname, clientApiPrefix), clientApiPrefix),
    ]);

    return endpointPatterns.some((pattern) =>
      [...candidates].some((candidate) => patternMatches(pattern, candidate)),
    );
  };
}
