class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'site-theme';
    this.LIGHT_MODE_CLASS = 'light-mode';
    this.init();
  }

  init() {
    this.applyStoredTheme();
    this.setupEventListeners();
    this.setupHamburgerMenu();
    this.setupSidebar();
    this.setupProjectCards();
    this.setupSearch();
  }

  applyStoredTheme() {
    const theme = localStorage.getItem(this.STORAGE_KEY);
    if (theme === 'light') {
      document.body.classList.add(this.LIGHT_MODE_CLASS);
    } else if (theme === 'dark') {
      document.body.classList.remove(this.LIGHT_MODE_CLASS);
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.body.classList.add(this.LIGHT_MODE_CLASS);
      }
    }
  }

  setupEventListeners() {
    const toggleButton = document.querySelector('.theme-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggleTheme());
      toggleButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }
  }

  toggleTheme() {
    const isLightMode = document.body.classList.contains(this.LIGHT_MODE_CLASS);
    if (isLightMode) {
      document.body.classList.remove(this.LIGHT_MODE_CLASS);
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.body.classList.add(this.LIGHT_MODE_CLASS);
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
  }

  setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');

    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', () => this.toggleSidebar());

    if (overlay) {
      overlay.addEventListener('click', () => this.closeSidebar());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
  }

  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const hamburger = document.querySelector('.hamburger-menu');

    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    hamburger.classList.toggle('open');
  }

  closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    const hamburger = document.querySelector('.hamburger-menu');

    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    hamburger.classList.remove('open');
  }

  setupSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    sidebarLinks.forEach(link => {
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

        const progress = card.querySelector('.project-progress-bar');
        if (progress && card.classList.contains('expanded')) {
          const percent = card.dataset.progress || '50';
          setTimeout(() => {
            progress.style.width = percent + '%';
          }, 100);
        }

        openCard = card.classList.contains('expanded') ? card : null;
      });
    });
  }

  setupSearch() {
    const searchInput = document.querySelector('.sidebar-search input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const navItems = document.querySelectorAll('.sidebar nav a');

      navItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ThemeManager();
});
