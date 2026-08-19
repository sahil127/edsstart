const TOKEN_KEY = 'authToken';
const REFRESH_KEY = 'eds_refresh_token';

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.location.href = '/login';
}

/**
 * Custom fetch wrapper that automatically appends Bearer token
 * and handles token refresh on 401 response
 */
export async function authFetch(url, options = {}) {
  let token = getAccessToken();

  console.log('--- authFetch Triggered ---',token);

  const headers = {
    ...options.headers,
    token: `${localStorage.getItem('authToken')}`,
  };

  let response = await fetch(url, { ...options, headers });

  // Handle expired access token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry request with new token
      headers.Authorization = `Bearer ${getAccessToken()}`;
      response = await fetch(url, { ...options, headers });
    } else {
      logout();
    }
  }

  return response;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch('http://localhost:3001/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch (e) {
    return false;
  }
}


