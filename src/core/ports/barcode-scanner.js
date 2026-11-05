/**
 * Contrato do leitor de códigos.
 * Adapters: BarcodeDetector nativo, ZXing, futuro leitor Bluetooth.
 *
 * @typedef {Object} ResultadoLeitura
 * @property {string} rawValue Código lido, sem tratamento.
 * @property {string} format Formato normalizado (EAN-13, QR-CODE...).
 * @property {number} lidoEm Timestamp em milissegundos.
 *
 * @typedef {Object} BarcodeScanner
 * @property {string} nome
 * @property {boolean} lanternaDisponivel
 * @property {(video: HTMLVideoElement, onDetect: (resultado: ResultadoLeitura) => void) => Promise<void>} iniciar
 * @property {() => Promise<void>} parar
 * @property {(ligada: boolean) => Promise<void>} alternarLanterna
 */

export {};
