import { authFetch } from '../../scripts/auth.js';

function updateHeroGreeting(block, firstName) {
  const target = block.querySelector('h1, h2');

  if (!target) {
    return;
  }

  target.textContent = firstName ? `Hello, ${firstName}!` : 'Hello!';
}

export default async function decorate(block) {
  try {
    const res = await authFetch('http://localhost:3001/api/profile', {
      method: 'POST',
    });

    if (!res.ok) {
      return;
    }

    const user = await res.json();
    const firstName = user?.data?.firstName;

    if (firstName) {
      updateHeroGreeting(block, firstName);
    }
  } catch (err) {
    console.error('Failed to load user info', err);
  }
}

