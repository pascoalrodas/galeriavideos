// Função para encerrar a sessão
    function sairDaConta() {
      sessionStorage.removeItem('usuarioLogado');
      sessionStorage.removeItem('emailUsuario');
      window.location.href = 'index.html';
    }

    // Controle de Fullscreen + Orientação Landscape
    function handleFullscreenChange() {
      if (document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.mozFullScreenElement) {
        
        // Tenta forçar modo paisagem
        if (screen.orientation && typeof screen.orientation.lock === 'function') {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } else {
        // Volta para orientação normal
        if (screen.orientation && typeof screen.orientation.unlock === 'function') {
          screen.orientation.unlock();
        }
      }
    }

    // Monitora mudanças de fullscreen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    // Clique duplo no vídeo para ativar/desativar fullscreen
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.video-container').forEach(container => {
        container.addEventListener('dblclick', () => {
          if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
              console.log('Erro ao entrar em fullscreen:', err);
            });
          } else {
            document.exitFullscreen();
          }
        });
      });
    });