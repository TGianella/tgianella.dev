function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|fr)/, '') || '/';
}

function getPageWeight(pathname: string): number {
  const p = stripLocale(pathname);
  if (p === '/') return 0;
  if (p === '/blog')    return 10;
  if (p === '/talks')   return 20;
  if (p === '/gallery') return 30;
  if (p.startsWith('/blog/'))    return 15;
  if (p.startsWith('/talks/'))   return 25;
  if (p.startsWith('/gallery/')) return 35;
  return -1;
}

let savedScroll: number | null = null;
let pendingLangSwitch = false;

function setVtNames(active: boolean) {
  document.querySelectorAll<HTMLElement>('[data-vt-name]').forEach(el => {
    el.style.viewTransitionName = active ? el.dataset.vtName! : '';
  });
}

document.addEventListener('astro:before-preparation', (e) => {
  const event = e as Event & { from: URL; to: URL; direction: string };
  const fromPath = stripLocale(event.from.pathname);
  const toPath   = stripLocale(event.to.pathname);
  pendingLangSwitch = fromPath === toPath && event.from.pathname !== event.to.pathname;

  if (pendingLangSwitch) {
    savedScroll = window.scrollY;
    event.direction = 'none';
    setVtNames(true); // old-state snapshot: named elements animate individually
  } else {
    setVtNames(false); // clear any names left from a previous lang switch
    const fromW = getPageWeight(event.from.pathname);
    const toW   = getPageWeight(event.to.pathname);
    if (fromW !== -1 && toW !== -1 && fromW !== toW) {
      event.direction = toW > fromW ? 'forward' : 'back';
    } else {
      event.direction = 'none';
    }
  }
});

document.addEventListener('astro:after-swap', () => {
  if (pendingLangSwitch) {
    setVtNames(true); // new-state snapshot: activate names in swapped-in DOM
  }
  if (savedScroll !== null) {
    window.scrollTo({ top: savedScroll, behavior: 'instant' });
    savedScroll = null;
  }
});

document.addEventListener('astro:page-load', () => {
  setVtNames(false);
  pendingLangSwitch = false;
});
