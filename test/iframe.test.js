import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarSrc } from '../lib/iframe.js';

const iframe = '<iframe src="https://www.xvideos.com/embedframe/oliuleee680" frameborder=0 width=510 height=400 scrolling=no allowfullscreen=allowfullscreen></iframe>';

test('lê o endereço de dentro do iframe', () => {
  assert.equal(
    normalizarSrc(iframe),
    'https://www.xvideos.com/embedframe/oliuleee680'
  );
});

test('aceita o endereço direto e o embed do xnxx', () => {
  assert.equal(
    normalizarSrc('https://www.xnxx.com/embedframe/uflcedff8c9'),
    'https://www.xnxx.com/embedframe/uflcedff8c9'
  );
});

test('recusa endereço que não é embed dessas origens', () => {
  assert.equal(normalizarSrc('https://www.youtube.com/embed/abc'), null);
  assert.equal(normalizarSrc('http://www.xvideos.com/embedframe/oliuleee680'), null);
  assert.equal(normalizarSrc('https://www.xvideos.com/embedframe/oliuleee680?auto=1'), null);
  assert.equal(normalizarSrc('<iframe src="https://evil.com/embedframe/oliuleee680"></iframe>'), null);
  assert.equal(normalizarSrc(''), null);
});
