// Guarda o app no celular para abrir sem internet.
// Rede primeiro (pega a versão nova quando tem internet), cache como reserva.
const CACHE = 'controle-bar-v8';
const ARQS = ['./', 'index.html', 'manifest.webmanifest', 'logo.png', 'icon-192.png', 'icon-512.png',
  // fotos dos produtos (para aparecerem sem internet)
  'fotos/bala-avulsa.jpg', 'fotos/bala-fini.jpg', 'fotos/halls.jpg', 'fotos/trident.jpg',
  'fotos/brahma.jpg', 'fotos/corona.jpg', 'fotos/heineken.jpg', 'fotos/original.jpg',
  'fotos/skol.jpg', 'fotos/bis.jpg', 'fotos/kit-kat.jpg', 'fotos/prestigio.jpg',
  'fotos/snickers.jpg', 'fotos/sonho-de-valsa.jpg', 'fotos/doce-de-leite.jpg', 'fotos/pacoca.jpg',
  'fotos/pirulito.jpg', 'fotos/pe-de-moleque.jpg', 'fotos/cachaca-51.jpg', 'fotos/campari.jpg',
  'fotos/conhaque-dreher.jpg', 'fotos/vodka-smirnoff.jpg', 'fotos/whisky-red-label.jpg', 'fotos/ypioca.jpg',
  'fotos/red-bull-zero.jpg', 'fotos/red-bull.jpg', 'fotos/linguica-com-vinagrete.jpg', 'fotos/coca-cola-zero.jpg',
  'fotos/coca-cola.jpg', 'fotos/fanta-laranja.jpg', 'fotos/guarana-antarctica.jpg', 'fotos/sprite.jpg',
  'fotos/cebolitos.jpg', 'fotos/cheetos.jpg', 'fotos/doritos.jpg', 'fotos/fandangos.jpg',
  'fotos/ruffles.jpg', 'fotos/coxinha.jpg', 'fotos/enroladinho-de-salsicha.jpg', 'fotos/esfiha-de-carne.jpg',
  'fotos/kibe.jpg', 'fotos/pastel.jpg', 'fotos/chicabon.jpg', 'fotos/cornetto.jpg',
  'fotos/eskibon.jpg', 'fotos/fruttare.jpg', 'fotos/magnum.jpg', 'fotos/agua-com-gas.jpg',
  'fotos/agua-sem-gas.jpg'];

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
