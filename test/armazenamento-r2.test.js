import test from 'node:test';
import assert from 'node:assert/strict';
import { criarArmazenamentoR2 } from '../lib/armazenamento-r2.js';

test('assina envio e leitura no bucket da galeria', async () => {
  const armazenamento = criarArmazenamentoR2({
    accountId: 'abc123',
    accessKeyId: 'chave',
    secretAccessKey: 'segredo',
    bucket: 'galeria-de-videos',
    expiracaoEnvio: 900,
    expiracaoLeitura: 3600
  });
  const chave = 'videos/11111111-1111-1111-1111-111111111111.mp4';
  const envio = new URL(await armazenamento.urlEnvio({ chave, tipo: 'video/mp4' }));
  assert.equal(envio.protocol, 'https:');
  assert.equal(envio.hostname, 'abc123.r2.cloudflarestorage.com');
  assert.equal(envio.pathname, `/galeria-de-videos/${chave}`);
  assert.equal(envio.searchParams.get('X-Amz-Expires'), '900');
  assert.match(envio.searchParams.get('X-Amz-SignedHeaders') || '', /content-type/);
  assert.ok(envio.searchParams.get('X-Amz-Signature'));

  const leitura = new URL(await armazenamento.urlLeitura(chave));
  assert.equal(leitura.pathname, `/galeria-de-videos/${chave}`);
  assert.equal(leitura.searchParams.get('X-Amz-Expires'), '3600');
  assert.equal(leitura.searchParams.get('X-Amz-SignedHeaders'), 'host');
});

