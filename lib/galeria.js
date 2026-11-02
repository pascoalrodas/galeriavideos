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

export function montarGrade(videos) {
  return videos.map((video, indice) => {
    const id = idHtml(video.id);
    const titulo = escaparHtml(video.titulo);
    const src = escaparHtml(video.src);
    const poster = normalizarCapa(video.poster);
    const capa = poster
      ? `
          <img class="video-capa" src="${escaparHtml(poster)}" alt="" loading="${indice === 0 ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">`
      : '';
    const dataCapa = poster ? ` data-capa="${escaparHtml(poster)}"` : '';
    return `
    <div class="video-container" data-id="${id}">
      <div class="video-cabecalho">
        <h2 class="video-title">${titulo}</h2>
        <button type="button" class="botao-excluir" data-id="${id}">Excluir</button>
      </div>
      <div class="video-wrapper" data-src="${src}"${dataCapa}>
        <button type="button" class="video-facade" aria-label="Assistir: ${titulo}">${capa}
          <span class="video-play" aria-hidden="true"></span>
          <span class="video-rotulo">Assistir</span>
        </button>
      </div>
    </div>`;
  }).join('\n');
}
