// Guarda o app no celular para abrir sem internet.
// Rede primeiro (pega a versão nova quando tem internet), cache como reserva.
const CACHE = 'controle-bar-v4';
const ARQS = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  // fotos dos produtos (para aparecerem sem internet)
  'fotos/original.jpg', 'fotos/heineken.jpg', 'fotos/corona.jpg', 'fotos/brahma.jpg',
  'fotos/red-bull.jpg', 'fotos/coca-cola.jpg', 'fotos/coca-cola-zero.jpg', 'fotos/guarana-antarctica.jpg',
  'fotos/fanta-laranja.jpg', 'fotos/sprite.jpg', 'fotos/agua-sem-gas.jpg', 'fotos/coxinha.jpg',
  'fotos/kibe.jpg', 'fotos/enroladinho-de-salsicha.jpg', 'fotos/esfiha-de-carne.jpg', 'fotos/pastel.jpg',
  'fotos/ruffles.jpg', 'fotos/doritos.jpg', 'fotos/cheetos.jpg', 'fotos/cebolitos.jpg',
  'fotos/cornetto.jpg', 'fotos/magnum.jpg', 'fotos/cachaca-51.jpg', 'fotos/ypioca.jpg',
  'fotos/vodka-smirnoff.jpg', 'fotos/campari.jpg', 'fotos/whisky-red-label.jpg', 'fotos/kit-kat.jpg',
  'fotos/snickers.jpg', 'fotos/sonho-de-valsa.jpg', 'fotos/trident.jpg', 'fotos/bala-avulsa.jpg',
  'fotos/pacoca.jpg', 'fotos/pe-de-moleque.jpg', 'fotos/doce-de-leite.jpg', 'fotos/pirulito.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
