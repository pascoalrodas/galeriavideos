import { AwsClient } from 'aws4fetch';

export function criarArmazenamentoR2({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucket,
  expiracaoEnvio = 900,
  expiracaoLeitura = 6 * 60 * 60
}) {
  const client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    service: 's3',
    region: 'auto'
  });
  const origem = `https://${accountId}.r2.cloudflarestorage.com`;

  function endereco(chave) {
    const caminho = String(chave).split('/').map((parte) => encodeURIComponent(parte)).join('/');
    return `${origem}/${bucket}/${caminho}`;
  }

  async function assinar(url, method, headers) {
    const pedido = new Request(url, { method, headers });
    const assinado = await client.sign(pedido, {
      aws: { signQuery: true, allHeaders: Boolean(headers) }
    });
    return String(assinado.url);
  }

  return {
    async urlEnvio({ chave, tipo }) {
      const url = new URL(endereco(chave));
      url.searchParams.set('X-Amz-Expires', String(expiracaoEnvio));
      return assinar(url, 'PUT', { 'Content-Type': tipo });
    },
    async urlLeitura(chave) {
      const url = new URL(endereco(chave));
      url.searchParams.set('X-Amz-Expires', String(expiracaoLeitura));
      return assinar(url, 'GET');
    },
    async detalhes(chave) {
      const resposta = await client.fetch(endereco(chave), { method: 'HEAD' });
      if (resposta.status === 404) return null;
      if (!resposta.ok) {
        const erro = new Error('Não foi possível consultar o arquivo.');
        erro.status = 502;
        throw erro;
      }
      return {
        tamanho: Number(resposta.headers.get('content-length') || 0),
        tipo: String(resposta.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      };
    },
    async excluir(chave) {
      const resposta = await client.fetch(endereco(chave), { method: 'DELETE' });
      if (resposta.status === 404 || resposta.ok) return;
      const erro = new Error('Não foi possível apagar o arquivo.');
      erro.status = 502;
      throw erro;
    }
  };
}
