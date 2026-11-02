import 'dotenv/config';
import { createClient } from '@libsql/client';
import videos from './data/videos.js';
import { buscarCapa } from './lib/capa.js';
import { criarApp } from './lib/app.js';

const obrigatorias = ['TURSO_URL', 'TURSO_TOKEN', 'SESSION_SECRET'];
for (const chave of obrigatorias) {
  if (!process.env[chave]) {
    console.error(`Falta a variável de ambiente ${chave}.`);
    process.exit(1);
  }
}

const emProducao = process.env.NODE_ENV === 'production';
const banco = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN
});

const app = criarApp({
  banco,
  segredo: process.env.SESSION_SECRET,
  cadastroLiberado: process.env.CADASTRO_LIBERADO === 'true',
  emProducao,
  videosIniciais: videos,
  buscarCapa
});

if (!emProducao) {
  app.listen(3000, () => {
    console.log('Servidor rodando localmente em http://localhost:3000');
  });
}

export default app;
