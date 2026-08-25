import { getMetadata } from '../../scripts/aem.js';
import { getAccessToken, logout } from '../../scripts/auth.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const navDrops = nav.querySelectorAll('.ticket-dropdown, .nav-drop');
    navDrops.forEach((drop) => drop.setAttribute('aria-expanded', 'false'));

    const navSections = nav.querySelector('.nav-sections');
    if (navSections && !isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button')?.focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navDrops = nav.querySelectorAll('.ticket-dropdown, .nav-drop');
    navDrops.forEach((drop) => drop.setAttribute('aria-expanded', 'false'));
    const navSections = nav.querySelector('.nav-sections');
    if (navSections && !isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  if (navSections) {
    toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

/**
 * loads and decorates the headers block
 * @param {Element} block The headers block element
 */
export default async function decorate(block) {
  const token = getAccessToken();
  const isLoggedIn = Boolean(token);

  try {
    // If the block is an empty header placeholder, fetch nav content
    if (!block.textContent.trim()) {
      const navMeta = getMetadata('nav');
      const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
      const resp = await fetch(`${navPath}.plain.html`);
      if (resp.ok) {
        const html = await resp.text();
        block.innerHTML = html;
      }
    }

    // 1. Dropdown Implementation (Handles Ticket and any list with sub-lists)
    const allLis = Array.from(block.querySelectorAll('li'));
    allLis.forEach((li) => {
      const parentUl = li.closest('ul');
      const siblingList = parentUl ? parentUl.nextElementSibling : null;

      if (siblingList && (siblingList.tagName === 'OL' || siblingList.tagName === 'UL')) {
        li.appendChild(siblingList);
        li.classList.add('ticket-dropdown', 'nav-drop');
        li.setAttribute('aria-expanded', 'false');
      }

      if (li.querySelector(':scope > ul, :scope > ol')) {
        li.classList.add('ticket-dropdown', 'nav-drop');
        li.setAttribute('aria-expanded', 'false');
      }
    });

    // Setup click events on dropdowns
    const dropdownItems = block.querySelectorAll('.ticket-dropdown, .nav-drop');
    dropdownItems.forEach((dropLi) => {
      dropLi.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        e.stopPropagation();
        e.preventDefault();

        const isExpanded = dropLi.getAttribute('aria-expanded') === 'true';
        dropdownItems.forEach((other) => {
          if (other !== dropLi) other.setAttribute('aria-expanded', 'false');
        });
        dropLi.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      });
    });

    document.addEventListener('click', () => {
      dropdownItems.forEach((item) => {
        item.setAttribute('aria-expanded', 'false');
      });
    });

    // 2. Strict Authentication-Based Navigation Visibility
    const isLoginOrSignup = (text) => {
      const t = (text || '').trim().toLowerCase();
      return t === 'login'
        || t === 'signup'
        || t === 'sign up'
        || t === 'signin'
        || t === 'sign-in';
    };

    const isLogout = (text) => {
      const t = (text || '').trim().toLowerCase();
      return t === 'logout'
        || t === 'log out'
        || t === 'sign out'
        || t === 'signout';
    };

    // Process all paragraphs <p> (e.g. Index, Signup, Login, Logout)
    block.querySelectorAll('p').forEach((p) => {
      const text = p.textContent.trim().toLowerCase();
      if (!text) return;

      if (isLoggedIn) {
        if (isLoginOrSignup(text)) {
          p.classList.add('auth-hidden');
        } else {
          p.classList.remove('auth-hidden');
          if (isLogout(text)) {
            p.style.cursor = 'pointer';
            p.addEventListener('click', (e) => {
              e.preventDefault();
              logout();
            });
          }
        }
      } else {
        if (isLoginOrSignup(text)) {
          p.classList.remove('auth-hidden');
        } else {
          p.classList.add('auth-hidden');
        }
      }
    });

    // Process all top-level list items <li> (e.g. Ticket dropdown)
    block.querySelectorAll('li').forEach((li) => {
      if (li.closest('.ticket-dropdown > ol, .ticket-dropdown > ul')) return;

      const clone = li.cloneNode(true);
      clone.querySelectorAll('ol, ul').forEach((sub) => sub.remove());
      const text = clone.textContent.trim().toLowerCase();
      if (!text) return;

      if (isLoggedIn) {
        if (isLoginOrSignup(text)) {
          li.classList.add('auth-hidden');
        } else {
          li.classList.remove('auth-hidden');
          if (isLogout(text)) {
            li.style.cursor = 'pointer';
            li.addEventListener('click', (e) => {
              e.preventDefault();
              logout();
            });
          }
        }
      } else {
        if (isLoginOrSignup(text)) {
          li.classList.remove('auth-hidden');
        } else {
          li.classList.add('auth-hidden');
        }
      }
    });

    // Hide any <ul> whose list items are all hidden
    block.querySelectorAll('ul').forEach((ul) => {
      if (ul.closest('.ticket-dropdown') && ul.parentElement.tagName === 'LI') return;
      const visibleLis = [...ul.querySelectorAll(':scope > li')].filter((li) => !li.classList.contains('auth-hidden'));
      if (visibleLis.length === 0) {
        ul.classList.add('auth-hidden');
      } else {
        ul.classList.remove('auth-hidden');
      }
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Headers decoration error:', error);
  }
}
