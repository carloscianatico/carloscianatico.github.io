class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'site-theme';
    this.LIGHT_MODE_CLASS = 'light-mode';
    this.init();
  }

  init() {
    this.applyStoredTheme();
    this.setupThemeToggle();
    this.setupHamburgerMenu();
    this.setupSidebarLinks();
    this.setupProjectCards();
    this.setupSearch();
  }

  getToggleButton() {
    return document.getElementById('theme-toggle');
  }

  setIcon(isLight) {
    const btn = this.getToggleButton();
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  }

  applyStoredTheme() {
    const theme = localStorage.getItem(this.STORAGE_KEY);
    if (theme === 'light') {
      document.body.classList.add(this.LIGHT_MODE_CLASS);
      this.setIcon(true);
    } else if (theme === 'dark') {
      document.body.classList.remove(this.LIGHT_MODE_CLASS);
      this.setIcon(false);
    } else {
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      if (prefersLight) {
        document.body.classList.add(this.LIGHT_MODE_CLASS);
        this.setIcon(true);
      } else {
        this.setIcon(false);
      }
    }
  }

  setupThemeToggle() {
    const btn = this.getToggleButton();
    if (!btn) return;
    btn.addEventListener('click', () => this.toggleTheme());
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  toggleTheme() {
    const isLight = document.body.classList.contains(this.LIGHT_MODE_CLASS);
    if (isLight) {
      document.body.classList.remove(this.LIGHT_MODE_CLASS);
      localStorage.setItem(this.STORAGE_KEY, 'dark');
      this.setIcon(false);
    } else {
      document.body.classList.add(this.LIGHT_MODE_CLASS);
      localStorage.setItem(this.STORAGE_KEY, 'light');
      this.setIcon(true);
    }
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', () => this.toggleSidebar());
    if (overlay) overlay.addEventListener('click', () => this.closeSidebar());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeSidebar();
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');
    const isOpen = sidebar.classList.contains('open');

    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    if (hamburger) {
      hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(!isOpen));
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');

    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (hamburger) {
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  }

  setupSidebarLinks() {
    document.querySelectorAll('.sidebar-nav-item').forEach(link => {
      link.addEventListener('click', () => this.closeSidebar());
    });
  }

  setupProjectCards() {
    const cards = document.querySelectorAll('.project-card');
    let openCard = null;

    cards.forEach(card => {
      const toggle = card.querySelector('.project-toggle');
      if (!toggle) return;

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();

        if (openCard && openCard !== card) {
          openCard.classList.remove('expanded');
          const prevToggle = openCard.querySelector('.project-toggle');
          if (prevToggle) prevToggle.classList.remove('open');
        }

        card.classList.toggle('expanded');
        toggle.classList.toggle('open');

        const bar = card.querySelector('.project-progress-bar');
        if (bar && card.classList.contains('expanded')) {
          const pct = card.dataset.progress || '50';
          setTimeout(() => { bar.style.width = pct + '%'; }, 100);
        }

        openCard = card.classList.contains('expanded') ? card : null;
      });
    });
  }

  setupSearch() {
    const input = document.getElementById('sidebar-search-input');
    if (!input) return;

    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.sidebar-nav-item').forEach(link => {
        link.style.display = link.textContent.toLowerCase().includes(q) ? 'block' : 'none';
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => { new ThemeManager(); });
