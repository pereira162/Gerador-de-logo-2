import { ViewBox } from '../types';

/**
 * Manages SVG ViewBox transformations and operations
 * Used to handle pan, zoom, and coordinate system transformations
 */
export class ViewBoxManager {
  
  /**
   * Creates a ViewBox object from a string definition
   * @param viewBoxStr ViewBox string in format "x y width height"
   * @returns ViewBox object or null if invalid string
   */
  private static lastStableViewBox: ViewBox | null = null;
  
  /**
   * Creates a stable ViewBox that prevents rapid oscillations
   * @param newViewBox The newly calculated ViewBox
   * @param threshold Minimum change threshold to update (default 5%)
   * @returns Stabilized ViewBox
   */
  static getStableViewBox(newViewBox: ViewBox | null, threshold: number = 0.05): ViewBox | null {
    if (!newViewBox) return this.lastStableViewBox;
    
    if (!this.lastStableViewBox) {
      this.lastStableViewBox = { ...newViewBox };
      return this.lastStableViewBox;
    }
    
    // Calculate percentage change in dimensions
    const widthChange = Math.abs((newViewBox.width - this.lastStableViewBox.width) / Math.max(1, this.lastStableViewBox.width));
    const heightChange = Math.abs((newViewBox.height - this.lastStableViewBox.height) / Math.max(1, this.lastStableViewBox.height));
    
    // For x and y positions, handle potential zero positions
    const lastX = Math.abs(this.lastStableViewBox.x) < 0.1 ? 1 : this.lastStableViewBox.x;
    const lastY = Math.abs(this.lastStableViewBox.y) < 0.1 ? 1 : this.lastStableViewBox.y;
    
    const xChange = Math.abs((newViewBox.x - this.lastStableViewBox.x) / Math.max(1, Math.abs(lastX)));
    const yChange = Math.abs((newViewBox.y - this.lastStableViewBox.y) / Math.max(1, Math.abs(lastY)));
    
    console.log('ViewBox changes:', { widthChange, heightChange, xChange, yChange, threshold });
    
    // Only update if changes exceed the threshold, or if maintaining the same aspect ratio
    if (widthChange > threshold || heightChange > threshold || xChange > threshold || yChange > threshold) {
      // Create a new object to prevent reference issues
      this.lastStableViewBox = { 
        x: newViewBox.x,
        y: newViewBox.y, 
        width: newViewBox.width, 
        height: newViewBox.height 
      };
      return this.lastStableViewBox;
    }
    
    // Otherwise keep the last stable viewBox
    return this.lastStableViewBox;
  }
  
  /**
   * Creates a ViewBox object from a string definition
   * @param viewBoxStr ViewBox string in format "x y width height"
   * @returns ViewBox object or null if invalid string
   */
  static parseViewBoxString(viewBoxStr: string | null): ViewBox | null {
    if (!viewBoxStr) return null;
    
    const parts = viewBoxStr.trim().split(/\s+|,/).map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      console.error('Invalid viewBox format:', viewBoxStr);
      return null;
    }
    
    return {
      x: parts[0],
      y: parts[1],
      width: parts[2],
      height: parts[3]
    };
  }
  
  /**
   * Converts a ViewBox object to a string representation
   * @param viewBox ViewBox object
   * @returns Formatted viewBox string
   */
  static toString(viewBox: ViewBox): string {
    return `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  }
  
  /**
   * Creates a new ViewBox that represents a zoomed version
   * @param viewBox Current ViewBox
   * @param scale Zoom scale factor
   * @param zoomPoint Point to zoom around (in SVG coordinates)
   * @returns New ViewBox representing the zoomed view
   */
  static zoom(viewBox: ViewBox, scale: number, zoomPoint: { x: number, y: number }): ViewBox {
    const newWidth = viewBox.width / scale;
    const newHeight = viewBox.height / scale;
    
    // Calculate new x,y to keep zoomPoint at the same relative position
    const relX = (zoomPoint.x - viewBox.x) / viewBox.width;
    const relY = (zoomPoint.y - viewBox.y) / viewBox.height;
    
    const newX = zoomPoint.x - relX * newWidth;
    const newY = zoomPoint.y - relY * newHeight;
    
    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    };
  }
  
  /**
   * Creates a new ViewBox that represents a panned version
   * @param viewBox Current ViewBox
   * @param dx Amount to pan in x direction (in SVG coordinates)
   * @param dy Amount to pan in y direction (in SVG coordinates)
   * @returns New ViewBox representing the panned view
   */
  static pan(viewBox: ViewBox, dx: number, dy: number): ViewBox {
    return {
      x: viewBox.x - dx,
      y: viewBox.y - dy,
      width: viewBox.width,
      height: viewBox.height
    };
  }
  
  /**
   * Convert client (screen) coordinates to SVG coordinates
   * @param clientX Client X coordinate
   * @param clientY Client Y coordinate
   * @param svgElement SVG DOM element
   * @param viewBox Current ViewBox
   * @returns Coordinates in SVG space
   */
  static clientToSVGCoordinates(
    clientX: number, 
    clientY: number, 
    svgElement: SVGSVGElement,
    viewBox: ViewBox
  ): { x: number, y: number } {
    const svgRect = svgElement.getBoundingClientRect();
    
    // Calculate the relative position within the SVG element
    const relativeX = (clientX - svgRect.left) / svgRect.width;
    const relativeY = (clientY - svgRect.top) / svgRect.height;
    
    // Map to ViewBox coordinates
    return {
      x: viewBox.x + viewBox.width * relativeX,
      y: viewBox.y + viewBox.height * relativeY
    };
  }
  
  /**
   * Calculate the aspect ratio of a ViewBox
   * @param viewBox ViewBox object
   * @returns Aspect ratio (width/height)
   */
  static getAspectRatio(viewBox: ViewBox): number {
    return viewBox.width / viewBox.height;
  }
  
  /**
   * Adjust a ViewBox to fit within a container while maintaining aspect ratio
   * @param viewBox ViewBox to adjust
   * @param containerWidth Container width
   * @param containerHeight Container height
   * @returns Adjusted ViewBox that maintains aspect ratio
   */
  static fitToContainer(
    viewBox: ViewBox,
    containerWidth: number,
    containerHeight: number
  ): ViewBox {
    const viewBoxAspectRatio = viewBox.width / viewBox.height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let newWidth = viewBox.width;
    let newHeight = viewBox.height;
    
    if (viewBoxAspectRatio > containerAspectRatio) {
      // ViewBox is wider than container
      newHeight = newWidth / containerAspectRatio;
    } else {
      // ViewBox is taller than container
      newWidth = newHeight * containerAspectRatio;
    }
    
    return {
      x: viewBox.x - (newWidth - viewBox.width) / 2,
      y: viewBox.y - (newHeight - viewBox.height) / 2,
      width: newWidth,
      height: newHeight
    };
  }
  
  /**
   * Create a default ViewBox for when none is specified
   * @returns Default ViewBox
   */
  static createDefault(): ViewBox {
    return { x: 0, y: 0, width: 100, height: 100 };
  }
}