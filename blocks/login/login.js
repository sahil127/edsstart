import { setTokens } from '../../scripts/auth.js';

export default async function decorate(block) {
  const form = block.querySelector('form');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailField = form.elements.email || form.elements.username;
    const payload = {
      email: emailField ? emailField.value : '',
      password: form.elements.password ? form.elements.password.value : '',
    };

    if (!payload.email || !payload.password) {
      alert('Please enter your email and password.');
      return;
    }

    const res = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const token = data.accessToken || data.token;
      setTokens(token, data.refreshToken);
      window.location.href = '/dashboard';
    } else {
      const error = await res.json().catch(() => ({}));
      alert(error.message || 'Login failed');
    }
  });
}