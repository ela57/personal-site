import { labs, labStages } from '../content/labs.js';
import { destinations } from '../content/destinations.js';

export function parseLabRoute(hash) {
  const match = /^#\/lab\/([a-z0-9-]+)\/([a-z]+)$/.exec(hash);
  if (!match) return null;
  const lab = labs.find(lab => lab.id === match[1]);
  return lab && labStages.includes(match[2]) ? { lab, stage: match[2] } : null;
}
export function labHash(id, stage) {
  const hash = `#/lab/${id}/${stage}`;
  if (!parseLabRoute(hash)) throw new RangeError('Unknown lab or stage.');
  return hash;
}
export function stationForLab(lab) {
  return destinations.find(station => station.projects.includes(lab.projectId))?.id || 'entrance';
}
export function excerptLines(source, start, end) {
  if (!source.trim()) throw new RangeError('Source is empty.');
  const lines = source.trimEnd().split('\n');
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > lines.length) throw new RangeError('Source line range is unavailable.');
  return lines.slice(start - 1, end);
}
export function exitDistance(state) {
  if (!state || !Number.isInteger(state.depth) || state.depth < 0) return 0;
  return state.depth + (state.deep ? 0 : 1);
}
export function historyRouteEvents(navigate, currentURL) {
  let popstateURL = null;
  return {
    popstate() { popstateURL = currentURL(); navigate(); },
    hashchange(event) {
      const paired = event.newURL === popstateURL; popstateURL = null;
      if (!paired) navigate();
    }
  };
}
