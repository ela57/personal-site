import { mountWords } from '../lab/words.js';
import { destinations, projectList } from '../content/destinations.js';

export const stationSubtitles = Object.fromEntries(destinations.map(s => [s.id, s.subtitle]));

export function mountPresentation(root = document) {
  for (const station of destinations.filter(station => station.projects.length)) root.querySelector(`#${station.id} .project-list`).innerHTML = projectList(station.id);
  document.body.classList.add('journey-ready');
  mountWords(root);
  return id => {
    for (const section of root.querySelectorAll('.station')) section.classList.toggle('is-active', section.id === id);
    const index = destinations.findIndex(station => station.id === id);
    root.querySelector('#location').textContent = `${String(index + 1).padStart(2, '0')} / 06 ${id === 'entrance' ? 'Entrance' : destinations[index].name}`;
  };
}
