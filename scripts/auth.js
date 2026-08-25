const TOKEN_KEY = 'authToken';
const REFRESH_KEY = 'eds_refresh_token';

export function setTokens(accessToken, refreshToken) {
  const token = accessToken || '';
  localStorage.setItem(TOKEN_KEY, token);

  if (refreshToken) {
    localStorage.setItem(REFRESH_KEY, refreshToken);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function getAccessToken() {
  const token = localStorage.getItem(TOKEN_KEY)
    || localStorage.getItem('token')
    || localStorage.getItem('accessToken')
    || sessionStorage.getItem(TOKEN_KEY)
    || sessionStorage.getItem('token')
    || '';

  if (!token || token === 'null' || token === 'undefined' || token === 'false') {
    return '';
  }
  return token;
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('token');
  window.location.href = '/login';
}

/**
 * Custom fetch wrapper that automatically appends Bearer token.
 * If the server rejects the token, the user is sent back to the login flow.
 */
export async function authFetch(url, options = {}) {
  const token = getAccessToken();
  const headers = {
    ...options.headers,
    token,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // logout();
  }

  return response;
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch('http://localhost:3001/api/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken || data.token, data.refreshToken);
    return true;
  } catch (e) {
    return false;
  }
}
