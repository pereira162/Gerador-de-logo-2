
import React, { useRef, useEffect, useState } from 'react';
import { useLogoStore } from '../store/logoStore';
import { SVG_EDITABLE_CLASS } from '../constants';
import { applyTempHighlightToSvgElement, removeTempHighlightFromSvgElement } from '../utils/svgUtils';


interface EditingCanvasProps {
  svgContent: string | null;
  className?: string;
}

const EditingCanvas: React.FC<EditingCanvasProps> = ({ svgContent: rawSvgContent, className }) => {
  const setSelectedElementId = useLogoStore((state) => state.setSelectedElementId);
  const selectedElementId = useLogoStore((state) => state.selectedElementId);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [displaySvg, setDisplaySvg] = useState<string | null>(rawSvgContent);

  useEffect(() => {
    let currentSvg = rawSvgContent;
    if (selectedElementId && currentSvg) {
      currentSvg = applyTempHighlightToSvgElement(currentSvg, selectedElementId, { stroke: 'rgb(34 197 94)', strokeWidth: '1px', strokeDasharray:'2 2'});
    }
    setDisplaySvg(currentSvg);
    
    // Cleanup previous highlight if selectedElementId changes or rawSvgContent changes
    return () => {
      if (rawSvgContent && selectedElementId) {
        // This is tricky because rawSvgContent might already be the new one.
        // Ideally, applyTempHighlight should be idempotent or we store the "clean" version.
        // For now, this effect re-applies based on current selectedElementId.
      }
    };

  }, [rawSvgContent, selectedElementId]);


  const handleSvgClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Fix: Changed target type to Node | null for broader compatibility and correct traversal.
    let currentTargetNode: Node | null = event.target as Node;
    
    // Traverse up if the click was on a child within an editable group (e.g. <tspan> in <text>)
    // Fix: Loop condition is now type-safe as currentTargetNode is Node | null and svgContainerRef.current is HTMLDivElement | null.
    while(currentTargetNode && currentTargetNode !== svgContainerRef.current) {
      // Fix: Check if the current node is an SVGElement and has the required properties.
      if (currentTargetNode instanceof SVGElement && 
          currentTargetNode.classList && // classList is on Element, SVGElement extends Element
          currentTargetNode.classList.contains(SVG_EDITABLE_CLASS) && 
          currentTargetNode.id) {
        setSelectedElementId(currentTargetNode.id);
        return;
      }
      // Fix: Use parentNode for DOM traversal; result is Node | null, which matches currentTargetNode type.
      currentTargetNode = currentTargetNode.parentNode;
    }
    // If clicked on background or non-editable part
    setSelectedElementId(null);
  };
  
  if (!displaySvg) {
    return (
      <div className={`flex items-center justify-center bg-slate-700 rounded-lg aspect-square ${className || 'w-full h-auto'}`}>
        <p className="text-slate-400">No logo loaded.</p>
      </div>
    );
  }

  return (
    <div
      ref={svgContainerRef}
      className={`p-4 bg-slate-700 rounded-lg shadow-inner flex items-center justify-center ${className || 'w-full h-auto'}`}
      onClick={handleSvgClick}
      dangerouslySetInnerHTML={{ __html: displaySvg }}
      style={{ 
        touchAction: 'none',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
};

export default EditingCanvas;