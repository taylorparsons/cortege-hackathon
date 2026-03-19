const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const WS_ORIGIN = import.meta.env.VITE_WS_ORIGIN ?? '';

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export function wsUrl(path = '/ws') {
  if (WS_ORIGIN) {
    return `${WS_ORIGIN}${path}`;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}
