import { compararSenha, ehHash, gerarHash } from '../lib/senha.js';

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function registrarRotasConta(app, { banco, sessao, cadastroLiberado }) {
  app.post('/cadastrar', async (req, res) => {
    if (!cadastroLiberado) {
      return res.status(403).json({ erro: 'O cadastro está fechado.' });
    }

    const nome = String(req.body?.nome || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const senha = String(req.body?.senha || '');

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios!' });
    }
    if (!emailValido(email)) {
      return res.status(400).json({ erro: 'Informe um e-mail válido.' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });
    }

    try {
      const hash = await gerarHash(senha);
      await banco.execute({
        sql: 'INSERT INTO utilizadores (nome, email, senha) VALUES (?, ?, ?)',
        args: [nome, email, hash]
      });
      return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
      if (error.message && error.message.includes('UNIQUE')) {
        return res.status(400).json({ erro: 'Este e-mail já está cadastrado!' });
      }
      console.error('Erro no banco:', error);
      return res.status(500).json({ erro: 'Erro interno ao salvar no banco de dados.' });
    }
  });

  app.post('/login', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const senha = String(req.body?.senha || '');

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios!' });
    }

    try {
      const resultado = await banco.execute({
        sql: 'SELECT email, senha FROM utilizadores WHERE email = ? COLLATE NOCASE',
        args: [email]
      });

      if (resultado.rows.length === 0) {
        return res.status(401).json({ erro: 'E-mail ou senha incorretos!' });
      }

      const usuario = resultado.rows[0];
      const armazenada = String(usuario.senha);
      let autorizada = false;

      if (ehHash(armazenada)) {
        autorizada = await compararSenha(senha, armazenada);
      } else if (armazenada === senha) {
        autorizada = true;
        try {
          const hash = await gerarHash(senha);
          await banco.execute({
            sql: 'UPDATE utilizadores SET senha = ? WHERE email = ?',
            args: [hash, usuario.email]
          });
        } catch (error) {
          console.error('Não foi possível gravar o hash da senha:', error);
        }
      }

      if (!autorizada) {
        return res.status(401).json({ erro: 'E-mail ou senha incorretos!' });
      }

      sessao.definir(res, String(usuario.email).toLowerCase());
      return res.status(200).json({ mensagem: 'Login autorizado!' });
    } catch (error) {
      console.error('Erro no login:', error);
      return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
  });

  app.post('/logout', (req, res) => {
    sessao.apagar(res);
    return res.status(204).end();
  });
}
