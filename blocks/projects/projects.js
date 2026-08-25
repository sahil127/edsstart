export default async function decorate(block) {
  // Get the link to the projects JSON authored in the block
  const jsonLink = block.querySelector('a');
  if (!jsonLink) return;

  try {
    const response = await fetch(jsonLink.href);
    const json = await response.json();
    const data = json.data || json; // Handles standard EDS JSON sheet structure

    const grid = document.createElement('div');
    grid.className = 'projects-grid';

    data.forEach((project) => {
      const card = document.createElement('div');
      card.className = 'project-card';

      // Normalize badge class name based on project Type
      const typeClass = project.Type ? project.Type.toLowerCase().replace(/\s+/g, '-') : 'default';

      card.innerHTML = `
        <div class="card-top">
          <div class="card-header">
            <h3 class="project-name">${project.Name || 'Unnamed Project'}</h3>
            <span class="project-badge badge-${typeClass}">${project.Type || 'General'}</span>
          </div>
          <p class="project-label">${project.Label || ''}</p>
        </div>
        <a href="${project.link || '#'}" target="_blank" rel="noopener noreferrer" class="project-btn">
          View Details
        </a>
      `;

      grid.appendChild(card);
    });

    block.textContent = '';
    block.appendChild(grid);
  } catch (error) {
    console.error('Error fetching project data:', error);
  }
}