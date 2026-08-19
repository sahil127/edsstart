const FORM_ENDPOINTS = {
  login: 'http://localhost:3001/api/login',
  signup: 'http://localhost:3001/api/signup',
  support: 'http://localhost:3001/api/tickets',
  'create-ticket': 'http://localhost:3001/api/create-ticket',
  contact: 'http://localhost:3001/api/contact',
};

const SUCCESS_HANDLERS = {
  login: (result) => {
    if (result.token) localStorage.setItem('authToken', result.token);
    alert('Login successful!');
    window.location.href = '/dashboard';
  },
  signup: () => {
    alert('Account created! Please log in.');
    window.location.href = '/login/login';
  },
  'create-ticket': () => {
    alert('Ticket created! Please check your email for confirmation.');
    window.location.href = '/tickets';
  },
  support: (result) => {
    alert(`Support ticket created! Reference: ${result.ticketKey}`);
  },
  default: () => {
    alert('Form submitted successfully!');
  },
};

export default async function decorate(block) {
  const formLink = block.querySelector('a');
  if (!formLink) return;
  const formUrl = formLink.href;

  const resp = await fetch(formUrl);
  if (!resp.ok) return;
  const json = await resp.json();

  const form = document.createElement('form');

  // Detect form variant from block classes, form JSON URL, or page pathname
  const formType = Object.keys(FORM_ENDPOINTS).find((type) =>
    block.classList.contains(type) || 
    formUrl.includes(type) || 
    window.location.pathname.includes(type)
  ) || 'default';

  console.log(`--- Form Type Detected: ${formType} ---`);

  // Build inputs dynamically from JSON sheet
  json.data.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = `field-wrapper ${field.Type}-wrapper`;

    if (field.Label && field.Type !== 'submit') {
      const label = document.createElement('label');
      label.textContent = field.Label;
      wrapper.appendChild(label);
    }

    let input;
    if (field.Type === 'textarea') {
      input = document.createElement('textarea');
    } else if (field.Type === 'select') {
      input = document.createElement('select');
      if (field.Options) {
        field.Options.split(',').forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt.trim();
          option.textContent = opt.trim();
          input.appendChild(option);
        });
      }
    } else if (field.Type === 'submit') {
      input = document.createElement('button');
      input.type = 'submit';
      input.textContent = field.Label || 'Submit';
    } else {
      input = document.createElement('input');
      input.type = field.Type || 'text';
    }

    input.name = field.Name;
    if (field.Placeholder) input.placeholder = field.Placeholder;
    if (field.Mandatory === 'true' || field.Mandatory === true) input.required = true;

    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });

  // Unique submission handler per form type
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const payload = Object.fromEntries(new FormData(form).entries());
    const endpoint = FORM_ENDPOINTS[formType] || 'http://localhost:3001/api/default';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        const handleSuccess = SUCCESS_HANDLERS[formType] || SUCCESS_HANDLERS.default;
        handleSuccess(result);
        form.reset();
      } else {
        alert(`Error: ${result.error || 'Submission failed'}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Unable to connect to backend service.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  block.replaceChildren(form);
}
