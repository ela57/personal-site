import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { destinations, stationProjects, categories, categoryProjects, projectList, projectHref, destinationIndex, escapeHtml as e } from '../content/destinations.js';
import { welcome, about, skills } from '../content/eportfolio.js';
import { portfolioNav, portfolioPages } from '../eportfolio/pages.js';
import { previewPicture } from '../content/graphics.js';
import { projectGallery, skillsMarquee } from '../eportfolio/features.js';

const hero = `<div class="entrance-words"><p class="build-line" aria-hidden="true">I like to build <span class="cycle" data-cycle="hero"><span class="cycleWord is-active">renderers.</span><span class="cycleWord">shaders.</span><span class="cycleWord">backtests.</span><span class="cycleWord">chess puzzles.</span></span></p><p class="sr-only">I like to build renderers, shaders, backtests and chess puzzles.</p><button id="wordMotion" type="button" aria-pressed="false" hidden>Pause word effects</button></div>`;
const welcomeBlock = `<section class="welcome-block" aria-labelledby="welcome-title"><h2 id="welcome-title">Welcome</h2><p data-scroll-ink>${e(welcome)}</p></section>`;
const panels = destinations.map(station => `<section id="${station.id}" class="station${station.id === 'entrance' ? ' is-active' : ''}" aria-labelledby="title-${station.id}"><div class="station-panel"><${station.id === 'entrance' ? 'h1' : 'h2'} id="title-${station.id}">${station.id === 'entrance' ? 'Ethan Lam' : station.name}</${station.id === 'entrance' ? 'h1' : 'h2'}>${station.id === 'entrance' ? `${hero}<div class="entrance-welcome"><h2>Welcome</h2><p>${e(welcome)}</p></div>` : ''}<p class="subtitle">${station.subtitle}</p>${station.projects.length ? `<ul class="project-list">${projectList(station.id)}</ul>` : ''}${station.id === 'overlook' ? `<nav class="contact-links" aria-label="Contact">${stationProjects('overlook')[0].links.slice(1).map(link => `<a href="${e(link.href.startsWith('#') ? `/projects/${link.href}` : link.href)}">${e(link.title)}</a>`).join('')}</nav>` : ''}</div></section>`).join('\n');
const home = readFileSync(new URL('./shell.html', import.meta.url), 'utf8')
  .replace('{{MENU}}', destinations.map(s => `<a data-station-link="${s.id}" href="#${s.id}">${s.id === 'entrance' ? 'Entrance' : s.name}</a>`).join(''))
  .replace('{{PANELS}}', panels);
const indexProject = project => `<li id="${project.id}">${previewPicture(project.id, '(max-width: 899px) 100vw, 380px')}<h3>${e(project.title)}</h3><span class="classification">${e(project.label)}</span><p>${e(project.needsContent ? 'Content needed' : project.summary)}</p>${project.needsContent ? '' : `<a href="${e(projectHref(project))}" aria-label="Open ${e(project.title)}">Open ↗</a>`}${project.body.length ? `<details><summary>Context</summary>${project.body.map(fact => `<p>${e(fact)}</p>`).join('')}</details>` : ''}</li>`;
const all = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>All destinations — Ethan Lam</title><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/projects/destinations.css"><link rel="stylesheet" href="/eportfolio/site.css"></head><body class="eportfolio-page"><header class="eportfolio-header"><a class="brand" href="/">Ethan Lam</a>${portfolioNav('projects')}</header><main><h1>All destinations</h1><p>Projects, research and the material still to come.</p>${categories.map(category => `<section><h2>${e(category.name)}</h2><ul>${categoryProjects(category.id).map(indexProject).join('')}</ul></section>`).join('')}</main></body></html>\n`;
const source = wirePreviews(readFileSync(new URL('../projects/index.html', import.meta.url), 'utf8'));
function wirePreviews(html) {
  const names = [['renderer', /pipeline-5\.png|graphics\/renderer-/], ['thermal', /shader-cover|graphics\/thermal-/], ['vol', /realized-vol-equity|graphics\/volatility-/], ['chess', /chess-preview|graphics\/chess-/], ['strategy', /strategy-preview|graphics\/strategy-/]];
  html = html.replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/g, picture => {
    const id = names.find(([, pattern]) => pattern.test(picture))?.[0];
    return id ? previewPicture(id, '(max-width: 899px) 100vw, 54vw', picture.includes('gameMini') ? 'gameMini' : '') : picture;
  }).replace(/<img[^>]*src="\/assets\/(chess|strategy)-preview\.svg"[^>]*>/g, (_, id) => previewPicture(id, '(max-width: 899px) 100vw, 320px', 'gameMini'));
  html = html.replace(/<template id="tpl-(renderer|thermal|vol|lab-chess|lab-strategy)">([\s\S]*?)<\/template>/g, (whole, slug, body) => {
    const id = slug.replace('lab-', '');
    body = body.replace(/<figure class="preview-hero"[\s\S]*?<\/figure>/g, '');
    if (id === 'vol') body = body.replace(/<figure class="plate plate--paper csMedia"[\s\S]*?<\/figure>/, '');
    body = body.replace(/^[ \t]+$/gm, '');
    return `<template id="tpl-${slug}">${body.replace(/<\/header>/, `</header><figure class="preview-hero">${previewPicture(id)}</figure>`)}</template>`;
  });
  html = html.replace(/content="https:\/\/ethan-lam.com\/og-image.png"/, 'content="https://ethan-lam.com/assets/graphics/renderer-1600.webp"');
  if (!html.includes('property="og:image:alt"')) html = html.replace(/<meta name="twitter:card"/, '<meta property="og:image:width" content="1600"><meta property="og:image:height" content="1000"><meta property="og:image:alt" content="Code-generated shaded icosahedron from the Canvas renderer."><meta name="twitter:image" content="https://ethan-lam.com/assets/graphics/renderer-1600.webp">\n  <meta name="twitter:card"');
  if (!html.includes('/eportfolio/scroll.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/eportfolio/scroll.css"><script type="module" src="/eportfolio/scroll.js"></script>\n</head>');
  html = html.replace(/<!-- project-gallery:start -->[\s\S]*?<!-- project-gallery:end -->/, '');
  html = html.replace(/(<h2 id="workTitle"[\s\S]*?<\/header>)/, `$1<!-- project-gallery:start -->${projectGallery()}<!-- project-gallery:end -->`);
  html = html.replace(/<dl class="toolbox" id="skills">[\s\S]*?<\/dl>|<section class="portfolio-marquee"[\s\S]*?<\/section>/, skillsMarquee());
  return html;
}
const pipeline = source.match(/<section class="pipeline"[\s\S]*?<\/section>/)[0].replaceAll('pipelineTitle', 'detailPipelineTitle');
const direct = source.replace(/<!-- renderer-pipeline:start -->[\s\S]*?<!-- renderer-pipeline:end -->/, `<!-- renderer-pipeline:start -->\n    ${pipeline}\n    <!-- renderer-pipeline:end -->`).replace(/<!-- destinations:start -->[\s\S]*?<!-- destinations:end -->/, `<!-- destinations:start -->\n<section class="all-destinations" id="destinations" aria-labelledby="destinationsTitle"><h2 id="destinationsTitle">All destinations</h2><div class="destination-index">${destinationIndex()}</div></section>\n    <!-- destinations:end -->`);
const sharedNav = (html, current) => html.replace(/<!-- eportfolio-nav:start -->[\s\S]*?<!-- eportfolio-nav:end -->/, `<!-- eportfolio-nav:start -->${portfolioNav(current)}<!-- eportfolio-nav:end -->`);
const portfolio = sharedNav(direct, 'projects').replace(/<!-- welcome:start -->[\s\S]*?<!-- welcome:end -->/, `<!-- welcome:start -->${welcomeBlock}<!-- welcome:end -->`).replace(/<!-- about-teaser:start -->[\s\S]*?<!-- about-teaser:end -->/, `<!-- about-teaser:start --><p>${e(about[0])}</p><a class="text-link" href="/about/">Read more</a><!-- about-teaser:end -->`).replace(/<!-- skills:start -->[\s\S]*?<!-- skills:end -->/, `<!-- skills:start -->${Object.entries(skills).map(([title,text]) => `<div><dt class="mono">${title}</dt><dd>${e(text)}</dd></div>`).join('')}<!-- skills:end -->`);
export const generatedPages = {
  ...portfolioPages,
  'index.html': sharedNav(portfolio, 'home').replaceAll('https://ethan-lam.com/projects/', 'https://ethan-lam.com/'),
  'explore/index.html': sharedNav(home, 'explore'),
  'projects/destinations.html': all.replace('</head>', '<link rel="stylesheet" href="/eportfolio/scroll.css"></head>'),
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
