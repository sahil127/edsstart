import { getAccessToken } from '../../scripts/auth.js';
import profilejs from '../profile/profile.js';

const API_BASE = 'http://localhost:3001/api';

/**
 * Show a toast notification
 */
function showToast(message, type = 'success', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add styles
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after duration
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
if (!document.head.querySelector('style[data-toast-styles]')) {
  style.setAttribute('data-toast-styles', 'true');
  document.head.appendChild(style);
}

const FORM_ENDPOINTS = {
  login: `${API_BASE}/login`,
  signup: `${API_BASE}/signup`,
  support: `${API_BASE}/tickets`,
  'create-ticket': `${API_BASE}/create-ticket`,
  contact: `${API_BASE}/contact`,
  'update-profile': `${API_BASE}/update-profile`,
  'user-information': `${API_BASE}/profile`,
};

// Forms that submit with PUT and require auth token
const PUT_FORMS = new Set(['update-profile', 'user-information']);

// Forms that pre-fill from an API GET on page load: formType → GET endpoint
const PREFILL_ENDPOINTS = {
  'update-profile': `${API_BASE}/profile`,
  'user-information': `${API_BASE}/profile`,
};

const SUCCESS_HANDLERS = {
  login: (result) => {
    const token = result.accessToken || result.token;
    if (token) {
      localStorage.setItem('authToken', token);
      if (result.refreshToken) {
        localStorage.setItem('eds_refresh_token', result.refreshToken);
      }
    }
    showToast('Login successful!', 'success');
    window.location.href = '/dashboard';
  },
  signup: () => {
    showToast('Account created! Please log in.', 'success');
    window.location.href = '/login';
  },
  'create-ticket': () => {
    showToast('Ticket created! Please check your email for confirmation.', 'success');
    window.location.href = '/tickets';
  },
  support: (result) => {
    showToast(`Support ticket created! Reference: ${result.ticketKey}`, 'success');
  },
  'update-profile': () => {
    showToast('Profile updated successfully!', 'success');
  },
  'user-information': () => {
    showToast('Profile updated successfully!', 'success');
  },
  default: () => {
    showToast('Form submitted successfully!', 'success');
  },
};

/**
 * Fetch current user profile data to pre-fill the form.
 * Returns a flat object of field values keyed by field name.
 */
async function fetchPrefillData(url) {
  try {
    const token = getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data || json || {};
  } catch (e) {
    return {};
  }
}

/**
 * Case-insensitive value lookup from a data object.
 */
function getValue(data, name) {
  if (data[name] !== undefined) return data[name];
  const lower = name.toLowerCase();
  const key = Object.keys(data).find((k) => k.toLowerCase() === lower);
  return key !== undefined ? data[key] : '';
}

async function populateSelectField(selectElement, optionsValue) {
  // Clear any existing default options (except first placeholder if needed)
  selectElement.innerHTML = '<option value="">Select Project</option>';

  // Check if options contains a JSON URL
  if (optionsValue.startsWith('http') || optionsValue.endsWith('.json')) {
    try {
      const response = await fetch(optionsValue);
      const json = await response.json();
      
      // Handle standard AEM EDS sheet response structure (json.data) or direct array
      const items = json.data || json;

      items.forEach((item) => {
        const option = document.createElement('option');
        // Fallback to Name, Label, or item string depending on your sheet structure
        option.value = item.Name || item.Label || item.value || item;
        option.textContent = item.Label || item.Name || item.text || item;
        selectElement.appendChild(option);
      });
    } catch (error) {
      console.error('Failed to fetch dynamic projects list:', error);
    }
  } else {
    // Fallback for standard comma-separated static options
    const optionsArray = optionsValue.split(',').map((opt) => opt.trim());
    optionsArray.forEach((opt) => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      selectElement.appendChild(option);
    });
  }
}

/**
 * Set a form field's value regardless of input type.
 */
function setFieldValue(input, value) {
  if (!input || value === '' || value === undefined) return;
  if (input.tagName === 'SELECT') {
    const opt = [...input.options].find((o) => o.value === String(value));
    if (opt) opt.selected = true;
  } else if (input.tagName === 'TEXTAREA') {
    input.textContent = value;
  } else {
    input.value = value;
  }
}

// export default async function decorate(block) {
//   if (window.location.pathname.endsWith('/profile')) {
//    await profilejs(block);
//   }
//   const formLink = block.querySelector('a');
//   if (!formLink) return;
//   const formUrl = formLink.href;

//   const resp = await fetch(formUrl);
//   if (!resp.ok) return;
//   const json = await resp.json();

//   // Detect form type from block classes, JSON URL, or page pathname
//   const formType = Object.keys(FORM_ENDPOINTS).find((type) =>
//     block.classList.contains(type)
//     || formUrl.includes(type)
//     || window.location.pathname.includes(type)) || 'default';

//   // Fetch prefill data if this form supports it (e.g. profile page)
//   const prefillUrl = PREFILL_ENDPOINTS[formType];
//   const prefillData = prefillUrl ? await fetchPrefillData(prefillUrl) : {};

//   const form = document.createElement('form');

//   // Build inputs dynamically from JSON sheet
//   json.data.forEach((field) => {
//     const wrapper = document.createElement('div');
//     wrapper.className = `field-wrapper ${field.Type}-wrapper`;

//     if (field.Label && field.Type !== 'submit') {
//       const label = document.createElement('label');
//       label.textContent = field.Label;
//       label.htmlFor = `form-${field.Name}`;
//       wrapper.appendChild(label);
//     }

//     let input;
//     if (field.Type === 'textarea') {
//       input = document.createElement('textarea');
//     } else if (field.Type === 'select') {
//       input = document.createElement('select');
//       if (field.Options) {
//         const blank = document.createElement('option');
//         blank.value = '';
//         blank.textContent = `Select ${field.Label || field.Name}`;
//         input.appendChild(blank);
//         field.Options.split(',').forEach((opt) => {
//           const option = document.createElement('option');
//           option.value = opt.trim();
//           option.textContent = opt.trim();
//           input.appendChild(option);
//         });
//       }
//     } else if (field.Type === 'submit') {
//       input = document.createElement('button');
//       input.type = 'submit';
//       input.textContent = field.Label || 'Submit';
//     } else {
//       input = document.createElement('input');
//       input.type = field.Type || 'text';
//     }

//     input.id = `form-${field.Name}`;
//     input.name = field.Name;
//     if (field.Placeholder) input.placeholder = field.Placeholder;
//     if (field.Mandatory === 'true' || field.Mandatory === true) input.required = true;

//     // Pre-fill field value from API if available
//     if (field.Type !== 'submit') {
//       setFieldValue(input, getValue(prefillData, field.Name));
//     }

//     wrapper.appendChild(input);
//     form.appendChild(wrapper);
//   });

//   // Submission handler
//   form.addEventListener('submit', async (e) => {
//     e.preventDefault();
//     const submitBtn = form.querySelector('button[type="submit"]');
//     if (submitBtn) {
//       submitBtn.disabled = true;
//       submitBtn.textContent = 'Saving…';
//     }

//     const payload = Object.fromEntries(new FormData(form).entries());
//     const endpoint = FORM_ENDPOINTS[formType] || `${API_BASE}/default`;
//     const method = PUT_FORMS.has(formType) ? 'PUT' : 'POST';

//     // Build headers — attach auth token for protected endpoints
//     const token = getAccessToken();
//     const headers = { 'Content-Type': 'application/json' };
//     if (token) {
//       headers.Authorization = `Bearer ${token}`;
//       headers.token = token;
//     }

//     try {
//       const res = await fetch(endpoint, {
//         method,
//         headers,
//         body: JSON.stringify(payload),
//       });

//       const result = await res.json().catch(() => ({}));

//       if (res.ok) {
//         const handleSuccess = SUCCESS_HANDLERS[formType] || SUCCESS_HANDLERS.default;
//         handleSuccess(result);
//         if (formType !== 'update-profile' && formType !== 'user-information') {
//           form.reset();
//         }
//       } else {
//         alert(`Error: ${result.error || result.message || 'Submission failed'}`);
//       }
//     } catch (err) {
//       // eslint-disable-next-line no-console
//       console.error('Submission error:', err);
//       alert('Unable to connect to backend service.');
//     } finally {
//       if (submitBtn) {
//         submitBtn.disabled = false;
//         submitBtn.textContent = 'Submit';
//       }
//     }
//   });

//   block.replaceChildren(form);
// }


export default async function decorate(block) {
  if (window.location.pathname.endsWith('/profile')) {
    await profilejs(block);
  }
  const formLink = block.querySelector('a');
  if (!formLink) return;
  const formUrl = formLink.href;

  const resp = await fetch(formUrl);
  if (!resp.ok) return;
  const json = await resp.json();

  // Detect form type from block classes, JSON URL, or page pathname
  const formType = Object.keys(FORM_ENDPOINTS).find((type) =>
    block.classList.contains(type)
    || formUrl.includes(type)
    || window.location.pathname.includes(type)) || 'default';

  // Fetch prefill data if this form supports it (e.g. profile page)
  const prefillUrl = PREFILL_ENDPOINTS[formType];
  const prefillData = prefillUrl ? await fetchPrefillData(prefillUrl) : {};

  const form = document.createElement('form');

  // Build inputs dynamically from JSON sheet using async loop
  for (const field of json.data) {
    const wrapper = document.createElement('div');
    wrapper.className = `field-wrapper ${field.Type}-wrapper`;

    if (field.Label && field.Type !== 'submit') {
      const label = document.createElement('label');
      label.textContent = field.Label;
      label.htmlFor = `form-${field.Name}`;
      wrapper.appendChild(label);
    }

    let input;
    if (field.Type === 'textarea') {
      input = document.createElement('textarea');
    } else if (field.Type === 'select') {
      input = document.createElement('select');
      if (field.Options) {
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = `Select ${field.Label || field.Name}`;
        input.appendChild(blank);

        const rawOptions = field.Options.trim();

        // Check if Options is a JSON URL
        if (rawOptions.startsWith('http') || rawOptions.endsWith('.json')) {
          try {
            const optResp = await fetch(rawOptions);
            if (optResp.ok) {
              const optJson = await optResp.json();
              const items = optJson.data || optJson;

              items.forEach((item) => {
                const option = document.createElement('option');
                const val = typeof item === 'object' ? (item.Name || item.Name || item.Name || '') : item;
                const text = typeof item === 'object' ? (item.Name || item.Name || item.Name || val) : item;
                option.value = val;
                option.textContent = text;
                input.appendChild(option);
              });
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Failed to fetch dynamic options for ${field.Name}:`, err);
          }
        } else {
          // Fallback to static comma-separated options
          rawOptions.split(',').forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.trim();
            option.textContent = opt.trim();
            input.appendChild(option);
          });
        }
      }
    } else if (field.Type === 'submit') {
      input = document.createElement('button');
      input.type = 'submit';
      input.textContent = field.Label || 'Submit';
    } else {
      input = document.createElement('input');
      input.type = field.Type || 'text';
    }

    input.id = `form-${field.Name}`;
    input.name = field.Name;
    if (field.Placeholder) input.placeholder = field.Placeholder;

    const isRequired = field.Mandatory?.toString().toLowerCase() === 'true';
    if (isRequired) input.required = true;

    // Pre-fill field value from API if available
    if (field.Type !== 'submit') {
      setFieldValue(input, getValue(prefillData, field.Name));
    }

    wrapper.appendChild(input);
    form.appendChild(wrapper);
  }

  // Submission handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    const endpoint = FORM_ENDPOINTS[formType] || `${API_BASE}/default`;
    const method = PUT_FORMS.has(formType) ? 'PUT' : 'POST';

    // Build headers — attach auth token for protected endpoints
    const token = getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers.token = token;
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        const handleSuccess = SUCCESS_HANDLERS[formType] || SUCCESS_HANDLERS.default;
        handleSuccess(result);
        if (formType !== 'update-profile' && formType !== 'user-information') {
          form.reset();
        }
      } else {
        showToast(`Error: ${result.error || result.message || 'Submission failed'}`, 'error');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Submission error:', err);
      showToast('Unable to connect to backend service.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    }
  });

  block.replaceChildren(form);
}
