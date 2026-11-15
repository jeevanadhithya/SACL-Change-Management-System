const rawConfiguredUrl =
  (import.meta.env.REACT_APP_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_URL as string | undefined) ||
  '';

const isHostedPreview =
  typeof window !== 'undefined' &&
  !['localhost', '127.0.0.1'].includes(window.location.hostname);

const resolvedBase =
  isHostedPreview && rawConfiguredUrl.includes('localhost') ? '' : rawConfiguredUrl;

export const API_BASE_URL = resolvedBase.replace(/\/+$/, '');

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}
