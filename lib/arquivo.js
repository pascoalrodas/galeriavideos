export const LIMITE_ARQUIVO = 2 * 1024 * 1024 * 1024;

const TIPOS = new Map([
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
  ['video/quicktime', 'mov'],
  ['video/ogg', 'ogv']
]);

const CHAVE = /^videos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp4|webm|mov|ogv)$/;

export function extensaoDoTipo(tipo) {
  return TIPOS.get(String(tipo || '').trim().toLowerCase()) || null;
}

export function tipoDaExtensao(extensao) {
  for (const [tipo, ext] of TIPOS) {
    if (ext === extensao) return tipo;
  }
  return null;
}

export function novaChave(tipo) {
  const extensao = extensaoDoTipo(tipo);
  if (!extensao) return null;
  return `videos/${crypto.randomUUID()}.${extensao}`;
}

export function chaveValida(chave) {
  return CHAVE.test(String(chave || ''));
}

export function srcArquivo(chave) {
  return `r2:${chave}`;
}

export function chaveDoSrc(src) {
  const valor = String(src || '');
  if (!valor.startsWith('r2:')) return null;
  const chave = valor.slice(3);
  return chaveValida(chave) ? chave : null;
}

