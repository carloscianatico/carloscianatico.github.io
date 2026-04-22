from __future__ import annotations

import copy
import re
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
PAGES = [
    'index.md',
    'about.md',
    'projects.md',
    'ideas.md',
    'articles.md',
    'contact.md',
]

FRONT_MATTER_RE = re.compile(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', re.DOTALL)
INLINE_LINK_RE = re.compile(r'\[([^\]]+)\]\(([^)]+)\)')
IMAGE_RE = re.compile(r'!\[([^\]]*)\]\(([^)]+)\)')
URL_RE = re.compile(r'^(https?://|mailto:|#)')


class Translator:
    def __init__(self) -> None:
        self.mode = 'fallback'
        self._fn = lambda text: text
        try:
            import argostranslate.package  # type: ignore
            import argostranslate.translate  # type: ignore

            argostranslate.package.update_package_index()
            available = argostranslate.package.get_available_packages()
            package = next(
                pkg for pkg in available if pkg.from_code == 'it' and pkg.to_code == 'en'
            )
            argostranslate.package.install_from_path(package.download())

            def _translate(text: str) -> str:
                return argostranslate.translate.translate(text, 'it', 'en')  # type: ignore

            self._fn = _translate
            self.mode = 'argos'
        except Exception:
            self.mode = 'fallback'
            self._fn = lambda text: FALLBACK_SENTENCE_MAP.get(text.strip(), text)

    def translate(self, text: str) -> str:
        text = text or ''
        if not text.strip():
            return text
        try:
            return self._fn(text)
        except Exception:
            return FALLBACK_SENTENCE_MAP.get(text.strip(), text)


def load_markdown(path: Path) -> tuple[dict[str, Any], str]:
    raw = path.read_text(encoding='utf-8')
    match = FRONT_MATTER_RE.match(raw)
    if not match:
        return {}, raw
    data = yaml.safe_load(match.group(1)) or {}
    body = match.group(2)
    return data, body


def dump_markdown(front_matter: dict[str, Any], body: str) -> str:
    yaml_text = yaml.safe_dump(front_matter, sort_keys=False, allow_unicode=True).strip()
    return f"---\n{yaml_text}\n---\n{body.rstrip()}\n"


def localize_url(url: str) -> str:
    stripped = url.strip()
    if not stripped.startswith('/') or stripped.startswith('/en/'):
        return url
    if stripped == '/':
        return '/en/'
    return '/en' + stripped


def translate_string(text: str, translator: Translator) -> str:
    stripped = text.strip()
    if not stripped:
        return text
    if URL_RE.match(stripped):
        return text
    if stripped in {'it', 'en'}:
        return text
    if text.startswith('Status:'):
        return 'Status:' + translator.translate(text[len('Status:'):])
    if '://' in text or text.startswith('mailto:'):
        return text
    return translator.translate(text)


def translate_inline_markdown(line: str, translator: Translator) -> str:
    placeholders: list[str] = []

    def _store(match: re.Match[str]) -> str:
        placeholders.append(match.group(0))
        return f"@@PLACEHOLDER{len(placeholders)-1}@@"

    masked = IMAGE_RE.sub(_store, line)
    masked = INLINE_LINK_RE.sub(lambda m: f"[{translator.translate(m.group(1))}]({localize_url(m.group(2)) if m.group(2).startswith('/') else m.group(2)})", masked)
    translated = translator.translate(masked)
    for idx, original in enumerate(placeholders):
        translated = translated.replace(f"@@PLACEHOLDER{idx}@@", original)
    return translated


def translate_markdown_body(body: str, translator: Translator) -> str:
    out: list[str] = []
    in_code = False
    for raw_line in body.splitlines():
        line = raw_line.rstrip('\n')
        stripped = line.strip()
        if stripped.startswith('```'):
            in_code = not in_code
            out.append(line)
            continue
        if in_code:
            out.append(line)
            continue
        if not stripped:
            out.append('')
            continue
        if stripped.startswith('>'):
            content = stripped[1:].strip()
            out.append('> ' + translate_inline_markdown(content, translator))
            continue
        bullet_match = re.match(r'^(\s*[-*+]\s+)(.+)$', line)
        if bullet_match:
            out.append(bullet_match.group(1) + translate_inline_markdown(bullet_match.group(2), translator))
            continue
        numbered_match = re.match(r'^(\s*\d+\.\s+)(.+)$', line)
        if numbered_match:
            out.append(numbered_match.group(1) + translate_inline_markdown(numbered_match.group(2), translator))
            continue
        heading_match = re.match(r'^(\s*#+\s+)(.+)$', line)
        if heading_match:
            out.append(heading_match.group(1) + translate_inline_markdown(heading_match.group(2), translator))
            continue
        out.append(translate_inline_markdown(line, translator))
    return '\n'.join(out) + '\n'


def translate_data(obj: Any, translator: Translator) -> Any:
    if isinstance(obj, dict):
        result: dict[str, Any] = {}
        for key, value in obj.items():
            if key.endswith('_en'):
                continue
            manual_key = f'{key}_en'
            if manual_key in obj:
                result[key] = obj[manual_key]
            elif key in {'layout', 'lang', 'ref', 'date', 'categories', 'tags', 'source_path', 'source_slug', 'auto_generated'}:
                result[key] = copy.deepcopy(value)
            elif key == 'permalink':
                result[key] = copy.deepcopy(value)
            elif key.endswith('url') or key == 'url':
                result[key] = localize_url(value) if isinstance(value, str) else copy.deepcopy(value)
            else:
                result[key] = translate_data(value, translator)
        return result
    if isinstance(obj, list):
        return [translate_data(item, translator) for item in obj]
    if isinstance(obj, str):
        return translate_string(obj, translator)
    return obj


def english_permalink(path: str) -> str:
    if path == '/':
        return '/en/'
    clean = path.strip('/')
    return f'/en/{clean}/'


def process_page(path: Path, translator: Translator) -> None:
    manual = ROOT / '_manual_en' / 'pages' / path.name
    target_dir = ROOT / 'en'
    target = target_dir / ('index.md' if path.name == 'index.md' else path.name)
    if manual.exists():
        target.write_text(manual.read_text(encoding='utf-8'), encoding='utf-8')
        return

    fm, body = load_markdown(path)
    new_fm = translate_data(fm, translator)
    new_fm['lang'] = 'en'
    new_fm['source_path'] = path.name
    new_fm['auto_generated'] = True
    new_fm['permalink'] = english_permalink(fm.get('permalink', '/' + path.stem + '/'))
    if 'title' in new_fm and path.name == 'about.md' and new_fm['title'] == 'Chi sono':
        new_fm['title'] = 'About'
    translated_body = translate_markdown_body(body, translator)
    if translator.mode != 'argos' and target.exists():
        return
    target.write_text(dump_markdown(new_fm, translated_body), encoding='utf-8')


def process_post(path: Path, translator: Translator) -> None:
    manual = ROOT / '_manual_en' / 'posts' / path.name
    target = ROOT / '_en_posts' / path.name
    if manual.exists():
        target.write_text(manual.read_text(encoding='utf-8'), encoding='utf-8')
        return

    fm, body = load_markdown(path)
    new_fm = translate_data(fm, translator)
    new_fm['lang'] = 'en'
    new_fm['source_slug'] = path.stem[11:] if len(path.stem) > 11 else path.stem
    new_fm['auto_generated'] = True
    if 'categories' in new_fm:
        new_fm['categories'] = ['articles']
    translated_body = translate_markdown_body(body, translator)
    if translator.mode != 'argos' and target.exists():
        return
    target.write_text(dump_markdown(new_fm, translated_body), encoding='utf-8')


def main() -> None:
    translator = Translator()
    for name in PAGES:
        process_page(ROOT / name, translator)
    for post in sorted((ROOT / '_posts').glob('*.md')):
        process_post(post, translator)
    mode_file = ROOT / '.manual_build'
    mode_file.write_text(f'translation_mode={translator.mode}\n', encoding='utf-8')


FALLBACK_SENTENCE_MAP = {
    'Chi sono': 'About',
    'Contatti': 'Contact',
    'Progetti': 'Projects',
    'Idee': 'Ideas',
    'Articoli': 'Articles',
}


if __name__ == '__main__':
    main()
