class ThemeManager {
  constructor() {
    this.STORAGE_KEY   = 'site-theme';
    this.READING_KEY   = 'site-reading-list';
    this.LIGHT         = 'light-mode';
    this.init();
  }

  init() {
    this.applyStoredTheme();
    this.setupThemeToggle();
    this.setupSidebar();
    this.setupSearch();
    this.setupProjectCards();
    this.renderReadingList();
    this.injectBookmarkButtons();
  }

  /* ─── TEMA ─────────────────────────────────────────── */

  setIcon(isLight) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = isLight ? '☀️' : '🌙';
  }

  applyStoredTheme() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const isLight = saved === 'light' ||
      (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    document.body.classList.toggle(this.LIGHT, isLight);
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

  /* ─── SIDEBAR ───────────────────────────────────────── */

  setupSidebar() {
    const hamburger = document.getElementById('hamburger-btn');
    const closeBtn  = document.getElementById('sidebar-close');
    const overlay   = document.getElementById('sidebar-overlay');

    if (hamburger) hamburger.addEventListener('click', () => this.toggleSidebar());
    if (closeBtn)  closeBtn.addEventListener('click',  () => this.closeSidebar());
    if (overlay)   overlay.addEventListener('click',   () => this.closeSidebar());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.closeSidebar();
    });

    // chiudi sidebar quando si clicca un link di navigazione
    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
      link.addEventListener('click', () => this.closeSidebar());
    });
  }

  toggleSidebar() {
    const sidebar   = document.getElementById('nav-sidebar');
    const hamburger = document.getElementById('hamburger-btn');
    const overlay   = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    const isOpen = sidebar.classList.toggle('open');
    sidebar.setAttribute('aria-hidden', String(!isOpen));
    if (hamburger) { hamburger.classList.toggle('open', isOpen); hamburger.setAttribute('aria-expanded', String(isOpen)); }
    if (overlay)   overlay.classList.toggle('open', isOpen);
  }

  closeSidebar() {
    const sidebar   = document.getElementById('nav-sidebar');
    const hamburger = document.getElementById('hamburger-btn');
    const overlay   = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    if (hamburger) { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }
    if (overlay)   overlay.classList.remove('open');
  }

  /* ─── RICERCA ───────────────────────────────────────── */

  setupSearch() {
    const input = document.getElementById('nav-search-input');
    if (!input) return;
    input.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        link.style.display = link.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ─── READING LIST (segnalibro) ─────────────────────── */

  getReadingList() {
    try { return JSON.parse(localStorage.getItem(this.READING_KEY) || '[]'); }
    catch { return []; }
  }

  saveReadingList(list) {
    localStorage.setItem(this.READING_KEY, JSON.stringify(list));
  }

  isSaved(url) {
    return this.getReadingList().some(item => item.url === url);
  }

  toggleReading(url, title) {
    let list = this.getReadingList();
    const idx = list.findIndex(item => item.url === url);
    if (idx >= 0) {
      list.splice(idx, 1);
      this.saveReadingList(list);
      this.renderReadingList();
      return false;
    } else {
      list.unshift({ url, title });
      this.saveReadingList(list);
      this.renderReadingList();
      return true;
    }
  }

  renderReadingList() {
    const container = document.getElementById('sidebar-reading-list');
    if (!container) return;
    const list = this.getReadingList();
    if (list.length === 0) {
      container.innerHTML = '<p class="sidebar-empty">Clicca 🔖 su un articolo per salvarlo qui.</p>';
      return;
    }
    container.innerHTML = list.map(item => `
      <div class="sidebar-reading-item">
        <a href="${item.url}" class="sidebar-reading-link">
          <span class="bookmark-icon">🔖</span>
          <span>${item.title}</span>
        </a>
        <button class="sidebar-reading-remove" data-url="${item.url}" title="Rimuovi">✕</button>
      </div>
    `).join('');

    container.querySelectorAll('.sidebar-reading-remove').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const url = btn.dataset.url;
        let list = this.getReadingList().filter(i => i.url !== url);
        this.saveReadingList(list);
        this.renderReadingList();
        // aggiorna il bookmark button sulla pagina se esiste
        document.querySelectorAll(`.bookmark-btn[data-url="${url}"]`).forEach(b => {
          b.classList.remove('is-saved');
          b.title = 'Salva per dopo';
          b.querySelector('.bk-label') && (b.querySelector('.bk-label').textContent = '🔖');
        });
      });
    });
  }

  /* ─── BOOKMARK BUTTONS ──────────────────────────────── */

  injectBookmarkButtons() {
    // 1. Articoli in lista (article-card, feature-article, glass-card con link)
    const selectors = ['.article-card', '.feature-article', '.link-card', '.glass-card'];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(card => {
        if (card.querySelector('.bookmark-btn')) return; // già aggiunto
        const anchor = card.tagName === 'A' ? card : card.querySelector('a[href]');
        if (!anchor) return;
        const url   = anchor.getAttribute('href');
        const title = (card.querySelector('h2, h3, strong') || anchor).textContent.trim().slice(0, 80);
        if (!url || !title) return;
        this.addBookmarkBtn(card, url, title, false);
      });
    });

    // 2. Pagina singolo articolo
    const postHero = document.querySelector('.post-hero');
    if (postHero && !postHero.querySelector('.bookmark-btn')) {
      const url   = window.location.pathname;
      const title = (document.querySelector('h1') || document.querySelector('.post-hero h1'))?.textContent.trim().slice(0, 80);
      if (url && title) {
        this.addBookmarkBtn(postHero, url, title, true);
      }
    }
  }

  addBookmarkBtn(parent, url, title, isPost) {
    const saved = this.isSaved(url);
    const btn   = document.createElement('button');
    btn.className  = 'bookmark-btn' + (isPost ? ' post-bookmark' : '') + (saved ? ' is-saved' : '');
    btn.dataset.url = url;
    btn.title      = saved ? 'Rimuovi dalla lista' : 'Salva per dopo';
    btn.innerHTML  = `<span class="bk-label">🔖</span>${isPost ? `<span>&nbsp;${saved ? 'Salvato' : 'Salva per dopo'}</span>` : ''}`;

    if (!isPost) {
      // card: position relative se non già impostato
      const pos = getComputedStyle(parent).position;
      if (pos === 'static') parent.style.position = 'relative';
    }

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const nowSaved = this.toggleReading(url, title);
      btn.classList.toggle('is-saved', nowSaved);
      btn.title = nowSaved ? 'Rimuovi dalla lista' : 'Salva per dopo';
      if (isPost) {
        btn.querySelector('span:last-child').textContent = nowSaved ? ' Salvato' : ' Salva per dopo';
      }
    });

    parent.appendChild(btn);
  }

  /* ─── PROJECT CARDS ─────────────────────────────────── */

  setupProjectCards() {
    let openCard = null;
    document.querySelectorAll('.project-card').forEach(card => {
      const toggle = card.querySelector('.project-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        if (openCard && openCard !== card) {
          openCard.classList.remove('expanded');
          const pt = openCard.querySelector('.project-toggle');
          if (pt) pt.classList.remove('open');
        }
        const expanded = card.classList.toggle('expanded');
        toggle.classList.toggle('open', expanded);
        if (expanded) {
          const bar = card.querySelector('.project-progress-bar');
          if (bar) setTimeout(() => { bar.style.width = (card.dataset.progress || 50) + '%'; }, 100);
        }
        openCard = expanded ? card : null;
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => { new ThemeManager(); });
