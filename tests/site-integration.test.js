import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { projects } from '../content/projects.js';
import { destinations, stationProjects, projectHref, projectList, escapeHtml } from '../content/destinations.js';
import { generatedPages } from '../journey/generate.js';
import { getStations } from '../journey/route.js';
import { parseDetailRoute } from '../lab/detail-routing.js';

test('generated root and direct index are current snapshots of the shared content model', () => {
  for (const [path, html] of Object.entries(generatedPages)) assert.equal(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), html);
  assert.deepEqual(destinations.map(s => s.id), getStations().map(s => s.id));
  const ids = destinations.flatMap(s => s.projects);
  assert.equal(new Set(ids).size, projects.length);
  assert.deepEqual(new Set(ids), new Set(projects.map(p => p.id)));
});

test('destination links preserve specific direct project and sandbox routes', () => {
  for (const project of projects) {
    const href = projectHref(project);
    assert.ok(href.startsWith('/projects/') || href.startsWith('/about/') || href.startsWith('/resume/'));
    assert.ok(projectList(destinations.find(s => s.projects.includes(project.id)).id).includes(escapeHtml(project.title)));
    if (project.needsContent) assert.ok(projectList(destinations.find(s => s.projects.includes(project.id)).id).includes('Content needed'));
    const file = href.split(/[?#]/)[0];
    assert.ok(existsSync(new URL(`..${file.endsWith('/') ? file + 'index.html' : file}`, import.meta.url)), href);
  }
  assert.equal(projectHref(projects.find(p => p.id === 'strategy'), false), '/projects/#lab/strategy');
  const simulated = projects.find(p => p.id === 'strategy-simulation');
  for (const labs of [true, false]) assert.equal(projectHref(simulated, labs), '/projects/#lab/strategy/simulated');
  assert.ok(projectList('observatory').includes('href="/projects/#lab/strategy/simulated"'));
  assert.equal(projectHref(projects.find(p => p.id === 'thermal')), '/projects/#project/thermal');
});

test('unknown/empty station lists and unsafe text have safe presentation', () => {
  assert.deepEqual(stationProjects('entrance'), []);
  assert.equal(projectList('entrance'), '');
  assert.deepEqual(stationProjects('missing'), []);
  assert.equal(projectList('missing'), '');
  assert.equal(escapeHtml('<a "x">&\''), '&lt;a &quot;x&quot;&gt;&amp;&#39;');
  assert.equal(projectHref({ id: 'empty', links: [] }), '/projects/destinations.html#empty');
});

test('forest scenery remains without a destination card or empty entrance lists', () => {
  assert.equal(projects.length, 15);
  assert.ok(!projects.some(project => project.id === 'forest-lake'));
  assert.ok(!destinations.some(station => station.projects.includes('forest-lake')));
  for (const path of ['index.html', 'explore/index.html', 'projects/index.html', 'projects/destinations.html']) {
    assert.ok(!generatedPages[path].includes('Forest lake'), path);
    assert.ok(!generatedPages[path].includes('One continuous forest-lake environment.'), path);
    assert.ok(!generatedPages[path].includes('<ul class="project-list"></ul>'), path);
  }
  const entrance = generatedPages['explore/index.html'].match(/<section id="entrance"[\s\S]*?<\/section>/)[0];
  assert.ok(entrance.includes('<h2>Welcome</h2>'));
  assert.ok(entrance.includes('Scroll to follow the shoreline.'));
  assert.ok(!entrance.includes('<ul'));
  assert.ok(generatedPages['explore/index.html'].includes('id="world"'));
  for (const path of ['projects/index.html', 'projects/destinations.html']) assert.ok(!generatedPages[path].includes('Lakeside entrance'), path);
});

test('simulated dataset belongs only to its explicit hash route, never a retained query', () => {
  const url = new URL('https://example.com/projects/?dataset=simulated#lab/strategy/simulated');
  assert.deepEqual(parseDetailRoute(url.hash), {slug:'lab-strategy',dataset:'simulated'});
  url.hash = '';
  assert.equal(parseDetailRoute(url.hash), null);
  url.hash = '#lab/strategy';
  assert.deepEqual(parseDetailRoute(url.hash), {slug:'lab-strategy',dataset:'spy'});
  for (const hash of ['', '#lab/strategy/unknown', '#lab/chess/simulated', '#project/renderer/simulated']) assert.equal(parseDetailRoute(hash), null);
  assert.deepEqual(parseDetailRoute('#project/renderer'), {slug:'renderer',dataset:'spy'});
});

test('direct page keeps its sections, local resources, JS-free figures and overlay templates', () => {
  const html = readFileSync(new URL('../projects/index.html', import.meta.url), 'utf8');
  for (const id of ['projects','lab','about','contact','tpl-renderer','tpl-thermal','tpl-vol','tpl-lab-chess','tpl-lab-strategy']) assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.includes('<noscript>'));
  assert.ok(html.includes('href="#destinations"'));
  assert.ok(html.includes('src="/projects/destinations.js"'));
  for (const match of html.matchAll(/(?:src|href)="(\/(?:assets|main\.js|styles\.css)[^"#]*)"/g)) assert.ok(existsSync(new URL(`..${match[1]}`, import.meta.url)), match[1]);
  assert.ok(!/(?:src|srcset|href)="(?:assets\/|main\.js|styles\.css)/.test(html));
});
