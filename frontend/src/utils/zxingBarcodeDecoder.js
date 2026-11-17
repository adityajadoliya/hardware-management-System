/**
 * In-memory high performance ZXing barcode reader
 * Decodes 1D (Code 128, Code 39, ITF, Codabar) and 2D (QR, DataMatrix) directly from canvas in < 5ms
 */
import * as ZXing from 'html5-qrcode/third_party/zxing-js.umd';

let cachedReader = null;

function getReader() {
  if (cachedReader) return cachedReader;

  const formats = [
    ZXing.BarcodeFormat.CODE_128,
    ZXing.BarcodeFormat.CODE_39,
    ZXing.BarcodeFormat.QR_CODE,
    ZXing.BarcodeFormat.DATA_MATRIX,
    ZXing.BarcodeFormat.EAN_13,
    ZXing.BarcodeFormat.UPC_A,
    ZXing.BarcodeFormat.ITF,
    ZXing.BarcodeFormat.CODABAR
  ];

  const hints = new Map();
  hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

  cachedReader = new ZXing.MultiFormatReader();
  cachedReader.setHints(hints);
  return cachedReader;
}

export function decodeBarcodeFromCanvas(canvas) {
  if (!canvas || !canvas.width || !canvas.height) return '';

  try {
    const reader = getReader();
    const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
    const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(luminanceSource));
    const result = reader.decode(binaryBitmap);
    return result?.getText?.() || result?.text || '';
  } catch (e) {
    try {
      const reader = getReader();
      const luminanceSource = new ZXing.HTMLCanvasElementLuminanceSource(canvas);
      const binaryBitmap = new ZXing.BinaryBitmap(new ZXing.GlobalHistogramBinarizer(luminanceSource));
      const result = reader.decode(binaryBitmap);
      return result?.getText?.() || result?.text || '';
    } catch (e2) {
      return '';
    }
  }
}
