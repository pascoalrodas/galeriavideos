-- Contas da galeria. A coluna senha guarda hash bcrypt, nunca a senha em texto.
CREATE TABLE IF NOT EXISTS utilizadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

-- Vídeos inseridos pela galeria. O aplicativo cria estas tabelas ao subir.
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  src TEXT NOT NULL UNIQUE,
  ordem INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_meta (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
