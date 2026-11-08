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
    const arquivo = String(video.src).startsWith('r2:');
    const capa = poster
      ? `
          <img class="video-capa" src="${escaparHtml(poster)}" alt="" loading="${indice === 0 ? 'eager' : 'lazy'}" decoding="async" referrerpolicy="no-referrer">`
      : '';
    const dataCapa = poster ? ` data-capa="${escaparHtml(poster)}"` : '';
    const origem = arquivo
      ? ' data-origem="arquivo"'
      : ` data-src="${src}"${dataCapa}`;
    return `
    <div class="video-container" data-id="${id}">
      <div class="video-cabecalho">
        <h2 class="video-title">${titulo}</h2>
        <button type="button" class="botao-fechar" aria-label="Fechar vídeo">×</button>
      </div>
      <div class="video-wrapper"${origem}>
        <button type="button" class="video-facade" aria-label="Assistir: ${titulo}">${capa}
          <span class="video-play" aria-hidden="true"></span>
          <span class="video-rotulo">Assistir</span>
        </button>
        <button type="button" class="botao-tela-cheia" aria-label="Tela cheia">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>
          </svg>
        </button>
      </div>
      <div class="video-rodape">
        <button type="button" class="botao-excluir" data-id="${id}">Excluir</button>
      </div>
    </div>`;
  }).join('\n');
}
