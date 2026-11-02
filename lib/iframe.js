const HOSTS = new Set(['www.xvideos.com', 'www.xnxx.com']);
const ID_EMBED = /^[A-Za-z0-9_-]{1,80}$/;

function extrairSrcBruto(entrada) {
  const texto = String(entrada ?? '').trim();
  const atributo = texto.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const bruto = atributo ? (atributo[1] ?? atributo[2] ?? atributo[3] ?? '') : texto;
  return bruto.replaceAll('&amp;', '&').trim();
}

export function normalizarSrc(entrada) {
  let url;
  try {
    url = new URL(extrairSrcBruto(entrada));
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  if (!HOSTS.has(url.hostname)) return null;
  if (url.username || url.password || url.port || url.search || url.hash) return null;

  const partes = url.pathname.split('/').filter(Boolean);
  if (partes.length !== 2 || partes[0] !== 'embedframe') return null;
  if (!ID_EMBED.test(partes[1])) return null;

  return `https://${url.hostname}/embedframe/${partes[1]}`;
}
