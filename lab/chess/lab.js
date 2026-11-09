import { mountChess } from './board.js';

function mount(root, options) {
  if (!document.querySelector('link[data-chess-style]')) {
    const style = document.createElement('link'); style.rel='stylesheet';style.href='/lab/chess/lab.css';style.dataset.chessStyle='true';document.head.append(style);
  }
  root.classList.add('chessMount');
  return mountChess(root,options);
}
export function mountEncounter(root) { return mount(root,{readOnly:true,persist:false}); }
export function mountExperiment(root) { return mount(root,{}); }
export function mountPreview(root) { return mount(root,{persist:false}); }
