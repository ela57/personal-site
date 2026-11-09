export function parseDetailRoute(hash) {
  const match = /^#(project|lab)\/([a-z0-9-]+)(\/simulated)?$/.exec(hash);
  if (!match || (match[3] && (match[1] !== 'lab' || match[2] !== 'strategy'))) return null;
  return { slug: match[1] === 'lab' ? `lab-${match[2]}` : match[2], dataset: match[3] ? 'simulated' : 'spy' };
}
