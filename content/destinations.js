import { projects } from './projects.js';
import { labs as labDefinitions } from './labs.js';

export const destinations = [
  { id: 'entrance', name: 'Lakeside entrance', subtitle: 'Scroll to follow the shoreline.', projects: [] },
  { id: 'observatory', name: 'Observatory', subtitle: 'Quantitative research', projects: ['vol', 'strategy', 'strategy-simulation', 'portfolio-manager'] },
  { id: 'archive', name: 'Archive', subtitle: 'Data and research', projects: ['data-universe', 'human-interaction'] },
  { id: 'workshop', name: 'Workshop', subtitle: 'Graphics, hardware and analysis labs', projects: ['renderer', 'thermal', 'scomp', 'palletizer-fsm', 'malware-research'] },
  { id: 'clearing', name: 'Clearing', subtitle: 'Games and experiments', projects: ['chess', 'poker', 'chess-buddies'] },
  { id: 'overlook', name: 'Overlook', subtitle: 'About and contact', projects: ['resume'] }
];

export const categories = [
  { id: 'projects', name: 'Projects', projects: ['renderer', 'thermal', 'data-universe', 'scomp', 'palletizer-fsm'] },
  { id: 'research-labs', name: 'Research & labs', projects: ['vol', 'strategy', 'strategy-simulation', 'chess', 'poker', 'human-interaction', 'malware-research'] },
  { id: 'leadership-experience', name: 'Leadership & experience', projects: ['portfolio-manager', 'chess-buddies'] },
  { id: 'resume', name: 'Résumé', projects: ['resume'] }
];

export function categoryProjects(id) {
  return (categories.find(category => category.id === id)?.projects || []).map(id => projects.find(project => project.id === id));
}

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
  return renderProjectList(stationProjects(id), labs);
}

function renderProjectList(items, labs) {
  return items.map(project => {
    const lab = !labs && labDefinitions.find(lab => lab.projectId === project.id);
    const action = lab ? 'Enter lab' : 'Open';
    const href = lab ? `/explore/#/lab/${lab.id}/encounter` : projectHref(project, labs);
    return `<li><h3>${escapeHtml(project.title)}</h3><span class="classification">${escapeHtml(project.label)}</span><p>${escapeHtml(project.needsContent ? 'Content needed' : project.summary)}</p>${project.needsContent ? '' : `<a ${lab ? `data-lab-link="${lab.id}" ` : ''}href="${escapeHtml(href)}" aria-label="${action}: ${escapeHtml(project.title)}">${action} <span aria-hidden="true">↗</span></a>`}</li>`;
  }).join('\n');
}

export function destinationIndex() {
  return categories.map(category => `<div class="destination-group"><h3>${escapeHtml(category.name)}</h3><ul class="project-list">${renderProjectList(categoryProjects(category.id), true).replaceAll('<h3>', '<h4>').replaceAll('</h3>', '</h4>')}</ul></div>`).join('\n');
}
