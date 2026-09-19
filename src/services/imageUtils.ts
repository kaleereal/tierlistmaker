/**
 * Image and Color Utilities for Tier List Maker
 */

export const PRESET_TIERS_SF = [
  { label: 'S', colorHex: '#F44336' },
  { label: 'A', colorHex: '#FF9800' },
  { label: 'B', colorHex: '#FFC107' },
  { label: 'C', colorHex: '#4CAF50' },
  { label: 'D', colorHex: '#2196F3' },
  { label: 'E', colorHex: '#3F51B5' },
  { label: 'F', colorHex: '#673AB7' },
];

export const PRESET_TIERS_AF = [
  { label: 'A', colorHex: '#F44336' },
  { label: 'B', colorHex: '#FF9800' },
  { label: 'C', colorHex: '#FFC107' },
  { label: 'D', colorHex: '#4CAF50' },
  { label: 'E', colorHex: '#2196F3' },
  { label: 'F', colorHex: '#673AB7' },
];

export const PRESET_TIERS_1_TO_5 = [
  { label: '⭐⭐⭐⭐⭐', colorHex: '#FFC107' },
  { label: '⭐⭐⭐⭐', colorHex: '#8BC34A' },
  { label: '⭐⭐⭐', colorHex: '#00BCD4' },
  { label: '⭐⭐', colorHex: '#FF9800' },
  { label: '⭐', colorHex: '#9E9E9E' },
];

export const PRESET_TIERS_OPINION = [
  { label: 'Suka Banget', colorHex: '#4CAF50' },
  { label: 'Netral', colorHex: '#FFC107' },
  { label: 'Kurang Suka', colorHex: '#F44336' },
];

export const SWATCH_COLORS = [
  '#F44336', '#E91E63', '#FF5722', '#FF9800', '#FFC107', '#FFEB3B',
  '#CDDC39', '#8BC34A', '#4CAF50', '#009688', '#00BCD4', '#2196F3',
  '#3F51B5', '#673AB7', '#9C27B0', '#607D8B', '#9E9E9E'
];

export const COLORBLIND_PALETTE = [
  '#0072B2', '#E69F00', '#009E73', '#D55E00',
  '#CC79A7', '#56B4E9', '#F0E442', '#999999'
];

export const PASTEL_FALLBACK_COLORS = [
  '#2E384D', '#3B3355', '#5D4157', '#34495E',
  '#16A085', '#27AE60', '#2980B9', '#8E44AD',
  '#D35400', '#C0392B', '#7F8C8D', '#4A6572'
];

/**
 * Calculates relative luminance for WCAG contrast
 */
export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return 0.5;
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates contrast ratio between two luminances
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns '#FFFFFF' or '#000000' based on contrast rules in PRD
 */
export function getAutoTextColor(hex: string): { textColor: string; hasWarning: boolean } {
  const bgLum = getRelativeLuminance(hex);
  const whiteLum = 1.0;
  const blackLum = 0.0;

  const whiteContrast = getContrastRatio(bgLum, whiteLum);
  const blackContrast = getContrastRatio(bgLum, blackLum);

  // If contrast against white >= 4.5:1, use white
  if (whiteContrast >= 4.5) {
    return { textColor: '#FFFFFF', hasWarning: false };
  }
  // Otherwise use black
  const hasWarning = whiteContrast < 3.0 && blackContrast < 3.0;
  return { textColor: '#000000', hasWarning };
}

/**
 * Generates deterministic pastel dark color from text
 */
export function getTitleColorHash(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_FALLBACK_COLORS.length;
  return PASTEL_FALLBACK_COLORS[index];
}

/**
 * Simulates vibrational haptic feedback safely
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
    try {
      const ms = type === 'light' ? 15 : type === 'medium' ? 30 : 50;
      navigator.vibrate(ms);
    } catch {
      // ignore
    }
  }
}

/**
 * Compresses an image to local WebP / JPEG data URL
 */
export async function compressImageToDataUrl(
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Try webp, fallback to jpeg
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // ignore
        }
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}
