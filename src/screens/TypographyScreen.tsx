import { useRef, useEffect } from "react";
import useZoomPan from "../../hooks/useZoomPan";
import { SVG_EDITABLE_CLASS } from "../../constants";

const MARGEM = 32; // margem extra para evitar cortes

// Substituir getDynamicViewBoxForTypography por função local
function getDynamicViewBoxForTypography(svg: SVGSVGElement, margem: number = 32): string {
  const text = svg.querySelector("text");
  if (!text) return "0 0 400 100";
  const bbox = text.getBBox();
  const x = bbox.x - margem;
  const y = bbox.y - margem;
  const w = bbox.width + 2 * margem;
  const h = bbox.height + 2 * margem;
  return `${x} ${y} ${w} ${h}`;
}

export default function TypographyScreen(props: { texto: string; fonte: string; cor: string; tamanho: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { texto, fonte, cor, tamanho } = props;

  // Hook de zoom/pan
  const { viewBox, resetView, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseEnter } = useZoomPan(svgRef, { minZoom: 0.2, maxZoom: 4 });

  // Ajuste automático do viewBox para englobar todo o texto
  useEffect(() => {
    if (svgRef.current) {
      const vb = getDynamicViewBoxForTypography(svgRef.current, MARGEM);
      if (vb) resetView();
    }
    // eslint-disable-next-line
  }, [texto, fonte, tamanho]);

  return (
    <div className="typography-canvas-container">
      <svg
        ref={svgRef}
        className="typography-canvas"
        viewBox={viewBox}
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        style={{ background: "#fff", borderRadius: 8 }}
      >
        <text
          x={0}
          y={tamanho}
          fontFamily={fonte}
          fontSize={tamanho}
          fill={cor}
          className={SVG_EDITABLE_CLASS}
          id="typography-main-text"
        >
          {texto}
        </text>
        {/* Adicione outros elementos se necessário */}
      </svg>
      <button onClick={() => resetView()}>Resetar Zoom/Pan</button>
    </div>
  );
}