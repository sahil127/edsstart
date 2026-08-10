import { authFetch } from '../../scripts/auth.js';

export default async function decorate(block) {
  try {
    const res = await authFetch('http://localhost:3000/api/profile');
    if (res.ok) {
      const user = await res.json();
      const heading = block.querySelector('h1, p');
      if (heading) heading.textContent = `Hello, ${user.firstName}!`;
    }
  } catch (err) {
    console.error('Failed to load user info', err);
  }
}