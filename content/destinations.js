import { projects } from './projects.js';
import { labs as labDefinitions } from './labs.js';

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
  return href.startsWith('#') ? `/projects/${href}` : href;
}

export const escapeHtml = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function projectList(id, labs = false) {
  return stationProjects(id).map(project => {
    const lab = !labs && labDefinitions.find(lab => lab.projectId === project.id);
    const action = lab ? 'Enter lab' : 'Open';
    const href = lab ? `/#/lab/${lab.id}/encounter` : projectHref(project, labs);
    return `<li><h3>${escapeHtml(project.title)}</h3><span class="classification">${escapeHtml(project.label)}</span><p>${escapeHtml(project.needsContent ? 'Content needed' : project.summary)}</p>${project.needsContent ? '' : `<a ${lab ? `data-lab-link="${lab.id}" ` : ''}href="${escapeHtml(href)}" aria-label="${action}: ${escapeHtml(project.title)}">${action} <span aria-hidden="true">↗</span></a>`}</li>`;
  }).join('\n');
}

export function destinationIndex() {
  return destinations.map(station => `<div class="destination-group"><h3>${escapeHtml(station.name)}</h3><ul class="project-list">${projectList(station.id, true).replaceAll('<h3>', '<h4>').replaceAll('</h3>', '</h4>')}</ul></div>`).join('\n');
}
