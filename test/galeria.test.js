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
  assert.match(html, /class="botao-fechar"/);
  assert.match(html, /aria-label="Fechar vídeo"/);
  assert.match(html, /class="video-rodape"/);
  assert.ok(html.indexOf('botao-fechar') < html.indexOf('video-wrapper'));
  assert.ok(html.indexOf('video-wrapper') < html.lastIndexOf('botao-excluir'));
  assert.match(html, /class="botao-tela-cheia"/);
  assert.match(html, /aria-label="Tela cheia"/);
  assert.doesNotMatch(html, /<iframe/);
  assert.doesNotMatch(html, /autoplay/);
  assert.doesNotMatch(html, /<Jerry>/);
  assert.doesNotMatch(html, /video-capa/);
});

test('arquivo fica sem o endereço interno e sem capa', () => {
  const html = montarGrade([
    {
      id: 8,
      titulo: 'Enviado',
      src: 'r2:videos/11111111-1111-1111-1111-111111111111.mp4'
    }
  ]);
  assert.match(html, /data-origem="arquivo"/);
  assert.match(html, /class="botao-fechar"/);
  assert.match(html, /class="botao-excluir" data-id="8"/);
  assert.doesNotMatch(html, /r2:videos/);
  assert.doesNotMatch(html, /data-src=/);
  assert.doesNotMatch(html, /<video/);
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
