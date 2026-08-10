import { setTokens } from '../../scripts/auth.js';

export default async function decorate(block) {
  const form = block.querySelector('form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: form.elements.username.value,
      password: form.elements.password.value,
    };

    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const { accessToken, refreshToken } = await res.json();
      setTokens(accessToken, refreshToken);
      window.location.href = '/dashboard'; // Redirect after login
    } else {
      alert('Login failed');
    }
  });
}