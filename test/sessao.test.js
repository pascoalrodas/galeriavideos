import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assinarSessao,
  cabecalhoCookie,
  lerCookie,
  lerSessao
} from '../lib/sessao.js';

const segredo = 'segredo-de-teste';

test('assina e lê a sessão', () => {
  const token = assinarSessao('ana@email.com', segredo, 1_000);
  const sessao = lerSessao(token, segredo, 1_000);
  assert.deepEqual(sessao, { email: 'ana@email.com' });
});

test('rejeita sessão alterada, expirada ou com outro segredo', () => {
  const token = assinarSessao('ana@email.com', segredo, 1_000);
  assert.equal(lerSessao(`${token}x`, segredo, 1_000), null);
  assert.equal(lerSessao(token, 'outro', 1_000), null);
  assert.equal(lerSessao(token, segredo, Date.now() + (8 * 24 * 60 * 60 * 1000)), null);
});

test('lê o cookie e marca HttpOnly', () => {
  const cabecalho = cabecalhoCookie('abc.def', { seguro: true });
  assert.match(cabecalho, /HttpOnly/);
  assert.match(cabecalho, /Secure/);
  assert.equal(lerCookie(`outro=1; ${cabecalho}`, 'sessao'), 'abc.def');
});
