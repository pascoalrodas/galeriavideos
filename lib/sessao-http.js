import {
  assinarSessao,
  cabecalhoCookie,
  cabecalhoCookieVazio,
  lerCookie,
  lerSessao
} from './sessao.js';

export function criarSessaoHttp(segredo, { seguro = false } = {}) {
  return {
    ler(req) {
      const token = lerCookie(req.headers.cookie, 'sessao');
      return lerSessao(token, segredo);
    },
    definir(res, email) {
      const token = assinarSessao(email, segredo);
      res.setHeader('Set-Cookie', cabecalhoCookie(token, { seguro }));
    },
    apagar(res) {
      res.setHeader('Set-Cookie', cabecalhoCookieVazio({ seguro }));
    }
  };
}
