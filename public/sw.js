/* Service worker de Orbis: hace la web instalable, recibe notificaciones push y abre la app al tocarlas. */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// Sin caché: la app siempre se sirve fresca desde la red.
self.addEventListener('fetch', () => {})

self.addEventListener('push', (e) => {
  let d = {}
  try {
    d = e.data ? e.data.json() : {}
  } catch {
    d = { cuerpo: e.data && e.data.text() }
  }
  e.waitUntil(
    self.registration.showNotification(d.titulo || 'Orbis', {
      body: d.cuerpo || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      image: d.imagen,
      tag: d.tag,
      renotify: Boolean(d.tag),
      requireInteraction: d.tipo === 'seguridad',
      data: { url: d.url || '/app/' },
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = new URL((e.notification.data && e.notification.data.url) || '/app/', self.location.origin).href
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.includes('/app') && 'focus' in v) {
          v.navigate(url).catch(() => {})
          return v.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
