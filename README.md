# Controle de Bar

App de anotação do balcão: substitui o caderno de contas. Uma tela só, imitando a folha do caderno.

- `index.html`: o app inteiro (HTML, CSS e JS num arquivo só)
- `sw.js` + `manifest.webmanifest`: abre sem internet e pode ser instalado na tela inicial
- Dados ficam no próprio celular (localStorage `bar_v2`). O backup é o arquivo `.json`, enviado pelo botão "Enviar backup" (área do dono ou "Fechar dia")

Regra que manda em tudo: lançar um item em no máximo 3 toques.

Publicado pelo GitHub Pages a partir da branch `main`.
