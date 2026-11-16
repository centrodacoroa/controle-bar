# Controle de Bar: regras do projeto

App do balcão do bar Centro da Coroa. O app inteiro é o `index.html` (HTML, CSS e JS num arquivo só), publicado pelo GitHub Pages em https://centrodacoroa.github.io/controle-bar/ a partir da branch `main`.

## Regras

- **Quem usa é leigo** (o dono e os funcionários). Tudo tem que ser fácil: botões grandes, pouco texto, nada de digitar quando der para tocar.
- **A tela do atendente não muda**: lançar um item em no máximo 3 toques. A gestão fica na área do dono (⚙︎, com PIN).
- **Não perder dados**: manter o formato salvo (localStorage `bar_v2`, com `produtos`, `contas` e `mov`) e o backup `.json`. Campo novo pode ser acrescentado, mas nenhum campo existente muda de nome ou de sentido. Configuração que não é dado do bar fica em chave própria (ex.: `bar_foto`), fora do `bar_v2`.
- **A cada mudança, subir a versão do cache** em `sw.js` (`const CACHE = 'controle-bar-vN'`), senão o celular continua com o app velho.
- **Testar o fluxo inteiro antes de publicar**:
  - balcão: abrir nome, lançar, tirar, fechar Pix / dinheiro / devendo, fechar dia;
  - estoque: chegou mercadoria (manual e foto da nota), contagem.

## Servidor da foto (`servidor-foto/`)

Cloudflare Worker que lê a foto da nota ou pedido com a API do Claude e devolve `{itens:[{nome,q,custo,p}]}` (q em unidades, custo = R$ total da linha, p = id do produto cadastrado ou "").

- O repositório é público: a chave da API **nunca** entra no código nem no app. Ela fica só como secret `ANTHROPIC_API_KEY` no Cloudflare.
- Proteções: só aceita a origem `https://centrodacoroa.github.io`, exige o código de acesso (secret `CODIGO_ACESSO`, configurado uma vez no app), e limita o tamanho da imagem.
- Nada entra no estoque sem o dono conferir e tocar em "Confirmar entrada" (`abrirEntrada`).
