const LOOP_GUARD_MARKER = 'data-ff-preview-guard';

const PREVIEW_GUARD_SCRIPT = `<script ${LOOP_GUARD_MARKER}="1">
(function(){
  if (window.__ffPreviewGuardInstalled) return;
  window.__ffPreviewGuardInstalled = true;
  document.addEventListener('click', function(ev){
    var target = ev.target;
    if (!target || !target.closest) return;
    var link = target.closest('a[href]');
    if (!link) return;
    var raw = (link.getAttribute('href') || '').trim();
    if (!raw || raw === '#') {
      ev.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (raw.charAt(0) === '#') {
      ev.preventDefault();
      var id = decodeURIComponent(raw.slice(1));
      var dest = id ? document.getElementById(id) : null;
      if (dest && dest.scrollIntoView) {
        dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    if (/^https?:\\/\\//i.test(raw)) {
      try {
        var u = new URL(raw);
        if (u.hostname === 'fforum3.vercel.app' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          ev.preventDefault();
          return;
        }
        ev.preventDefault();
        window.open(u.toString(), '_blank', 'noopener,noreferrer');
      } catch (e) {
        ev.preventDefault();
      }
      return;
    }
    // WHY: Relative URLs inside srcdoc resolve against parent /workspace and cause recursive iframe loops.
    ev.preventDefault();
  }, true);

  document.addEventListener('submit', function(ev){
    if (ev.defaultPrevented) return;
    ev.preventDefault();
  }, false);
})();
</script>`;

export function hardenPreviewHtml(rawHtml: string): string {
  const input = (rawHtml || '').trim();
  if (!input) return '';
  const cleaned = input
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh\b[^>]*>/gi, '');

  if (cleaned.includes(LOOP_GUARD_MARKER)) {
    return cleaned;
  }
  if (/<\/body>/i.test(cleaned)) {
    return cleaned.replace(/<\/body>/i, `${PREVIEW_GUARD_SCRIPT}\n</body>`);
  }
  if (/<\/html>/i.test(cleaned)) {
    return cleaned.replace(/<\/html>/i, `${PREVIEW_GUARD_SCRIPT}\n</html>`);
  }
  return `${cleaned}\n${PREVIEW_GUARD_SCRIPT}`;
}

export function bundleAiFilesToSingleHtml(
  files: Array<{ path: string; content: string }>
): string | null {
  if (!Array.isArray(files) || files.length === 0) return null;
  const htmlFile =
    files.find((f) => /(^|\/)index\.html?$/i.test(f.path)) ||
    files.find((f) => /\.html?$/i.test(f.path));
  if (!htmlFile || !htmlFile.content || !/<(html|body|section|main|div)/i.test(htmlFile.content)) {
    return null;
  }

  let combined = htmlFile.content.trim();
  if (!/<html\b/i.test(combined)) {
    combined = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${combined}</body></html>`;
  }

  const cssFiles = files.filter((f) => /\.css$/i.test(f.path) && f.content.trim());
  if (cssFiles.length > 0) {
    const mergedCss = cssFiles.map((f) => f.content).join('\n\n');
    combined = combined.replace(
      /<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["'](?!https?:\/\/)[^"']+["'][^>]*>/gi,
      ''
    );
    const styleTag = `<style>\n${mergedCss}\n</style>`;
    if (/<\/head>/i.test(combined)) {
      combined = combined.replace(/<\/head>/i, `${styleTag}\n</head>`);
    } else {
      combined = `${styleTag}\n${combined}`;
    }
  }

  const jsFiles = files.filter((f) => /\.js$/i.test(f.path) && f.content.trim());
  if (jsFiles.length > 0) {
    const mergedJs = jsFiles.map((f) => f.content).join('\n\n');
    combined = combined.replace(
      /<script\b[^>]*src\s*=\s*["'](?!https?:\/\/)[^"']+["'][^>]*>\s*<\/script>/gi,
      ''
    );
    const scriptTag = `<script>\n${mergedJs}\n</script>`;
    if (/<\/body>/i.test(combined)) {
      combined = combined.replace(/<\/body>/i, `${scriptTag}\n</body>`);
    } else {
      combined = `${combined}\n${scriptTag}`;
    }
  }

  return combined;
}
