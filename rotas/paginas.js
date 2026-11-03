import path from 'path';

export function registrarRotasPaginas(app, { sessao, raiz }) {
  app.get('/', (req, res) => {
    if (sessao.ler(req)) return res.redirect('/galeria');
    res.sendFile(path.join(raiz, 'public', 'index.html'));
  });

  app.get(['/index.html', '/paginainicial.html'], (req, res) => {
    res.redirect(req.path === '/paginainicial.html' ? '/galeria' : '/');
  });
}
