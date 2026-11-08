import { normalizarCapa } from './capa.js';

export class VideoDuplicado extends Error {
  constructor() {
    super('Esse vídeo já está na galeria.');
    this.name = 'VideoDuplicado';
  }
}

function linha(row) {
  return {
    id: Number(row.id),
    titulo: String(row.titulo),
    src: String(row.src),
    poster: normalizarCapa(row.poster)
  };
}

function posterParaGravar(valor) {
  return normalizarCapa(valor) || '';
}

async function mapaLimitado(itens, limite, tarefa) {
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      const indice = proximo;
      proximo += 1;
      await tarefa(itens[indice]);
    }
  }
  const trabalhadores = Math.min(limite, itens.length);
  await Promise.all(Array.from({ length: trabalhadores }, () => trabalhador()));
}

function ehConflito(error) {
  const codigo = String(error?.code || '');
  const mensagem = String(error?.message || '');
  return codigo.includes('CONSTRAINT') || /UNIQUE|PRIMARY KEY/i.test(mensagem);
}

async function garantirTabelas(banco) {
  await banco.execute(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      src TEXT NOT NULL UNIQUE,
      ordem INTEGER NOT NULL,
      poster TEXT
    )
  `);
  const colunas = await banco.execute('PRAGMA table_info(videos)');
  const temPoster = colunas.rows.some((coluna) => coluna.name === 'poster');
  if (!temPoster) {
    await banco.execute('ALTER TABLE videos ADD COLUMN poster TEXT');
  }
  await banco.execute(`
    CREATE TABLE IF NOT EXISTS app_meta (
      chave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);
}

async function semear(banco, iniciais) {
  const existente = await banco.execute({
    sql: "SELECT 1 AS ok FROM app_meta WHERE chave = 'videos_semeados'"
  });
  if (existente.rows.length > 0) return;

  const comandos = [
    {
      sql: "INSERT INTO app_meta (chave, valor) VALUES ('videos_semeados', '1')"
    },
    ...iniciais.map((video, indice) => ({
      sql: 'INSERT OR IGNORE INTO videos (titulo, src, ordem) VALUES (?, ?, ?)',
      args: [video.titulo, video.src, indice + 1]
    }))
  ];

  try {
    await banco.batch(comandos, 'write');
  } catch (error) {
    if (!ehConflito(error)) throw error;
  }
}

export function criarRepositorioVideos(banco, { iniciais = [], buscarCapa = null } = {}) {
  let preparacao = null;

  async function preencherCapas() {
    if (typeof buscarCapa !== 'function') return;
    const faltando = await banco.execute(
      "SELECT id, src FROM videos WHERE poster IS NULL AND src NOT LIKE 'r2:%'"
    );
    await mapaLimitado(faltando.rows, 4, async (row) => {
      const poster = posterParaGravar(await buscarCapa(String(row.src)));
      await banco.execute({
        sql: 'UPDATE videos SET poster = ? WHERE id = ? AND poster IS NULL',
        args: [poster, Number(row.id)]
      });
    });
  }

  function preparar() {
    if (!preparacao) {
      preparacao = garantirTabelas(banco)
        .then(() => semear(banco, iniciais))
        .catch((error) => {
          preparacao = null;
          throw error;
        });
    }
    return preparacao;
  }

  return {
    preparar,
    async listar() {
      await preparar();
      await preencherCapas();
      const resultado = await banco.execute(
        'SELECT id, titulo, src, poster FROM videos ORDER BY ordem ASC, id ASC'
      );
      return resultado.rows.map(linha);
    },
    async obter(id) {
      await preparar();
      const resultado = await banco.execute({
        sql: 'SELECT id, titulo, src, poster FROM videos WHERE id = ?',
        args: [id]
      });
      return resultado.rows[0] ? linha(resultado.rows[0]) : null;
    },
    async inserir({ titulo, src }) {
      await preparar();
      const arquivo = String(src).startsWith('r2:');
      const poster = !arquivo && typeof buscarCapa === 'function'
        ? posterParaGravar(await buscarCapa(src))
        : '';
      try {
        const resultado = await banco.execute({
          sql: `
            INSERT INTO videos (titulo, src, ordem, poster)
            VALUES (?, ?, (SELECT COALESCE(MIN(ordem), 1) - 1 FROM videos), ?)
            RETURNING id, titulo, src, poster
          `,
          args: [titulo, src, poster]
        });
        return linha(resultado.rows[0]);
      } catch (error) {
        if (ehConflito(error)) throw new VideoDuplicado();
        throw error;
      }
    },
    async excluir(id) {
      await preparar();
      const resultado = await banco.execute({
        sql: 'DELETE FROM videos WHERE id = ?',
        args: [id]
      });
      return resultado.rowsAffected > 0;
    }
  };
}
