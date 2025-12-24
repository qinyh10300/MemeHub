import { DEFAULT_AVATARS } from '../configs/avatar.js';
import { resolvePublicUrl } from './publicUrl.js';

function hashSeed(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function pickDefaultAvatar(userDoc = {}) {
  const seed = userDoc._id?.toString() || userDoc.username || 'default';
  const idx = DEFAULT_AVATARS.length
    ? Math.abs(hashSeed(seed) % DEFAULT_AVATARS.length)
    : 0;
  return DEFAULT_AVATARS[idx] || '';
}

export function resolveUserAvatar(userDoc = {}, publicBaseUrl = '') {
  const raw = (userDoc?.avatar || userDoc?.avatarUrl || '').toString().trim();
  const chosen = raw || pickDefaultAvatar(userDoc);
  return resolvePublicUrl(chosen, publicBaseUrl);
}


