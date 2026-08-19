export default async function decorate(block) {
  const apiLink = block.querySelector('a')?.href || 'http://localhost:3001/api/tickets';
console.log('--- Ticket API Link:', apiLink);
  // Loading indicator
  block.innerHTML = '<div class="tickets-loading">Loading ticket queue...</div>';

  try {
    const response = await fetch(apiLink);
    const result = await response.json();

    if (!response.ok || !result.success || !result.data.length) {
      block.innerHTML = '<div class="tickets-empty">No tickets found.</div>';
      return;
    }

    const tickets = result.data;

    // Create Jira-style table markup
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'ticket-list-wrapper';

    const table = document.createElement('table');
    table.className = 'jira-ticket-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Key</th>
          <th>Summary</th>
          <th>Type</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tickets.map((t) => `
          <tr>
            <td class="ticket-key"><strong>${t.ticketId || t.id}</strong></td>
            <td class="ticket-summary">
              <span class="summary-text">${t.summary}</span>
              <span class="reporter-email">${t.email}</span>
            </td>
            <td><span class="badge type-${(t.issueType || 'support').toLowerCase()}">${t.issueType || 'Support'}</span></td>
            <td><span class="badge priority-${(t.priority || 'medium').toLowerCase()}">${t.priority || 'Medium'}</span></td>
            <td><span class="badge status-${(t.status || 'open').toLowerCase().replace('_', '-')}">${t.status || 'OPEN'}</span></td>
            <td class="ticket-date">${new Date(t.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="btn-edit" data-ticket='${JSON.stringify(t)}'>Edit</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    tableWrapper.appendChild(table);
    block.replaceChildren(tableWrapper);
  } catch (err) {
    console.error('Error loading tickets:', err);
    block.innerHTML = '<div class="tickets-error">Failed to load ticket list.</div>';
  }
}