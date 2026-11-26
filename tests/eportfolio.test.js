import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { projects } from '../content/projects.js';
import { welcome, about, career, skills, awards } from '../content/eportfolio.js';
import { portfolioNav, escape } from '../eportfolio/pages.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('every public page has static shared navigation and appropriate current page', () => {
  for (const [file,current] of [['index.html','home'],['explore/index.html','explore'],['projects/index.html','projects'],['projects/destinations.html','projects'],['about/index.html','about'],['career/index.html','career']]) {
    const html = read(file);
    assert.ok(html.includes(portfolioNav(current)), file);
    assert.equal((portfolioNav(current).match(/aria-current="page"/g) || []).length, current === 'explore' ? 0 : 1);
    assert.ok(html.includes('/eportfolio/site.css'));
    if (!['index.html','explore/index.html','projects/index.html'].includes(file)) assert.ok(html.includes('class="eportfolio-page'), file);
  }
  assert.ok(!portfolioNav('missing').includes('aria-current'));
  assert.equal(escape('<>&\'"'), '&lt;&gt;&amp;&#39;&quot;');
});
test('approved copy is rendered verbatim with a five-step career plan and awards', () => {
  for (const file of ['index.html','projects/index.html']) assert.ok(read(file).includes(escape(welcome)), file);
  about.forEach(p => assert.ok(read('about/index.html').includes(escape(p))));
  for (const p of [career.intro,career.goal,career.now,career.closing,...career.steps.map(step => step[1])]) assert.ok(read('career/index.html').includes(escape(p)));
  assert.equal(career.steps.length,5);
  awards.forEach(award => assert.ok(read('about/index.html').includes(escape(award))));
  Object.values(skills).forEach(text => assert.ok(read('projects/index.html').includes(escape(text))));
});
test('résumé is not publicly served or linked', () => {
  assert.ok(!existsSync(new URL('../assets/Lam_Ethan_Resume.pdf',import.meta.url)));
  assert.ok(!existsSync(new URL('../resume/index.html',import.meta.url)));
  assert.ok(!read('.gitignore').includes('!assets/'));
  assert.ok(!projects.some(p=>p.id==='resume'));
  for (const file of ['index.html','explore/index.html','projects/index.html','projects/destinations.html','about/index.html','career/index.html','experiments/scroll/index.html','content/projects.js']) assert.ok(!/\/resume\/|Lam_Ethan_Resume/i.test(read(file)), file);
});
test('Chess Buddies has sourced leadership content, not a placeholder', () => {
  const chess=projects.find(p=>p.id==='chess-buddies');
  assert.equal(chess.needsContent,false);
  assert.ok(chess.summary.includes('President · Aug 2022–May 2024'));
  assert.ok(chess.body.includes(about[3]));
  assert.equal(chess.links[0].href,'/about/#chess-buddies');
  assert.ok(!projects.some(p=>p.id==='crypto-game'));
});
