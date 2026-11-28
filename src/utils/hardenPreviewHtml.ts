const LOOP_GUARD_MARKER = 'data-ff-preview-guard';
const CONSOLE_BRIDGE_MARKER = 'data-ff-console-bridge';
const STORAGE_SHIM_MARKER = 'data-ff-storage-shim';

export interface HardenPreviewOptions {
  enableConsoleBridge?: boolean;
  previewId?: string;
}

// WHY: Sandboxed iframes omit allow-same-origin for XSS isolation, so native localStorage/sessionStorage throw SecurityError; an in-memory shim lets generated task/timer/theme apps run cleanly.
function buildStorageShimScript(): string {
  return `<script ${STORAGE_SHIM_MARKER}="1">
(function(){
  var makeMem = function(){
    var s = Object.create(null);
    return {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(s, String(k)) ? s[String(k)] : null; },
      setItem: function(k, v){ s[String(k)] = String(v); },
      removeItem: function(k){ delete s[String(k)]; },
      clear: function(){ s = Object.create(null); },
      key: function(i){ return Object.keys(s)[i] || null; },
      get length(){ return Object.keys(s).length; }
    };
  };
  ['localStorage', 'sessionStorage'].forEach(function(prop){
    try {
      var st = window[prop];
      st.setItem('__ff_p__', '1');
      st.removeItem('__ff_p__');
    } catch (_) {
      try {
        Object.defineProperty(window, prop, { value: makeMem(), configurable: true, writable: false });
      } catch (__) {}
    }
  });
})();
</script>`;
}

function buildConsoleBridgeScript(previewId: string): string {
  const safeId = JSON.stringify(previewId || 'default');
  return `<script ${CONSOLE_BRIDGE_MARKER}="1">
(function(){
  if (window.__ffConsoleBridgeInstalled) return;
  window.__ffConsoleBridgeInstalled = true;
  var PID = ${safeId};
  var emit = function(level, text, stack, file, line){
    try {
      window.parent.postMessage({
        source: 'ff-preview-console',
        previewId: PID,
        level: level,
        message: String(text || '').slice(0, 1200),
        stack: stack ? String(stack).slice(0, 800) : '',
        file: file ? String(file) : '',
        line: typeof line === 'number' ? line : undefined,
        timestamp: Date.now()
      }, '*');
    } catch (_) {}
  };
  var serializeArg = function(val){
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (val instanceof Error) return val.name + ': ' + val.message;
    if (typeof Element !== 'undefined' && val instanceof Element) {
      return '<' + val.tagName.toLowerCase() + (val.id ? '#' + val.id : '') + '>';
    }
    try {
      var seen = [];
      return JSON.stringify(val, function(_, v){
        if (typeof v === 'object' && v !== null) {
          if (seen.indexOf(v) !== -1) return '[Circular]';
          seen.push(v);
        }
        return v;
      });
    } catch (_) {
      return String(val);
    }
  };
  ['log', 'info', 'warn', 'error'].forEach(function(lvl){
    var orig = console[lvl];
    console[lvl] = function(){
      var parts = [];
      for (var i = 0; i < arguments.length; i += 1) {
        parts.push(serializeArg(arguments[i]));
      }
      emit(lvl === 'log' ? 'info' : lvl, parts.join(' '));
      if (typeof orig === 'function') {
        try { orig.apply(console, arguments); } catch (_) {}
      }
    };
  });
  window.addEventListener('error', function(ev){
    var msg = (ev && ev.message) || 'Runtime error';
    var stack = ev && ev.error && ev.error.stack ? ev.error.stack : '';
    var file = (ev && ev.filename) || '';
    var line = ev && typeof ev.lineno === 'number' ? ev.lineno : undefined;
    emit('error', msg, stack, file, line);
  });
  window.addEventListener('unhandledrejection', function(ev){
    var reason = ev && ev.reason;
    var msg = reason instanceof Error ? reason.message : serializeArg(reason);
    var stack = reason instanceof Error && reason.stack ? reason.stack : '';
    emit('error', 'Unhandled Promise rejection: ' + msg, stack);
  });
})();
</script>`;
}

function buildPreviewGuardScript(previewId: string): string {
  const safeId = JSON.stringify(previewId || 'default');
  return `<script ${LOOP_GUARD_MARKER}="1">
(function(){
  if (window.__ffPreviewGuardInstalled) return;
  window.__ffPreviewGuardInstalled = true;
  var PID = ${safeId};
  var emitNav = function(pathStr){
    try {
      window.parent.postMessage({
        source: 'ff-preview-nav',
        previewId: PID,
        path: String(pathStr || '/')
      }, '*');
    } catch (_) {}
  };
  document.addEventListener('click', function(ev){
    var target = ev.target;
    if (!target || !target.closest) return;
    var link = target.closest('a[href]');
    if (!link) return;
    var raw = (link.getAttribute('href') || '').trim();
    if (!raw || raw === '#') {
      ev.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      emitNav('/');
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
      emitNav('/' + raw);
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
    emitNav(raw.charAt(0) === '/' ? raw : '/' + raw);
  }, true);

  document.addEventListener('submit', function(ev){
    if (ev.defaultPrevented) return;
    ev.preventDefault();
  }, false);
})();
</script>`;
}

export function stripPreviewGuardScripts(rawHtml: string): string {
  return (rawHtml || '')
    .replace(/<script\b[^>]*data-ff-preview-guard[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script\b[^>]*data-ff-console-bridge[^>]*>[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script\b[^>]*data-ff-storage-shim[^>]*>[\s\S]*?<\/script>\s*/gi, '');
}

export function hardenPreviewHtml(rawHtml: string, options?: HardenPreviewOptions): string {
  const input = (rawHtml || '').trim();
  if (!input) return '';
  let cleaned = input
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?\s*refresh\b[^>]*>/gi, '');

  const previewId = options?.previewId || 'default';
  const headInjections: string[] = [];
  if (!cleaned.includes(STORAGE_SHIM_MARKER)) {
    headInjections.push(buildStorageShimScript());
  }
  if (options?.enableConsoleBridge && !cleaned.includes(CONSOLE_BRIDGE_MARKER)) {
    headInjections.push(buildConsoleBridgeScript(previewId));
  }
  if (headInjections.length > 0) {
    const injected = headInjections.join('\n');
    if (/<head\b[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<head\b[^>]*>/i, (m) => `${m}\n${injected}`);
    } else if (/<html\b[^>]*>/i.test(cleaned)) {
      cleaned = cleaned.replace(/<html\b[^>]*>/i, (m) => `${m}\n<head>${injected}</head>`);
    } else {
      cleaned = `${injected}\n${cleaned}`;
    }
  }

  if (cleaned.includes(LOOP_GUARD_MARKER)) {
    return cleaned;
  }

  const guardTag = buildPreviewGuardScript(previewId);
  if (/<\/body>/i.test(cleaned)) {
    return cleaned.replace(/<\/body>/i, `${guardTag}\n</body>`);
  }
  if (/<\/html>/i.test(cleaned)) {
    return cleaned.replace(/<\/html>/i, `${guardTag}\n</html>`);
  }
  return `${cleaned}\n${guardTag}`;
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
