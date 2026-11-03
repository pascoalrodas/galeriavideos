const botaoAbrir = document.getElementById('abrir-inserir');
const painel = document.getElementById('form-video');
const mensagem = document.getElementById('mensagem-video');
const titulo = document.getElementById('titulo-video');
const iframe = document.getElementById('iframe-video');
const galeria = document.querySelector('.gallery');

botaoAbrir.addEventListener('click', () => {
  const aberto = !painel.classList.toggle('escondido');
  botaoAbrir.setAttribute('aria-expanded', String(aberto));
  if (aberto) titulo.focus();
});

painel.addEventListener('submit', async (event) => {
  event.preventDefault();
  mensagem.textContent = '';
  mensagem.className = 'mensagem-video';
  const botao = painel.querySelector('button[type="submit"]');
  botao.disabled = true;

  try {
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
  } catch {
    mensagem.textContent = 'Erro ao conectar com o servidor.';
    mensagem.classList.add('erro');
  } finally {
    botao.disabled = false;
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

function criarFachada(titulo, capa) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'video-facade';
  botao.setAttribute('aria-label', `Assistir: ${titulo}`);
  const segura = capaSegura(capa);
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

function restaurarFachada(wrapper) {
  const titulo = wrapper.closest('.video-container')?.querySelector('.video-title')?.textContent || 'Vídeo';
  trocarMidia(wrapper, criarFachada(titulo, wrapper.dataset.capa));
}

function montarPlayer(wrapper) {
  const src = srcSeguro(wrapper?.dataset.src);
  if (!src) return;
  const titulo = wrapper.closest('.video-container')?.querySelector('.video-title')?.textContent || 'Vídeo';

  galeria.querySelectorAll('.video-wrapper').forEach((outro) => {
    if (outro !== wrapper && outro.querySelector('iframe')) restaurarFachada(outro);
  });

  if (wrapper.querySelector('iframe')?.dataset.embed === src) return;

  const frame = document.createElement('iframe');
  frame.dataset.embed = src;
  frame.title = titulo;
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

galeria.addEventListener('dblclick', (event) => {
  if (toqueDireto(event) || event.target.closest('.botao-excluir, .botao-tela-cheia')) return;
  const container = event.target.closest('.video-container');
  if (!container) return;
  alternarTelaCheia(container);
});
