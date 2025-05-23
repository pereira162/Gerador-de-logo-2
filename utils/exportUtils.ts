import { DEFAULT_SVG_EXPORT_WIDTH, DEFAULT_SVG_EXPORT_HEIGHT } from "../constants";
import { ViewBoxManager } from "../services/ViewBoxManager";

/**
 * Get the ViewBox from an SVG string
 * @param svgString SVG content as string
 * @returns ViewBox object or null if not found
 */
function getViewBox(svgString: string): { x: number, y: number, width: number, height: number } | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgRoot = doc.documentElement;
  const viewBoxAttr = svgRoot.getAttribute('viewBox');
  if (viewBoxAttr) {
    const [x, y, width, height] = viewBoxAttr.split(/[\s,]+/).map(Number);
    if ([x,y,width,height].every(v => !isNaN(v))) {
      return { x, y, width, height };
    }
  }
  return null;
};

/**
 * Calcula o bounding box real de todos os elementos SVG com maior precisão,
 * especialmente para texto, garantindo que todas as dimensões sejam capturadas corretamente.
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

/**
 * Versão melhorada que fornece cálculo preciso de bounds, renderizando
 * os elementos temporariamente no DOM para garantir dimensões corretas.
 */
function getPreciseFullContentBounds(svgString: string, paddingMin = 5, paddingMax = 20, paddingPercent = 0.05) {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgNode = svgDoc.documentElement.cloneNode(true) as SVGSVGElement;

  // Cria elemento temporário no DOM para forçar renderização
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.style.visibility = 'hidden';
  document.body.appendChild(tempDiv);
  tempDiv.appendChild(svgNode);

  // Força reflow do navegador para calcular corretamente dimensões
  svgNode.getBoundingClientRect();

  let bounds = null;
  try {
    // Agora os elementos têm dimensões calculadas, podemos obter o bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const allElements = Array.from(svgNode.querySelectorAll('*'));

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

    if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY)) {
      const padding = Math.max(paddingMin, Math.min((maxX - minX) * paddingPercent, paddingMax));
      bounds = {
        minX: minX - padding,
        minY: minY - padding,
        width: (maxX - minX) + 2 * padding,
        height: (maxY - minY) + 2 * padding,
      };
    }
  } finally {
    // Sempre remover o elemento temporário do DOM
    document.body.removeChild(tempDiv);
  }

  return bounds;
}

export const downloadSVG = (svgString: string, filename: string): void => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;

  // Force text elements to use absolute coordinates instead of percentages for export
  svgDoc.querySelectorAll('text').forEach(textEl => {
    const x = textEl.getAttribute('x');
    const y = textEl.getAttribute('y');
    
    // If using percentages (ends with %), convert to absolute values
    if (x && x.endsWith('%')) {
      const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
      const percentX = parseFloat(x.replace('%', ''));
      const absX = viewBox.x + (viewBox.width * percentX / 100);
      textEl.setAttribute('x', String(absX));
    }
    
    if (y && y.endsWith('%')) {
      const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
      const percentY = parseFloat(y.replace('%', ''));
      const absY = viewBox.y + (viewBox.height * percentY / 100);
      textEl.setAttribute('y', String(absY));
    }
  });

  // Usa a função precisa para calcular bounds
  const bounds = getPreciseFullContentBounds(svgString);
  if (bounds) {
    // Create a ViewBox object and apply stabilization
    const viewBoxObj = {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.width,
      height: bounds.height
    };
    
    // Use stable viewBox to prevent jitter during export
    const stableViewBox = ViewBoxManager.getStableViewBox(viewBoxObj, 0.02) || viewBoxObj;
    
    console.log("Export SVG viewBox:", stableViewBox);
    
    // Apply the stable viewBox to the SVG
    const viewBoxStr = ViewBoxManager.toString(stableViewBox);
    svgElement.setAttribute('viewBox', viewBoxStr);
    svgElement.setAttribute('width', String(stableViewBox.width));
    svgElement.setAttribute('height', String(stableViewBox.height));
  } else {
    // Tenta o método original caso o preciso falhe
    const fallbackBounds = getFullContentBounds(svgDoc);
    if (fallbackBounds) {
      svgElement.setAttribute('viewBox', `${fallbackBounds.minX} ${fallbackBounds.minY} ${fallbackBounds.width} ${fallbackBounds.height}`);
      svgElement.setAttribute('width', String(fallbackBounds.width));
      svgElement.setAttribute('height', String(fallbackBounds.height));
    } else {
      // fallback para defaults em último caso
      svgElement.setAttribute('viewBox', `0 0 ${DEFAULT_SVG_EXPORT_WIDTH} ${DEFAULT_SVG_EXPORT_HEIGHT}`);
      svgElement.setAttribute('width', String(DEFAULT_SVG_EXPORT_WIDTH));
      svgElement.setAttribute('height', String(DEFAULT_SVG_EXPORT_HEIGHT));
    }
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

  // Force text elements to use absolute coordinates instead of percentages for export
  svgDoc.querySelectorAll('text').forEach(textEl => {
    const x = textEl.getAttribute('x');
    const y = textEl.getAttribute('y');
    
    // If using percentages (ends with %), convert to absolute values
    if (x && x.endsWith('%')) {
      const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
      const percentX = parseFloat(x.replace('%', ''));
      const absX = viewBox.x + (viewBox.width * percentX / 100);
      textEl.setAttribute('x', String(absX));
    }
    
    if (y && y.endsWith('%')) {
      const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
      const percentY = parseFloat(y.replace('%', ''));
      const absY = viewBox.y + (viewBox.height * percentY / 100);
      textEl.setAttribute('y', String(absY));
    }
  });

  // Usa a função precisa para calcular bounds
  const bounds = getPreciseFullContentBounds(svgString);
  let width = baseWidth, height = baseHeight, minX = 0, minY = 0;
  if (bounds) {
    // Create a ViewBox object and apply stabilization
    const viewBoxObj = {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.width,
      height: bounds.height
    };
    
    // Use stable viewBox to prevent jitter during export
    const stableViewBox = ViewBoxManager.getStableViewBox(viewBoxObj, 0.02) || viewBoxObj;
    
    // Apply the stable viewBox
    minX = stableViewBox.x;
    minY = stableViewBox.y;
    width = stableViewBox.width;
    height = stableViewBox.height;
    
    console.log("Export PNG viewBox:", { minX, minY, width, height });
    
    svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    svgElement.setAttribute('width', String(width));
    svgElement.setAttribute('height', String(height));
  } else {
    // Tenta o método original caso o preciso falhe
    const fallbackBounds = getFullContentBounds(svgDoc);
    if (fallbackBounds) {
      minX = fallbackBounds.minX;
      minY = fallbackBounds.minY;
      width = fallbackBounds.width;
      height = fallbackBounds.height;
      svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
      svgElement.setAttribute('width', String(width));
      svgElement.setAttribute('height', String(height));
    } else {
      svgElement.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
      svgElement.setAttribute('width', String(baseWidth));
      svgElement.setAttribute('height', String(baseHeight));
    }
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

  // Force text elements to use absolute coordinates instead of percentages for export
  svgDoc.querySelectorAll('text').forEach(textEl => {
    const x = textEl.getAttribute('x');
    const y = textEl.getAttribute('y');
    
    // If using percentages (ends with %), convert to absolute values
    if (x && x.endsWith('%')) {
      const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
      const percentX = parseFloat(x.replace('%', ''));
      const absX = viewBox.x + (viewBox.width * percentX / 100);
      textEl.setAttribute('x', String(absX));
    }
    
    if (y && y.endsWith('%')) {
      const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
      const percentY = parseFloat(y.replace('%', ''));
      const absY = viewBox.y + (viewBox.height * percentY / 100);
      textEl.setAttribute('y', String(absY));
    }
  });

  // Usa método preciso primeiro
  const bounds = getPreciseFullContentBounds(svgString);
  if (bounds) {
    // Create a ViewBox object and apply stabilization
    const viewBoxObj = {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.width,
      height: bounds.height
    };
    
    // Use stable viewBox to prevent jitter during export
    const stableViewBox = ViewBoxManager.getStableViewBox(viewBoxObj, 0.02) || viewBoxObj;
    
    const viewBoxStr = ViewBoxManager.toString(stableViewBox);
    svgElement.setAttribute('viewBox', viewBoxStr);
    svgElement.setAttribute('width', String(stableViewBox.width));
    svgElement.setAttribute('height', String(stableViewBox.height));
  } else {
    // Tenta método original caso o preciso falhe
    const fallbackBounds = getFullContentBounds(svgDoc);
    if (fallbackBounds) {
      svgElement.setAttribute('viewBox', `${fallbackBounds.minX} ${fallbackBounds.minY} ${fallbackBounds.width} ${fallbackBounds.height}`);
      svgElement.setAttribute('width', String(fallbackBounds.width));
      svgElement.setAttribute('height', String(fallbackBounds.height));
    } else {
      // Última opção: defaults
      svgElement.setAttribute('viewBox', `0 0 ${DEFAULT_SVG_EXPORT_WIDTH} ${DEFAULT_SVG_EXPORT_HEIGHT}`);
      svgElement.setAttribute('width', String(DEFAULT_SVG_EXPORT_WIDTH));
      svgElement.setAttribute('height', String(DEFAULT_SVG_EXPORT_HEIGHT));
    }
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

    // Force text elements to use absolute coordinates instead of percentages for export
    svgDoc.querySelectorAll('text').forEach(textEl => {
      const x = textEl.getAttribute('x');
      const y = textEl.getAttribute('y');
      
      // If using percentages (ends with %), convert to absolute values
      if (x && x.endsWith('%')) {
        const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
        const percentX = parseFloat(x.replace('%', ''));
        const absX = viewBox.x + (viewBox.width * percentX / 100);
        textEl.setAttribute('x', String(absX));
      }
      
      if (y && y.endsWith('%')) {
        const viewBox = getViewBox(svgString) || { x: 0, y: 0, width: 100, height: 100 };
        const percentY = parseFloat(y.replace('%', ''));
        const absY = viewBox.y + (viewBox.height * percentY / 100);
        textEl.setAttribute('y', String(absY));
      }
    });

    // Usa método preciso primeiro
    const bounds = getPreciseFullContentBounds(svgString);
    let width = baseWidth, height = baseHeight, minX = 0, minY = 0;
    if (bounds) {
      // Create a ViewBox object and apply stabilization
      const viewBoxObj = {
        x: bounds.minX,
        y: bounds.minY,
        width: bounds.width,
        height: bounds.height
      };
      
      // Use stable viewBox to prevent jitter during export
      const stableViewBox = ViewBoxManager.getStableViewBox(viewBoxObj, 0.02) || viewBoxObj;
      
      // Apply the stable viewBox
      minX = stableViewBox.x;
      minY = stableViewBox.y;
      width = stableViewBox.width;
      height = stableViewBox.height;
      
      console.log("Export PNG Promise viewBox:", { minX, minY, width, height });
      
      svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
      svgElement.setAttribute('width', String(width));
      svgElement.setAttribute('height', String(height));
    } else {
      // Tenta método original caso o preciso falhe
      const fallbackBounds = getFullContentBounds(svgDoc);
      if (fallbackBounds) {
        minX = fallbackBounds.minX;
        minY = fallbackBounds.minY;
        width = fallbackBounds.width;
        height = fallbackBounds.height;
        svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
        svgElement.setAttribute('width', String(width));
        svgElement.setAttribute('height', String(height));
      } else {
        // Última opção: defaults
        svgElement.setAttribute('viewBox', `0 0 ${baseWidth} ${baseHeight}`);
        svgElement.setAttribute('width', String(baseWidth));
        svgElement.setAttribute('height', String(baseHeight));
      }
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
