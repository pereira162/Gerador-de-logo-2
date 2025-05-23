import React, { useRef, useEffect } from 'react';
import { useLogoStore } from '../store/logoStore';
import { Screen, TextProperties } from '../types';
import { DEFAULT_FONTS, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../constants';
import { ViewBoxManager } from '../services/ViewBoxManager';
import ColorPicker from '../components/ColorPicker';
import useZoomPan from '../hooks/useZoomPan';

/**
 * Função utilitária melhorada para calcular de forma estável o bounding box de todo o conteúdo SVG (ícone + textos)
 * com margem de segurança para evitar cortes.
 */
function getFullContentBoundsForTypography(svg: SVGSVGElement, margem: number = 32) {
  // Primeiro tentamos pegar todas as dimensões exatas
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  // Forçamos um reflow para garantir que todas as dimensões estejam calculadas
  svg.getBoundingClientRect();
  
  // 1. Primeiro, vamos processar o grupo que contém o ícone (dangerouslySetInnerHTML)
  const iconGroup = svg.querySelector('g');
  if (iconGroup) {
    try {
      const iconBBox = iconGroup.getBBox();
      if (iconBBox && iconBBox.width > 0 && iconBBox.height > 0) {
        console.log("Icon BBox:", iconBBox);
        minX = Math.min(minX, iconBBox.x);
        minY = Math.min(minY, iconBBox.y);
        maxX = Math.max(maxX, iconBBox.x + iconBBox.width);
        maxY = Math.max(maxY, iconBBox.y + iconBBox.height);
      }
    } catch (e) {
      console.error("Error getting icon BBox:", e);
    }
  }
  
  // 2. Agora processamos todos os elementos SVG, com tratamento especial para textos
  const allElements = Array.from(svg.querySelectorAll('*'));
  
  allElements.forEach(el => {
    // Ignora elementos sem representação visual ou já processados como grupo
    if (el.tagName === 'defs' || el.tagName === 'style' || el === iconGroup) return;
    
    try {
      // Para textos, usamos uma abordagem especial que captura melhor as dimensões
      if (el.tagName === 'text') {
        const bbox = (el as SVGGraphicsElement).getBBox?.();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          // Adicionamos uma margem extra para textos, que costumam ter problemas de dimensionamento
          const textPadding = 4; // Pequeno padding extra para textos
          minX = Math.min(minX, bbox.x - textPadding);
          minY = Math.min(minY, bbox.y - textPadding);
          maxX = Math.max(maxX, bbox.x + bbox.width + textPadding);
          maxY = Math.max(maxY, bbox.y + bbox.height + textPadding);
          console.log(`Text element BBox (${(el as SVGTextElement).textContent}):`, bbox);
        }
      } else if ((el as SVGGraphicsElement).getBBox) {
        // Para outros elementos SVG, usamos getBBox normalmente
        const bbox = (el as SVGGraphicsElement).getBBox?.();
        if (bbox && bbox.width > 0 && bbox.height > 0) {
          minX = Math.min(minX, bbox.x);
          minY = Math.min(minY, bbox.y);
          maxX = Math.max(maxX, bbox.x + bbox.width);
          maxY = Math.max(maxY, bbox.y + bbox.height);
        }
      }
    } catch (e) {
      // Ignora erros de elementos sem getBBox
    }
  });
  
  // fallback em caso de erro
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    console.log("Using fallback viewBox");
    return '0 0 400 100';
  }
  
  // Adiciona margem de segurança
  const padding = margem;
  const x = minX - padding;
  const y = minY - padding;
  const w = (maxX - minX) + 2 * padding;
  const h = (maxY - minY) + 2 * padding;
  
  console.log("Final calculated viewBox:", { x, y, w, h });
  return `${x} ${y} ${w} ${h}`;
}

const TextPropertyControls: React.FC<{
  textType: 'companyName' | 'tagline';
  textProps: TextProperties;
  updateProperty: (textType: 'companyName' | 'tagline', property: keyof TextProperties, value: any) => void;
  title: string;
}> = ({ textType, textProps, updateProperty, title }) => {
  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow mb-6">
      <h3 className="text-xl font-semibold text-emerald-400 mb-3">{title}</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor={`${textType}-content`} className="block text-sm font-medium text-slate-300 mb-1">Text</label>
          <input
            type="text"
            id={`${textType}-content`}
            value={textProps.content}
            onChange={(e) => updateProperty(textType, 'content', e.target.value)}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor={`${textType}-fontFamily`} className="block text-sm font-medium text-slate-300 mb-1">Font</label>
          <select
            id={`${textType}-fontFamily`}
            value={textProps.fontFamily}
            onChange={(e) => updateProperty(textType, 'fontFamily', e.target.value)}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
          >
            {DEFAULT_FONTS.map(font => (
              <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>{font.name}</option>
            ))}
          </select>
        </div>
        <ColorPicker
          label="Text Color"
          color={textProps.fill}
          onChange={(color) => updateProperty(textType, 'fill', color)}
        />
        <div>
          <label htmlFor={`${textType}-fontSize`} className="block text-sm font-medium text-slate-300 mb-1">Font Size ({textProps.fontSize}px)</label>
          <input
            type="range"
            id={`${textType}-fontSize`}
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            value={textProps.fontSize}
            onChange={(e) => updateProperty(textType, 'fontSize', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor={`${textType}-x`} className="block text-sm font-medium text-slate-300 mb-1">Position X (%)</label>
                <input type="number" id={`${textType}-x`} value={textProps.x} onChange={(e) => updateProperty(textType, 'x', parseFloat(e.target.value))}
                className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500" step="0.5" />
            </div>
            <div>
                <label htmlFor={`${textType}-y`} className="block text-sm font-medium text-slate-300 mb-1">Position Y (%)</label>
                <input type="number" id={`${textType}-y`} value={textProps.y} onChange={(e) => updateProperty(textType, 'y', parseFloat(e.target.value))}
                className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500" step="0.5" />
            </div>
        </div>
        <div>
            <label htmlFor={`${textType}-textAnchor`} className="block text-sm font-medium text-slate-300 mb-1">Text Align</label>
            <select id={`${textType}-textAnchor`} value={textProps.textAnchor} onChange={(e) => updateProperty(textType, 'textAnchor', e.target.value as TextProperties['textAnchor'])}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500">
                <option value="start">Left</option>
                <option value="middle">Center</option>
                <option value="end">Right</option>
            </select>
        </div>
      </div>
    </div>
  );
};

// Error boundary component to catch errors in the component
export const ErrorBoundary: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    const handleError = () => {
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="p-4 bg-red-500 text-white rounded-lg">
        <h3 className="text-xl font-bold">Something went wrong</h3>
        <p>There was an error rendering this component. Please try again or go back to the previous step.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-white text-red-500 rounded-lg font-medium"
        >
          Reload Page
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
};

const MARGEM = 32;

const TypographyScreen: React.FC = () => {
  // Optimize store selection to prevent excessive re-renders
  // Use individual selectors with custom equality checks
  const updateTextProperty = useLogoStore(state => state.updateTextProperty);
  const setTaglineEnabled = useLogoStore(state => state.setTaglineEnabled);
  const setScreen = useLogoStore(state => state.setScreen);
  
  // For data properties, use shallow comparison or targeted comparison to reduce re-renders
  const companyName = useLogoStore(
    state => state.companyName, 
    (prev, next) => {
      if (!prev && !next) return true;
      if (!prev || !next) return false;
      // Only compare the fields that will affect the UI
      return (
        prev.content === next.content &&
        prev.fontFamily === next.fontFamily &&
        prev.fontSize === next.fontSize &&
        prev.fill === next.fill &&
        prev.textAnchor === next.textAnchor &&
        prev.x === next.x &&
        prev.y === next.y
      );
    }
  );
  
  const tagline = useLogoStore(
    state => state.tagline,
    (prev, next) => {
      if (!prev && !next) return true;
      if (!prev || !next) return false;
      // Only compare the fields that will affect the UI
      return (
        prev.content === next.content &&
        prev.fontFamily === next.fontFamily &&
        prev.fontSize === next.fontSize &&
        prev.fill === next.fill &&
        prev.textAnchor === next.textAnchor &&
        prev.x === next.x &&
        prev.y === next.y
      );
    }
  );
  
  const editedIconSvg = useLogoStore(state => state.editedIconSvg);

  // Função utilitária para extrair apenas o conteúdo interno do SVG (sem a tag <svg>)
  function getSvgInnerContent(svgString: string | null): string {
    if (!svgString) return '';
    const match = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    return match ? match[1] : svgString;
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const { viewBox, resetView, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseEnter } = useZoomPan(svgRef, { minZoom: 0.2, maxZoom: 4 });

  // --- ATUALIZADO: Ajuste automático e estável do viewBox para englobar todo o texto + ícone ---
  useEffect(() => {
    if (svgRef.current) {
      // Log to debug if icon is present
      console.log("Current editedIconSvg:", editedIconSvg ? "Present" : "Not present");
      
      // Adicionamos um pequeno timeout para garantir que os textos e ícone foram renderizados completamente
      const timeoutId = setTimeout(() => {
        if (svgRef.current) {
          // Usamos nossa função melhorada para cálculo preciso do viewBox
          const vb = getFullContentBoundsForTypography(svgRef.current, MARGEM);
          if (vb) {
            console.log("Calculated viewBox:", vb);
            
            // Parse viewBox string to ViewBox object
            const viewBoxObj = ViewBoxManager.parseViewBoxString(vb);
            if (viewBoxObj) {
              // Use ViewBoxManager's stabilization to prevent jitter
              const stableViewBox = ViewBoxManager.getStableViewBox(viewBoxObj, 0.03) || viewBoxObj;
              
              // Don't set viewBox directly on the SVG element - let useZoomPan handle it
              // Update the store with the stable viewBox for consistency
              useLogoStore.getState().setCurrentViewBox(stableViewBox);
            }
          }
        }
      }, 100); // Slightly longer delay for better rendering assurance
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    companyName?.content,
    companyName?.fontFamily,
    companyName?.fontSize,
    companyName?.x,
    companyName?.y,
    tagline?.content,
    tagline?.fontFamily,
    tagline?.fontSize,
    tagline?.x,
    tagline?.y,
    editedIconSvg, // Make sure this dependency is included
    MARGEM
  ]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-200px)] min-h-[600px] animate-fadeIn">
      <div className="lg:w-2/5 xl:w-1/2 flex flex-col space-y-4">
        <h2 className="text-3xl font-semibold text-center text-emerald-400 mb-2">Add Your Text</h2>
        <div className="flex-grow bg-slate-700 p-2 rounded-lg shadow-inner">
          {/* --- SVG flexível com pan/zoom, renderizando ícone + textos --- */}
          <svg
            ref={svgRef}
            viewBox={viewBox}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseEnter={handleMouseEnter}
            style={{ background: "#fff", borderRadius: 8, touchAction: "none" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Renderiza o SVG do ícone editado (sem a tag <svg>) */}
            {editedIconSvg && (
              <g dangerouslySetInnerHTML={{ __html: getSvgInnerContent(editedIconSvg) }} />
            )}
            {/* Company Name */}
            {companyName && companyName.content && (
              <text
                x={companyName.x}
                y={companyName.y}
                fontFamily={companyName.fontFamily}
                fontSize={companyName.fontSize}
                fill={companyName.fill}
                textAnchor={companyName.textAnchor}
                id="typography-companyName"
              >
                {companyName.content}
              </text>
            )}
            {/* Tagline */}
            {tagline && tagline.content && (
              <text
                x={tagline.x}
                y={tagline.y}
                fontFamily={tagline.fontFamily}
                fontSize={tagline.fontSize}
                fill={tagline.fill}
                textAnchor={tagline.textAnchor}
                id="typography-tagline"
              >
                {tagline.content}
              </text>
            )}
          </svg>
          <button
            onClick={() => resetView()}
            className="mt-2 px-4 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded"
          >
            Resetar Zoom/Pan
          </button>
        </div>
      </div>

      <div className="lg:w-3/5 xl:w-1/2 space-y-6 overflow-y-auto max-h-[calc(100vh-240px)] pr-2">
        <TextPropertyControls title="Company Name" textType="companyName" textProps={companyName} updateProperty={updateTextProperty} />
        
        <div>
          <label className="flex items-center space-x-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!tagline}
              onChange={(e) => setTaglineEnabled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-400"
            />
            <span className="text-slate-200">Enable Tagline</span>
          </label>
          {tagline && (
            <TextPropertyControls title="Tagline" textType="tagline" textProps={tagline} updateProperty={updateTextProperty} />
          )}
        </div>
      </div>

      <div className="w-full lg:col-span-full flex justify-between mt-4 items-center">
        <div>
          <button
              onClick={() => setScreen(Screen.Editor)}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
          >
              &larr; Back to Icon
          </button>
        </div>
        <button
            onClick={() => setScreen(Screen.Export)}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
        >
            Next: Export Logo &rarr;
        </button>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};



export default TypographyScreen;

/**
 * Calcula um viewBox que engloba todo o texto SVG de forma robusta e com margem extra.
 * Esta função é usada para exportação e é consistente com as funções de exportação.
 */
export function getDynamicViewBoxForTypography(svg: SVGSVGElement, margem: number = 32): string {
  // Primeiro consideramos todos os textos
  const textos = svg.querySelectorAll("text");
  if (textos.length === 0) return "0 0 400 100";

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  // Forçamos reflow para garantir que as dimensões estão atualizadas
  svg.getBoundingClientRect();
  
  // Processamos cada texto
  textos.forEach(text => {
    try {
      const bbox = text.getBBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        // Adicionamos uma margem extra específica para textos
        const textPadding = 4;
        minX = Math.min(minX, bbox.x - textPadding);
        minY = Math.min(minY, bbox.y - textPadding);
        maxX = Math.max(maxX, bbox.x + bbox.width + textPadding);
        maxY = Math.max(maxY, bbox.y + bbox.height + textPadding);
      }
    } catch {}
  });
  
  // Também consideramos outros elementos SVG para o caso de ícones
  const otherElements = svg.querySelectorAll("*:not(text):not(defs):not(style)");
  otherElements.forEach(el => {
    try {
      const bbox = (el as SVGGraphicsElement).getBBox?.();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    } catch {}
  });

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return "0 0 400 100";
  }
  
  // Adicionamos margem de segurança final
  const x = minX - margem;
  const y = minY - margem;
  const w = (maxX - minX) + 2 * margem;
  const h = (maxY - minY) + 2 * margem;
  
  return `${x} ${y} ${w} ${h}`;
}