const botaoAbrir = document.getElementById('abrir-inserir');
const painel = document.getElementById('form-video');
const mensagem = document.getElementById('mensagem-video');
const titulo = document.getElementById('titulo-video');
const iframe = document.getElementById('iframe-video');
const arquivoInput = document.getElementById('arquivo-video');
const campoIframe = document.getElementById('campo-iframe');
const campoArquivo = document.getElementById('campo-arquivo');
const galeria = document.querySelector('.gallery');
const LIMITE_ARQUIVO = 2 * 1024 * 1024 * 1024;
const TIPOS_ARQUIVO = new Map([
  ['mp4', 'video/mp4'],
  ['webm', 'video/webm'],
  ['mov', 'video/quicktime'],
  ['ogv', 'video/ogg'],
  ['ogg', 'video/ogg']
]);

let modo = 'iframe';

function definirModo(proximo) {
  modo = proximo;
  const arquivo = proximo === 'arquivo';
  campoIframe.classList.toggle('escondido', arquivo);
  campoArquivo.classList.toggle('escondido', !arquivo);
  iframe.required = !arquivo;
  document.getElementById('modo-iframe').classList.toggle('modo-ativo', !arquivo);
  document.getElementById('modo-arquivo').classList.toggle('modo-ativo', arquivo);
  document.getElementById('modo-iframe').setAttribute('aria-pressed', String(!arquivo));
  document.getElementById('modo-arquivo').setAttribute('aria-pressed', String(arquivo));
}

document.getElementById('modo-iframe').addEventListener('click', () => definirModo('iframe'));
document.getElementById('modo-arquivo').addEventListener('click', () => definirModo('arquivo'));

botaoAbrir.addEventListener('click', () => {
  const aberto = !painel.classList.toggle('escondido');
  botaoAbrir.setAttribute('aria-expanded', String(aberto));
  if (aberto) titulo.focus();
});

function tipoDoArquivo(arquivo) {
  const informado = String(arquivo.type || '').toLowerCase();
  if ([...TIPOS_ARQUIVO.values()].includes(informado)) return informado;
  const extensao = arquivo.name.split('.').pop()?.toLowerCase();
  return TIPOS_ARQUIVO.get(extensao) || '';
}

function quadroCliente(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0.2 || numero > 5) return null;
  return String(Number(numero.toFixed(4)));
}

function capturarQuadro(src, aoMedir, aoExibir) {
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  if (!String(src).startsWith('blob:')) video.crossOrigin = 'anonymous';
  let encerrado = false;

  return new Promise((resolve, reject) => {
    const limite = setTimeout(() => finalizar(new Error('tempo')), 25000);

    function finalizar(erro, valor) {
      if (encerrado) return;
      encerrado = true;
      clearTimeout(limite);
      if (erro) {
        if (!video.isConnected) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        reject(erro);
        return;
      }
      resolve(valor);
    }

    video.addEventListener('error', () => finalizar(new Error('video')), { once: true });
    video.addEventListener('loadedmetadata', () => {
      if (!video.videoWidth || !video.videoHeight) {
        finalizar(new Error('sem quadro'));
        return;
      }
      const quadro = quadroCliente(video.videoWidth / video.videoHeight);
      if (!quadro) {
        finalizar(new Error('sem quadro'));
        return;
      }
      aoMedir?.(video.videoWidth / video.videoHeight);
      aoExibir?.(video);
      const destino = Number.isFinite(video.duration) && video.duration > 0.5 ? 0.5 : 0;
      const desenhar = () => {
        try {
          const escala = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(video.videoWidth * escala));
          canvas.height = Math.max(1, Math.round(video.videoHeight * escala));
          const contexto = canvas.getContext('2d', { alpha: false });
          contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) {
              finalizar(new Error('sem imagem'));
              return;
            }
            finalizar(null, { blob, quadro });
          }, 'image/jpeg', 0.82);
        } catch (erro) {
          finalizar(erro);
        }
      };
      if (destino === 0) {
        if (video.readyState >= 2) desenhar();
        else video.addEventListener('loadeddata', desenhar, { once: true });
        return;
      }
      video.addEventListener('seeked', desenhar, { once: true });
      try {
        video.currentTime = destino;
      } catch (erro) {
        finalizar(erro);
      }
    }, { once: true });
    video.src = src;
  });
}

async function enviarArquivo(botao) {
  const arquivo = arquivoInput.files?.[0];
  if (!arquivo) {
    mensagem.textContent = 'Escolha um arquivo de vídeo.';
    mensagem.classList.add('erro');
    return;
  }
  const tipo = tipoDoArquivo(arquivo);
  if (!tipo) {
    mensagem.textContent = 'Use um vídeo MP4, WebM, MOV ou OGG.';
    mensagem.classList.add('erro');
    return;
  }
  if (arquivo.size > LIMITE_ARQUIVO) {
    mensagem.textContent = 'O arquivo passa de 2 GB.';
    mensagem.classList.add('erro');
    return;
  }

  mensagem.textContent = 'Preparando a capa...';
  let previa = null;
  const local = URL.createObjectURL(arquivo);
  try {
    previa = await capturarQuadro(local);
  } catch {
    previa = null;
  } finally {
    URL.revokeObjectURL(local);
  }

  mensagem.textContent = 'Enviando o arquivo...';
  const preparo = await fetch('/videos/envio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: titulo.value,
      tipo,
      tamanho: arquivo.size
    })
  });
  const dados = await preparo.json().catch(() => ({}));
  if (!preparo.ok) {
    mensagem.textContent = dados.erro || 'Não foi possível preparar o envio.';
    mensagem.classList.add('erro');
    return;
  }

  const envio = await fetch(dados.url, {
    method: 'PUT',
    headers: { 'Content-Type': dados.tipo || tipo },
    body: arquivo
  });
  if (!envio.ok) {
    mensagem.textContent = 'Não foi possível enviar o arquivo.';
    mensagem.classList.add('erro');
    return;
  }

  const confirmacao = await fetch('/videos/arquivo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titulo: titulo.value, chave: dados.chave })
  });
  const salvo = await confirmacao.json().catch(() => ({}));
  if (!confirmacao.ok) {
    mensagem.textContent = salvo.erro || 'Não foi possível salvar o vídeo.';
    mensagem.classList.add('erro');
    return;
  }
  if (previa) {
    mensagem.textContent = 'Guardando a capa...';
    await guardarCapa(salvo.id, previa.blob, previa.quadro);
  }
  botao.disabled = true;
  window.location.reload();
  return true;
}

painel.addEventListener('submit', async (event) => {
  event.preventDefault();
  mensagem.textContent = '';
  mensagem.className = 'mensagem-video';
  const botao = painel.querySelector('button[type="submit"]');
  botao.disabled = true;
  let salvou = false;

  try {
    if (modo === 'arquivo') {
      salvou = await enviarArquivo(botao);
      return;
    }
    const resposta = await fetch('/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: titulo.value,
        iframe: iframe.value
      })
    });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) {
      mensagem.textContent = dados.erro || 'Não foi possível inserir o vídeo.';
      mensagem.classList.add('erro');
      return;
    }
    window.location.reload();
    salvou = true;
  } catch {
    mensagem.textContent = 'Erro ao conectar com o servidor.';
    mensagem.classList.add('erro');
  } finally {
    if (!salvou) botao.disabled = false;
  }
});

const HOSTS_EMBED = new Set(['www.xvideos.com', 'www.xnxx.com']);
const ID_EMBED = /^[A-Za-z0-9_-]{1,80}$/;
const origensConectadas = new Set();
let playerPendente = null;

function toqueDireto(event) {
  return event?.pointerType === 'touch' || window.matchMedia('(pointer: coarse)').matches;
}

function srcSeguro(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !HOSTS_EMBED.has(url.hostname)) return null;
  if (url.username || url.password || url.port || url.search || url.hash) return null;
  const partes = url.pathname.split('/').filter(Boolean);
  if (partes.length !== 2 || partes[0] !== 'embedframe' || !ID_EMBED.test(partes[1])) return null;
  return `https://${url.hostname}/embedframe/${partes[1]}`;
}

function preconectar(src) {
  const seguro = srcSeguro(src);
  if (!seguro) return;
  const origem = new URL(seguro).origin;
  if (origensConectadas.has(origem)) return;
  origensConectadas.add(origem);
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origem;
  document.head.appendChild(link);
}

const HOST_CAPA = /^(?:[a-z0-9-]+\.)*(?:xvideos-cdn|xnxx-cdn)\.com$/i;

function capaSegura(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !HOST_CAPA.test(url.hostname)) return null;
  if (url.username || url.password || url.port || url.search || url.hash) return null;
  if (!/\.(?:jpe?g|webp)$/i.test(url.pathname)) return null;
  return url.href;
}

function urlCapaR2(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.r2.cloudflarestorage.com')) return null;
  if (url.username || url.password || url.port || url.hash) return null;
  if (!/\.jpe?g$/i.test(url.pathname)) return null;
  return url.href;
}

function capaAceita(valor) {
  return capaSegura(valor) || urlCapaR2(valor);
}

function criarFachada(titulo, capa) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'video-facade';
  botao.setAttribute('aria-label', `Assistir: ${titulo}`);
  const segura = capaAceita(capa);
  if (segura) {
    const imagem = document.createElement('img');
    imagem.className = 'video-capa';
    imagem.alt = '';
    imagem.loading = 'lazy';
    imagem.decoding = 'async';
    imagem.referrerPolicy = 'no-referrer';
    imagem.src = segura;
    botao.append(imagem);
  }
  const icone = document.createElement('span');
  icone.className = 'video-play';
  icone.setAttribute('aria-hidden', 'true');
  const rotulo = document.createElement('span');
  rotulo.className = 'video-rotulo';
  rotulo.textContent = 'Assistir';
  botao.append(icone, rotulo);
  return botao;
}

function criarBotaoTelaCheia() {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-tela-cheia';
  botao.setAttribute('aria-label', 'Tela cheia');
  botao.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/></svg>';
  return botao;
}

function trocarMidia(wrapper, no) {
  const telaCheia = wrapper.querySelector('.botao-tela-cheia');
  wrapper.replaceChildren(no);
  wrapper.append(telaCheia || criarBotaoTelaCheia());
}

function aplicarQuadro(wrapper) {
  const quadro = quadroCliente(wrapper.dataset.quadro);
  if (!quadro) {
    wrapper.classList.remove('video-arquivo');
    wrapper.style.removeProperty('--quadro');
    return;
  }
  wrapper.dataset.quadro = quadro;
  wrapper.style.setProperty('--quadro', quadro);
  wrapper.classList.add('video-arquivo');
}

function mostrarCapa(wrapper, url) {
  const fachada = wrapper.querySelector('.video-facade');
  if (!fachada) return;
  fachada.querySelectorAll('video.video-capa').forEach((previa) => {
    previa.pause();
    previa.removeAttribute('src');
    previa.load();
    previa.remove();
  });
  let imagem = fachada.querySelector('img.video-capa');
  if (!imagem) {
    imagem = document.createElement('img');
    imagem.className = 'video-capa';
    imagem.alt = '';
    imagem.decoding = 'async';
    fachada.prepend(imagem);
  }
  imagem.src = url;
}

function restaurarFachada(wrapper) {
  wrapper.dataset.abertura = '';
  aplicarQuadro(wrapper);
  const tituloVideo = wrapper.closest('.video-container')?.querySelector('.video-title')?.textContent || 'Vídeo';
  trocarMidia(wrapper, criarFachada(tituloVideo, wrapper.dataset.capa));
}

function fecharOutros(wrapper) {
  galeria.querySelectorAll('.video-wrapper').forEach((outro) => {
    if (outro !== wrapper && outro.querySelector('iframe, video')) restaurarFachada(outro);
  });
}

function urlArquivoSegura(valor) {
  let url;
  try {
    url = new URL(valor);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.r2.cloudflarestorage.com')) return null;
  return url.href;
}

async function guardarCapa(id, blob, quadro) {
  const preparo = await fetch(`/videos/${id}/capa`, { method: 'POST' });
  const dados = await preparo.json().catch(() => ({}));
  if (!preparo.ok) return null;
  if (dados.pronta) return urlCapaR2(dados.url);
  const destino = urlArquivoSegura(dados.url);
  if (!destino || !dados.chave) return null;
  const envio = await fetch(destino, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob
  });
  if (!envio.ok) return null;
  const confirmacao = await fetch(`/videos/${id}/capa/confirmar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chave: dados.chave, quadro })
  });
  const salvo = await confirmacao.json().catch(() => ({}));
  if (!confirmacao.ok) return null;
  return urlCapaR2(salvo.url);
}

async function montarArquivo(wrapper) {
  const id = wrapper.closest('.video-container')?.dataset.id;
  if (!id) return;
  const marca = String(Date.now());
  wrapper.dataset.abertura = marca;
  fecharOutros(wrapper);
  try {
    const resposta = await fetch(`/videos/${id}/reproducao`);
    const dados = await resposta.json().catch(() => ({}));
    if (wrapper.dataset.abertura !== marca) return;
    if (!resposta.ok) {
      window.alert(dados.erro || 'Não foi possível abrir o vídeo.');
      return;
    }
    const seguro = urlArquivoSegura(dados.url);
    if (!seguro) {
      window.alert('Não foi possível abrir o vídeo.');
      return;
    }
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    const poster = capaAceita(wrapper.dataset.capa);
    if (poster) video.poster = poster;
    video.addEventListener('loadedmetadata', () => {
      const quadro = quadroCliente(video.videoWidth / video.videoHeight);
      if (!quadro) return;
      wrapper.dataset.quadro = quadro;
      aplicarQuadro(wrapper);
    });
    video.src = seguro;
    trocarMidia(wrapper, video);
    video.play().catch(() => {});
  } catch {
    if (wrapper.dataset.abertura === marca) {
      window.alert('Erro ao conectar com o servidor.');
    }
  }
}

function montarPlayer(wrapper) {
  if (wrapper?.dataset.origem === 'arquivo') {
    if (!wrapper.querySelector('video')) montarArquivo(wrapper);
    return;
  }
  const src = srcSeguro(wrapper?.dataset.src);
  if (!src) return;
  const tituloVideo = wrapper.closest('.video-container')?.querySelector('.video-title')?.textContent || 'Vídeo';

  fecharOutros(wrapper);

  if (wrapper.querySelector('iframe')?.dataset.embed === src) return;

  const frame = document.createElement('iframe');
  frame.dataset.embed = src;
  frame.title = tituloVideo;
  frame.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-presentation allow-forms'
  );
  frame.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture; accelerometer; gyroscope; clipboard-write';
  frame.allowFullscreen = true;
  frame.setAttribute('webkitallowfullscreen', '');
  frame.setAttribute('mozallowfullscreen', '');
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.src = src;
  trocarMidia(wrapper, frame);
}

function cancelarPlayerPendente() {
  if (!playerPendente) return;
  clearTimeout(playerPendente);
  playerPendente = null;
}

function abrirPlayer(wrapper, event) {
  if (toqueDireto(event)) {
    cancelarPlayerPendente();
    montarPlayer(wrapper);
    return;
  }
  cancelarPlayerPendente();
  playerPendente = setTimeout(() => {
    playerPendente = null;
    montarPlayer(wrapper);
  }, 280);
}

galeria.addEventListener('error', (event) => {
  if (event.target.classList?.contains('video-capa')) event.target.remove();
}, true);

galeria.addEventListener('pointerover', (event) => {
  const wrapper = event.target.closest('.video-wrapper');
  if (!wrapper) return;
  preconectar(wrapper.dataset.src);
});

function pedirTelaCheia(elemento) {
  const pedir = elemento.requestFullscreen
    || elemento.webkitRequestFullscreen
    || elemento.mozRequestFullScreen;
  if (!pedir) return Promise.reject(new Error('sem tela cheia'));
  try {
    return Promise.resolve(pedir.call(elemento));
  } catch (erro) {
    return Promise.reject(erro);
  }
}

function fecharVideo(container) {
  cancelarPlayerPendente();
  const cheia = document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement;
  if (cheia === container) {
    const sair = document.exitFullscreen
      || document.webkitExitFullscreen
      || document.mozCancelFullScreen;
    if (sair) {
      try {
        Promise.resolve(sair.call(document)).catch(() => {});
      } catch {
        // o navegador recusou sair da tela cheia
      }
    }
  }
  const wrapper = container.querySelector('.video-wrapper');
  if (wrapper?.querySelector('iframe, video')) restaurarFachada(wrapper);
}

function alternarTelaCheia(container) {
  cancelarPlayerPendente();
  const wrapper = container.querySelector('.video-wrapper');
  if (wrapper) montarPlayer(wrapper);
  const cheia = document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement;
  if (cheia) {
    const sair = document.exitFullscreen
      || document.webkitExitFullscreen
      || document.mozCancelFullScreen;
    if (!sair) return;
    try {
      Promise.resolve(sair.call(document)).catch(() => {});
    } catch {
      // o navegador recusou sair da tela cheia
    }
    return;
  }
  pedirTelaCheia(container).catch(() => {
    const frame = container.querySelector('iframe');
    if (frame) pedirTelaCheia(frame).catch(() => {});
  });
}

galeria.querySelectorAll('.video-wrapper').forEach((wrapper) => {
  if (!wrapper.querySelector('.botao-tela-cheia')) wrapper.append(criarBotaoTelaCheia());
});

galeria.addEventListener('click', async (event) => {
  const telaCheia = event.target.closest('.botao-tela-cheia');
  if (telaCheia) {
    if (event.detail > 1) return;
    const container = telaCheia.closest('.video-container');
    if (container) alternarTelaCheia(container);
    return;
  }

  const fechar = event.target.closest('.botao-fechar');
  if (fechar) {
    const container = fechar.closest('.video-container');
    if (container) fecharVideo(container);
    return;
  }

  const fachada = event.target.closest('.video-facade');
  if (fachada) {
    const wrapper = fachada.closest('.video-wrapper');
    if (wrapper) abrirPlayer(wrapper, event);
    return;
  }

  const botao = event.target.closest('.botao-excluir');
  if (!botao) return;

  const nome = botao.closest('.video-container')?.querySelector('.video-title')?.textContent || 'este vídeo';
  if (!window.confirm(`Excluir "${nome}" da galeria?`)) return;

  botao.disabled = true;
  try {
    const resposta = await fetch(`/videos/${botao.dataset.id}`, { method: 'DELETE' });
    if (resposta.status === 204) {
      botao.closest('.video-container')?.remove();
      if (!galeria.querySelector('.video-container')) {
        galeria.innerHTML = '<p class="galeria-vazia">Nenhum vídeo na galeria.</p>';
      }
      return;
    }
    const dados = await resposta.json().catch(() => ({}));
    window.alert(dados.erro || 'Não foi possível excluir o vídeo.');
    botao.disabled = false;
  } catch {
    window.alert('Erro ao conectar com o servidor.');
    botao.disabled = false;
  }
});

document.getElementById('sair').addEventListener('click', async () => {
  try {
    await fetch('/logout', { method: 'POST' });
  } finally {
    window.location.href = '/';
  }
});

function aoMudarTelaCheia() {
  const cheia = document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement;
  document.querySelectorAll('.botao-tela-cheia').forEach((botao) => {
    const ativo = Boolean(cheia) && botao.closest('.video-container') === cheia;
    botao.setAttribute('aria-label', ativo ? 'Sair da tela cheia' : 'Tela cheia');
  });
  if (cheia) {
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(() => {});
    }
    return;
  }
  if (screen.orientation && typeof screen.orientation.unlock === 'function') {
    screen.orientation.unlock();
  }
}

document.addEventListener('fullscreenchange', aoMudarTelaCheia);
document.addEventListener('webkitfullscreenchange', aoMudarTelaCheia);
document.addEventListener('mozfullscreenchange', aoMudarTelaCheia);

async function preencherCapasArquivo() {
  const pendentes = [...galeria.querySelectorAll('.video-wrapper[data-origem="arquivo"]')]
    .filter((wrapper) => !wrapper.querySelector('.video-capa'));
  for (const wrapper of pendentes) {
    if (wrapper.dataset.capa) continue;
    const id = wrapper.closest('.video-container')?.dataset.id;
    if (!id) continue;
    try {
      const resposta = await fetch(`/videos/${id}/reproducao`);
      const dados = await resposta.json().catch(() => ({}));
      const seguro = urlArquivoSegura(dados.url);
      if (!resposta.ok || !seguro || wrapper.querySelector('.video-capa')) continue;
      const { blob, quadro } = await capturarQuadro(seguro, (proporcao) => {
        const medido = quadroCliente(proporcao);
        if (!medido || wrapper.dataset.quadro) return;
        wrapper.dataset.quadro = medido;
        aplicarQuadro(wrapper);
      }, (video) => {
        if (!wrapper.querySelector('.video-facade') || wrapper.querySelector('.video-capa')) return;
        video.className = 'video-capa';
        video.controls = false;
        wrapper.querySelector('.video-facade').prepend(video);
      });
      if (!wrapper.isConnected) continue;
      wrapper.dataset.quadro = quadro;
      aplicarQuadro(wrapper);
      const local = URL.createObjectURL(blob);
      mostrarCapa(wrapper, local);
      const remota = await guardarCapa(id, blob, quadro);
      if (remota) {
        wrapper.dataset.capa = remota;
        mostrarCapa(wrapper, remota);
      }
      URL.revokeObjectURL(local);
    } catch {
      // a visita continua sem capa quando o quadro não pode ser lido
    }
  }
}

galeria.querySelectorAll('.video-wrapper[data-quadro]').forEach(aplicarQuadro);
preencherCapasArquivo();

galeria.addEventListener('dblclick', (event) => {
  if (toqueDireto(event) || event.target.closest('.botao-excluir, .botao-fechar, .botao-tela-cheia')) return;
  const container = event.target.closest('.video-container');
  if (!container) return;
  alternarTelaCheia(container);
});
