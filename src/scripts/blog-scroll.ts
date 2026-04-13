import { registerScrollStrategy } from "./scroll-preservation";

registerScrollStrategy({
  condition: (fromPath) => fromPath.startsWith("/blog/"),
  save: () => {
    const navHeight =
      document.querySelector<HTMLElement>(".nav")?.offsetHeight ?? 0;
    const prose = document.querySelector(".prose");
    // If the prose top is still below the nav, the user is in the header — fall through to default
    if (!prose || prose.getBoundingClientRect().top >= navHeight) return null;

    const children = [...prose.children] as HTMLElement[];
    const index = children.findIndex(
      (el) => el.getBoundingClientRect().bottom > navHeight,
    );
    if (index === -1) return null;

    return () => {
      const cs = [
        ...(document.querySelector(".prose")?.children ?? []),
      ] as HTMLElement[];
      const el = cs[Math.min(index, cs.length - 1)];
      if (!el) return;
      const nav = document.querySelector<HTMLElement>(".nav");
      window.scrollTo({
        top: el.offsetTop - (nav?.offsetHeight ?? 0),
        behavior: "instant",
      });
    };
  },
});
