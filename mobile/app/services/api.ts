const BASE_URL = 'http://192.168.0.57:8000';

let _refreshToken: string | null = null;
let _onTokenRefresh: ((newToken: string) => void) | null = null;
let _onAuthFailure: (() => void) | null = null;

export function configureAuth(
  refreshToken: string | null,
  onTokenRefresh: (newToken: string) => void,
  onAuthFailure: () => void
) {
  _refreshToken = refreshToken;
  _onTokenRefresh = onTokenRefresh;
  _onAuthFailure = onAuthFailure;
}

export async function apiFetch(path: string, token: string | null, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && _refreshToken) {
    const refreshResponse = await fetch(`${BASE_URL}/users/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: _refreshToken }),
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      _onTokenRefresh?.(refreshData.access_token);
      const retryResponse = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshData.access_token}`,
          ...options.headers,
        },
      });
      if (!retryResponse.ok) throw new Error(`HTTP ${retryResponse.status}`);
      return retryResponse.json();
    } else {
      _onAuthFailure?.();
      throw new Error('Session expired');
    }
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
