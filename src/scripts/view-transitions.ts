import { stripLocale, resolveDirection } from "./view-transition-utils";

let pendingLangSwitch = false;

function setVtNames(active: boolean) {
  document.querySelectorAll<HTMLElement>("[data-vt-name]").forEach((el) => {
    el.style.viewTransitionName = active ? el.dataset.vtName! : "";
  });
}

document.addEventListener("astro:before-swap", () => {
  document.documentElement.setAttribute("data-vt-swapping", "");
});

document.addEventListener("astro:page-load", () => {
  document.documentElement.removeAttribute("data-vt-swapping");
});

document.addEventListener("astro:before-preparation", (e) => {
  const event = e as Event & { from: URL; to: URL; direction: string };
  const fromPath = stripLocale(event.from.pathname);
  const toPath = stripLocale(event.to.pathname);
  pendingLangSwitch =
    fromPath === toPath && event.from.pathname !== event.to.pathname;

  if (pendingLangSwitch) {
    event.direction = "none";
    setVtNames(true); // old-state snapshot: named elements animate individually
  } else {
    setVtNames(false); // clear any names left from a previous lang switch
    const galleryNav = {
      prevHref: document.querySelector<HTMLAnchorElement>(".photo-arrow--prev")
        ?.pathname,
      nextHref: document.querySelector<HTMLAnchorElement>(".photo-arrow--next")
        ?.pathname,
    };
    event.direction = resolveDirection(event.from, event.to, galleryNav);
  }
});

document.addEventListener("astro:after-swap", () => {
  if (pendingLangSwitch) {
    setVtNames(true); // new-state snapshot: activate names in swapped-in DOM
  }
});

document.addEventListener("astro:page-load", () => {
  setVtNames(false);
  pendingLangSwitch = false;
});
