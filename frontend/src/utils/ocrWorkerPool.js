/**
 * High-Speed Singleton OCR Worker Pool
 * Pre-initializes once and reuses the worker to avoid 15-second re-initialization lags.
 */
import { createWorker } from 'tesseract.js';

let sharedWorker = null;
let isInitializing = false;
let initPromise = null;

export async function getSharedOCRWorker() {
  if (sharedWorker) {
    return sharedWorker;
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      // First try locally served static assets (fast, offline-ready)
      let worker = null;
      try {
        const localWorkerPromise = createWorker('eng', 1, {
          workerPath: '/tesseract/worker.min.js',
          corePath: '/tesseract/tesseract-core-simd-lstm.wasm.js',
          langPath: '/tesseract',
          logger: () => {}
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Local load timeout')), 5000)
        );
        worker = await Promise.race([localWorkerPromise, timeoutPromise]);
      } catch (localErr) {
        // Fallback to default CDN if local assets are not reachable
        worker = await createWorker('eng', 1, { logger: () => {} });
      }

      try {
        // PSM 11 (Sparse text) is optimal for hardware labels, barcodes & nameplates
        await worker.setParameters({
          tessedit_pageseg_mode: '11'
        });
      } catch (e) {}

      sharedWorker = worker;
      isInitializing = false;
      return worker;
    } catch (err) {
      console.warn('OCR Worker notice (fast fallback engaged):', err.message);
      isInitializing = false;
      sharedWorker = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * High-Clarity Preprocessing for Maximum OCR Accuracy
 * Retains high resolution (up to 1600px) so fine serial number digits (3 vs 6 vs 8) remain sharp.
 */
export function optimizeImageForFastOCR(imageSrc, maxWidth = 1600) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, width, height);

      // Intelligent dynamic contrast stretch without destroying character anatomy
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;

      // Find min & max brightness
      let minL = 255;
      let maxL = 0;
      for (let i = 0; i < d.length; i += 16) {
        const l = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        if (l < minL) minL = l;
        if (l > maxL) maxL = l;
      }

      const range = Math.max(30, maxL - minL);

      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // Gentle normalized stretch
        const stretched = Math.min(255, Math.max(0, Math.round(((gray - minL) / range) * 255)));
        d[i] = stretched;
        d[i + 1] = stretched;
        d[i + 2] = stretched;
      }
      ctx.putImageData(imgData, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
