import { useRef, useCallback, useEffect } from "react";
import { useLogoStore } from "../store/logoStore";
import { ViewBox } from "../types";
import { ViewBoxManager } from "../services/ViewBoxManager";

// Use ViewBoxManager for consistent viewBox string handling
function viewBoxToString(vb: ViewBox | null): string {
  if (!vb) return "0 0 100 100";
  return ViewBoxManager.toString(vb);
}

interface UseZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
}

/**
 * Custom hook for handling zoom and pan interactions with an SVG element
 */
export default function useZoomPan(
  svgRef: React.RefObject<SVGSVGElement>,
  {
    minZoom = 0.1,
    maxZoom = 10,
    zoomFactor = 0.1,
  }: UseZoomPanOptions = {}
) {
  const currentViewBox = useLogoStore((s) => s.currentViewBox);
  const zoomLevel = useLogoStore((s) => s.zoomLevel);
  // Funções de atualização do Zustand (sempre disponíveis)
  const setCurrentViewBox = useLogoStore((s) => s.setCurrentViewBox);
  const setZoomLevel = useLogoStore((s) => s.setZoomLevel);

  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // Handle mouse wheel for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      if (!svgRef.current || !currentViewBox) return;
      e.preventDefault();
      const direction = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
      let newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel * direction));
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * currentViewBox.width + currentViewBox.x;
      const mouseY = ((e.clientY - rect.top) / rect.height) * currentViewBox.height + currentViewBox.y;
      const newWidth = currentViewBox.width / direction;
      const newHeight = currentViewBox.height / direction;
      const relX = (mouseX - currentViewBox.x) / currentViewBox.width;
      const relY = (mouseY - currentViewBox.y) / currentViewBox.height;
      const newX = mouseX - relX * newWidth;
      const newY = mouseY - relY * newHeight;
      // Use ViewBoxManager's stabilization to prevent jitter
      const newViewBox = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      const stableViewBox = ViewBoxManager.getStableViewBox(newViewBox, 0.02) || newViewBox;
      setCurrentViewBox(stableViewBox);
      setZoomLevel(newZoom);
    },
    [svgRef, currentViewBox, zoomLevel, minZoom, maxZoom, zoomFactor, setCurrentViewBox, setZoomLevel]
  );

  // Start panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (svgRef.current) svgRef.current.style.cursor = "grabbing";
    },
    [svgRef]
  );

  // Handle panning motion
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isPanning.current || !svgRef.current || !currentViewBox) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = currentViewBox.width / rect.width;
      const scaleY = currentViewBox.height / rect.height;
      // Create updated viewBox with pan adjustments
      const newViewBox = {
        ...currentViewBox,
        x: currentViewBox.x - dx * scaleX,
        y: currentViewBox.y - dy * scaleY,
      };
      // Apply stabilization to prevent jerky movement
      const stableViewBox = ViewBoxManager.getStableViewBox(newViewBox, 0.01) || newViewBox;
      setCurrentViewBox(stableViewBox);
      lastMouse.current = { x: e.clientX, y: e.clientY };
    },
    [svgRef, currentViewBox, setCurrentViewBox]
  );

  // End panning
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (svgRef.current) svgRef.current.style.cursor = "grab";
  }, [svgRef]);

  // Enable pointer events
  const handleMouseEnter = useCallback(() => {
    if (!isPanning.current && svgRef.current) svgRef.current.style.cursor = "grab";
  }, [svgRef]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const resetView = useCallback(() => {
    setCurrentViewBox({ x: 0, y: 0, width: 100, height: 100 });
    setZoomLevel(1);
  }, [setCurrentViewBox, setZoomLevel]);

  // Attach React event handlers (not native DOM listeners)
  return {
    svgRef,
    viewBox: viewBoxToString(currentViewBox),
    zoomLevel,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseEnter,
    resetView,
  };
}