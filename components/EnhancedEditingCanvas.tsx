import React, { useEffect, useRef } from 'react';
import { useZoomPan } from '../hooks/useZoomPan';
import { useLogoStore } from '../store/logoStore';
import { ViewBoxManager } from '../services/ViewBoxManager';

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
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.documentElement;
  
  // Get the current viewBox from the SVG or use a default
  const originalViewBoxStr = svgElement.getAttribute('viewBox');
  
  // Set up zoom and pan functionality
  const { svgRef, viewBox, zoomLevel, resetView, fitContent } = useZoomPan({
    minZoom: 0.1,
    maxZoom: 10,
    zoomFactor: 0.1
  });

  // Select an element on click
  const handleElementClick = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    
    // Find the nearest element with an ID (could be a parent)
    let currentElement: SVGElement | null = target;
    while (currentElement && !currentElement.id && currentElement !== svgRef.current) {
      currentElement = currentElement.parentElement as SVGElement;
    }
    
    if (currentElement && currentElement.id && currentElement !== svgRef.current) {
      e.stopPropagation(); // Prevent event bubbling to container
      setSelectedElementId(currentElement.id);
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
          <button 
            onClick={fitContent}
            className="px-3 py-1 text-sm bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            Fit Content
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
          ref={svgRef}
          viewBox={viewBox}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full cursor-grab"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleElementClick}
          dangerouslySetInnerHTML={{ __html: enhancedSvgContent }}
        ></svg>
        
        {/* Selection Indicator */}
        {selectedElementId && svgRef.current && (
          <SelectionHighlight
            svgRef={svgRef}
            selectedElementId={selectedElementId}
          />
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
        // Get bounding box of selected element
        const bbox = selectedElement.getBBox();
        
        // Apply element's transforms if any
        const transform = selectedElement.getAttribute('transform');
        
        // Update highlight position
        const highlight = highlightRef.current;
        highlight.setAttribute('x', String(bbox.x));
        highlight.setAttribute('y', String(bbox.y));
        highlight.setAttribute('width', String(bbox.width));
        highlight.setAttribute('height', String(bbox.height));
        
        // If there's a transform, apply it to the highlight as well
        if (transform) {
          highlight.setAttribute('transform', transform);
        } else {
          highlight.removeAttribute('transform');
        }
      } catch (err) {
        console.error('Error updating selection highlight:', err);
      }
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