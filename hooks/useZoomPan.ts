import { useRef, useCallback, useEffect } from "react";
import { useLogoStore } from "../store/logoStore";
import { ViewBox } from "../types";
import ViewBoxManager from '../services/ViewBoxManager';

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
      
      const rect = svgRef.current.getBoundingClientRect();
      const { x: mouseX, y: mouseY } = ViewBoxManager.clientToSVGCoordinates(
        e.clientX,
        e.clientY,
        rect,
        currentViewBox
      );

      const zoomDirection = e.deltaY < 0 ? 'in' : 'out';
      const newViewBox = ViewBoxManager.zoom(currentViewBox, zoomDirection, { x: mouseX, y: mouseY }, zoomFactor);
      
      // Calculate newZoom based on the change in width/height, consistent with how ViewBoxManager.zoom might change it.
      // This assumes zoomFactor is applied directly to width/height in ViewBoxManager.zoom
      // For a more robust approach, consider if ViewBoxManager should also return the new zoom level or scale factor.
      const newZoomFactor = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
      let newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel * newZoomFactor));
      
      setCurrentViewBox(newViewBox);
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
      const scaledDx = dx * (currentViewBox.width / rect.width);
      const scaledDy = dy * (currentViewBox.height / rect.height);
      
      const newViewBox = ViewBoxManager.pan(currentViewBox, scaledDx, scaledDy);
      
      setCurrentViewBox(newViewBox);
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
    const defaultViewBox = ViewBoxManager.createDefault();
    setCurrentViewBox(defaultViewBox);
    setZoomLevel(1);
  }, [setCurrentViewBox, setZoomLevel]);

  // Attach React event handlers (not native DOM listeners)
  return {
    svgRef,
    viewBox: ViewBoxManager.toString(currentViewBox),
    zoomLevel,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseEnter,
    resetView,
  };
}