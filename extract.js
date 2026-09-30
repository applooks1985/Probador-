// Lee un enlace de producto y devuelve nombre, marca, precio, imagen y color
const dec = s => (s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
module.exports = async (req, res) => {
  const url = String(req.query.url || '').trim();
  if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'Enlace no válido' });
  try {
    const r = await fetch(url, { redirect: 'follow', headers: {
      'user-agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36',
      'accept-language': 'es-ES,es;q=0.9', accept: 'text/html' } });
    const html = await r.text();
    const out = { url: r.url || url };
    const find = o => {
      if (!o || typeof o !== 'object') return null;
      if (Array.isArray(o)) { for (const x of o) { const f = find(x); if (f) return f; } return null; }
      if ([].concat(o['@type'] || []).includes('Product')) return o;
      return find(o['@graph']);
    };
    let p = null;
    for (const b of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try { p = find(JSON.parse(b[1])); if (p) break; } catch (e) {}
    }
    if (p) {
      out.name = p.name;
      out.brand = p.brand && typeof p.brand === 'object' ? p.brand.name : p.brand;
      out.color = p.color;
      const o = [].concat(p.offers || [])[0] || {};
      out.price = o.price || (o.priceSpecification || {}).price;
      let im = [].concat(p.image || [])[0];
      out.image = im && im.url ? im.url : im;
    }
    const meta = k => {
      const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + k + '["\'][^>]*content=["\']([^"\']*)["\']', 'i'))
        || html.match(new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]+(?:property|name)=["\']' + k + '["\']', 'i'));
      return m && m[1];
    };
    out.name = out.name || meta('og:title');
    out.image = out.image || meta('og:image');
    out.price = out.price || meta('product:price:amount') || meta('og:price:amount');
    out.brand = out.brand || meta('og:site_name');
    for (const k of ['name', 'brand', 'color']) if (out[k]) out[k] = dec(String(out[k]));
    out.ok = !!(out.name || out.image);
    res.json(out);
  } catch (e) { res.status(500).json({ error: 'No pude leer la página: ' + e.message }); }
};
