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

  block.innerHTML = '';
  block.appendChild(form);
}
