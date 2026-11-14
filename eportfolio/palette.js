import { clamp } from './scroll-scheduler.js';

export const tones = [[236, 231, 220], [19, 44, 35], [24, 55, 68], [73, 43, 35]];
export const welcomeTones = [[19, 32, 27], [19, 44, 35], [24, 55, 68]];
export const luminance = values => values.map(value => { const v = value / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
export function paletteInk(a, b, t) {
  const rgb = tones[a].map((value, i) => value * (1 - t) + tones[b][i] * t);
  const bg = luminance(rgb);
  return (bg + .05) / .05 >= 1.05 / (bg + .05) ? 'dark' : 'light';
}
export function chapterPalette(p, colors = tones) {
  const position = clamp(p) * (colors.length - 1);
  const a = Math.min(colors.length - 2, Math.floor(position)), t = position - a;
  const background = colors[a].map((value, i) => Math.round(value * (1 - t) + colors[a + 1][i] * t));
  const bg = luminance(background);
  return {
    background,
    color: (bg + .05) / .05 >= 1.05 / (bg + .05) ? '#000000' : '#ffffff'
  };
}
export const welcomePalette = p => ({ ...chapterPalette(p, welcomeTones), color: '#ece7dc' });
