import { clamp } from './scroll-scheduler.js';

export function inkWords(element) {
  const words = element.textContent.trim().split(/\s+/).map(word => {
    const span = document.createElement('span');
    span.className = 'ink-word'; span.textContent = word;
    return span;
  });
  element.replaceChildren(...words.flatMap((word, i) => i ? [document.createTextNode(' '), word] : [word]));
  return words;
}
export function paintInk(words, p) {
  words.forEach((word, index) => { word.style.opacity = .2 + .8 * clamp(p * (words.length + 6) - index); });
}
export const advanceMarquee = (phase, dt, velocity) => phase + dt / 1000 * (18 + Math.abs(velocity) * 220);
export function marqueeTransform(phase, distance, index, velocity) {
  const offset = phase % (distance || 1);
  return `translateX(${index ? offset - distance : -offset}px) skewX(${velocity * (index ? -3 : 3)}deg)`;
}
export function paintStack(card, p) {
  card.style.transform = `scale(${1 - p * .045})`;
  card.style.opacity = 1 - p * .16;
}
export function paintTimeline(path, milestones, p) {
  path.style.strokeDasharray = 1; path.style.strokeDashoffset = 1 - p;
  milestones.forEach((milestone, i) => milestone.classList.toggle('milestone-lit', p + .001 >= i / Math.max(1, milestones.length - 1)));
}
