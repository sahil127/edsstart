export default async function decorate(block) {
  const formLink = block.querySelector('a');
  if (!formLink) return;
  const formUrl = formLink.href;

  const resp = await fetch(formUrl);
  if (!resp.ok) return;
  const json = await resp.json();

  const form = document.createElement('form');
  
  json.data.forEach((field) => {
    const wrapper = document.createElement('div');
    wrapper.className = `field-wrapper ${field.Type}-wrapper`;

    if (field.Label) {
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
  const isLoginForm = block.classList.contains('login') || formUrl.includes('login');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      // Dynamic endpoint selection depending on form type
      const API_ENDPOINT = isLoginForm 
        ? 'http://localhost:3001/api/login' 
        : 'http://localhost:3001/api/user-information';

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        if (isLoginForm) {
          // 1. Store the authentication token
          if (result.token) {
            localStorage.setItem('authToken', result.token);
          }
          
          alert('Login successful!');
          
          // 2. Redirect user to dashboard/home page after login
          window.location.href = '/dashboard'; 
        } else {
          alert('Form submitted successfully!');
          form.reset();
        }
      } else {
        alert(`Error: ${result.error || 'Submission failed'}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Unable to connect to backend server.');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
  block.appendChild(form);
}