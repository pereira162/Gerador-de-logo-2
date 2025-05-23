
import { DEFAULT_SVG_EXPORT_WIDTH, DEFAULT_SVG_EXPORT_HEIGHT } from "../constants";

export const downloadSVG = (svgString: string, filename: string): void => {
  // Use the same bounds calculation as PNG export for consistency
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Find the actual bounds of all the content, including text
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const allElements = Array.from(svgDoc.querySelectorAll('*'));
  
  allElements.forEach(el => {
    // Skip elements like defs that don't have visual representation
    if (el.tagName === 'defs' || el.tagName === 'style') return;
    
    try {
      const bbox = (el as SVGGraphicsElement).getBBox?.();
      if (bbox) {
        // Include all content in the bounds calculation
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    } catch (e) {
      // Ignore errors for elements that don't support getBBox
    }
  });
  
  // Ensure we have valid bounds (fallback to defaults if not)
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    // Fallback to existing viewBox or defaults
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(/[\s,]+/).map(Number);
      if (!isNaN(width) && !isNaN(height)) {
        minX = x;
        minY = y;
        maxX = x + width;
        maxY = y + height;
      } else {
        minX = 0;
        minY = 0;
        maxX = DEFAULT_SVG_EXPORT_WIDTH;
        maxY = DEFAULT_SVG_EXPORT_HEIGHT;
      }
    } else {
      minX = 0;
      minY = 0;
      maxX = DEFAULT_SVG_EXPORT_WIDTH;
      maxY = DEFAULT_SVG_EXPORT_HEIGHT;
    }
  }
  
  // Add some padding to avoid cutting off content at the edges
  const padding = Math.max(5, Math.min((maxX - minX) * 0.05, 20));
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  // Calculate the new dimensions
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Update the viewBox attribute to include all content
  svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  svgElement.setAttribute('width', String(width));
  svgElement.setAttribute('height', String(height));
  
  // Get the updated SVG string
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
  baseWidth: number = DEFAULT_SVG_EXPORT_WIDTH, // Default width if SVG has no inherent size
  baseHeight: number = DEFAULT_SVG_EXPORT_HEIGHT // Default height
): void => {
  // First, check if we need to adjust the SVG's viewBox to include all content
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Find the actual bounds of all the content, including text
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const allElements = Array.from(svgDoc.querySelectorAll('*'));
  
  allElements.forEach(el => {
    // Skip elements like defs that don't have visual representation
    if (el.tagName === 'defs' || el.tagName === 'style') return;
    
    try {
      const bbox = (el as SVGGraphicsElement).getBBox?.();
      if (bbox) {
        // Adjust for transforms to get accurate bounds
        const transformMatrix = (el as SVGGraphicsElement).getScreenCTM?.();
        if (transformMatrix) {
          const transformedPoints = [
            { x: bbox.x, y: bbox.y },
            { x: bbox.x + bbox.width, y: bbox.y },
            { x: bbox.x, y: bbox.y + bbox.height },
            { x: bbox.x + bbox.width, y: bbox.y + bbox.height }
          ];
          
          transformedPoints.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
        } else {
          // Fallback if getScreenCTM is not available
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        }
      }
    } catch (e) {
      // Ignore errors for elements that don't support getBBox
      console.warn(`Could not get bounding box for element:`, el, e);
    }
  });
  
  // Ensure we have valid bounds (fallback to defaults if not)
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    // Fallback to existing viewBox or defaults
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(/[\s,]+/).map(Number);
      if (!isNaN(width) && !isNaN(height)) {
        minX = x;
        minY = y;
        maxX = x + width;
        maxY = y + height;
      } else {
        minX = 0;
        minY = 0;
        maxX = baseWidth;
        maxY = baseHeight;
      }
    } else {
      minX = 0;
      minY = 0;
      maxX = baseWidth;
      maxY = baseHeight;
    }
  }
  
  // Add some padding to avoid cutting off content at the edges
  const padding = Math.max(5, Math.min((maxX - minX) * 0.05, 20));
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  // Calculate the new dimensions
  const width = maxX - minX;
  const height = maxY - minY;
  
  // Update the viewBox attribute to include all content
  svgElement.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
  svgElement.setAttribute('width', String(width));
  svgElement.setAttribute('height', String(height));
  
  // Get the updated SVG string
  const updatedSvgString = new XMLSerializer().serializeToString(svgElement);
  
  // Now create the image and continue with the export
  const img = new Image();
  const svgBlob = new Blob([updatedSvgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    // Set canvas dimensions based on the updated SVG
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
