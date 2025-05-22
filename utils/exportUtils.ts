
import { DEFAULT_SVG_EXPORT_WIDTH, DEFAULT_SVG_EXPORT_HEIGHT } from "../constants";

export const downloadSVG = (svgString: string, filename: string): void => {
  // Ensure SVG has width and height for better compatibility if not present, using viewBox or defaults
  let finalSvgString = svgString;
  if (!svgString.includes('width=') || !svgString.includes('height=')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = doc.documentElement;
    if (!svgElement.getAttribute('width') || !svgElement.getAttribute('height')) {
      const viewBox = svgElement.getAttribute('viewBox');
      let width = DEFAULT_SVG_EXPORT_WIDTH;
      let height = DEFAULT_SVG_EXPORT_HEIGHT;
      if (viewBox) {
        const parts = viewBox.split(' ');
        width = parseFloat(parts[2]);
        height = parseFloat(parts[3]);
      }
      svgElement.setAttribute('width', String(width));
      svgElement.setAttribute('height', String(height));
      finalSvgString = new XMLSerializer().serializeToString(svgElement);
    }
  }


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
  baseWidth: number = DEFAULT_SVG_EXPORT_WIDTH, // Default width if SVG has no inherent size
  baseHeight: number = DEFAULT_SVG_EXPORT_HEIGHT // Default height
): void => {
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const actualWidth = baseWidth * resolutionFactor;
    const actualHeight = baseHeight * resolutionFactor;
    
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      URL.revokeObjectURL(url);
      return;
    }

    ctx.drawImage(img, 0, 0, actualWidth, actualHeight);
    URL.revokeObjectURL(url); // Revoke URL after drawing to canvas

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
