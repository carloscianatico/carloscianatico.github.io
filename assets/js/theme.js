class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'site-theme';
    this.LIGHT = 'light-mode';
    this.init();
  }

  init() {
    this.applyStoredTheme();
    this.setupThemeToggle();
    this.setupHamburgerMenu();
    this.setupSearch();
    this.setupProjectCards();
  }

  /* ---- THEME ---- */

  setIcon(isLight) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  }

  applyStoredTheme() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    let isLight = false;
    if (saved === 'light') {
      isLight = true;
    } else if (!saved) {
      isLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    }
    document.body.classList.toggle(this.LIGHT, isLight);
    // setIcon viene chiamato dopo il DOM ready, ma il body class è già applicato
    this.setIcon(isLight);
  }

  setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle(this.LIGHT);
      localStorage.setItem(this.STORAGE_KEY, isLight ? 'light' : 'dark');
      this.setIcon(isLight);
    });
  }

  /* ---- HAMBURGER + DROPDOWN ---- */

  positionDropdown() {
    const header = document.querySelector('.site-header-shell');
    const dropdown = document.getElementById('nav-dropdown');
    if (!header || !dropdown) return;
    dropdown.style.top = header.getBoundingClientRect().bottom + 'px';
  }

  setupHamburgerMenu() {
    const btn      = document.getElementById('hamburger-btn');
    const dropdown = document.getElementById('nav-dropdown');
    const overlay  = document.getElementById('nav-overlay');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', () => {
      this.positionDropdown();
      const isOpen = dropdown.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      dropdown.setAttribute('aria-hidden', String(!isOpen));
      if (overlay) overlay.classList.toggle('open', isOpen);
    });

    if (overlay) overlay.addEventListener('click', () => this.closeMenu());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeMenu();
    });

    dropdown.querySelectorAll('.nav-dropdown-link').forEach(link => {
      link.addEventListener('click', () => this.closeMenu());
    });

    // Aggiorna posizione dropdown allo scroll (l'header è sticky)
    window.addEventListener('scroll', () => {
      if (dropdown.classList.contains('open')) this.positionDropdown();
    }, { passive: true });
  }

  closeMenu() {
    const btn      = document.getElementById('hamburger-btn');
    const dropdown = document.getElementById('nav-dropdown');
    const overlay  = document.getElementById('nav-overlay');
    if (!dropdown) return;
    dropdown.classList.remove('open');
    dropdown.setAttribute('aria-hidden', 'true');
    if (btn) { btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
    if (overlay) overlay.classList.remove('open');
  }

  /* ---- SEARCH ---- */

  setupSearch() {
    const input = document.getElementById('nav-search-input');
    if (!input) return;
    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.nav-dropdown-link').forEach(link => {
        link.style.display = link.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ---- PROJECT CARDS ---- */

  setupProjectCards() {
    let openCard = null;
    document.querySelectorAll('.project-card').forEach(card => {
      const toggle = card.querySelector('.project-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (openCard && openCard !== card) {
          openCard.classList.remove('expanded');
          const pt = openCard.querySelector('.project-toggle');
          if (pt) pt.classList.remove('open');
        }
        const isExpanded = card.classList.toggle('expanded');
        toggle.classList.toggle('open', isExpanded);
        if (isExpanded) {
          const bar = card.querySelector('.project-progress-bar');
          if (bar) setTimeout(() => { bar.style.width = (card.dataset.progress || 50) + '%'; }, 100);
        }
        openCard = isExpanded ? card : null;
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => { new ThemeManager(); });
