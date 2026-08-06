export default async function decorate(block) {
  const formLink = block.querySelector('a');
  if (!formLink) return;

  // Ensure relative path resolves correctly to the current domain
  const formUrl = formLink.href;

  try {
    const resp = await fetch(formUrl);
    if (!resp.ok) return;
    const json = await resp.json();

    // Check if json.data exists
    const fields = json.data || json;
    if (!Array.isArray(fields)) return;

    const form = document.createElement('form');

    fields.forEach((field) => {
      // Normalize object keys to lowercase to match sheet header JSON conversion
      const normalized = {};
      Object.keys(field).forEach((key) => {
        normalized[key.toLowerCase()] = field[key];
      });

      const type = normalized.type || 'text';
      const labelText = normalized.label || '';
      const name = normalized.name || '';
      const placeholder = normalized.placeholder || '';
      const mandatory = normalized.mandatory;
      const options = normalized.options || '';

      const wrapper = document.createElement('div');
      wrapper.className = `field-wrapper ${type}-wrapper`;

      if (labelText) {
        const label = document.createElement('label');
        label.textContent = labelText;
        wrapper.appendChild(label);
      }

      let input;
      if (type === 'textarea') {
        input = document.createElement('textarea');
      } else if (type === 'select') {
        input = document.createElement('select');
        if (options) {
          options.split(',').forEach((opt) => {
            const option = document.createElement('option');
            option.value = opt.trim();
            option.textContent = opt.trim();
            input.appendChild(option);
          });
        }
      } else if (type === 'submit') {
        input = document.createElement('button');
        input.type = 'submit';
        input.textContent = labelText || 'Submit';
      } else {
        input = document.createElement('input');
        input.type = type;
      }

      if (type !== 'submit') {
        input.name = name;
        if (placeholder) input.placeholder = placeholder;
        if (mandatory === true || mandatory === 'true' || mandatory === 'TRUE') {
          input.required = true;
        }
      }

      wrapper.appendChild(input);
      form.appendChild(wrapper);
    });

    block.replaceChildren(form);
  } catch (err) {
    // Console log error if JSON fetch or parsing fails
    console.error('Failed to render EDS form:', err);
  }
}
