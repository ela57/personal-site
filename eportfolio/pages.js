import { about, aboutHeading, career, awards } from '../content/eportfolio.js';
import { careerTimeline } from './features.js';

export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function portfolioNav(current) {
  return `<nav class="eportfolio-nav" aria-label="ePortfolio">${[['home','Home','/'],['about','About','/about/'],['resume','Résumé','/resume/'],['career','Career Goals','/career/'],['projects','Projects','/projects/#projects'],['contact','Contact','/projects/#contact']].map(([id,title,href]) => `<a href="${href}"${current === id ? ' aria-current="page"' : ''}>${title}</a>`).join('')}</nav>`;
}

const page = (id, title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#13201b"><title>${title} — Ethan Lam</title><link rel="icon" href="/favicon.png"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/eportfolio/site.css">${id === 'resume' ? '' : '<link rel="stylesheet" href="/eportfolio/scroll.css"><script type="module" src="/eportfolio/scroll.js"></script>'}</head>
<body class="eportfolio-page eportfolio-${id}"><a class="skip" href="#main">Skip to content</a><header class="eportfolio-header"><a class="brand" href="/">Ethan Lam</a>${portfolioNav(id)}</header><main id="main" class="eportfolio-reading"><p class="eyebrow">${title}</p>${body}</main><footer class="eportfolio-footer"><a href="/projects/#contact">Contact Ethan</a></footer></body></html>
`;

export const portfolioPages = {
  'about/index.html': page('about', 'About', `<h1>${escape(aboutHeading)}</h1>${about.map((p,i) => `<p${i === 0 ? ' data-scroll-ink' : ''}${i === 3 ? ' id="chess-buddies"' : ''}>${escape(p)}</p>`).join('')}<section id="awards" aria-labelledby="awards-title"><h2 id="awards-title">Achievements &amp; Awards</h2><ul class="award-list">${awards.map(award => `<li>${escape(award)}</li>`).join('')}</ul></section><a class="text-link" href="/resume/">View résumé</a>`),
  'career/index.html': page('career', 'Career Goals', `<h1>Career Goals</h1><p class="lead">${escape(career.intro)}</p><section><h2>Long-term goal</h2><p>${escape(career.goal)}</p></section><section><h2>Where I am now</h2><p>${escape(career.now)}</p></section>${careerTimeline()}<section><h2>How I'll get there</h2><ol class="career-steps" data-scroll-stack>${career.steps.map(([title,text], i) => `<li style="--index:${i}"><h3>${escape(title)}</h3><p>${escape(text)}</p></li>`).join('')}</ol></section><p class="closing">${escape(career.closing)}</p>`),
  'resume/index.html': page('resume', 'Résumé', `<h1>Résumé</h1><div class="pdf-actions"><a class="pdf-button" href="/assets/Lam_Ethan_Resume.pdf" download="Lam_Ethan_Resume.pdf">Download PDF</a><a class="pdf-button secondary" href="/assets/Lam_Ethan_Resume.pdf" target="_blank" rel="noopener noreferrer">Open in new tab</a></div><p class="pdf-fallback">If the embedded PDF is unavailable on your device, <a class="text-link" href="/assets/Lam_Ethan_Resume.pdf">open the résumé PDF</a> or use Download PDF above.</p><object class="resume-pdf" data="/assets/Lam_Ethan_Resume.pdf#view=FitH&amp;pagemode=none" type="application/pdf" aria-label="Ethan Lam résumé"><p><a class="text-link" href="/assets/Lam_Ethan_Resume.pdf">Open Ethan Lam's résumé PDF</a>.</p></object>`)
};
