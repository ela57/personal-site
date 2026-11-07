export const revealInterval = count => Math.min(35, 580 / Math.max(1, count - 1));

export function mountWords(root = document) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const toggles = []; let paused = false;
  const button = root.querySelector('#wordMotion');
  if (button) {
    button.hidden = false;
    button.addEventListener('click', () => {
      paused = !paused; button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? 'Resume word effects' : 'Pause word effects';
      toggles.forEach(toggle => toggle());
    });
  }
  root.querySelectorAll('[data-cycle]').forEach(group => {
    const words = [...group.children];
    if (!words.length) return;
    const letters = words.map(word => {
      const chars = Array.from(word.textContent, char => {
        const span = document.createElement('span'); span.className = 'wordChar'; span.textContent = char; return span;
      });
      word.replaceChildren(...chars); return chars;
    });
    let index = 0, timer = 0, visible = false, next = null, remaining = 2600, due = 0;
    function resume() {
      if (timer || !next || !visible || document.hidden || reduced.matches || paused) return;
      due = performance.now() + remaining;
      timer = setTimeout(() => { timer = 0; next(); }, remaining);
    }
    function pause() { clearTimeout(timer); if (timer) remaining = Math.max(0, due - performance.now()); timer = 0; }
    function schedule(fn, delay) { next = fn; remaining = delay; resume(); }
    function enter() {
      words[index].classList.add('is-active');
      const chars = letters[index]; chars.forEach(c => c.style.opacity = '0'); let i = 0;
      const step = () => { if (chars[i]) chars[i++].style.opacity = '1'; if (i < chars.length) schedule(step, 40); else schedule(leave, 2720); };
      schedule(step, 40);
    }
    function leave() {
      const order = [...letters[index]];
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      let i = 0;
      const step = () => {
        if (order[i]) order[i++].style.opacity = '0';
        if (i < order.length) schedule(step, 40);
        else schedule(() => { words[index].classList.remove('is-active'); index = (index + 1) % words.length; enter(); }, 370);
      };
      step();
    }
    function preference() {
      pause(); index = 0;
      words.forEach((word, i) => word.classList.toggle('is-active', i === 0));
      letters.flat().forEach(c => c.style.opacity = '1');
      schedule(leave, 2600);
    }
    const visibility = () => document.hidden ? pause() : resume();
    toggles.push(() => paused ? pause() : resume());
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? resume() : pause(); });
    observer.observe(group);
    document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', preference);
    preference();
    cleanups.push(() => { pause(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', preference); });
  });
  const headings = root.querySelectorAll('main h2, main .projTitle');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-revealed'); observer.unobserve(entry.target);
  }), { threshold: .12 });
  headings.forEach(heading => {
    const original = heading.textContent;
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT, { acceptNode: node => node.parentElement.closest('[data-cycle],.sr-only') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    const count = nodes.reduce((sum, node) => sum + Array.from(node.textContent).length, 0); let index = 0;
    nodes.forEach(node => {
      const wrapper = document.createElement('span'); wrapper.setAttribute('aria-hidden', 'true');
      for (const char of node.textContent) {
        const span = document.createElement('span'); span.className = 'revealChar'; span.textContent = char;
        span.style.transitionDelay = `${index++ * revealInterval(count)}ms`; wrapper.append(span);
      }
      node.replaceWith(wrapper);
    });
    if (!heading.querySelector('.sr-only')) {
      const stable = document.createElement('span'); stable.className = 'sr-only'; stable.textContent = original; heading.append(stable);
    }
    heading.classList.add('reveal-ready'); observer.observe(heading);
  });
  function preference() { if (reduced.matches) headings.forEach(h => h.classList.add('is-revealed')); }
  preference(); reduced.addEventListener('change', preference);
  const cleanup = event => {
    if (event.persisted) return;
    cleanups.forEach(fn => fn()); observer.disconnect(); reduced.removeEventListener('change', preference); removeEventListener('pagehide', cleanup);
  };
  addEventListener('pagehide', cleanup);
}
