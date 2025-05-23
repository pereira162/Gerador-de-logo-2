import { useState, useRef, useCallback, useEffect } from "react";
import { ViewBox } from "../types";
import { ViewBoxManager } from "../services/ViewBoxManager";
import { useLogoStore } from "../store/logoStore";

interface UseZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
}

/**
 * Custom hook for handling zoom and pan interactions with an SVG element
 */
export function useZoomPan({ 
  minZoom = 0.1,
  maxZoom = 10, 
  zoomFactor = 0.1
}: UseZoomPanOptions = {}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDragging = useRef(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });
  
  // Get state from store
  const currentViewBox = useLogoStore(state => state.currentViewBox);
  const zoomLevel = useLogoStore(state => state.zoomLevel);
  const setCurrentViewBox = useLogoStore(state => state.setCurrentViewBox);
  const setZoomLevel = useLogoStore(state => state.setZoomLevel);
  const resetViewToDefault = useLogoStore(state => state.resetViewToDefault);

  // Initialize viewBox if not yet set
  useEffect(() => {
    if (!currentViewBox && svgRef.current) {
      const viewBoxStr = svgRef.current.getAttribute("viewBox");
      const initialViewBox = ViewBoxManager.parseViewBoxString(viewBoxStr) || 
                           ViewBoxManager.createDefault();
      setCurrentViewBox(initialViewBox);
    }
  }, [currentViewBox, setCurrentViewBox]);

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    if (!svgRef.current || !currentViewBox) return;
    
    // Calculate zoom direction and factor
    const delta = e.deltaY < 0 ? 1 + zoomFactor : 1 - zoomFactor;
    const newZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel * delta));
    
    // Get mouse position in SVG coordinates
    const zoomPoint = ViewBoxManager.clientToSVGCoordinates(
      e.clientX, 
      e.clientY, 
      svgRef.current,
      currentViewBox
    );
    
    // Calculate new viewBox
    const newViewBox = ViewBoxManager.zoom(currentViewBox, delta, zoomPoint);
    
    setCurrentViewBox(newViewBox);
    setZoomLevel(newZoomLevel);
  }, [currentViewBox, zoomLevel, zoomFactor, minZoom, maxZoom, setCurrentViewBox, setZoomLevel]);

  // Start panning
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0 || !currentViewBox) return; // Only left mouse button
    
    isDragging.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    
    // Set cursor to grabbing
    if (svgRef.current) {
      svgRef.current.style.cursor = "grabbing";
    }
  }, [currentViewBox]);

  // Handle panning motion
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !svgRef.current || !currentViewBox) return;
    
    const dx = e.clientX - lastMousePosition.current.x;
    const dy = e.clientY - lastMousePosition.current.y;
    
    // Scale the movement according to the SVG viewport and current zoom level
    const svgRect = svgRef.current.getBoundingClientRect();
    const scaleX = currentViewBox.width / svgRect.width;
    const scaleY = currentViewBox.height / svgRect.height;
    
    // Calculate pan distance in SVG coordinates
    const panX = dx * scaleX;
    const panY = dy * scaleY;
    
    // Update viewBox
    const newViewBox = ViewBoxManager.pan(currentViewBox, -panX, -panY);
    setCurrentViewBox(newViewBox);
    
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  }, [currentViewBox, setCurrentViewBox]);

  // End panning
  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    
    // Reset cursor
    if (svgRef.current) {
      svgRef.current.style.cursor = "grab";
    }
  }, []);
  
  // Enable pointer events
  const handleMouseEnter = useCallback(() => {
    if (svgRef.current) {
      svgRef.current.style.cursor = "grab";
    }
  }, []);

  // Clean up event listeners when component unmounts
  useEffect(() => {
    const svgElement = svgRef.current;
    
    if (svgElement) {
      svgElement.addEventListener("wheel", handleWheel, { passive: false });
      svgElement.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      svgElement.addEventListener("mouseenter", handleMouseEnter);
      
      return () => {
        svgElement.removeEventListener("wheel", handleWheel);
        svgElement.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        svgElement.removeEventListener("mouseenter", handleMouseEnter);
      };
    }
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseEnter]);

  // Reset view to default
  const resetView = useCallback(() => {
    resetViewToDefault();
  }, [resetViewToDefault]);

  // Fit content to view
  const fitContent = useCallback(() => {
    if (svgRef.current && currentViewBox) {
      const bbox = svgRef.current.getBBox();
      const padding = Math.min(bbox.width, bbox.height) * 0.1; // Add 10% padding
      
      setCurrentViewBox({
        x: bbox.x - padding,
        y: bbox.y - padding,
        width: bbox.width + padding * 2,
        height: bbox.height + padding * 2
      });
      setZoomLevel(1);
    }
  }, [currentViewBox, setCurrentViewBox, setZoomLevel]);

  return {
    svgRef,
    viewBox: currentViewBox ? ViewBoxManager.toString(currentViewBox) : "0 0 100 100",
    zoomLevel,
    resetView,
    fitContent
  };
}