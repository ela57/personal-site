export const escape = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const pct = value => `${(value*100).toFixed(2)}%`;
export async function json(path, signal) {
  const response = await fetch(path,{signal});
  if (!response.ok) throw new Error('Bundled data could not load.');
  return response.json();
}
export const path = (values,x,y) => values.map((value,i) => value === null ? '' : `${i && values[i-1] !== null ? 'L' : 'M'}${x(i).toFixed(2)},${y(value).toFixed(2)}`).join('');
export function sourceText(source) { return `${source.repo} · seed ${source.seed} · commit ${source.commit}`; }
