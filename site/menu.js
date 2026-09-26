document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const button = document.querySelector(".menu-toggle");
  const nav = document.getElementById("site-nav");

  if (!header || !button || !nav) return;

  const closeMenu = () => {
    button.setAttribute("aria-expanded", "false");
    button.querySelector(".visually-hidden").textContent = "Ouvrir le menu";
    nav.classList.remove("is-open");
  };

  button.addEventListener("click", () => {
    const willOpen = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(willOpen));
    button.querySelector(".visually-hidden").textContent = willOpen
      ? "Fermer le menu"
      : "Ouvrir le menu";
    nav.classList.toggle("is-open", willOpen);
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      button.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) closeMenu();
  });
});

