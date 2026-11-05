const ROTULOS = {
  qr_code: 'QR Code',
  data_matrix: 'Data Matrix',
  pdf417: 'PDF417',
  aztec: 'Aztec',
  codabar: 'Codabar',
};

/**
 * Converte o identificador técnico do formato em rótulo legível.
 * @param {string|number} formato
 */
export function rotuloDoFormato(formato) {
  const chave = String(formato ?? '')
    .trim()
    .toLowerCase();

  if (ROTULOS[chave]) return ROTULOS[chave];

  return chave.replace(/_/g, '-').toUpperCase();
}
