import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { criarApp } from '../lib/app.js';

const iframe = '<iframe src="https://www.xvideos.com/embedframe/oliuleee680" frameborder=0 width=510 height=400 scrolling=no allowfullscreen=allowfullscreen></iframe>';

function cookieDe(resposta) {
  const lista = typeof resposta.headers.getSetCookie === 'function'
    ? resposta.headers.getSetCookie()
    : [resposta.headers.get('set-cookie')];
  assert.ok(lista[0]);
  return lista[0].split(';')[0];
}

async function subir({ armazenamento = null } = {}) {
  const banco = createClient({ url: ':memory:' });
  await banco.execute(`
    CREATE TABLE utilizadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL
    )
  `);
  const app = criarApp({
    banco,
    segredo: 'segredo-de-teste',
    cadastroLiberado: true,
    videosIniciais: [
      { titulo: 'Já estava', src: 'https://www.xvideos.com/embedframe/aaa111' }
    ],
    armazenamento
  });
  const servidor = await new Promise((resolve) => {
    const escuta = app.listen(0, () => resolve(escuta));
  });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  return { banco, servidor, base };
}

test('insere pelo iframe e exclui o vídeo da galeria', async () => {
  const { banco, servidor, base } = await subir();
  try {
    const cadastro = await fetch(`${base}/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Teste', email: 'teste@exemplo.com', senha: 'senha-forte' })
    });
    assert.equal(cadastro.status, 201);

    const login = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teste@exemplo.com', senha: 'senha-forte' })
    });
    assert.equal(login.status, 200);
    const cookie = cookieDe(login);

    const jsonRuim = await fetch(`${base}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{nao-json'
    });
    assert.equal(jsonRuim.status, 400);

    const semSessao = await fetch(`${base}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Novo', iframe })
    });
    assert.equal(semSessao.status, 401);

    const pagina = await fetch(`${base}/galeria`, { headers: { cookie } });
    const html = await pagina.text();
    assert.equal(pagina.status, 200);
    assert.equal(
      pagina.headers.get('content-security-policy'),
      'frame-src https://www.xvideos.com/embedframe/ https://www.xnxx.com/embedframe/'
    );
    assert.match(html, /Inserir vídeo/);
    assert.match(html, /Já estava/);
    assert.match(html, /botao-excluir/);
    assert.match(html, /data-src="https:\/\/www\.xvideos\.com\/embedframe\/aaa111"/);
    assert.doesNotMatch(html, /<iframe\b[^>]*aaa111/);

    const criado = await fetch(`${base}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Cola do iframe', iframe })
    });
    assert.equal(criado.status, 201);
    const video = await criado.json();
    assert.equal(video.src, 'https://www.xvideos.com/embedframe/oliuleee680');

    const repetido = await fetch(`${base}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'De novo', iframe })
    });
    assert.equal(repetido.status, 409);

    const invalido = await fetch(`${base}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Ruim', iframe: '<iframe src="https://example.com"></iframe>' })
    });
    assert.equal(invalido.status, 400);

    const exclusao = await fetch(`${base}/videos/${video.id}`, {
      method: 'DELETE',
      headers: { cookie }
    });
    assert.equal(exclusao.status, 204);

    const depois = await fetch(`${base}/galeria`, { headers: { cookie } });
    const htmlDepois = await depois.text();
    assert.match(htmlDepois, /Já estava/);
    assert.doesNotMatch(htmlDepois, /Cola do iframe/);
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) => (error ? reject(error) : resolve()));
    });
    banco.close();
  }
});

function armazenamentoMemoria() {
  const objetos = new Map();
  return {
    objetos,
    async urlEnvio({ chave, tipo }) {
      return `https://galeria-de-videos.exemplo.r2.cloudflarestorage.com/${chave}?tipo=${encodeURIComponent(tipo)}`;
    },
    async urlLeitura(chave) {
      return `https://galeria-de-videos.exemplo.r2.cloudflarestorage.com/${chave}?leitura=1`;
    },
    async detalhes(chave) {
      return objetos.get(chave) || null;
    },
    async excluir(chave) {
      objetos.delete(chave);
    }
  };
}

test('envia um arquivo, reproduz e apaga o objeto', async () => {
  const armazenamento = armazenamentoMemoria();
  const { banco, servidor, base } = await subir({ armazenamento });
  try {
    const cadastro = await fetch(`${base}/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Teste', email: 'arquivo@exemplo.com', senha: 'senha-forte' })
    });
    assert.equal(cadastro.status, 201);
    const login = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arquivo@exemplo.com', senha: 'senha-forte' })
    });
    const cookie = cookieDe(login);

    const semConfig = await fetch(`${base}/videos/envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo: 'Sem', tipo: 'video/mp4', tamanho: 10 })
    });
    assert.equal(semConfig.status, 401);

    const tipoRuim = await fetch(`${base}/videos/envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Ruim', tipo: 'video/avi', tamanho: 10 })
    });
    assert.equal(tipoRuim.status, 400);

    const grande = await fetch(`${base}/videos/envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Grande', tipo: 'video/mp4', tamanho: (2 * 1024 * 1024 * 1024) + 1 })
    });
    assert.equal(grande.status, 400);

    const preparo = await fetch(`${base}/videos/envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Caseiro', tipo: 'video/mp4', tamanho: 1200 })
    });
    assert.equal(preparo.status, 200);
    const envio = await preparo.json();
    assert.match(envio.chave, /^videos\/[0-9a-f-]{36}\.mp4$/);
    assert.match(envio.url, /galeria-de-videos\.exemplo\.r2\.cloudflarestorage\.com/);

    const cedo = await fetch(`${base}/videos/arquivo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Caseiro', chave: envio.chave })
    });
    assert.equal(cedo.status, 400);

    armazenamento.objetos.set(envio.chave, { tamanho: 1200, tipo: 'video/mp4' });
    const criado = await fetch(`${base}/videos/arquivo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Caseiro', chave: envio.chave })
    });
    assert.equal(criado.status, 201);
    const video = await criado.json();
    assert.equal(video.origem, 'arquivo');
    assert.equal(video.src, undefined);

    const pagina = await fetch(`${base}/galeria`, { headers: { cookie } });
    const html = await pagina.text();
    assert.match(html, /data-origem="arquivo"/);
    assert.match(html, /botao-fechar/);
    assert.match(html, /Arquivo/);
    assert.doesNotMatch(html, new RegExp(envio.chave));

    const reproducao = await fetch(`${base}/videos/${video.id}/reproducao`, { headers: { cookie } });
    assert.equal(reproducao.status, 200);
    assert.equal(reproducao.headers.get('cache-control'), 'no-store');
    const midia = await reproducao.json();
    assert.match(midia.url, /leitura=1/);

    const embed = await fetch(`${base}/galeria`, { headers: { cookie } });
    const idEmbed = (await embed.text()).match(/data-src="https:\/\/www\.xvideos\.com\/embedframe\/aaa111"/);
    assert.ok(idEmbed);

    const exclusao = await fetch(`${base}/videos/${video.id}`, {
      method: 'DELETE',
      headers: { cookie }
    });
    assert.equal(exclusao.status, 204);
    assert.equal(armazenamento.objetos.has(envio.chave), false);
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) => (error ? reject(error) : resolve()));
    });
    banco.close();
  }
});

test('recusa envio de arquivo quando o armazenamento não está configurado', async () => {
  const { banco, servidor, base } = await subir();
  try {
    const cadastro = await fetch(`${base}/cadastrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Teste', email: 'sem-r2@exemplo.com', senha: 'senha-forte' })
    });
    assert.equal(cadastro.status, 201);
    const login = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sem-r2@exemplo.com', senha: 'senha-forte' })
    });
    const cookie = cookieDe(login);
    const resposta = await fetch(`${base}/videos/envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ titulo: 'Local', tipo: 'video/mp4', tamanho: 20 })
    });
    assert.equal(resposta.status, 503);
  } finally {
    await new Promise((resolve, reject) => {
      servidor.close((error) => (error ? reject(error) : resolve()));
    });
    banco.close();
  }
});
