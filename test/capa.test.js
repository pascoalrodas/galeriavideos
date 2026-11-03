import test from 'node:test';
import assert from 'node:assert/strict';
import { extrairCapa, normalizarCapa } from '../lib/capa.js';

const html = `
  html5player.setThumbUrl('https://thumb-cdn77.xvideos-cdn.com/abc/0/xv_24_t.jpg');
  html5player.setThumbUrl169('https://thumb-cdn77.xnxx-cdn.com/abc/0/xv_20_t.jpg');
  <meta property="og:image" content="https://evil.com/capa.jpg">
`;

test('prefere a miniatura 16:9 do cdn', () => {
  assert.equal(
    extrairCapa(html),
    'https://thumb-cdn77.xnxx-cdn.com/abc/0/xv_20_t.jpg'
  );
});

test('recusa endereço que não é imagem desses cdns', () => {
  assert.equal(normalizarCapa('https://evil.com/capa.jpg'), null);
  assert.equal(normalizarCapa('http://thumb-cdn77.xvideos-cdn.com/abc/0/xv_20_t.jpg'), null);
  assert.equal(normalizarCapa('https://thumb-cdn77.xvideos-cdn.com/abc/0/video_360p.mp4'), null);
  assert.equal(extrairCapa('<meta property="og:image" content="https://evil.com/capa.jpg">'), null);
});
