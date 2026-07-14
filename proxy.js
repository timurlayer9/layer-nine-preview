// layer-nine.ai edge worker: serves the domain from GitHub Pages.
// Hosting lives at https://timurlayer9.github.io/layer-nine-preview/ (auto-built
// from this repo's main branch); this worker only maps the domain onto it.

const UPSTREAM_HOST = 'https://timurlayer9.github.io';
const UPSTREAM_PREFIX = '/layer-nine-preview';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const upstream = UPSTREAM_HOST + UPSTREAM_PREFIX + url.pathname + url.search;

    const resp = await fetch(upstream, {
      method: request.method,
      redirect: 'manual',
      headers: {
        'Accept': request.headers.get('Accept') || '*/*',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'layer-nine-edge',
      },
    });

    // Rewrite GitHub Pages redirects (e.g. /de -> /de/) back onto the domain.
    if (resp.status >= 300 && resp.status < 400) {
      let loc = resp.headers.get('Location') || '/';
      loc = loc
        .replace(UPSTREAM_HOST + UPSTREAM_PREFIX, '')
        .replace(UPSTREAM_PREFIX, '');
      if (!loc.startsWith('http') && !loc.startsWith('/')) loc = '/' + loc;
      return new Response(null, { status: resp.status, headers: { Location: loc } });
    }

    const headers = new Headers(resp.headers);
    headers.delete('x-github-request-id');
    headers.delete('x-fastly-request-id');
    headers.delete('server');
    return new Response(resp.body, { status: resp.status, headers });
  },
};
