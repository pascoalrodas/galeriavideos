// Função para sair da conta
function sairDaConta() {
  sessionStorage.removeItem('usuarioLogado');
  sessionStorage.removeItem('emailUsuario');
  window.location.href = 'index.html';
}

// Controle de Fullscreen + Orientação
function handleFullscreenChange() {
  if (document.fullscreenElement || 
      document.webkitFullscreenElement || 
      document.mozFullScreenElement) {
    
    if (screen.orientation && typeof screen.orientation.lock === 'function') {
      screen.orientation.lock('landscape').catch(() => {
        console.log("Não foi possível bloquear orientação (comum em alguns navegadores)");
      });
    }
  } else {
    if (screen.orientation && typeof screen.orientation.unlock === 'function') {
      screen.orientation.unlock();
    }
  }
}

// Eventos de fullscreen
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);

// Clique duplo para fullscreen
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.video-container').forEach(container => {
    container.style.cursor = 'pointer';
    container.addEventListener('dblclick', () => {
      if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
          console.log('Erro fullscreen:', err);
          // Fallback: tentar no iframe
          const iframe = container.querySelector('iframe');
          if (iframe && iframe.requestFullscreen) iframe.requestFullscreen();
        });
      } else {
        document.exitFullscreen();
      }
    });
  });
});
