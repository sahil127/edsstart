import { authFetch } from '../../scripts/auth.js';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];

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

export default async function decorate(block) {
  const apiLink = block.querySelector('a')?.href || 'http://localhost:3001/api/tickets';
  console.log('--- Ticket API Link:', apiLink);
  // Loading indicator
  block.innerHTML = '<div class="tickets-loading">Loading ticket queue...</div>';

  try {
    // Use authFetch to include auth token
    const response = await authFetch(apiLink);
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
          <th>Created By</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tickets.map((t) => `
          <tr data-ticket-id="${t.ticketId || t.id}">
            <td class="ticket-key"><strong>${t.ticketId || t.id}</strong></td>
            <td class="ticket-summary">
              <span class="summary-text">${t.summary}</span>
              <span class="reporter-email">${t.email}</span>
            </td>
            <td><span class="badge type-${(t.issueType || 'support').toLowerCase()}">${t.issueType || 'Support'}</span></td>
            <td><span class="badge priority-${(t.priority || 'medium').toLowerCase()}">${t.priority || 'Medium'}</span></td>
            <td class="ticket-status" data-current-status="${t.status || 'open'}"><span class="badge status-${(t.status || 'open').toLowerCase().replace('_', '-')}">${t.status || 'OPEN'}</span></td>
            <td class="ticket-date">${new Date(t.createdAt).toLocaleDateString()}</td>
            <td class="created-by-cell">${t.createdByName || 'User'}</td>
            <td>
              <select class="status-dropdown" data-ticket-id="${t.ticketId || t.id}">
                <option value="">Change Status</option>
                ${STATUS_OPTIONS.map((status) => `<option value="${status.toLowerCase()}">${status}</option>`).join('')}
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    `;

    tableWrapper.appendChild(table);
    block.replaceChildren(tableWrapper);

    // Add event listeners to status dropdowns
    const dropdowns = tableWrapper.querySelectorAll('.status-dropdown');
    dropdowns.forEach((dropdown) => {
      dropdown.addEventListener('change', async (e) => {
        const newStatus = e.target.value;
        if (!newStatus) return;

        const ticketId = dropdown.getAttribute('data-ticket-id');
        const row = tableWrapper.querySelector(`tr[data-ticket-id="${ticketId}"]`);
        const statusCell = row.querySelector('.ticket-status');

        try {
          // Attempt to update ticket via API
          const updateRes = await authFetch(`http://localhost:3001/api/update-ticket-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, status: newStatus }),
          });

          if (updateRes.ok) {
            // Update the badge in the status column
            statusCell.innerHTML = `<span class="badge status-${newStatus.toLowerCase().replace('_', '-')}">${newStatus.toUpperCase()}</span>`;
            dropdown.value = '';
            showToast(`Ticket ${ticketId} status updated to ${newStatus}`, 'success');
            console.log(`Ticket ${ticketId} status updated to ${newStatus}`);
          } else {
            const error = await updateRes.json().catch(() => ({}));
            showToast(`Failed to update ticket: ${error.message || 'Unknown error'}`, 'error');
            dropdown.value = '';
          }
        } catch (err) {
          console.error('Error updating ticket:', err);
          showToast('Unable to update ticket status.', 'error');
          dropdown.value = '';
        }
      });
    });
  } catch (err) {
    console.error('Error loading tickets:', err);
    block.innerHTML = '<div class="tickets-error">Failed to load ticket list.</div>';
  }
}