/* ==========================================================================
   Retoucherie Mer Égée — interactions
   Aucune dépendance, aucun suivi, aucun cookie.
   ========================================================================== */
(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const nav = document.getElementById("nav");
  const menuOpen = document.querySelector("[data-menu-open]");
  const menuClose = document.querySelector("[data-menu-close]");
  const mobileQuery = window.matchMedia("(max-width: 980px)");
  let lastFocused = null;

  /* ------------------------------------------------------------------------
     En-tête : fond au défilement
     ------------------------------------------------------------------------ */
  const onScroll = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------------
     Menu mobile
     ------------------------------------------------------------------------ */
  const setMenu = (open) => {
    if (!nav || !menuOpen) return;
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    menuOpen.setAttribute("aria-expanded", String(open));
    menuOpen.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");

    if (open) {
      lastFocused = document.activeElement;
      if (menuClose) {
        window.setTimeout(() => menuClose.focus(), 60);
      }
    } else if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
      lastFocused = null;
    }
  };

  if (menuOpen) {
    menuOpen.addEventListener("click", () => {
      setMenu(menuOpen.getAttribute("aria-expanded") !== "true");
    });
  }

  if (menuClose) {
    menuClose.addEventListener("click", () => setMenu(false));
  }

  if (nav) {
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    nav.addEventListener("keydown", (event) => {
      if (event.key !== "Tab" || !nav.classList.contains("is-open")) return;
      const focusables = Array.from(
        nav.querySelectorAll('a[href], button:not([disabled])')
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav && nav.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  const handleMobileChange = (event) => {
    if (!event.matches) setMenu(false);
  };
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", handleMobileChange);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(handleMobileChange);
  }

  /* ------------------------------------------------------------------------
     Barre d'actions mobile : apparaît après le hero
     ------------------------------------------------------------------------ */
  const mobileBar = document.querySelector(".mobile-bar");
  const heroSection = document.querySelector(".hero");

  const updateMobileBar = () => {
    if (!mobileBar) return;
    const threshold = Math.max(
      480,
      heroSection ? heroSection.offsetTop + heroSection.offsetHeight - 140 : 600
    );
    mobileBar.classList.toggle("is-visible", window.scrollY > threshold);
  };

  updateMobileBar();
  window.addEventListener("scroll", updateMobileBar, { passive: true });
  window.addEventListener("resize", updateMobileBar);

  /* ------------------------------------------------------------------------
     Apparition douce des blocs
     ------------------------------------------------------------------------ */
  const revealItems = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------------
     Navigation : section active
     ------------------------------------------------------------------------ */
  const navLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const navSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    const setCurrent = (id) => {
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${id}`) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setCurrent(entry.target.id);
        });
      },
      { rootMargin: "-38% 0px -52% 0px", threshold: 0 }
    );
    navSections.forEach((section) => spy.observe(section));
  }

  /* ------------------------------------------------------------------------
     Statut d'ouverture (heure de Paris) et jour courant
     ------------------------------------------------------------------------ */
  const status = document.querySelector("[data-status]");
  const statusText = document.querySelector("[data-status-text]");
  const hourRows = document.querySelectorAll(".hours tr[data-day]");

  const dayNumbers = {
    "lun.": 1,
    "mar.": 2,
    "mer.": 3,
    "jeu.": 4,
    "ven.": 5,
    "sam.": 6,
    "dim.": 0,
  };

  const parisClock = () => {
    try {
      const formatter = new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Europe/Paris",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      const parts = formatter.formatToParts(new Date());
      const read = (type) => {
        const part = parts.find((item) => item.type === type);
        return part ? part.value : "";
      };
      const dayLabel = read("weekday").toLowerCase();
      const day = Object.prototype.hasOwnProperty.call(dayNumbers, dayLabel)
        ? dayNumbers[dayLabel]
        : new Date().getDay();
      const hours = parseInt(read("hour"), 10) || 0;
      const minutes = parseInt(read("minute"), 10) || 0;
      return { day, minutes: hours * 60 + minutes };
    } catch (error) {
      const now = new Date();
      return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
    }
  };

  const updateStatus = () => {
    if (!status || !statusText) return;
    const { day, minutes } = parisClock();
    let label = "";
    let isOpen = false;

    if (day === 0) {
      label = "Fermé · ouvre lundi à 10h";
    } else if (minutes < 10 * 60) {
      label = "Fermé · ouvre à 10h";
    } else if (minutes < 13 * 60) {
      label = "Ouvert · jusqu’à 13h";
      isOpen = true;
    } else if (minutes < 15 * 60 + 30) {
      label = "Fermé · ouvre à 15h30";
    } else if (minutes < 19 * 60) {
      label = "Ouvert · jusqu’à 19h";
      isOpen = true;
    } else if (day === 6) {
      label = "Fermé · ouvre lundi à 10h";
    } else {
      label = "Fermé · ouvre demain à 10h";
    }

    status.dataset.open = isOpen ? "true" : "false";
    statusText.textContent = label;

    hourRows.forEach((row) => {
      row.classList.toggle("is-today", Number(row.dataset.day) === day);
    });
  };

  updateStatus();
  window.setInterval(updateStatus, 60 * 1000);

  /* ------------------------------------------------------------------------
     Carte Google Maps chargée au clic (aucun cookie avant)
     ------------------------------------------------------------------------ */
  const mapFrame = document.querySelector("[data-map-frame]");
  const mapButton = document.querySelector("[data-map-load]");
  const mapLabel = document.querySelector("[data-map-label]");
  const mapSource =
    "https://www.google.com/maps?q=Retoucherie%20Mer%20%C3%89g%C3%A9e%2C%2011%20rue%20Lac%C3%A9p%C3%A8de%2C%2075005%20Paris&z=17&hl=fr&output=embed";

  if (mapFrame && mapButton) {
    mapButton.addEventListener("click", () => {
      mapButton.disabled = true;
      mapButton.textContent = "Chargement…";

      const iframe = document.createElement("iframe");
      iframe.src = mapSource;
      iframe.title =
        "Carte Google Maps — Retoucherie Mer Égée, 11 rue Lacépède, 75005 Paris";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.allowFullscreen = true;
      iframe.tabIndex = 0;

      iframe.addEventListener("load", () => {
        if (mapLabel) mapLabel.textContent = "Carte Google Maps";
        iframe.focus({ preventScroll: true });
      });

      mapFrame.replaceChildren(iframe);
      mapButton.remove();
    });
  }

  /* ------------------------------------------------------------------------
     Une seule question ouverte à la fois (repli si name= n'est pas géré)
     ------------------------------------------------------------------------ */
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item && other.open) other.open = false;
      });
    });
  });

  /* ------------------------------------------------------------------------
     Année du pied de page
     ------------------------------------------------------------------------ */
  const year = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(year);
  });

  window.__merEgeeReady = true;
})();
