#!/usr/bin/env python3
"""Render deterministic project previews from local code/data; never fetch external images."""
import argparse
import hashlib
import importlib.metadata
import io
import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import platform
import shutil
import tempfile
import threading

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'assets/graphics'
COMMON = [
    'tools/graphics/generate.py', 'tools/graphics/render.html',
    'tools/graphics/render.js', 'tools/graphics/model.js',
    'assets/fonts/archivo-var.woff2', 'assets/fonts/ibm-plex-mono-400.woff2',
]


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def render(directory, contact_sheet, browser_path):
    directory.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}'
    thumbnails = []
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=browser_path, headless=True, args=['--disable-dev-shm-usage'])
            context = browser.new_context(viewport={'width': 1600, 'height': 1000}, device_scale_factor=1, reduced_motion='reduce', locale='en-US', timezone_id='UTC')
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
            page.on('response', lambda response: errors.append(f'HTTP {response.status}: {response.url}') if response.status >= 400 else None)
            page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base + '/') else route.abort())
            page.goto(base + '/tools/graphics/render.html', wait_until='networkidle')
            page.wait_for_function('window.graphicsReady || window.graphicsError')
            error = page.evaluate('window.graphicsError')
            if error:
                raise RuntimeError(error)
            cards = page.evaluate('window.graphics.map(({svg, ...card}) => card)')
            manifest = {
                'schema': 1,
                'generator': 'python3 tools/graphics/generate.py',
                'toolchain': {'chrome': browser.version, 'python': platform.python_version(), 'playwright': importlib.metadata.version('playwright'), 'pillow': importlib.metadata.version('Pillow')},
                'design': {'background': '#13201b', 'frame': '1 px, inset 40 px', 'grid': '1 px / 40 px, mist at 5.5% opacity', 'fonts': ['Archivo', 'IBM Plex Mono'], 'format': 'lossless WebP'},
                'graphics': [],
            }
            for card in cards:
                page.evaluate('id => window.showGraphic(id)', card['id'])
                layout_errors = page.evaluate('''() => {
                    const errors = [];
                    for (const node of document.querySelectorAll('#art text')) {
                        const b = node.getBBox();
                        if (b.x < 40 || b.y < 40 || b.x + b.width > 1560 || b.y + b.height > 960) errors.push(`Clipped text: ${node.textContent}`);
                    }
                    const caption = document.querySelector('#footer .caption').getBBox();
                    const note = document.querySelector('#footer .note').getBBox();
                    if (caption.x + caption.width + 24 > note.x) errors.push('Footer caption and note overlap');
                    return errors;
                }''')
                if layout_errors:
                    raise RuntimeError(f'{card["id"]}: {layout_errors}')
                image = Image.open(io.BytesIO(page.locator('#art').screenshot(animations='disabled'))).convert('RGB')
                if image.size != (1600, 1000):
                    raise RuntimeError(f'Unexpected capture dimensions: {image.size}')
                files = []
                for width, height in [(1600, 1000), (800, 500)]:
                    target = directory / f'{card["id"]}-{width}.webp'
                    scaled = image if width == 1600 else image.resize((width, height), Image.Resampling.LANCZOS)
                    scaled.save(target, 'WEBP', lossless=True, method=6)
                    files.append({'path': f'assets/graphics/{target.name}', 'width': width, 'height': height, 'sha256': sha(target)})
                sources = sorted(set(COMMON + card.pop('sources')))
                card['sources'] = [{'path': path, 'sha256': sha(ROOT / path)} for path in sources]
                card['files'] = files
                manifest['graphics'].append(card)
                thumbnails.append(image.resize((480, 300), Image.Resampling.LANCZOS))
                print(f'{card["id"]}: 1600x1000 + 800x500 · {card["note"]}')
            if errors:
                raise RuntimeError('\n'.join(errors))
            (directory / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
            context.close()
            browser.close()
            print('BROWSER_ERRORS 0 · TEXT_WITHIN_FRAME · FOOTERS_DO_NOT_OVERLAP')
        if contact_sheet:
            contact_sheet.parent.mkdir(parents=True, exist_ok=True)
            sheet = Image.new('RGB', (480 * 2 + 24 * 3, 300 * 4 + 24 * 5), '#0b1511')
            for index, image in enumerate(thumbnails):
                sheet.paste(image, (24 + (index % 2) * 504, 24 + (index // 2) * 324))
            sheet.save(contact_sheet)
            print(f'Contact sheet: {contact_sheet}')
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--browser', default=shutil.which('google-chrome') or shutil.which('chromium'), help='Chrome/Chromium executable; otherwise use Playwright Chromium')
    parser.add_argument('--contact-sheet', type=Path, default=Path.home() / 'shots/graphics/contact-sheet.png')
    parser.add_argument('--check', action='store_true', help='Regenerate privately and byte-compare with committed outputs')
    args = parser.parse_args()
    if args.check:
        with tempfile.TemporaryDirectory(prefix='graphics-check-') as temp:
            directory = Path(temp)
            render(directory, None, args.browser)
            names = {file.name for file in directory.iterdir()}
            existing = {file.name for file in OUTPUT.iterdir() if file.suffix in ['.webp', '.json']}
            if names != existing or any((directory / name).read_bytes() != (OUTPUT / name).read_bytes() for name in names):
                raise SystemExit('Graphics are stale or the browser/toolchain differs; regenerate and inspect the diff.')
            print('REPRODUCIBLE_OUTPUTS 17/17 byte-identical')
    else:
        render(OUTPUT, args.contact_sheet.expanduser(), args.browser)


if __name__ == '__main__':
    main()
