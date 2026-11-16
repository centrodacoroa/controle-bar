// Servidor da foto da nota: recebe a foto + a lista de produtos do app,
// pede ao Claude para ler a nota/pedido e devolve {itens:[{nome,q,custo,p}]}.
//
// Secrets (configurados no painel da Cloudflare, nunca no código):
//   ANTHROPIC_API_KEY  chave da API da Anthropic
//   CODIGO_ACESSO      código que o dono digita uma vez no app
import Anthropic from '@anthropic-ai/sdk';

const ORIGEM = 'https://centrodacoroa.github.io';
const MAX_CORPO = 2_500_000;   // bytes do pedido inteiro (a foto já vem reduzida pelo app, ~300 KB)
const MAX_PRODUTOS = 300;
const MODELO_PADRAO = 'claude-opus-5-5';

const ESQUEMA = {
  type: 'object',
  properties: {
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome do produto como está escrito na nota' },
          q: { type: 'integer', description: 'Quantidade em UNIDADES (fardo/caixa já convertido)' },
          custo: { type: 'number', description: 'Valor total pago nessa linha, em reais. 0 se não aparece' },
          p: { type: 'string', description: 'id do produto cadastrado que corresponde, ou "" se nenhum' },
        },
        required: ['nome', 'q', 'custo', 'p'],
        additionalProperties: false,
      },
    },
  },
  required: ['itens'],
  additionalProperties: false,
};

const INSTRUCOES = `Você lê fotos de notas fiscais, cupons, pedidos e romaneios de entrega de um bar pequeno no Brasil.
Devolva cada produto que chegou, numa linha por produto.

Regras:
- q é sempre em UNIDADES. Converta embalagens: "2 FD 12" ou "2 fardos c/12" = 24; "1 CX 24 UN" = 24; "3 PCT c/ 6" = 18. Se a nota diz a quantidade por embalagem (ex.: "C/12", "12X350ML", "PACK 6"), use-a. Se só diz "1 fardo" sem dizer quantas unidades, use o tamanho mais comum para aquele produto no Brasil (lata de cerveja/refrigerante: fardo de 12; long neck: caixa de 24; água 500 ml: fardo de 12) e mesmo assim devolva a linha.
- custo é o valor TOTAL da linha em reais (não o preço unitário). Se a nota não mostra valor, use 0.
- p: compare com a lista de produtos cadastrados no bar e coloque o id do produto que é a mesma coisa (marca e tamanho parecidos; ex.: "CERV BRAHMA CHOPP LT 350ML" = "Cerveja lata"). Se não houver nenhum que corresponda, use "".
- nome: o nome do produto como aparece na nota, legível (pode desabreviar).
- Ignore linhas que não são produto (troco, desconto geral, frete, impostos, totais).
- Se a foto não é uma nota/pedido ou está ilegível, devolva itens vazio.`;

function cors(origem) {
  return {
    'Access-Control-Allow-Origin': origem === ORIGEM ? ORIGEM : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Codigo',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function resposta(obj, status, origem) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origem) },
  });
}

// comparação que não vaza o código pelo tempo de resposta
async function mesmoCodigo(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !b) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i] ^ y[i];
  return d === 0;
}

export default {
  async fetch(request, env) {
    const origem = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: origem === ORIGEM ? 204 : 403, headers: cors(origem) });
    }
    if (request.method !== 'POST') return resposta({ erro: 'Use POST' }, 405, origem);
    if (origem !== ORIGEM) return resposta({ erro: 'Origem não permitida' }, 403, origem);
    if (!(await mesmoCodigo(request.headers.get('X-Codigo') || '', env.CODIGO_ACESSO))) {
      return resposta({ erro: 'Código de acesso errado' }, 401, origem);
    }

    const tam = Number(request.headers.get('Content-Length') || 0);
    if (tam > MAX_CORPO) return resposta({ erro: 'Foto grande demais' }, 413, origem);
    const texto = await request.text();
    if (texto.length > MAX_CORPO) return resposta({ erro: 'Foto grande demais' }, 413, origem);

    let dados;
    try { dados = JSON.parse(texto); } catch { return resposta({ erro: 'Pedido inválido' }, 400, origem); }
    const imagem = typeof dados.imagem === 'string' ? dados.imagem : '';
    const tipo = ['image/jpeg', 'image/png', 'image/webp'].includes(dados.tipo) ? dados.tipo : 'image/jpeg';
    if (!imagem || !/^[A-Za-z0-9+/]+=*$/.test(imagem)) return resposta({ erro: 'Sem foto' }, 400, origem);

    const produtos = (Array.isArray(dados.produtos) ? dados.produtos : [])
      .slice(0, MAX_PRODUTOS)
      .map(p => ({ id: String(p.id ?? '').slice(0, 40), nome: String(p.nome ?? '').slice(0, 80) }))
      .filter(p => p.id && p.nome);
    const ids = new Set(produtos.map(p => p.id));

    if (!env.ANTHROPIC_API_KEY) return resposta({ erro: 'Servidor sem chave da API' }, 500, origem);
    const client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}), // só para teste local
      maxRetries: 1,
      timeout: 80_000,
    });

    let msg;
    try {
      msg = await client.beta.messages.create({
        model: env.MODELO || MODELO_PADRAO,
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA } },
        system: INSTRUCOES,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: tipo, data: imagem } },
            { type: 'text', text: 'Produtos cadastrados no bar (id: nome):\n' +
                (produtos.map(p => `${p.id}: ${p.nome}`).join('\n') || '(nenhum)') +
                '\n\nLeia a nota da foto.' },
          ],
        }],
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return resposta({ erro: 'Chave da API inválida' }, 502, origem);
      if (e instanceof Anthropic.RateLimitError) return resposta({ erro: 'Muitas fotos seguidas. Espere um minuto.' }, 429, origem);
      if (e instanceof Anthropic.BadRequestError) return resposta({ erro: 'A API recusou a foto: ' + e.message }, 502, origem);
      if (e instanceof Anthropic.APIError) return resposta({ erro: 'Erro na API (' + e.status + ')' }, 502, origem);
      return resposta({ erro: 'Não consegui falar com a API' }, 502, origem);
    }

    if (msg.stop_reason === 'refusal') return resposta({ erro: 'Não foi possível ler essa foto' }, 422, origem);
    if (msg.stop_reason === 'max_tokens') return resposta({ erro: 'Nota grande demais: fotografe em partes' }, 422, origem);
    const bloco = msg.content.find(b => b.type === 'text');
    let lido;
    try { lido = JSON.parse(bloco ? bloco.text : ''); } catch { return resposta({ erro: 'Resposta ilegível' }, 502, origem); }

    const itens = (Array.isArray(lido.itens) ? lido.itens : [])
      .map(it => ({
        nome: String(it.nome ?? '').trim().slice(0, 80),
        q: Math.max(0, Math.round(Number(it.q) || 0)),
        custo: Math.max(0, Math.round((Number(it.custo) || 0) * 100) / 100),
        p: ids.has(it.p) ? it.p : '',
      }))
      .filter(it => it.nome);

    return resposta({ itens }, 200, origem);
  },
};
