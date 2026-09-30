self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'POST' && u.pathname === '/share') {
    e.respondWith((async () => {
      const f = await e.request.formData();
      const file = f.get('image');
      if (file && file.size) {
        const c = await caches.open('shared');
        await c.put('/shared-image', new Response(file, { headers: { 'Content-Type': file.type || 'image/jpeg' } }));
        return Response.redirect('/?shared=1', 303);
      }
      const m = String((f.get('url') || '') + ' ' + (f.get('text') || '')).match(/https?:\/\/\S+/);
      return Response.redirect(m ? '/?url=' + encodeURIComponent(m[0]) : '/', 303);
    })());
  }
});
