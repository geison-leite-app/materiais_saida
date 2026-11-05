export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'METODO_NAO_PERMITIDO' });
  }

  return res.status(200).json({
    ok: true,
    servico: 'materiais-saida-obra',
    versao: '0.2.0',
    em: new Date().toISOString(),
  });
}
