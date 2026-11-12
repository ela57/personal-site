import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { about, aboutHeading, career, welcome, skills, awards } from '../../content/eportfolio.js';
import { projects } from '../../content/projects.js';
import { escape, portfolioNav } from '../../eportfolio/pages.js';

export const selection = ['renderer', 'thermal', 'vol', 'strategy', 'chess', 'poker'].map(id => projects.find(project => project.id === id));
const image = project => project.assets.find(asset => /\.(webp|png|svg)$/.test(asset));
const href = project => project.links[0]?.href.startsWith('#') ? `/${project.links[0].href}` : project.links[0]?.href || `/projects/destinations.html#${project.id}`;
const media = project => image(project) ? `<img src="/${image(project)}" alt="${escape(project.title)} — ${escape(project.label)}" width="960" height="600" loading="lazy">` : `<div class="text-art"><p>${escape(project.body[0])}</p></div>`;
const label = (id, text, inspiration) => `<p class="feature-label adaptive">${id} · ${text} — inspired by ${inspiration}</p>`;
const heading = (id, title) => `<h2 class="adaptive" id="${id}-title">${title}</h2>`;
const card = project => `<article class="project-card">${media(project)}<div class="card-copy"><p class="classification">${escape(project.label)}</p><h3><a href="${href(project)}">${escape(project.title)} <span aria-hidden="true">↗</span></a></h3><p>${escape(project.summary)}</p></div></article>`;
const ink = about[0].slice(about[0].indexOf('What draws'));
const lines = text => {
  const words = text.split(' ');
  return Array.from({ length: Math.ceil(words.length / 6) }, (_, index) => `<span class="line-mask"><span class="rise-line">${escape(words.slice(index * 6, index * 6 + 6).join(' '))}</span></span>`).join(' ');
};

export function renderScrollPage() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#13201b"><title>Scroll experiments — Ethan Lam</title><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/eportfolio/site.css"><link rel="stylesheet" href="./scroll.css"><script type="module" src="./scroll.js"></script></head>
<body class="eportfolio-page scroll-experiments"><a class="skip" href="#main">Skip to content</a><div class="palette" aria-hidden="true"><div></div><div></div><div></div><div></div></div>
<header class="eportfolio-header"><a class="brand" href="/">Ethan Lam</a>${portfolioNav('experiments')}</header>
<nav class="feature-rail" aria-label="Scroll experiments">${Array.from({ length: 7 }, (_, index) => `<a href="#F0${index + 1}">F0${index + 1}</a>`).join('')}</nav>
<main id="main"><div class="intro"><p class="eyebrow adaptive">Experimental / scroll studies</p><h1 class="adaptive">Scroll experiments — pick the ones you like by number.</h1><p class="intro-copy adaptive">${escape(welcome)}</p><a class="start-link adaptive" href="#F01">F01 <span aria-hidden="true">↓</span></a></div>
<section class="experiment ink-section" id="F01" data-palette="0" aria-labelledby="F01-title"><div class="sticky-scene"><div class="section-inner">${label('F01', 'Ink reveal', 'ViV/DeepBook')}${heading('F01', 'About')}<p class="ink-copy adaptive">${escape(ink)}</p></div></div></section>
<section class="experiment rise-section" id="F02" data-palette="1" aria-labelledby="F02-title"><div class="section-inner">${label('F02', 'Masked line rise', 'DeepBook')}${heading('F02', 'Projects')}<h3 class="rise-heading adaptive">${lines(aboutHeading)}</h3><div class="rise-grid">${selection.slice(0, 3).map(project => `<div><h3 class="rise-heading adaptive">${lines(project.title)}</h3><p class="adaptive">${escape(project.summary)}</p></div>`).join('')}</div></div></section>
<section class="experiment palette-section" id="F03" data-palette="2" aria-labelledby="F03-title"><div class="section-inner">${label('F03', 'Chapter palette', 'Extrafazant')}${heading('F03', 'Skills')}<p class="palette-statement adaptive">${escape(career.goal)}</p><dl class="skills adaptive">${Object.entries(skills).map(([title, text]) => `<div><dt>${title}</dt><dd>${escape(text)}</dd></div>`).join('')}</dl><ul class="awards adaptive">${awards.slice(0, 3).map(award => `<li>${escape(award)}</li>`).join('')}</ul></div></section>
<section class="experiment horizontal-section" id="F04" data-palette="3" aria-labelledby="F04-title"><div class="horizontal-pin"><div class="section-inner">${label('F04', 'Pinned horizontal gallery', 'Lando Norris')}${heading('F04', 'Projects')}</div><div class="gallery-window"><div class="gallery-track">${selection.map(card).join('')}</div></div></div></section>
<section class="experiment stack-section" id="F05" data-palette="1" aria-labelledby="F05-title"><div class="section-inner">${label('F05', 'Sticky card stack', 'CRL’s layered composition')}${heading('F05', "How I'll get there")}<ol class="career-stack">${career.steps.map(([title, text], index) => `<li class="career-card" style="--index:${index}"><span class="step-number">0${index + 1}</span><h3>${escape(title)}</h3><p>${escape(text)}</p></li>`).join('')}</ol></div></section>
<section class="experiment preview-section" id="F06" data-palette="2" aria-labelledby="F06-title"><div class="section-inner">${label('F06', 'Cursor-follow preview index', 'Signal-A Studio')}${heading('F06', 'Projects')}<ul class="preview-index">${selection.map(project => `<li><a class="preview-link" href="${href(project)}"${image(project) ? ` data-preview="/${image(project)}"` : ''}><span class="preview-title adaptive">${escape(project.title)}</span><span class="inline-preview">${media(project)}</span><span class="preview-summary adaptive">${escape(project.summary)}</span></a></li>`).join('')}</ul></div></section>
<section class="experiment expansion-section" id="F07" data-palette="3" aria-labelledby="F07-title"><div class="section-inner">${label('F07', 'Clip-path expansion', 'Brandon Yasin’s image transitions')}${heading('F07', escape(selection[0].title))}</div><figure class="expansion-pin"><div class="expand-mask"><img src="/assets/pipeline-5.png" alt="${escape(selection[0].title)} — ${escape(selection[0].label)}" width="960" height="600" loading="lazy"></div><figcaption>${escape(selection[0].summary)}</figcaption></figure></section>
</main><div class="cursor-preview" aria-hidden="true"><img alt="" width="480" height="300"></div><footer class="experiment-footer"><a class="adaptive" href="/projects/">Projects <span aria-hidden="true">↗</span></a><a class="adaptive" href="/projects/#contact">Contact</a></footer></body></html>
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) writeFileSync(new URL('./index.html', import.meta.url), renderScrollPage());
