import { montarGrade } from '../lib/galeria.js';
import { normalizarSrc } from '../lib/iframe.js';
import { VideoDuplicado } from '../lib/repositorio-videos.js';

const TITULO_MAX = 180;
const IFRAME_MAX = 4000;

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

export function registrarRotasGaleria(app, { repositorio, sessao, template }) {
  app.get('/galeria', async (req, res) => {
    if (!sessao.ler(req)) return res.redirect('/');
    const videos = await repositorio.listar();
    const grade = videos.length
      ? montarGrade(videos)
      : '<p class="galeria-vazia">Nenhum vídeo na galeria.</p>';
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

  app.delete('/videos/:id', async (req, res) => {
    if (!exigirSessao(sessao, req, res)) return;

    const id = lerId(req.params.id);
    if (!id) return res.status(400).json({ erro: 'Vídeo inválido.' });

    const removido = await repositorio.excluir(id);
    if (!removido) return res.status(404).json({ erro: 'Vídeo não encontrado.' });
    return res.status(204).end();
  });
}
