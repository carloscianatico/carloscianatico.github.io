# Carlo Scianatico — sito bilingue Jekyll

## Come funziona questa struttura

- **Scrivi e aggiorni in italiano**: pagine `.md` nella root e post in `_posts/`.
- La versione inglese già presente nel repo vive in `en/` e `_en_posts/`.
- Se vuoi un inglese migliore per una pagina o un post, puoi creare un override manuale in:
  - `_manual_en/pages/<nome-file>.md`
  - `_manual_en/posts/<nome-file>.md`

## Per avere la traduzione automatica ad ogni modifica

Questa repo include già un workflow GitHub Actions in `.github/workflows/pages.yml`.

Per attivarlo davvero:
1. Vai nel repo su **Settings > Pages**
2. In **Build and deployment**, cambia **Source** da **Deploy from a branch** a **GitHub Actions**
3. Fai un nuovo commit / push

Finché resti su **Deploy from a branch**, il sito funziona comunque, ma la traduzione automatica non si aggiorna da sola: vedrai solo i file inglesi già generati nel repo.

## File che aggiorni di solito

- `index.md`
- `about.md`
- `projects.md`
- `ideas.md`
- `articles.md`
- `contact.md`
- `_posts/*.md`

## File che non devi toccare normalmente

- `_layouts/`
- `_includes/`
- `_en_posts/`
- `en/`

Quelli sono la struttura del sito o l'output inglese generato.
