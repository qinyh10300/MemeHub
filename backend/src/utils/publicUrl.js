function stripTrailingSlashes(value = '') {
  return value.replace(/\/+$/, '');
}

function firstHeaderValue(value) {
  if (!value) return '';
  const text = Array.isArray(value) ? value[0] : `${value}`;
  return text.split(',')[0].trim();
}

export function getPublicBaseUrl(req) {
  const envBase = (process.env.PUBLIC_BASE_URL || '').trim();
  if (envBase) return stripTrailingSlashes(envBase);

  const proto = firstHeaderValue(req.headers['x-forwarded-proto']) || req.protocol || 'http';
  const host = firstHeaderValue(req.headers['x-forwarded-host']) || req.get('host') || '';
  if (!host) return '';
  return `${proto}://${host}`;
}

export function normalizeApiPath(pathValue = '') {
  if (!pathValue) return '';
  // 统一模因资源走 /api/memefiles（适配常见反代只转发 /api）
  if (pathValue.startsWith('/memefiles/')) {
    return pathValue.replace(/^\/memefiles\//, '/api/memefiles/');
  }
  // 兼容历史存储的 /api/memefiles/*
  if (pathValue.startsWith('/api/memefiles/')) {
    return pathValue;
  }
  // 兼容历史存储的 /avatars/*，统一走 /api/avatars 以适配只转发 /api 的反代
  if (pathValue.startsWith('/avatars/')) {
    return pathValue.replace(/^\/avatars\//, '/api/avatars/');
  }
  // stickers 同理（目前已挂载 /api/stickers）
  if (pathValue.startsWith('/stickers/')) {
    return pathValue.replace(/^\/stickers\//, '/api/stickers/');
  }
  return pathValue;
}

function rewriteOriginWithPublicBase(urlString, publicBaseUrl) {
  if (!publicBaseUrl) return urlString;
  try {
    const target = new URL(urlString);
    const base = new URL(publicBaseUrl);
    const hostLooksLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(target.hostname);
    const sameHost = target.hostname === base.hostname;
    const missingPort = !target.port && !!base.port;

    if (hostLooksLocal || (sameHost && missingPort)) {
      return `${base.origin}${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    // ignore
  }
  return urlString;
}

export function resolvePublicUrl(value = '', publicBaseUrl = '') {
  if (!value) return '';
  const trimmed = `${value}`.trim();
  if (!trimmed) return '';

  if (/^data:/i.test(trimmed) || /^blob:/i.test(trimmed)) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    return rewriteOriginWithPublicBase(trimmed, publicBaseUrl);
  }

  if (trimmed.startsWith('//')) {
    const scheme = publicBaseUrl ? publicBaseUrl.split('://')[0] : 'http';
    return `${scheme}:${trimmed}`;
  }

  const normalizedPath = normalizeApiPath(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
  return publicBaseUrl ? `${publicBaseUrl}${normalizedPath}` : normalizedPath;
}


