import { authFetch } from '../../scripts/auth.js';


const API_BASE = 'http://localhost:3001/api';

/**
 * Profile form field definitions — no external sheet dependency.
 * Add or remove fields here to match your API response shape.
 */
const PROFILE_FIELDS = [
  { name: 'firstName', label: 'First Name', type: 'text', placeholder: 'Enter first name', required: true },
  { name: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Enter last name', required: true },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter email', required: true, fullWidth: true },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
  { name: 'address', label: 'Address', type: 'text', placeholder: 'Enter address', fullWidth: true },
  { name: 'city', label: 'City', type: 'text', placeholder: 'Enter city' },
  { name: 'state', label: 'State', type: 'text', placeholder: 'Enter state' },
  { name: 'country', label: 'Country', type: 'text', placeholder: 'Enter country' },
  { name: 'zipCode', label: 'Zip Code', type: 'text', placeholder: 'Enter zip code' },
];

/**
 * Fetches the current user's profile data from the API.
 * GET http://localhost:3001/api/profile
 */
async function fetchUserProfile() {
  try {
    const res = await authFetch(`${API_BASE}/profile`, { method: 'GET' });
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data || json || {};
  } catch (e) {
    return {};
  }
}

/**
 * Case-insensitive lookup of a value from the profile data object.
 * Handles API responses where key casing may differ from field definitions.
 */
function getProfileValue(data, fieldName) {
  if (data[fieldName] !== undefined) return data[fieldName];
  const lower = fieldName.toLowerCase();
  const matchedKey = Object.keys(data).find((k) => k.toLowerCase() === lower);
  return matchedKey !== undefined ? data[matchedKey] : '';
}

/**
 * Creates a single form field (label + input).
 */
function createField(field, value) {
  const wrapper = document.createElement('div');
  wrapper.className = `profile-field-wrapper${field.fullWidth ? ' profile-field-full' : ''}`;

  const label = document.createElement('label');
  label.htmlFor = `profile-${field.name}`;
  label.textContent = field.label;
  wrapper.appendChild(label);

  let input;
  if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.rows = 4;
    input.textContent = value || '';
  } else {
    input = document.createElement('input');
    input.type = field.type || 'text';
    input.value = value || '';
  }

  input.id = `profile-${field.name}`;
  input.name = field.name;
  if (field.placeholder) input.placeholder = field.placeholder;
  if (field.required) input.required = true;

  wrapper.appendChild(input);
  return wrapper;
}

/**
 * Loads and decorates the profile block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {

  console.log("heerrrreee")
  block.textContent = '';

  // Show loading state
  const loadingEl = document.createElement('div');
  loadingEl.className = 'profile-loading';
  loadingEl.innerHTML = '<span class="profile-spinner"></span><p>Loading your profile…</p>';
  block.appendChild(loadingEl);

  // Fetch profile data from API
  const userData = await fetchUserProfile();

  block.textContent = '';

  // Header with avatar initial
  const firstInitial = (getProfileValue(userData, 'firstName') || 'U')[0].toUpperCase();
  const header = document.createElement('div');
  header.className = 'profile-header';
  // header.innerHTML = `
  //   <div class="profile-avatar">${firstInitial}</div>
  //   <div class="profile-header-info">
  //     <h2>Edit Profile</h2>
  //     <p>${getProfileValue(userData, 'email') || ''}</p>
  //   </div>
  // `;
  block.appendChild(header);

  // Status message
  const statusEl = document.createElement('div');
  statusEl.className = 'profile-status';
  statusEl.setAttribute('aria-live', 'polite');
  block.appendChild(statusEl);

  // Build form
  const form = document.createElement('form');
  form.id = 'profile-form';

  const fieldsGrid = document.createElement('div');
  fieldsGrid.className = 'profile-fields-grid';

  // Render each field pre-filled with API data
  PROFILE_FIELDS.forEach((field) => {
    const value = getProfileValue(userData, field.name);
    fieldsGrid.appendChild(createField(field, value));
  });

  form.appendChild(fieldsGrid);

  // Action buttons
  const actions = document.createElement('div');
  actions.className = 'profile-actions';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'reset';
  resetBtn.className = 'profile-btn-reset';
  resetBtn.textContent = 'Reset';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'profile-btn-save';
  submitBtn.textContent = 'Save Changes';

  actions.appendChild(resetBtn);
  actions.appendChild(submitBtn);
  form.appendChild(actions);

  // Submit → PUT /api/update-profile
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    statusEl.className = 'profile-status';
    statusEl.textContent = '';

    const payload = Object.fromEntries(new FormData(form).entries());
    const token =  localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    try {
      const res = await authFetch(`${API_BASE}/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'token': token },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
alert(JSON.stringify(result))
console.log('Profile update response:', result);
      // if (res.ok) {
      //   statusEl.className = 'profile-status profile-status--success';
      //   statusEl.textContent = '✓ Profile updated successfully!';
      //   // Update avatar initial if first name changed
      //   const avatar = block.querySelector('.profile-avatar');
      //   if (avatar) avatar.textContent = (payload.firstName || 'U')[0].toUpperCase();
      // } else {
      //   statusEl.className = 'profile-status profile-status--error';
      //   statusEl.textContent = `✗ ${result.error || result.message || 'Update failed. Please try again.'}`;
      // }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Profile update error:', err);
      statusEl.className = 'profile-status profile-status--error';
      statusEl.textContent = '✗ Unable to connect to server. Please try again.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
      // statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  block.appendChild(form);
}
