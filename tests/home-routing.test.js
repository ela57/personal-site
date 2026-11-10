import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { generatedPages } from '../journey/generate.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function legacyTarget(hash = '', search = '', pathname = '/') {
  let target = null;
  runInNewContext(read('journey/legacy.js'), {
    location: { hash, search, pathname, replace: url => { target = url; } },
    history: { replaceState: (_state, _title, url) => { target = url; } },
    URLSearchParams, addEventListener() {}
  });
  return target;
}

test('homepage and projects alias share static content and a footer-only experiment link', () => {
  for (const path of ['index.html', 'projects/index.html']) {
    const html = generatedPages[path];
    assert.ok(html.includes('<body data-static-portfolio>'));
    for (const id of ['welcome-title','projects','lab','about','contact','tpl-renderer','tpl-lab-strategy']) assert.ok(html.includes(`id="${id}"`));
    assert.ok(!html.includes('/journey/main.js'));
    const body = html.replace(/<template[\s\S]*?<\/template>/g, '');
    assert.ok(!body.includes('<canvas'));
    assert.equal((html.match(/href="\/explore\/"/g) || []).length, 1);
    assert.ok(html.indexOf('id="experimental"') > html.indexOf('id="destinations"'));
    assert.ok(html.includes('Experimental interactive version'));
    assert.ok(!html.includes('>Forest journey</a>'));
    assert.ok(html.includes('Computer engineering · Georgia Tech ’28'));
    assert.ok(html.includes('All destinations <span aria-hidden="true">↗</span></a>'));
    assert.ok(html.includes('<h1 class="heroTitle" id="heroTitle">Ethan Lam</h1>'));
    assert.ok(html.includes('data-cycle="hero"'));
  }
  assert.ok(generatedPages['index.html'].includes('href="/" aria-current="page"'));
  assert.ok(read('main.js').includes('interactive: !staticPortfolio'));
  assert.ok(read('main.js').includes('if (!staticPortfolio) mountPipeline'));
  assert.ok(!/^import .*water\.js/m.test(read('lab/lake/lake.js')));
});

test('legacy station, five-stage lab and tour/debug URLs preserve their complete state', () => {
  for (const hash of ['#/at/workshop','#workshop','#/lab/chess/inspect','#/lab/strategy/experiment']) {
    assert.equal(legacyTarget(hash, '?debug&tour=1&custom=kept'), `/explore/?debug&tour=1&custom=kept${hash}`);
  }
  assert.equal(legacyTarget('', '?tour=1'), '/explore/?tour=1');
  assert.equal(legacyTarget('', '?debug'), '/explore/?debug');
  assert.equal(legacyTarget('#work', '?custom=kept'), '/?custom=kept#projects');
});

test('direct project/lab hashes, ordinary anchors and unrelated queries stay on the portfolio', () => {
  for (const hash of ['', '#project/renderer','#lab/strategy','#lab/strategy/simulated','#lab/chess','#projects','#contact','#experimental']) {
    assert.equal(legacyTarget(hash, '?dataset=simulated'), null);
  }
  for (const hash of ['#lab/strategy','#project/thermal','#contact']) assert.equal(legacyTarget(hash, '?tour=1&debug'), null);
  assert.equal(legacyTarget('#/at/workshop', '', '/explore/'), null);
  assert.equal(legacyTarget('#lab/strategy', '', '/projects/'), null);
  assert.equal(legacyTarget('#unknown'), null);
});

test('journey station and lab history stays on its mounted path', () => {
  for (const path of ['journey/main.js', 'journey/lab-presenter.js']) {
    const source = read(path);
    assert.ok(!source.includes('`/${location.search}'));
    assert.ok(source.includes('${location.pathname}${location.search}'));
  }
  assert.ok(generatedPages['explore/index.html'].includes('id="motion" href="/"'));
  assert.ok(generatedPages['explore/index.html'].includes('href="/explore/#/lab/strategy/encounter"'));
});
