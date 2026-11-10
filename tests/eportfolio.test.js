import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { projects } from '../content/projects.js';
import { welcome, about, career, skills, awards } from '../content/eportfolio.js';
import { portfolioNav, escape } from '../eportfolio/pages.js';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
test('every public page has static shared navigation and one current page', () => {
  for (const [file,current] of [['index.html','home'],['projects/index.html','projects'],['projects/destinations.html','projects'],['about/index.html','about'],['resume/index.html','resume'],['career/index.html','career']]) {
    const html = read(file);
    assert.ok(html.includes(portfolioNav(current)), file);
    assert.equal((portfolioNav(current).match(/aria-current="page"/g) || []).length, 1);
    assert.ok(html.includes('/eportfolio/site.css'));
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
test('résumé is a committed PDF with embed, download, new-tab and fallback links', () => {
  const path='assets/Lam_Ethan_Resume.pdf';
  assert.ok(existsSync(new URL(`../${path}`,import.meta.url)));
  assert.equal(readFileSync(new URL(`../${path}`,import.meta.url)).subarray(0,5).toString(),'%PDF-');
  assert.ok(read('.gitignore').includes('!assets/Lam_Ethan_Resume.pdf'));
  const html=read('resume/index.html');
  assert.ok(html.includes(`data="/${path}#view=FitH&amp;pagemode=none" type="application/pdf"`));
  assert.ok(html.includes(`href="/${path}" download="Lam_Ethan_Resume.pdf"`));
  assert.ok(html.includes(`href="/${path}" target="_blank" rel="noopener noreferrer"`));
  assert.ok(html.includes('class="pdf-fallback"'));
  for (const file of ['index.html','projects/index.html','projects/destinations.html','content/projects.js']) assert.ok(!/mailto:[^"\s]*(?:subject=|r%C3%A9sum|resume)/i.test(read(file)), file);
  assert.equal(projects.find(p=>p.id==='resume').links[0].href,'/resume/');
});
test('Chess Buddies has sourced leadership content, not a placeholder', () => {
  const chess=projects.find(p=>p.id==='chess-buddies');
  assert.equal(chess.needsContent,false);
  assert.ok(chess.summary.includes('President · Aug 2022–May 2024'));
  assert.ok(chess.body.includes(about[3]));
  assert.equal(chess.links[0].href,'/about/#chess-buddies');
  assert.ok(!projects.some(p=>p.id==='crypto-game'));
});
