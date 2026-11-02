import crypto from 'crypto';

const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;
const SETE_DIAS_SEG = 7 * 24 * 60 * 60;

export function assinarSessao(email, segredo, agora = Date.now()) {
  const corpo = Buffer.from(JSON.stringify({
    email,
    exp: agora + SETE_DIAS_MS
  })).toString('base64url');
  const assinatura = crypto.createHmac('sha256', segredo).update(corpo).digest('base64url');
  return `${corpo}.${assinatura}`;
}

export function lerSessao(token, segredo, agora = Date.now()) {
  if (!token || !segredo) return null;

  const ponto = token.lastIndexOf('.');
  if (ponto <= 0) return null;

  const corpo = token.slice(0, ponto);
  const assinatura = token.slice(ponto + 1);
  const esperada = crypto.createHmac('sha256', segredo).update(corpo).digest('base64url');

  const recebida = Buffer.from(assinatura);
  const calculada = Buffer.from(esperada);
  if (recebida.length !== calculada.length || !crypto.timingSafeEqual(recebida, calculada)) {
    return null;
  }

  try {
    const dados = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    if (!dados.email || typeof dados.exp !== 'number' || dados.exp < agora) return null;
    return { email: dados.email };
  } catch {
    return null;
  }
}

export function lerCookie(cabecalho, nome) {
  if (!cabecalho) return null;

  for (const parte of cabecalho.split(';')) {
    const separador = parte.indexOf('=');
    if (separador === -1) continue;
    const chave = parte.slice(0, separador).trim();
    if (chave !== nome) continue;
    return decodeURIComponent(parte.slice(separador + 1).trim());
  }

  return null;
}

export function cabecalhoCookie(token, { seguro = false } = {}) {
  const partes = [
    `sessao=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${SETE_DIAS_SEG}`
  ];
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}

export function cabecalhoCookieVazio({ seguro = false } = {}) {
  const partes = [
    'sessao=',
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (seguro) partes.push('Secure');
  return partes.join('; ');
}
