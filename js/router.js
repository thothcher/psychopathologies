// Minimal hash router: #/name/param1/param2?key=value
export function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  return { name: parts[0] || '', params: parts.slice(1), query: new URLSearchParams(query) };
}

export function start(handler) {
  const run = () => handler(parseHash());
  addEventListener('hashchange', run);
  run();
}

export const go = (path) => {
  location.hash = '#/' + path;
};
