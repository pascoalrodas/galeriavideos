import { quadroValido } from './arquivo.js';
import { normalizarCapa } from './capa.js';

export function escaparHtml(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function idHtml(id) {
  const numero = Number(id);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    throw new Error('Vídeo sem identificador válido.');
  }
  return String(numero);
}

function urlCapaArquivo(valor) {
  let url;
  try {
    url = new URL(String(valor || ''));
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (!url.hostname.endsWith('.r2.cloudflarestorage.com')) return null;
  if (url.username || url.password || url.port || url.hash) return null;
  if (!/\.jpe?g$/i.test(url.pathname)) return null;
  return url.href;
}

export function montarGrade(videos) {
  return videos.map((video, indice) => {
    const id = idHtml(video.id);
    const titulo = escaparHtml(video.titulo);
    const src = escaparHtml(video.src);
    const arquivo = String(video.src).startsWith('r2:');
    const poster = arquivo ? urlCapaArquivo(video.capa) : normalizarCapa(video.poster);
    const quadro = arquivo ? quadroValido(video.quadro) : null;
    const capa = poster
      ? `
          <img class="video-capa" src="${escaparHtml(poster)}" alt="" loading="${indice === 0 ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">`
      : '';
    const dataCapa = poster ? ` data-capa="${escaparHtml(poster)}"` : '';
    const dataQuadro = quadro ? ` data-quadro="${quadro}"` : '';
    const vertical = quadro && Number(quadro) < 1;
    const classe = quadro
      ? `video-wrapper video-arquivo${vertical ? ' video-vertical' : ''}`
      : 'video-wrapper';
    const estilo = quadro ? ` style="--quadro:${quadro}"` : '';
    const origem = arquivo
      ? ` data-origem="arquivo"${dataCapa}${dataQuadro}`
      : ` data-src="${src}"${dataCapa}`;
    const botaoInteira = arquivo
      ? `
        <button type="button" class="botao-tela-inteira" aria-label="Tela cheia sem cortar" title="Mostra o vídeo inteiro" aria-pressed="false">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 5h16v14H4z"/>
            <path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M7 8h10v8H7z"/>
          </svg>
        </button>`
      : '';
    return `
    <div class="video-container" data-id="${id}">
      <div class="video-cabecalho">
        <h2 class="video-title">${titulo}</h2>
        <button type="button" class="botao-fechar" aria-label="Fechar vídeo">×</button>
      </div>
      <div class="${classe}"${estilo}${origem}>
        <button type="button" class="video-facade" aria-label="Assistir: ${titulo}">${capa}
          <span class="video-play" aria-hidden="true"></span>
          <span class="video-rotulo">Assistir</span>
        </button>
        <button type="button" class="botao-tela-cheia" aria-label="Tela cheia" title="Preenche a tela">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>
          </svg>
        </button>${botaoInteira}
      </div>
      <div class="video-rodape">
        <button type="button" class="botao-excluir" data-id="${id}">Excluir</button>
      </div>
    </div>`;
  }).join('\n');
}
