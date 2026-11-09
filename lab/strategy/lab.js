import { mountStrategy } from './sandbox.js';

export function mountEncounter(root) { root.classList.add('strategyMount'); return mountStrategy(root, { readOnly: true }); }
export function mountExperiment(root) { root.classList.add('strategyMount'); return mountStrategy(root); }
