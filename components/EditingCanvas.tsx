
import React, { useRef, useMemo } from 'react';
import { useLogoStore } from '../store/logoStore';
import { SVG_EDITABLE_CLASS } from '../constants';
import { applyTempHighlightToSvgElement } from '../utils/svgUtils';


interface EditingCanvasProps {
  svgContent: string | null;
  className?: string;
}

const EditingCanvas: React.FC<EditingCanvasProps> = ({ svgContent: rawSvgContent, className }) => {
  const setSelectedElementId = useLogoStore((state) => state.setSelectedElementId);
  const selectedElementId = useLogoStore((state) => state.selectedElementId);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const displaySvgForRender = useMemo(() => {
    if (!rawSvgContent) {
      return null;
    }
    if (selectedElementId) {
      return applyTempHighlightToSvgElement(rawSvgContent, selectedElementId, { stroke: 'rgb(34 197 94)', strokeWidth: '1px', strokeDasharray:'2 2'});
    }
    return rawSvgContent; // No element selected, or no highlight needed, show raw SVG
  }, [rawSvgContent, selectedElementId]);


  const handleSvgClick = (event: React.MouseEvent<HTMLDivElement>) => {
    let currentTargetNode: Node | null = event.target as Node;
    
    while(currentTargetNode && currentTargetNode !== svgContainerRef.current) {
      if (currentTargetNode instanceof SVGElement && 
          currentTargetNode.classList && 
          currentTargetNode.classList.contains(SVG_EDITABLE_CLASS) && 
          currentTargetNode.id) {
        setSelectedElementId(currentTargetNode.id);
        return;
      }
      currentTargetNode = currentTargetNode.parentNode;
    }
    setSelectedElementId(null);
  };
  
  if (!displaySvgForRender) {
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
      dangerouslySetInnerHTML={{ __html: displaySvgForRender }}
      style={{ touchAction: 'none' }} 
    />
  );
};

export default EditingCanvas;