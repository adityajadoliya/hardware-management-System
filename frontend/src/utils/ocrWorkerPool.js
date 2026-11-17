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
      const workerPromise = createWorker('eng', 1, {
        logger: () => {} // Silent for maximum speed
      });

      // Strict 1.5s timeout on downloading worker - if network is slow, fail fast!
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Worker load timeout')), 1500)
      );

      const worker = await Promise.race([workerPromise, timeoutPromise]);

      try {
        await worker.setParameters({
          tessedit_pageseg_mode: '6'
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
 * Fast Downscale & Contrast Optimization for Instant OCR (< 400ms)
 * Resizes to 750px which provides optimal OCR recognition speed.
 */
export function optimizeImageForFastOCR(imageSrc, maxWidth = 750) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(img, 0, 0, width, height);

      // Fast contrast adjustment
      const imgData = ctx.getImageData(0, 0, width, height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        gray = (gray - 128) * 1.5 + 128;
        gray = Math.min(255, Math.max(0, gray));
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}
