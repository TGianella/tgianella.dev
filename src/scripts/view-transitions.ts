function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|fr)/, '') || '/';
}

function getPageWeight(pathname: string): number {
  const p = stripLocale(pathname);
  if (p === '/') return 0;
  if (p === '/blog')    return 10;
  if (p === '/talks')   return 20;
  if (p === '/blue-screens') return 30;
  if (p.startsWith('/blog/'))    return 15;
  if (p.startsWith('/talks/'))   return 25;
  if (p.startsWith('/blue-screens/')) return 35;
  return -1;
}

function resolveDirection(from: URL, to: URL): string {
  const fromPath = stripLocale(from.pathname);
  const toPath   = stripLocale(to.pathname);

  if (fromPath.startsWith('/blue-screens/') && toPath.startsWith('/blue-screens/') && fromPath !== toPath) {
    const prevHref = document.querySelector<HTMLAnchorElement>('.photo-arrow--prev')?.pathname;
    const nextHref = document.querySelector<HTMLAnchorElement>('.photo-arrow--next')?.pathname;
    if (to.pathname === nextHref)      return 'forward';
    if (to.pathname === prevHref)      return 'back';
    return 'none';
  }

  const fromW = getPageWeight(from.pathname);
  const toW   = getPageWeight(to.pathname);
  if (fromW !== -1 && toW !== -1 && fromW !== toW) {
    return toW > fromW ? 'forward' : 'back';
  }
  return 'none';
}

let pendingLangSwitch = false;

function setVtNames(active: boolean) {
  document.querySelectorAll<HTMLElement>('[data-vt-name]').forEach(el => {
    el.style.viewTransitionName = active ? el.dataset.vtName! : '';
  });
}

document.addEventListener('astro:before-swap', () => {
  document.documentElement.setAttribute('data-vt-swapping', '');
});

document.addEventListener('astro:page-load', () => {
  document.documentElement.removeAttribute('data-vt-swapping');
});

document.addEventListener('astro:before-preparation', (e) => {
  const event = e as Event & { from: URL; to: URL; direction: string };
  const fromPath = stripLocale(event.from.pathname);
  const toPath   = stripLocale(event.to.pathname);
  pendingLangSwitch = fromPath === toPath && event.from.pathname !== event.to.pathname;
  console.log("###", {pendingLangSwitch, fromPath, toPath, event});

  if (pendingLangSwitch) {
    event.direction = 'none';
    setVtNames(true); // old-state snapshot: named elements animate individually
  } else {
    setVtNames(false); // clear any names left from a previous lang switch
    event.direction = resolveDirection(event.from, event.to);
  }
});

document.addEventListener('astro:after-swap', () => {
  if (pendingLangSwitch) {
    setVtNames(true); // new-state snapshot: activate names in swapped-in DOM
  }
});

document.addEventListener('astro:page-load', () => {
  setVtNames(false);
  pendingLangSwitch = false;
});
