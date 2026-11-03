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

async function subir() {
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
    ]
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
