const HOST_CAPA = /^(?:[a-z0-9-]+\.)*(?:xvideos-cdn|xnxx-cdn)\.com$/i;
const LIMITE_HTML = 2_000_000;

function candidato(html, regex, grupo) {
  const achado = String(html).match(regex);
  return achado?.[grupo] || null;
}

export function normalizarCapa(entrada) {
  let url;
  try {
    url = new URL(String(entrada ?? '').trim().replaceAll('&amp;', '&'));
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  if (!HOST_CAPA.test(url.hostname)) return null;
  if (url.username || url.password || url.port || url.search || url.hash) return null;
  if (!/\.(?:jpe?g|webp)$/i.test(url.pathname)) return null;
  return url.href;
}

export function extrairCapa(html) {
  const texto = String(html ?? '');
  const brutos = [
    candidato(texto, /setThumbUrl169\(\s*(['"])(https:\/\/[^'"\s]+)\1\s*\)/, 2),
    candidato(texto, /setThumbUrl\(\s*(['"])(https:\/\/[^'"\s]+)\1\s*\)/, 2),
    candidato(texto, /property=["']og:image["'][^>]*content=["'](https:\/\/[^"']+)["']/i, 1),
    candidato(texto, /content=["'](https:\/\/[^"']+)["'][^>]*property=["']og:image["']/i, 1)
  ];
  for (const bruto of brutos) {
    const capa = normalizarCapa(bruto);
    if (capa) return capa;
  }
  return null;
}

export async function buscarCapa(src, { obter = fetch, timeoutMs = 8000 } = {}) {
  try {
    const resposta = await obter(src, {
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!resposta.ok) return '';
    const html = await resposta.text();
    if (html.length > LIMITE_HTML) return '';
    return extrairCapa(html) || '';
  } catch {
    return '';
  }
}
