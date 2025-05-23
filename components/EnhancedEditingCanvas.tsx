import React, { useEffect, useRef } from 'react';
import useZoomPan from '../hooks/useZoomPan';
import { useLogoStore } from '../store/logoStore';

// Adicione ou ajuste conforme seu projeto:
export const SVG_EDITABLE_CLASS = "svg-editable-element";

interface EnhancedEditingCanvasProps {
  svgContent: string;
  className?: string;
}

const EnhancedEditingCanvas: React.FC<EnhancedEditingCanvasProps> = ({ 
  svgContent, 
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedElementId = useLogoStore(state => state.selectedElementId);
  const setSelectedElementId = useLogoStore(state => state.setSelectedElementId);
  
  // Parse the SVG content once
  const parser = new DOMParser();
  
  // Set up zoom and pan functionality
  const svgRef = useRef<SVGSVGElement>(null);
  const { svgRef: panRef, viewBox, zoomLevel, resetView } = useZoomPan(svgRef, {
    minZoom: 0.1,
    maxZoom: 10,
    zoomFactor: 0.1
  });

  // Seleção: só permite selecionar elementos com id e classe SVG_EDITABLE_CLASS
  const handleElementClick = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    let currentElement: Element | null = target;
    while (
      currentElement &&
      (!(currentElement as SVGElement).id ||
        !(currentElement as SVGElement).classList.contains(SVG_EDITABLE_CLASS)) &&
      currentElement !== svgRef.current
    ) {
      currentElement = currentElement.parentElement ? (currentElement.parentElement as unknown as SVGElement) : null;
    }
    if (
      currentElement &&
      (currentElement as SVGElement).id &&
      (currentElement as SVGElement).classList.contains(SVG_EDITABLE_CLASS) &&
      currentElement !== svgRef.current
    ) {
      e.stopPropagation(); // Prevent event bubbling to container
      setSelectedElementId((currentElement as SVGElement).id);
    }
  };

  // Reset selection when clicking the background
  const handleBackgroundClick = () => {
    setSelectedElementId(null);
  };
  
  // Create the Enhanced SVG with zoom/pan capabilities by combining original SVG content
  const createEnhancedSvg = () => {
    if (!svgContent) return '';
    
    try {
      // Ensures we're working with the latest parsed SVG
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      
      // Remove any existing viewBox to use our managed one
      svgElement.removeAttribute('viewBox');
      
      // Garante que elementos editáveis tenham a classe correta
      svgElement.querySelectorAll('[id]').forEach(el => {
        if (!el.classList.contains(SVG_EDITABLE_CLASS)) {
          el.classList.add(SVG_EDITABLE_CLASS);
        }
      });
      
      // Parse SVG content to HTML string
      const svgInnerHTML = new XMLSerializer().serializeToString(svgElement);
      
      // Return just the inner content (without the outer <svg> tag)
      return svgInnerHTML
        // Remove the opening svg tag
        .replace(/<svg[^>]*>/, '')
        // Remove the closing svg tag
        .replace(/<\/svg>$/, '');
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return '';
    }
  };
  
  // Get the SVG content without the outer <svg> tag
  const enhancedSvgContent = createEnhancedSvg();

  return (
    <div className="relative flex flex-col w-full h-full">
      {/* Toolbar */}
      <div className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-t-lg">
        <div className="flex space-x-2">
          <button 
            onClick={resetView}
            className="px-3 py-1 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            Reset View
          </button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Zoom: {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* SVG Container */}
      <div 
        ref={containerRef} 
        className={`flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-hidden relative ${className}`}
        onClick={handleBackgroundClick}
      >
        <svg
          ref={panRef}
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full cursor-grab"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleElementClick}
          dangerouslySetInnerHTML={{ __html: enhancedSvgContent }}
        ></svg>
        
        {/* Selection Indicator */}
        {selectedElementId && svgRef.current && (
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "none",
              width: "100%",
              height: "100%",
              zIndex: 10,
            }}
            viewBox={viewBox}
          >
            <SelectionHighlight
              svgRef={svgRef}
              selectedElementId={selectedElementId}
            />
          </svg>
        )}
      </div>
      
      {/* Info Footer */}
      <div className="p-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-b-lg">
        <p>Drag to pan • Scroll to zoom • Click to select elements</p>
      </div>
    </div>
  );
};

// Helper component to highlight selected SVG elements
interface SelectionHighlightProps {
  svgRef: React.RefObject<SVGSVGElement>;
  selectedElementId: string;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({ svgRef, selectedElementId }) => {
  const highlightRef = useRef<SVGRectElement>(null);

  useEffect(() => {
    if (!svgRef.current || !highlightRef.current) return;
    const selectedElement = svgRef.current.getElementById(selectedElementId);
    if (selectedElement) {
      try {
        // Corrigir tipo para acessar getBBox
        const bbox = (selectedElement as SVGGraphicsElement).getBBox();
        const transform = selectedElement.getAttribute('transform');
        const highlight = highlightRef.current;
        highlight.setAttribute('x', String(bbox.x));
        highlight.setAttribute('y', String(bbox.y));
        highlight.setAttribute('width', String(bbox.width));
        highlight.setAttribute('height', String(bbox.height));
        if (transform) {
          highlight.setAttribute('transform', transform);
        } else {
          highlight.removeAttribute('transform');
        }
      } catch (err) {
        console.error('Error updating selection highlight:', err);
        // Optionally reset highlight on error too
        const highlight = highlightRef.current;
        highlight.setAttribute('width', '0');
        highlight.setAttribute('height', '0');
        highlight.removeAttribute('transform');
      }
    } else {
      // Element not found, reset/hide highlight
      const highlight = highlightRef.current;
      highlight.setAttribute('width', '0');
      highlight.setAttribute('height', '0');
      highlight.removeAttribute('transform');
    }
  }, [selectedElementId, svgRef]);

  // Don't render until svgRef is available
  if (!svgRef.current) return null;
  
  return (
    <rect
      ref={highlightRef}
      x="0"
      y="0"
      width="0"
      height="0"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="1"
      strokeDasharray="4 2"
      pointerEvents="none"
    />
  );
};

export default EnhancedEditingCanvas;