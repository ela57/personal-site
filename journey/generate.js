import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { destinations, stationProjects, projectList, projectHref, destinationIndex, escapeHtml as e } from '../content/destinations.js';
import { welcome, about, skills } from '../content/eportfolio.js';
import { portfolioNav, portfolioPages } from '../eportfolio/pages.js';

const hero = `<div class="entrance-words"><p class="build-line" aria-hidden="true">I like to build <span class="cycle" data-cycle="hero"><span class="cycleWord is-active">renderers.</span><span class="cycleWord">shaders.</span><span class="cycleWord">backtests.</span><span class="cycleWord">chess puzzles.</span></span></p><p class="sr-only">I like to build renderers, shaders, backtests and chess puzzles.</p><button id="wordMotion" type="button" aria-pressed="false" hidden>Pause word effects</button></div>`;
const welcomeBlock = `<section class="welcome-block" aria-labelledby="welcome-title"><h2 id="welcome-title">Welcome</h2><p>${e(welcome)}</p></section>`;
const panels = destinations.map(station => `<section id="${station.id}" class="station${station.id === 'entrance' ? ' is-active' : ''}" aria-labelledby="title-${station.id}"><div class="station-panel"><${station.id === 'entrance' ? 'h1' : 'h2'} id="title-${station.id}">${station.id === 'entrance' ? 'Ethan Lam' : station.name}</${station.id === 'entrance' ? 'h1' : 'h2'}>${station.id === 'entrance' ? `${hero}<div class="entrance-welcome"><h2>Welcome</h2><p>${e(welcome)}</p></div>` : ''}<p class="subtitle">${station.subtitle}</p>${station.projects.length ? `<ul class="project-list">${projectList(station.id)}</ul>` : ''}${station.id === 'overlook' ? `<nav class="contact-links" aria-label="Contact">${stationProjects('overlook')[0].links.slice(1).map(link => `<a href="${e(link.href.startsWith('#') ? `/projects/${link.href}` : link.href)}">${e(link.title)}</a>`).join('')}</nav>` : ''}</div></section>`).join('\n');
const home = readFileSync(new URL('./shell.html', import.meta.url), 'utf8')
  .replace('{{MENU}}', destinations.map(s => `<a data-station-link="${s.id}" href="#${s.id}">${s.id === 'entrance' ? 'Entrance' : s.name}</a>`).join(''))
  .replace('{{PANELS}}', panels);
const indexProject = project => `<li id="${project.id}"><h3>${e(project.title)}</h3><span class="classification">${e(project.label)}</span><p>${e(project.needsContent ? 'Content needed' : project.summary)}</p>${project.needsContent ? '' : `<a href="${e(projectHref(project))}" aria-label="Open ${e(project.title)}">Open ↗</a>`}${project.body.length ? `<details><summary>Context</summary>${project.body.map(fact => `<p>${e(fact)}</p>`).join('')}</details>` : ''}</li>`;
const all = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>All destinations — Ethan Lam</title><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/projects/destinations.css"><link rel="stylesheet" href="/eportfolio/site.css"></head><body class="eportfolio-page"><header class="eportfolio-header"><a class="brand" href="/">Ethan Lam</a>${portfolioNav('projects')}</header><main><h1>All destinations</h1><p>Projects, research and the material still to come.</p>${destinations.filter(station => station.projects.length).map(station => `<section><h2>${station.name}</h2><ul>${stationProjects(station.id).map(indexProject).join('')}</ul></section>`).join('')}</main></body></html>\n`;
const direct = readFileSync(new URL('../projects/index.html', import.meta.url), 'utf8').replace(/<!-- destinations:start -->[\s\S]*?<!-- destinations:end -->/, `<!-- destinations:start -->\n<section class="all-destinations" id="destinations" aria-labelledby="destinationsTitle"><h2 id="destinationsTitle">All destinations</h2><div class="destination-index">${destinationIndex()}</div></section>\n    <!-- destinations:end -->`);
const sharedNav = (html, current) => html.replace(/<!-- eportfolio-nav:start -->[\s\S]*?<!-- eportfolio-nav:end -->/, `<!-- eportfolio-nav:start -->${portfolioNav(current)}<!-- eportfolio-nav:end -->`);
const portfolio = sharedNav(direct, 'projects').replace(/<!-- welcome:start -->[\s\S]*?<!-- welcome:end -->/, `<!-- welcome:start -->${welcomeBlock}<!-- welcome:end -->`).replace(/<!-- about-teaser:start -->[\s\S]*?<!-- about-teaser:end -->/, `<!-- about-teaser:start --><p>${e(about[0])}</p><a class="text-link" href="/about/">Read more</a><!-- about-teaser:end -->`).replace(/<!-- skills:start -->[\s\S]*?<!-- skills:end -->/, `<!-- skills:start -->${Object.entries(skills).map(([title,text]) => `<div><dt class="mono">${title}</dt><dd>${e(text)}</dd></div>`).join('')}<!-- skills:end -->`);
export const generatedPages = {
  ...portfolioPages,
  'index.html': sharedNav(portfolio, 'home').replaceAll('https://ethan-lam.com/projects/', 'https://ethan-lam.com/'),
  'explore/index.html': sharedNav(home, 'explore'),
  'projects/destinations.html': all,
  'projects/index.html': portfolio
};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [path, html] of Object.entries(generatedPages)) {
    const url = new URL(`../${path}`, import.meta.url);
    if (process.argv.includes('--check')) {
      if (readFileSync(url, 'utf8') !== html) throw new Error(`Regenerate ${path}: node journey/generate.js`);
    } else writeFileSync(url, html);
  }
}
