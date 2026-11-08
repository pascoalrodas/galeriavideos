import {
  LIMITE_ARQUIVO,
  chaveDoSrc,
  chaveValida,
  extensaoDoTipo,
  novaChave,
  srcArquivo,
  tipoDaExtensao
} from '../lib/arquivo.js';
import { montarGrade } from '../lib/galeria.js';
import { normalizarSrc } from '../lib/iframe.js';
import { VideoDuplicado } from '../lib/repositorio-videos.js';

const TITULO_MAX = 180;
const IFRAME_MAX = 4000;
const POLITICA_FRAME = 'frame-src https://www.xvideos.com/embedframe/ https://www.xnxx.com/embedframe/';

function exigirSessao(sessao, req, res) {
  if (sessao.ler(req)) return true;
  res.status(401).json({ erro: 'Faça login para continuar.' });
  return false;
}

function lerTitulo(valor) {
  const titulo = String(valor ?? '').trim().replace(/\s+/g, ' ');
  if (!titulo) return { erro: 'Informe o título do vídeo.' };
  if (titulo.length > TITULO_MAX) return { erro: 'O título é longo demais.' };
  return { titulo };
}

function lerId(valor) {
  if (!/^\d+$/.test(String(valor ?? ''))) return null;
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return id;
}

function armazenamentoAusente(res) {
  res.status(503).json({ erro: 'O envio de arquivos não está configurado.' });
}

export function registrarRotasGaleria(app, { repositorio, sessao, template, armazenamento = null }) {
  app.get('/galeria', async (req, res) => {
    if (!sessao.ler(req)) return res.redirect('/');
    const videos = await repositorio.listar();
    const grade = videos.length
      ? montarGrade(videos)
      : '<p class="galeria-vazia">Nenhum vídeo na galeria.</p>';
    res.set('Content-Security-Policy', POLITICA_FRAME);
    res.type('html').send(template.replace('{{GRADE}}', () => grade));
  });

  app.post('/videos', async (req, res) => {
    if (!exigirSessao(sessao, req, res)) return;

    const titulo = lerTitulo(req.body?.titulo);
    if (titulo.erro) return res.status(400).json({ erro: titulo.erro });

    const bruto = String(req.body?.iframe ?? '');
    if (!bruto.trim()) return res.status(400).json({ erro: 'Cole o código do iframe.' });
    if (bruto.length > IFRAME_MAX) {
      return res.status(400).json({ erro: 'O código do iframe é longo demais.' });
    }

    const src = normalizarSrc(bruto);
    if (!src) {
      return res.status(400).json({ erro: 'Use um iframe de embed do xvideos ou do xnxx.' });
    }

    try {
      const video = await repositorio.inserir({ titulo: titulo.titulo, src });
      return res.status(201).json(video);
    } catch (error) {
      if (error instanceof VideoDuplicado) {
        return res.status(409).json({ erro: error.message });
      }
      throw error;
    }
  });

  app.post('/videos/envio', async (req, res) => {
    if (!exigirSessao(sessao, req, res)) return;
    if (!armazenamento) return armazenamentoAusente(res);

    const titulo = lerTitulo(req.body?.titulo);
    if (titulo.erro) return res.status(400).json({ erro: titulo.erro });

    const tipo = String(req.body?.tipo || '').trim().toLowerCase();
    if (!extensaoDoTipo(tipo)) {
      return res.status(400).json({ erro: 'Use um vídeo MP4, WebM, MOV ou OGG.' });
    }

    const tamanho = Number(req.body?.tamanho);
    if (!Number.isSafeInteger(tamanho) || tamanho <= 0) {
      return res.status(400).json({ erro: 'Escolha um arquivo de vídeo.' });
    }
    if (tamanho > LIMITE_ARQUIVO) {
      return res.status(400).json({ erro: 'O arquivo passa de 2 GB.' });
    }

    const chave = novaChave(tipo);
    try {
      const url = await armazenamento.urlEnvio({ chave, tipo });
      return res.status(200).json({ chave, url, tipo, titulo: titulo.titulo });
    } catch (error) {
      console.error(error);
      return res.status(502).json({ erro: 'Não foi possível preparar o envio.' });
    }
  });

  app.post('/videos/arquivo', async (req, res) => {
    if (!exigirSessao(sessao, req, res)) return;
    if (!armazenamento) return armazenamentoAusente(res);

    const titulo = lerTitulo(req.body?.titulo);
    if (titulo.erro) return res.status(400).json({ erro: titulo.erro });

    const chave = String(req.body?.chave || '');
    if (!chaveValida(chave)) return res.status(400).json({ erro: 'Arquivo inválido.' });

    let detalhes;
    try {
      detalhes = await armazenamento.detalhes(chave);
    } catch (error) {
      console.error(error);
      return res.status(502).json({ erro: 'Não foi possível confirmar o arquivo.' });
    }
    if (!detalhes) return res.status(400).json({ erro: 'O arquivo não chegou ao armazenamento.' });

    const tipoEsperado = tipoDaExtensao(chave.split('.').pop());
    const tipoRecebido = detalhes.tipo;
    const tamanhoOk = Number.isSafeInteger(detalhes.tamanho)
      && detalhes.tamanho > 0
      && detalhes.tamanho <= LIMITE_ARQUIVO;
    const tipoOk = !tipoRecebido || tipoRecebido === tipoEsperado;
    if (!tamanhoOk || !tipoOk) {
      try {
        await armazenamento.excluir(chave);
      } catch (error) {
        console.error(error);
      }
      return res.status(400).json({ erro: 'O arquivo enviado não foi aceito.' });
    }

    try {
      const video = await repositorio.inserir({ titulo: titulo.titulo, src: srcArquivo(chave) });
      return res.status(201).json({ id: video.id, titulo: video.titulo, origem: 'arquivo' });
    } catch (error) {
      if (error instanceof VideoDuplicado) {
        return res.status(409).json({ erro: error.message });
      }
      throw error;
    }
  });

  app.get('/videos/:id/reproducao', async (req, res) => {
    if (!exigirSessao(sessao, req, res)) return;
    res.set('Cache-Control', 'no-store');

    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'Vídeo inválido.' });

    const video = await repositorio.obter(id);
    if (!video) return res.status(404).json({ erro: 'Vídeo não encontrado.' });

    const chave = chaveDoSrc(video.src);
    if (!chave) return res.status(400).json({ erro: 'Esse vídeo não é um arquivo.' });
    if (!armazenamento) return armazenamentoAusente(res);

    try {
      const url = await armazenamento.urlLeitura(chave);
      return res.json({ url });
    } catch (error) {
      console.error(error);
      return res.status(502).json({ erro: 'Não foi possível abrir o vídeo.' });
    }
  });

  app.delete('/videos/:id', async (req, res) => {
    if (!exigirSessao(sessao, req, res)) return;

    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'Vídeo inválido.' });

    const video = await repositorio.obter(id);
    if (!video) return res.status(404).json({ erro: 'Vídeo não encontrado.' });

    const chave = chaveDoSrc(video.src);
    if (chave) {
      if (!armazenamento) return armazenamentoAusente(res);
      try {
        await armazenamento.excluir(chave);
      } catch (error) {
        console.error(error);
        return res.status(502).json({ erro: 'Não foi possível apagar o arquivo.' });
      }
    }

    const removido = await repositorio.excluir(id);
    if (!removido) return res.status(404).json({ erro: 'Vídeo não encontrado.' });
    return res.status(204).end();
  });
}
