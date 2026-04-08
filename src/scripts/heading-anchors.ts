const LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="0.75em" height="0.75em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

document.addEventListener('astro:page-load', () => {
  const article = document.querySelector<HTMLElement>('article[data-copy-link]');
  const TOOLTIP_DEFAULT = article?.dataset.copyLink ?? 'Copy link to section';
  const TOOLTIP_COPIED  = article?.dataset.linkCopied ?? 'Copied!';

  document.querySelectorAll<HTMLHeadingElement>('.prose h2[id], .prose h3[id], .prose h4[id]').forEach(heading => {
    const btn = document.createElement('button');
    btn.className = 'heading-anchor';
    btn.setAttribute('aria-label', TOOLTIP_DEFAULT);
    btn.dataset.tooltip = TOOLTIP_DEFAULT;
    btn.innerHTML = LINK_ICON;

    btn.addEventListener('click', () => {
      const url = `${location.origin}${location.pathname}#${heading.id}`;
      navigator.clipboard.writeText(url).then(() => {
        btn.setAttribute('aria-label', TOOLTIP_COPIED);
        btn.dataset.tooltip = TOOLTIP_COPIED;
        btn.dataset.copied = 'true';
        setTimeout(() => {
          btn.setAttribute('aria-label', TOOLTIP_DEFAULT);
          btn.dataset.tooltip = TOOLTIP_DEFAULT;
          delete btn.dataset.copied;
        }, 2000);
      });
    });

    heading.appendChild(btn);
  });
});
