function redirectLegacy() {
  if (!['/', '/index.html'].includes(location.pathname)) return;
  const hash = location.hash;
  const direct = /^#(?:project|lab)\//.test(hash) || /^#(?:top|main|projects|work|work-renderer|work-thermal|work-vol|about|contact|lab|experience|approach|pipeline|destinations|experimental)$/.test(hash);
  if (direct) {
    if (hash === '#work') history.replaceState(null, '', `${location.pathname}${location.search}#projects`);
    return;
  }
  const query = new URLSearchParams(location.search);
  const journey = /^#\/(?:at|lab)\//.test(hash) || /^#(?:entrance|observatory|archive|workshop|clearing|overlook)$/.test(hash);
  if (journey || query.has('tour') || query.has('debug')) location.replace(`/explore/${location.search}${hash}`);
}
redirectLegacy();
addEventListener('hashchange', redirectLegacy);
