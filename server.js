import 'dotenv/config';
import { createClient } from '@libsql/client';
import videos from './data/videos.js';
import { criarArmazenamentoR2 } from './lib/armazenamento-r2.js';
import { buscarCapa } from './lib/capa.js';
import { criarApp } from './lib/app.js';

const obrigatorias = ['TURSO_URL', 'TURSO_TOKEN', 'SESSION_SECRET'];
for (const chave of obrigatorias) {
  if (!process.env[chave]) {
    console.error(`Falta a variável de ambiente ${chave}.`);
    process.exit(1);
  }
}

function armazenamentoDoAmbiente() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || 'galeria-de-videos';
  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.error('Envio de arquivos desligado: faltam R2_ACCOUNT_ID, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.');
    return null;
  }
  return criarArmazenamentoR2({ accountId, accessKeyId, secretAccessKey, bucket });
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
  buscarCapa,
  armazenamento: armazenamentoDoAmbiente()
});

if (!emProducao) {
  app.listen(3000, () => {
    console.log('Servidor rodando localmente em http://localhost:3000');
  });
}

export default app;
