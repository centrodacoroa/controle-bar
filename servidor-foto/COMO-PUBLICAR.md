# Como colocar a "Foto da nota" para funcionar

São 4 partes, feitas uma vez só. Leva uns 20 minutos. Faça no computador; só a parte 4 é no celular.

Antes de começar, invente um **código de acesso**: uma senha comprida só de letras e números, por exemplo `coroa7bar2026nota`. Anote num papel. Ele vai em dois lugares: no Cloudflare (parte 3) e no app (parte 4).

---

## Parte 1: conta na API da Anthropic (quem lê a foto)

1. Entre em **https://platform.claude.com** e clique em **Sign up**. Crie a conta com seu e-mail.
2. Se pedir, crie uma "organização": pode pôr o nome do bar.
3. **Coloque crédito** (é pré-pago):
   - Menu **Settings → Billing**.
   - Clique em **Buy credits** (comprar créditos), cadastre o cartão e compre **US$ 10**. Dá para várias centenas de fotos (cada foto custa mais ou menos de R$ 0,10 a R$ 0,40).
   - **Deixe a recarga automática desligada** ("Auto reload": off). Assim, nunca gasta mais do que você colocou.
4. **Limite de gasto por mês**:
   - Menu **Settings → Limits**.
   - Em **Spend limit**, ponha um valor mensal, por exemplo **US$ 10**. Se chegar nisso, a foto para de funcionar até o mês seguinte. Nada é cobrado a mais.
5. **Crie a chave**:
   - Menu **API Keys → Create Key**.
   - Nome: `foto-nota-bar`.
   - Copie a chave (começa com `sk-ant-`) e **guarde por alguns minutos**: ela aparece uma vez só. Se perder, é só apagar e criar outra.
   - **Nunca** mande essa chave por WhatsApp e nunca cole no app nem no GitHub. Ela vai só no Cloudflare (parte 3).

## Parte 2: conta na Cloudflare (onde o servidor fica)

1. Entre em **https://dash.cloudflare.com/sign-up** e crie a conta grátis com seu e-mail. Confirme o e-mail.
2. O plano grátis de Workers basta (100 mil pedidos por dia).

## Parte 3: publicar o servidor

> Antes: o código do servidor (pasta `servidor-foto`) precisa estar na branch `main` do GitHub, junto com a versão nova do app.

1. No painel da Cloudflare, menu da esquerda: **Compute (Workers) → Workers & Pages**.
2. Clique em **Create** e depois em **Import a repository** (importar um repositório).
3. Escolha **GitHub** e autorize a Cloudflare a ver o repositório **centrodacoroa/controle-bar** (pode escolher "só este repositório").
4. Selecione **controle-bar** e preencha:
   - **Project name**: `foto-nota-bar` (tem que ser exatamente esse nome).
   - **Root directory** (pasta raiz), em "Advanced settings": `servidor-foto`
   - O resto deixe como está (comando de deploy: `npx wrangler deploy`).
5. Clique em **Deploy** e espere terminar (1 ou 2 minutos).
6. **Coloque os dois segredos**:
   - Abra o worker **foto-nota-bar → Settings → Variables and Secrets → Add**.
   - Type **Secret**, nome `ANTHROPIC_API_KEY`, valor: a chave `sk-ant-…` da parte 1. Salve.
   - **Add** de novo: Type **Secret**, nome `CODIGO_ACESSO`, valor: o código de acesso que você anotou. Salve.
   - Clique em **Deploy** se aparecer o botão.
7. **Copie o endereço** do servidor. Ele aparece no topo da página do worker, algo como `foto-nota-bar.SEUNOME.workers.dev`. Anote.

Pronto. Daqui para frente, toda mudança que entrar na `main` na pasta `servidor-foto` é publicada sozinha.

## Parte 4: ligar no celular do bar (uma vez)

1. Abra o app, toque em **⚙︎** e digite o PIN.
2. Aba **Estoque → + Chegou mercadoria → 📷 Foto da nota**.
3. Na primeira vez ele pede:
   - **Endereço do servidor**: o endereço da parte 3 (ex.: `foto-nota-bar.seunome.workers.dev`).
   - **Código de acesso**: o código que você anotou.
4. Toque em **Salvar**, depois em **📷 Foto da nota**, e fotografe uma nota de teste.

Para trocar depois: **⚙︎ → Produtos e preços → 📷 Config. foto**.

---

## Se der problema

| Aparece no app | O que fazer |
|---|---|
| "Código de acesso errado" | O código no app está diferente do `CODIGO_ACESSO` do Cloudflare. Toque em "Arrumar configuração". |
| "Não consegui falar com o servidor da foto" | Confira a internet e o endereço (sem espaço, sem erro de digitação). |
| "Chave da API inválida" | Crie outra chave na Anthropic e troque o secret `ANTHROPIC_API_KEY` no Cloudflare. |
| "Erro na API (400)" ou parou de funcionar no fim do mês | Acabou o crédito ou bateu o limite do mês. Veja **Billing** na Anthropic. |
| "Não achei produtos na foto" | Tire de novo: de perto, reta, com luz e a nota inteira aparecendo. |

**Se a chave vazar** (alguém viu, foi para o GitHub): apague a chave em **API Keys** na Anthropic, crie outra e troque no Cloudflare. **Se o código de acesso vazar**: troque o `CODIGO_ACESSO` no Cloudflare e no app.
