import { projects } from './projects.js';

export const destinations = [
  { id: 'entrance', name: 'Lakeside entrance', subtitle: 'Scroll to follow the shoreline.', projects: ['forest-lake'] },
  { id: 'observatory', name: 'Observatory', subtitle: 'Quantitative research', projects: ['vol', 'strategy', 'strategy-simulation', 'portfolio-manager'] },
  { id: 'archive', name: 'Archive', subtitle: 'Data and research', projects: ['data-universe', 'human-interaction'] },
  { id: 'workshop', name: 'Workshop', subtitle: 'Graphics, hardware and analysis labs', projects: ['renderer', 'thermal', 'scomp', 'palletizer-fsm', 'malware-research'] },
  { id: 'clearing', name: 'Clearing', subtitle: 'Games and experiments', projects: ['chess', 'poker', 'chess-buddies'] },
  { id: 'overlook', name: 'Overlook', subtitle: 'About and contact', projects: ['resume'] }
];

export function stationProjects(id) {
  return (destinations.find(station => station.id === id)?.projects || []).map(id => projects.find(project => project.id === id));
}

export function projectHref(project, labs = true) {
  const href = project.links[0]?.href;
  if (!href) return `/projects/destinations.html#${project.id}`;
  if (href.startsWith('#lab/') && !labs) return '/projects/#lab';
  return href.startsWith('#') ? `/projects/${href}` : href;
}

export const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function projectList(id, labs = false) {
  return stationProjects(id).map(project => `<li><h3>${escapeHtml(project.title)}</h3><span class="classification">${escapeHtml(project.label)}</span><p>${escapeHtml(project.needsContent ? 'Content needed' : project.summary)}</p><a href="${escapeHtml(projectHref(project, labs))}" aria-label="Open ${escapeHtml(project.title)}">Open <span aria-hidden="true">↗</span></a></li>`).join('\n');
}

export function destinationIndex() {
  return destinations.map(station => `<div class="destination-group"><h3>${escapeHtml(station.name)}</h3><ul class="project-list">${projectList(station.id, true).replaceAll('<h3>', '<h4>').replaceAll('</h3>', '</h4>')}</ul></div>`).join('\n');
}
