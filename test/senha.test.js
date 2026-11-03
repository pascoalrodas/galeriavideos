import test from 'node:test';
import assert from 'node:assert/strict';
import { compararSenha, ehHash, gerarHash } from '../lib/senha.js';

test('reconhece hash bcrypt e confere a senha', async () => {
  assert.equal(ehHash('texto-puro'), false);
  const hash = await gerarHash('senha-forte');
  assert.equal(ehHash(hash), true);
  assert.equal(await compararSenha('senha-forte', hash), true);
  assert.equal(await compararSenha('outra', hash), false);
});
