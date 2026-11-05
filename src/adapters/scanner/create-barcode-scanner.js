import { createNativeBarcodeScanner, suportaLeitorNativo } from './native-barcode-detector.js';
import { createZxingBarcodeScanner } from './zxing-barcode-scanner.js';

/**
 * Escolhe o melhor leitor disponível: nativo primeiro, ZXing como fallback.
 * Retorna null quando não há como acessar a câmera.
 *
 * @returns {Promise<import('../../core/ports/barcode-scanner.js').BarcodeScanner | null>}
 */
export async function criarBarcodeScanner() {
  if (await suportaLeitorNativo()) {
    return createNativeBarcodeScanner();
  }

  if (navigator.mediaDevices?.getUserMedia) {
    return createZxingBarcodeScanner();
  }

  return null;
}
