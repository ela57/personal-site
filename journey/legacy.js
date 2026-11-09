function redirectLegacy() {
  const hash = location.hash;
  const legacy = /^#(?:project|lab)\/[a-z0-9-]+$/.test(hash) || hash === '#lab/strategy/simulated' || /^#(?:top|main|projects|work|work-renderer|work-thermal|work-vol|about|contact|lab|experience|approach|pipeline)$/.test(hash);
  if (legacy) location.replace(`/projects/${location.search}${hash === '#work' ? '#projects' : hash}`);
}
redirectLegacy();
addEventListener('hashchange', redirectLegacy);
