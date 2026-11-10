import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { labs, labStages } from '../content/labs.js';
import { projects } from '../content/projects.js';
import { parseLabRoute, labHash, stationForLab, excerptLines, exitDistance, historyRouteEvents } from '../journey/lab-routing.js';
import { destinations, projectList } from '../content/destinations.js';

test('lab schema has five complete stages, real project labels and resolvable mount exports', () => {
  assert.equal(new Set(labs.map(lab => lab.id)).size,labs.length);
  for (const lab of labs) {
    const project = projects.find(project => project.id === lab.projectId);
    assert.ok(project); assert.equal(lab.label,project.label); assert.ok(lab.title);
    assert.deepEqual(Object.keys(lab.stages),labStages);
    for (const stage of Object.values(lab.stages)) {
      assert.ok(stage.title);
      if (stage.mount) {
        assert.match(stage.mount.module,/^\/lab\/[a-z0-9/.-]+\.js$/);
        const source = readFileSync(new URL(`..${stage.mount.module}`,import.meta.url),'utf8');
        assert.ok(source.includes(`export function ${stage.mount.export}(`));
      }
      for (const excerpt of stage.excerpts || []) {
        const source = readFileSync(new URL(`../${excerpt.path}`,import.meta.url),'utf8');
        assert.ok(excerptLines(source,excerpt.start,excerpt.end).length);
      }
      if (stage.diagram) assert.ok(existsSync(new URL(`../${stage.diagram.path}`,import.meta.url)));
    }
    assert.ok(lab.stages.encounter.mount); assert.ok(lab.stages.experiment.mount);
    assert.ok(lab.stages.understand.problem.length && lab.stages.understand.approach.length);
    assert.ok(lab.stages.inspect.excerpts?.length || lab.stages.inspect.steps?.length || lab.stages.inspect.diagram);
    for (const field of ['lessons','limitations','improvements']) assert.ok(lab.stages.reflect[field].length);
  }
});

test('lab hashes round-trip all stages and resolve their world station', () => {
  for (const lab of labs) for (const stage of labStages) {
    assert.deepEqual(parseLabRoute(labHash(lab.id,stage)),{ lab,stage });
    assert.equal(stationForLab(lab),destinations.find(station => station.projects.includes(lab.projectId)).id);
  }
});
test('unknown, missing or malformed routes do not open a lab', () => {
  for (const hash of ['', '#/at/observatory','#/lab/strategy','#/lab/strategy/unknown','#/lab/missing/inspect','#/lab/strategy/inspect/extra']) assert.equal(parseLabRoute(hash),null);
  assert.throws(() => labHash('missing','inspect'),RangeError);
  assert.throws(() => labHash('strategy','missing'),RangeError);
});
test('history exit distance returns to a station origin or the deep-link entry', () => {
  assert.equal(exitDistance({ depth: 4,deep: false }),5);
  assert.equal(exitDistance({ depth: 4,deep: true }),4);
  assert.equal(exitDistance({ depth: 0,deep: true }),0);
  assert.equal(exitDistance(null),0); assert.equal(exitDistance({depth:-1}),0);
});
test('source excerpts preserve real lines and reject invalid ranges', () => {
  assert.deepEqual(excerptLines('one\ntwo\nthree\n',2,3),['two','three']);
  assert.throws(() => excerptLines('',1,1),RangeError);
  for (const range of [[0,1],[2,1],[1,4],[1.5,2]]) assert.throws(() => excerptLines('one\ntwo\nthree',...range),RangeError);
});
test('paired popstate/hashchange routes once, including an Exit replacement, without swallowing manual hashes', () => {
  let url = 'https://site.test/#/lab/strategy/encounter', calls = 0;
  const events = historyRouteEvents(() => { calls++; url = 'https://site.test/#/at/observatory'; }, () => url);
  events.popstate();
  events.hashchange({ newURL: 'https://site.test/#/lab/strategy/encounter' });
  assert.equal(calls,1);
  url = 'https://site.test/#/lab/strategy/inspect'; events.hashchange({newURL:url});
  assert.equal(calls,2);
  events.popstate(); events.hashchange({newURL:'https://site.test/#/at/observatory'});
  assert.equal(calls,3);
});
test('journey lab entry is generated from definitions; placeholders have no actions', () => {
  assert.match(projectList('observatory'),/data-lab-link="strategy"[^>]+href="\/explore\/#\/lab\/strategy\/encounter"/);
  assert.ok(projectList('observatory').includes('Enter lab'));
  assert.ok(!projectList('archive').includes('<a '));
  assert.ok(!projectList('archive',true).includes('<a '));
});
