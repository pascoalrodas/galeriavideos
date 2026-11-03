import test from 'node:test';
import assert from 'node:assert/strict';
import { montarGrade } from '../lib/galeria.js';

test('monta o card, o botão de excluir e escapa o título', () => {
  const html = montarGrade([
    { id: 4, titulo: 'Tom & <Jerry>', src: 'https://www.xvideos.com/embedframe/abc' }
  ]);
  assert.match(html, /Tom &amp; &lt;Jerry&gt;/);
  assert.match(html, /data-src="https:\/\/www\.xvideos\.com\/embedframe\/abc"/);
  assert.match(html, /aria-label="Assistir: Tom &amp; &lt;Jerry&gt;"/);
  assert.match(html, /class="video-facade"/);
  assert.match(html, /class="botao-excluir" data-id="4"/);
  assert.doesNotMatch(html, /<iframe/);
  assert.doesNotMatch(html, /autoplay/);
  assert.doesNotMatch(html, /<Jerry>/);
  assert.doesNotMatch(html, /video-capa/);
});

test('mostra a capa quando o endereço da imagem é do cdn', () => {
  const html = montarGrade([
    {
      id: 4,
      titulo: 'Primeiro',
      src: 'https://www.xvideos.com/embedframe/abc',
      poster: 'https://thumb-cdn77.xvideos-cdn.com/abc/0/xv_20_t.jpg'
    },
    {
      id: 5,
      titulo: 'Segundo',
      src: 'https://www.xnxx.com/embedframe/def',
      poster: 'https://thumb-cdn77.xnxx-cdn.com/def/0/xv_20_t.jpg'
    },
    {
      id: 6,
      titulo: 'Ruim',
      src: 'https://www.xvideos.com/embedframe/ghi',
      poster: 'https://evil.com/capa.jpg'
    }
  ]);
  assert.match(html, /class="video-capa" src="https:\/\/thumb-cdn77\.xvideos-cdn\.com\/abc\/0\/xv_20_t\.jpg"/);
  assert.match(html, /data-capa="https:\/\/thumb-cdn77\.xvideos-cdn\.com\/abc\/0\/xv_20_t\.jpg"/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /loading="lazy"/);
  assert.doesNotMatch(html, /evil\.com/);
});
