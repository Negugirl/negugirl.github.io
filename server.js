// server.js
const express = require('express');
const fetch = require('node-fetch'); // v2 compatible
const cheerio = require('cheerio');
const url = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple allowlist — replace with domains you want to allow in production
const domainAllowlist = [
  // example: 'www.example.com'
];

function isAllowed(targetUrl) {
  if (!targetUrl) return false;
  try {
    const p = new URL(targetUrl);
    // only allow https and host that matches allowed pattern:
    if (p.protocol !== 'https:') return false;
    if (domainAllowlist.length === 0) return true; // open for dev
    return domainAllowlist.includes(p.hostname);
  } catch (e) {
    return false;
  }
}

function makeProxyUrl(originalUrl) {
  // create a proxied internal route that will fetch originalUrl
  // encode originalUrl in query string
  return `/proxy?url=${encodeURIComponent(originalUrl)}`;
}

app.use(express.static('public')); // serve front-end files (index.html etc.)

app.get('/proxy', async (req, res) => {
  const target = req.query.url;
  if (!isAllowed(target)) {
    return res.status(400).send('Bad or disallowed URL');
  }

  try {
    // Fetch the target page
    const upstreamResp = await fetch(target, {
      redirect: 'follow',
      headers: {
        // send a reasonable user-agent; some servers refuse default node UA
        'User-Agent': 'Mozilla/5.0 (compatible; ProxyBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    // Copy some response headers (but avoid passing along security headers that would break embedding)
    // You can add caching headers here later.
    const contentType = upstreamResp.headers.get('content-type') || '';
    // If it's not HTML, just pipe it (images, css, js)
    if (!contentType.includes('text/html')) {
      res.set('Content-Type', contentType);
      const buffer = await upstreamResp.buffer();
      return res.send(buffer);
    }

    // For HTML, parse and rewrite links so they point back through the proxy
    const body = await upstreamResp.text();
    const $ = cheerio.load(body);

    const base = new URL(target);

    // Helper to rewrite attribute that points to a URL
    function rewriteAttr(elem, attr) {
      const val = $(elem).attr(attr);
      if (!val) return;
      // ignore javascript: and mailto:
      if (/^\s*(javascript:|mailto:|#)/i.test(val)) return;
      try {
        const u = new URL(val, base);
        const proxied = makeProxyUrl(u.href);
        $(elem).attr(attr, proxied);
      } catch (e) {
        // ignore
      }
    }

    // Rewrite sources and hrefs
    $('img').each((i, el) => rewriteAttr(el, 'src'));
    $('script').each((i, el) => rewriteAttr(el, 'src'));
    $('link').each((i, el) => rewriteAttr(el, 'href'));
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      if (href.trim().startsWith('#')) {
        // keep anchor links as is or you could rewrite to scroll within iframe
        return;
      }
      rewriteAttr(el, 'href');
    });
    $('form').each((i, el) => {
      const action = $(el).attr('action') || target;
      try {
        const aURL = new URL(action, base);
        $(el).attr('action', makeProxyUrl(aURL.href));
      } catch (e) {}
    });

    // Optionally inject a base tag so relative links behave (but we rewrote most)
    $('head').prepend(`<base href="${base.origin}${base.pathname}">`);

    // Optionally inject a small banner/note (remove if you don't want)
    $('body').prepend(
      `<div style="background:#111;color:#fff;padding:6px 12px;font-size:13px;">
         Proxied from ${base.origin} — served by MyProxy
       </div>`
    );

    // Send the rebuilt HTML
    res.set('Content-Type', 'text/html; charset=utf-8');
    const out = $.html();
    res.send(out);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).send('Proxy fetch error');
  }
});

// A small health check
app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
