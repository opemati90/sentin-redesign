const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

function closeMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Menü öffnen");
  mobileMenu.hidden = true;
  document.body.classList.remove("menu-open");
}

function openMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.setAttribute("aria-expanded", "true");
  menuButton.setAttribute("aria-label", "Menü schließen");
  mobileMenu.hidden = false;
  document.body.classList.add("menu-open");
  mobileMenu.querySelector("a")?.focus();
}

menuButton?.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  expanded ? closeMenu() : openMenu();
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

const navGroups = [...document.querySelectorAll("[data-nav-group]")];

function closeNavGroups(exception = null) {
  navGroups.forEach((group) => {
    if (group === exception) return;
    group.dataset.open = "false";
    group.querySelector("[data-nav-trigger]")?.setAttribute("aria-expanded", "false");
  });
}

navGroups.forEach((group) => {
  const trigger = group.querySelector("[data-nav-trigger]");
  const setGroupOpen = (isOpen) => {
    group.dataset.open = String(isOpen);
    trigger?.setAttribute("aria-expanded", String(isOpen));
  };

  trigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = trigger.getAttribute("aria-expanded") !== "true";
    closeNavGroups(group);
    setGroupOpen(willOpen);
  });

  if (window.matchMedia("(hover: hover)").matches) {
    group.addEventListener("pointerenter", () => {
      closeNavGroups(group);
      group.dataset.open = "true";
    });
    group.addEventListener("pointerleave", () => setGroupOpen(false));
  }

  group.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!group.contains(document.activeElement)) setGroupOpen(false);
    });
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-nav-group]")) return;
  closeNavGroups();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menuButton.focus();
  }

  if (event.key === "Escape") {
    const openGroup = navGroups.find((group) => group.dataset.open === "true");
    const trigger = openGroup?.querySelector("[data-nav-trigger]");
    closeNavGroups();
    trigger?.focus();
  }
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}

const filterButtons = document.querySelectorAll("[data-filter]");
const caseItems = document.querySelectorAll("[data-category]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });

    caseItems.forEach((item) => {
      const isVisible = selectedFilter === "all" || item.dataset.category === selectedFilter;
      item.hidden = !isVisible;
    });
  });
});

const demoForm = document.querySelector("[data-demo-form]");
const formStatus = document.querySelector("[data-form-status]");

demoForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!demoForm.reportValidity()) return;

  const submitButton = demoForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Wird geprüft...";
  formStatus.textContent = "";

  window.setTimeout(() => {
    submitButton.disabled = false;
    submitButton.textContent = "Gespräch vereinbaren";
    formStatus.textContent = "Prototyp validiert. Es wurden keine Daten gesendet.";
  }, 450);
});
