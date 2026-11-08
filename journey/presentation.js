import { mountWords } from '../lab/words.js';

export const stationSubtitles = {
  entrance: 'Scroll to follow the shoreline.',
  observatory: 'Quantitative research',
  archive: 'Data and research',
  workshop: 'Graphics, hardware and analysis labs',
  clearing: 'Games and experiments',
  overlook: 'About and contact'
};

export function mountPresentation(root) {
  const words = document.createElement('div');
  words.className = 'entrance-words';
  words.innerHTML = `<p class="build-line" aria-hidden="true">I like to build <span class="cycle" data-cycle="hero"><span class="cycleWord is-active">renderers.</span><span class="cycleWord">shaders.</span><span class="cycleWord">backtests.</span><span class="cycleWord">chess puzzles.</span></span></p>
    <p class="sr-only">I like to build renderers, shaders, backtests and chess puzzles.</p>
    <button id="wordMotion" type="button" aria-pressed="false" hidden>Pause word effects</button>`;
  root.querySelector('#station-title').after(words);
  document.body.classList.add('journey-ready');
  mountWords(root);
  return (id, name) => {
    root.dataset.station = id;
    words.hidden = id !== 'entrance';
    root.querySelector('#station-title').textContent = id === 'entrance' ? 'Ethan Lam' : name;
    root.querySelector('#view-status').textContent = stationSubtitles[id] || name;
  };
}
