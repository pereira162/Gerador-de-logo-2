import { DEFAULT_SVG_EXPORT_WIDTH, DEFAULT_SVG_EXPORT_HEIGHT } from "../constants";

/**
 * Calcula o bounding box real de todos os elementos SVG (incluindo textos e ícones) e ajusta o viewBox
 * para garantir que nada seja cortado na exportação. Adiciona uma margem automática.
 */
function getFullContentBounds(svgDoc: Document, paddingMin = 5, paddingMax = 20, paddingPercent = 0.05) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const allElements = Array.from(svgDoc.querySelectorAll('*'));

  allElements.forEach(el => {
    // Ignora elementos sem representação visual
    if (el.tagName === 'defs' || el.tagName === 'style') return;
    try {
      const bbox = (el as SVGGraphicsElement).getBBox?.();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    } catch {
      // ignora erros de elementos sem getBBox
    }
  });

  // fallback para viewBox ou defaults
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null;
  }

  // margem automática
  const padding = Math.max(paddingMin, Math.min((maxX - minX) * paddingPercent, paddingMax));
  return {
    minX: minX - padding,
    minY: minY - padding,
    width: (maxX - minX) + 2 * padding,
    height: (maxY - minY) + 2 * padding,
  };
}

export const downloadSVG = (svgString: string, filename: string): void => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  // Calcula bounds reais
  const bounds = getFullContentBounds(svgDoc);
  if (bounds) {
    svgElement.setAttribute('viewBox', `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
    svgElement.setAttribute('width', String(bounds.width));
    svgElement.setAttribute('height', String(bounds.height));
  } else {
    // fallback para defaults
    svgElement.setAttribute('viewBox', `0 0 ${DEFAULT_SVG_EXPORT_WIDTH} ${DEFAULT_SVG_EXPORT_HEIGHT}`);
    svgElement.setAttribute('width', String(DEFAULT_SVG_EXPORT_WIDTH));
    svgElement.setAttribute('height', String(DEFAULT_SVG_EXPORT_HEIGHT));
  }

  const finalSvgString = new XMLSerializer().serializeToString(svgElement);

  const blob = new Blob([finalSvgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadPNG = (
  svgString: string,
  filename: string,
  resolutionFactor: number = 1,
  baseWidth: number = DEFAULT_SVG_EXPORT_WIDTH,
  baseHeight: number = DEFAULT_SVG_EXPORT_HEIGHT
): void => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  // Calcula bounds reais
  const bounds = getFullContentBounds(svgDoc);
  let width = baseWidth, height = baseHeight, minX = 0, minY = 0;
  if (bounds) {
    minX = bounds.minX;
    minY = bounds.minY;
    width = bounds.width;
    height = bounds.height;
    svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svgElement.setAttribute('width', String(width));
    svgElement.setAttribute('height', String(height));
  } else {
    svgElement.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
    svgElement.setAttribute('width', String(baseWidth));
    svgElement.setAttribute('height', String(baseHeight));
  }

  const updatedSvgString = new XMLSerializer().serializeToString(svgElement);

  const img = new Image();
  const svgBlob = new Blob([updatedSvgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const actualWidth = width * resolutionFactor;
    const actualHeight = height * resolutionFactor;

    canvas.width = actualWidth;
    canvas.height = actualHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      URL.revokeObjectURL(url);
      return;
    }

    ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.onerror = (e) => {
    console.error('Error loading SVG image for PNG conversion:', e);
    URL.revokeObjectURL(url);
  };

  img.src = url;
};

/**
 * Exporta o SVG ajustando o viewBox para englobar todo o conteúdo visível, com margem.
 * Garante que nada do logo (ícone ou texto) seja cortado.
 */
export function getExportedSVG(svgString: string): string {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  const bounds = getFullContentBounds(svgDoc);
  if (bounds) {
    svgElement.setAttribute('viewBox', `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`);
    svgElement.setAttribute('width', String(bounds.width));
    svgElement.setAttribute('height', String(bounds.height));
  } else {
    svgElement.setAttribute('viewBox', `0 0 ${DEFAULT_SVG_EXPORT_WIDTH} ${DEFAULT_SVG_EXPORT_HEIGHT}`);
    svgElement.setAttribute('width', String(DEFAULT_SVG_EXPORT_WIDTH));
    svgElement.setAttribute('height', String(DEFAULT_SVG_EXPORT_HEIGHT));
  }

  return new XMLSerializer().serializeToString(svgElement);
}

/**
 * Exporta o PNG ajustando o viewBox para englobar todo o conteúdo visível, com margem.
 * Garante que nada do logo (ícone ou texto) seja cortado.
 */
export function getExportedPNG(
  svgString: string,
  resolutionFactor: number = 1,
  baseWidth: number = DEFAULT_SVG_EXPORT_WIDTH,
  baseHeight: number = DEFAULT_SVG_EXPORT_HEIGHT
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    const bounds = getFullContentBounds(svgDoc);
    let width = baseWidth, height = baseHeight, minX = 0, minY = 0;
    if (bounds) {
      minX = bounds.minX;
      minY = bounds.minY;
      width = bounds.width;
      height = bounds.height;
      svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
      svgElement.setAttribute('width', String(width));
      svgElement.setAttribute('height', String(height));
    } else {
      svgElement.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
      svgElement.setAttribute('width', String(baseWidth));
      svgElement.setAttribute('height', String(baseHeight));
    }

    const updatedSvgString = new XMLSerializer().serializeToString(svgElement);

    const img = new Image();
    const svgBlob = new Blob([updatedSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const actualWidth = width * resolutionFactor;
      const actualHeight = height * resolutionFactor;

      canvas.width = actualWidth;
      canvas.height = actualHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export PNG'));
        }
      }, 'image/png');
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}
