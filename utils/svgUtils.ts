
import { SVGElementProperties, TextProperties, PALETTE_CLASS_MAP, ColorPalette } from '../types';
import { SVG_EDITABLE_CLASS, DEFAULT_FILL_COLOR, DEFAULT_STROKE_COLOR } from '../constants';

// Helper to parse transform string; very basic, assumes order or specific formats.
// A robust solution would use regex or a micro-parser.
const parseTransform = (transformStr: string | null): SVGElementProperties['transform'] => {
  const transform: SVGElementProperties['transform'] = {
    translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0
  };
  if (!transformStr) return transform;

  const translateMatch = transformStr.match(/translate\(\s*([-\d.]+)\s*,?\s*([-\d.]+)\s*\)/);
  if (translateMatch) {
    transform.translateX = parseFloat(translateMatch[1]);
    transform.translateY = parseFloat(translateMatch[2]);
  }
  
  // Match scale(sX, sY) or scale(s)
  const scaleMatch = transformStr.match(/scale\(\s*([-\d.]+)\s*(?:,\s*([-\d.]+))?\s*\)/);
  if (scaleMatch) {
    transform.scaleX = parseFloat(scaleMatch[1]);
    transform.scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : parseFloat(scaleMatch[1]); // If sY is not present, use sX
  }

  const rotateMatch = transformStr.match(/rotate\(\s*([-\d.]+)(?:\s*([-\d.]+)\s*([-\d.]+))?\s*\)/); // rotate(angle cx cy) or rotate(angle)
  if (rotateMatch) {
    transform.rotate = parseFloat(rotateMatch[1]);
    // cx, cy for rotate are not handled by this simple version.
  }
  return transform;
};

const formatTransform = (transform: Partial<SVGElementProperties['transform']>): string => {
  let result = '';
  if (transform.translateX !== undefined || transform.translateY !== undefined) {
    result += `translate(${transform.translateX || 0} ${transform.translateY || 0}) `;
  }
  if (transform.scaleX !== undefined || transform.scaleY !== undefined) {
     // SVG standard: scale(x y), if y is not provided, it's equal to x.
    const scaleX = transform.scaleX ?? 1;
    const scaleY = transform.scaleY ?? scaleX; // if scaleY is undefined, use scaleX
    result += `scale(${scaleX} ${scaleY}) `;
  }
  if (transform.rotate !== undefined) {
    result += `rotate(${transform.rotate || 0}) `;
  }
  return result.trim();
};

export const extractInitialElementsProperties = (svgString: string): Record<string, Partial<SVGElementProperties>> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const elements = doc.querySelectorAll(`.${SVG_EDITABLE_CLASS}`);
  const props: Record<string, Partial<SVGElementProperties>> = {};

  elements.forEach(el => {
    if (el instanceof SVGElement && el.id) {
      props[el.id] = {
        fill: el.getAttribute('fill') || DEFAULT_FILL_COLOR,
        stroke: el.getAttribute('stroke') || 'none',
        strokeWidth: parseFloat(el.getAttribute('stroke-width') || '0'),
        opacity: parseFloat(el.getAttribute('opacity') || '1'),
        transform: parseTransform(el.getAttribute('transform')),
      };
    }
  });
  return props;
};

export const applyElementPropertiesToSvg = (
  originalSvgString: string,
  allElementsProps: Record<string, Partial<SVGElementProperties>>
): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(originalSvgString, "image/svg+xml");

  Object.entries(allElementsProps).forEach(([id, propsToApply]) => {
    const element = doc.getElementById(id);
    if (element) {
      if (propsToApply.fill !== undefined) element.setAttribute('fill', propsToApply.fill);
      if (propsToApply.stroke !== undefined) element.setAttribute('stroke', propsToApply.stroke);
      if (propsToApply.strokeWidth !== undefined) element.setAttribute('stroke-width', String(propsToApply.strokeWidth));
      if (propsToApply.opacity !== undefined) element.setAttribute('opacity', String(propsToApply.opacity));
      if (propsToApply.transform !== undefined) {
        const transformString = formatTransform(propsToApply.transform);
        if (transformString) {
          element.setAttribute('transform', transformString);
        } else {
          element.removeAttribute('transform');
        }
      }
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
};


export const applyPaletteToSvgString = (
  svgString: string,
  palette: ColorPalette,
  classMap: Record<string, keyof ColorPalette['colors']>
): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");

  Object.entries(classMap).forEach(([className, colorKey]) => {
    const elements = doc.querySelectorAll(`.${className}`);
    const colorValue = palette.colors[colorKey];
    if (colorValue) {
      elements.forEach(el => {
        if (el instanceof SVGElement) {
          el.setAttribute('fill', colorValue);
          // Optionally, could clear stroke or set it to a related color.
        }
      });
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
};

export const addTextElementsToSvg = (svgString: string, textElementsConfig: TextProperties[]): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgRoot = doc.documentElement;
  
  const viewBox = getViewBox(svgString) || { x:0, y:0, width:100, height:100 };

  // Remove any existing text elements added by this function (e.g. with a specific class)
  doc.querySelectorAll('.logo-text-element').forEach(el => el.remove());

  textElementsConfig.forEach(config => {
    if (!config.content.trim()) return; // Don't add empty text

    const textEl = doc.createElementNS("http://www.w3.org/2000/svg", "text");
    textEl.setAttribute('x', `${config.x}%`); // Use percentage for responsiveness within viewBox
    textEl.setAttribute('y', `${config.y}%`);
    textEl.setAttribute('font-family', config.fontFamily);
    textEl.setAttribute('font-size', String(config.fontSize * (viewBox.width / 100) * 0.3)); // Scale font size relative to viewBox
    textEl.setAttribute('fill', config.fill);
    textEl.setAttribute('text-anchor', config.textAnchor);
    textEl.classList.add('logo-text-element'); // Mark as added text
    textEl.classList.add(SVG_EDITABLE_CLASS); // Make text editable too
    textEl.id = `text-${config.content.substring(0,10).replace(/\s/g,'_')}-${Date.now()}` // basic unique id
    textEl.textContent = config.content;
    svgRoot.appendChild(textEl);
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(svgRoot);
};

export const getViewBox = (svgString: string): { x: number, y: number, width: number, height: number } | null => {
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

export const applyTempHighlightToSvgElement = (svgString: string, elementId: string, styles: { stroke: string; strokeWidth: string, strokeDasharray?:string }): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const element = doc.getElementById(elementId);
  if (element) {
    element.setAttribute('data-original-stroke', element.getAttribute('stroke') || 'none');
    element.setAttribute('data-original-stroke-width', element.getAttribute('stroke-width') || '0');
    element.setAttribute('data-original-stroke-dasharray', element.getAttribute('stroke-dasharray') || 'none');
    
    element.setAttribute('stroke', styles.stroke);
    element.setAttribute('stroke-width', styles.strokeWidth);
    if(styles.strokeDasharray) element.setAttribute('stroke-dasharray', styles.strokeDasharray);
  }
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
};

export const removeTempHighlightFromSvgElement = (svgString: string, elementId: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const element = doc.getElementById(elementId);
  if (element) {
    const originalStroke = element.getAttribute('data-original-stroke');
    const originalStrokeWidth = element.getAttribute('data-original-stroke-width');
    const originalStrokeDasharray = element.getAttribute('data-original-stroke-dasharray');

    if (originalStroke) element.setAttribute('stroke', originalStroke); else element.removeAttribute('stroke');
    if (originalStrokeWidth) element.setAttribute('stroke-width', originalStrokeWidth); else element.removeAttribute('stroke-width');
    if (originalStrokeDasharray && originalStrokeDasharray !== 'none') element.setAttribute('stroke-dasharray', originalStrokeDasharray); else element.removeAttribute('stroke-dasharray');

    element.removeAttribute('data-original-stroke');
    element.removeAttribute('data-original-stroke-width');
    element.removeAttribute('data-original-stroke-dasharray');
  }
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.documentElement);
};
