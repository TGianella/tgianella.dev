document.addEventListener("astro:page-load", () => {
  const tocLinks = [
    ...document.querySelectorAll<HTMLAnchorElement>(".toc__link"),
  ];
  if (!tocLinks.length) return;

  const headings = tocLinks
    .map((link) => document.getElementById(link.getAttribute("href")!.slice(1)))
    .filter((el): el is HTMLElement => el !== null);

  const navEl = document.querySelector<HTMLElement>(".nav");

  const onScroll = () => {
    const offset = (navEl?.offsetHeight ?? 0) + 32;
    const scrollY = window.scrollY + offset;

    let activeIdx = 0;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].offsetTop <= scrollY) {
        activeIdx = i;
      }
    }

    tocLinks.forEach((link, i) => {
      link.classList.toggle("toc__link--active", i === activeIdx);
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.addEventListener(
    "astro:before-swap",
    () => window.removeEventListener("scroll", onScroll),
    { once: true },
  );
});
