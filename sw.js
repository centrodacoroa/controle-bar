// Guarda o app no celular para abrir sem internet.
// Rede primeiro (pega a versão nova quando tem internet), cache como reserva: sem rede, rede travada (3 s) ou resposta de erro.
const CACHE = 'controle-bar-v16';
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
  'fotos/agua-sem-gas.jpg',
  'fotos/halls-extra-forte.jpg', 'fotos/trident-hortela.jpg', 'fotos/trident-melancia.jpg', 'fotos/trident-morango.jpg', 'fotos/amstel.jpg', 'fotos/antarctica.jpg', 'fotos/amstel-0-0.jpg', 'fotos/heineken-0-0-lata-269-ml.jpg', 'fotos/heineken-0-0-lata-350-ml.jpg', 'fotos/heineken-ultimate.jpg', 'fotos/bis-xtra-oreo.jpg', 'fotos/bis-xtra-original.jpg', 'fotos/diamante-negro.jpg', 'fotos/lacta-ao-leite.jpg', 'fotos/laka.jpg', 'fotos/ouro-branco.jpg', 'fotos/bananinha-sem-acucar.jpg', 'fotos/bananinha.jpg', 'fotos/pingo-de-ouro.jpg', 'fotos/contini.jpg', 'fotos/cynar.jpg', 'fotos/jack-daniel-s.jpg', 'fotos/black-label.jpg', 'fotos/kariri-ouro.jpg', 'fotos/pitu.jpg', 'fotos/velho-barreiro.jpg', 'fotos/guaraviton-acai.jpg', 'fotos/guaraviton.jpg', 'fotos/gatorade-berry-blue.jpg', 'fotos/gatorade-laranja.jpg', 'fotos/gatorade-limao.jpg', 'fotos/gatorade-tangerina.jpg', 'fotos/gatorade-uva.jpg', 'fotos/h2oh-limoneto.jpg', 'fotos/h2oh-limao.jpg', 'fotos/amendoim-alho.jpg', 'fotos/crocante.jpg', 'fotos/amendoim-frito.jpg', 'fotos/amendoim-japones.jpg', 'fotos/amendoim-salgado-sem-pele.jpg', 'fotos/amendoim-com-chocolate.jpg', 'fotos/bala-colorida.jpg', 'fotos/bala-de-goma.jpg', 'fotos/ovinhos-de-amendoim.jpg', 'fotos/pastel-churrasco.jpg', 'fotos/salgadinho-calabresa.jpg', 'fotos/corona-long-neck.jpg', 'fotos/heineken-0-0-long-neck.jpg', 'fotos/heineken-long-neck.jpg', 'fotos/praya.jpg', 'fotos/amstel-vibes-lemon.jpg', 'fotos/skol-beats-vermelha.jpg', 'fotos/skol-beats-azul.jpg', 'fotos/schweppes-mixed-spritz.jpg', 'fotos/smirnoff-ice.jpg', 'fotos/monster.jpg', 'fotos/monster-zero.jpg', 'fotos/monster-rio-punch.jpg', 'fotos/paleta-cremosa.jpg', 'fotos/paleta-frutada.jpg', 'fotos/paleta-recheada.jpg', 'fotos/mussarela-nozinho.jpg', 'fotos/salame.jpg', 'fotos/fanta-uva.jpg', 'fotos/guarana-antarctica-zero.jpg', 'fotos/schweppes-citrus.jpg', 'fotos/sprite-zero.jpg', 'fotos/fys-guarana.jpg', 'fotos/tonica-antarctica.jpg', 'fotos/cafe-com-leite.jpg', 'fotos/cafe.jpg', 'fotos/empadinha.jpg', 'fotos/pao-de-queijo.jpg', 'fotos/del-valle-lata-manga.jpg', 'fotos/del-valle-kapo-uva.jpg', 'fotos/mamba-water.jpg', 'fotos/5star.jpg', 'fotos/beats-gt.jpg'];

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
  const pagina = e.request.mode === 'navigate';
  const guardado = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || (pagina ? caches.match('index.html') : undefined));
  const rede = fetch(e.request).then(r => {
    if (r.ok && !r.redirected) { // erro (503, página de login do Wi-Fi) nunca entra no lugar do app
      const copia = r.clone();
      e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {}));
    }
    return r;
  });
  const boa = rede.then(r => { if (!r.ok || r.redirected) throw 0; return r; });
  const espera = new Promise((ok, erro) => setTimeout(erro, 3000));
  e.respondWith(
    Promise.race([boa, espera]).catch(() => guardado().then(r => r || rede))
  );
});
