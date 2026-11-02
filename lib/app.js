import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { criarRepositorioVideos } from './repositorio-videos.js';
import { criarSessaoHttp } from './sessao-http.js';
import { registrarRotasConta } from '../rotas/conta.js';
import { registrarRotasGaleria } from '../rotas/galeria.js';
import { registrarRotasPaginas } from '../rotas/paginas.js';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

export function criarApp({
  banco,
  segredo,
  cadastroLiberado = false,
  emProducao = false,
  videosIniciais = [],
  buscarCapa = null
}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '32kb' }));

  const sessao = criarSessaoHttp(segredo, { seguro: emProducao });
  const repositorio = criarRepositorioVideos(banco, { iniciais: videosIniciais, buscarCapa });
  const template = fs.readFileSync(path.join(raiz, 'views', 'galeria.html'), 'utf8');

  registrarRotasPaginas(app, { sessao, raiz });
  registrarRotasGaleria(app, { repositorio, sessao, template });
  registrarRotasConta(app, { banco, sessao, cadastroLiberado });

  app.use(express.static(path.join(raiz, 'public'), { index: false }));

  app.use((erro, req, res, next) => {
    const status = Number(erro.status || erro.statusCode) || 500;
    if (status >= 500) console.error(erro);
    if (res.headersSent) return next(erro);
    if (req.method === 'GET' && !req.path.startsWith('/videos')) {
      return res.status(status).type('html').send('<p>Erro interno no servidor.</p>');
    }
    const mensagem = status === 400
      ? 'Os dados enviados não são um JSON válido.'
      : 'Erro interno no servidor.';
    return res.status(status).json({ erro: mensagem });
  });

  return app;
}
