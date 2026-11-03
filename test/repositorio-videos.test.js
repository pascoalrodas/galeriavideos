import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { criarRepositorioVideos } from '../lib/repositorio-videos.js';

function bancoMemoria() {
  return createClient({ url: ':memory:' });
}

test('semente uma vez, insere no topo e não restaura exclusão', async () => {
  const banco = bancoMemoria();
  const repositorio = criarRepositorioVideos(banco, {
    iniciais: [
      { titulo: 'Primeiro', src: 'https://www.xvideos.com/embedframe/aaa111' },
      { titulo: 'Segundo', src: 'https://www.xnxx.com/embedframe/bbb222' }
    ]
  });

  const lista = await repositorio.listar();
  assert.deepEqual(lista.map((video) => video.titulo), ['Primeiro', 'Segundo']);

  const novo = await repositorio.inserir({
    titulo: 'Novo',
    src: 'https://www.xvideos.com/embedframe/ccc333'
  });
  assert.equal(novo.titulo, 'Novo');

  const comNovo = await repositorio.listar();
  assert.deepEqual(comNovo.map((video) => video.titulo), ['Novo', 'Primeiro', 'Segundo']);

  assert.equal(await repositorio.excluir(lista[0].id), true);
  assert.equal(await repositorio.excluir(lista[0].id), false);

  await repositorio.preparar();
  const restante = await repositorio.listar();
  assert.deepEqual(restante.map((video) => video.titulo), ['Novo', 'Segundo']);

  await assert.rejects(
    () => repositorio.inserir({ titulo: 'Outro', src: novo.src }),
    /já está na galeria/
  );

  banco.close();
});

test('guarda a capa uma vez e não repete a busca', async () => {
  const banco = bancoMemoria();
  const capas = {
    'https://www.xvideos.com/embedframe/aaa111': 'https://thumb-cdn77.xvideos-cdn.com/abc/0/xv_20_t.jpg',
    'https://www.xvideos.com/embedframe/ccc333': 'https://evil.com/capa.jpg'
  };
  let chamadas = 0;
  const repositorio = criarRepositorioVideos(banco, {
    iniciais: [
      { titulo: 'Primeiro', src: 'https://www.xvideos.com/embedframe/aaa111' }
    ],
    buscarCapa: async (src) => {
      chamadas += 1;
      return capas[src] || '';
    }
  });

  const lista = await repositorio.listar();
  assert.equal(lista[0].poster, capas['https://www.xvideos.com/embedframe/aaa111']);
  await repositorio.listar();
  assert.equal(chamadas, 1);

  const novo = await repositorio.inserir({
    titulo: 'Novo',
    src: 'https://www.xvideos.com/embedframe/ccc333'
  });
  assert.equal(novo.poster, null);
  assert.equal(chamadas, 2);

  banco.close();
});
