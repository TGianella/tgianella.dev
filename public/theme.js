function applyStoredTheme() {
  try {
    const theme = localStorage.getItem("theme");
    const expiry = localStorage.getItem("theme-expiry");
    if (theme && expiry && Date.now() < Number(expiry)) {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      localStorage.removeItem("theme");
      localStorage.removeItem("theme-expiry");
      document.documentElement.removeAttribute("data-theme");
    }
  } catch {
    // localStorage unavailable in some privacy modes; safe to ignore
  }
}
applyStoredTheme();
document.addEventListener("astro:after-swap", applyStoredTheme);
