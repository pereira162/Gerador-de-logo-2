import { describe, it, expect, vi } from 'vitest';
import ViewBoxManager, { DEFAULT_VIEW_BOX } from './ViewBoxManager';
import type { ViewBox } from '../types';

describe('ViewBoxManager', () => {
  describe('parseViewBoxString', () => {
    it('should parse a valid viewBox string "x y w h"', () => {
      expect(ViewBoxManager.parseViewBoxString('10 20 100 200')).toEqual({ x: 10, y: 20, width: 100, height: 200 });
    });

    it('should parse a valid viewBox string with commas "x, y, w, h"', () => {
      expect(ViewBoxManager.parseViewBoxString('10, 20, 100, 200')).toEqual({ x: 10, y: 20, width: 100, height: 200 });
    });

    it('should parse a string with extra spaces', () => {
      expect(ViewBoxManager.parseViewBoxString('  10   20   100   200  ')).toEqual({ x: 10, y: 20, width: 100, height: 200 });
    });

    it('should return null for an invalid string with insufficient numbers', () => {
      expect(ViewBoxManager.parseViewBoxString('10 20 100')).toBeNull();
    });

    it('should return null for a string with non-numeric values', () => {
      expect(ViewBoxManager.parseViewBoxString('10 20 foo 200')).toBeNull();
    });

    it('should return null for an empty string', () => {
      expect(ViewBoxManager.parseViewBoxString('')).toBeNull();
    });

    it('should return null for a null input', () => {
      expect(ViewBoxManager.parseViewBoxString(null)).toBeNull();
    });
  });

  describe('toString', () => {
    it('should convert a ViewBox object to a string "x y w h"', () => {
      const vb: ViewBox = { x: 10, y: 20, width: 100, height: 200 };
      expect(ViewBoxManager.toString(vb)).toBe('10 20 100 200');
    });

    it('should return default string for null ViewBox object', () => {
        const defaultStr = `${DEFAULT_VIEW_BOX.x} ${DEFAULT_VIEW_BOX.y} ${DEFAULT_VIEW_BOX.width} ${DEFAULT_VIEW_BOX.height}`;
        expect(ViewBoxManager.toString(null)).toBe(defaultStr);
    });
  });

  describe('zoom', () => {
    const initialViewBox: ViewBox = { x: 0, y: 0, width: 100, height: 100 };
    const zoomPoint = { x: 50, y: 50 }; // Center of the initial viewBox
    const zoomFactor = 0.1; // Standard factor used in useZoomPan

    it('should zoom in correctly (scale factor > 1 equivalent)', () => {
      // 'in' implies a scale factor internally calculated like 1 / (1 - zoomFactor) if zoomFactor represents reduction
      // Or, if ViewBoxManager.zoom's 'factor' argument is directly used as a multiplier for width/height when zooming out,
      // then for zooming in, it would be width / (1 + factor), height / (1 + factor)
      // Let's assume the zoomFactor in useZoomPan (0.1) is passed to ViewBoxManager.zoom
      // and ViewBoxManager.zoom interprets 'in' as making things larger (smaller viewBox width/height)
      // and 'out' as making things smaller (larger viewBox width/height).

      const newViewBox = ViewBoxManager.zoom(initialViewBox, 'in', zoomPoint, zoomFactor);
      // Expected new width = 100 / (1 + 0.1) = 90.9090...
      // Expected new x = 50 - (50 * (100 / (1 + 0.1))) / 100 = 50 - 50 * (1 / (1+0.1)) = 50 - 45.4545... = 4.5454...
      expect(newViewBox.width).toBeLessThan(initialViewBox.width);
      expect(newViewBox.height).toBeLessThan(initialViewBox.height);
      expect(newViewBox.x).toBeCloseTo(zoomPoint.x * (1 - newViewBox.width / initialViewBox.width));
      expect(newViewBox.y).toBeCloseTo(zoomPoint.y * (1 - newViewBox.height / initialViewBox.height));
    });

    it('should zoom out correctly (scale factor < 1 equivalent)', () => {
      const newViewBox = ViewBoxManager.zoom(initialViewBox, 'out', zoomPoint, zoomFactor);
      // Expected new width = 100 * (1 + 0.1) = 110
      // Expected new x = 50 - (50 * (100 * (1 + 0.1))) / 100 = 50 - 50 * (1+0.1) = 50 - 55 = -5
      expect(newViewBox.width).toBeGreaterThan(initialViewBox.width);
      expect(newViewBox.height).toBeGreaterThan(initialViewBox.height);
      expect(newViewBox.x).toBeCloseTo(zoomPoint.x - (zoomPoint.x * newViewBox.width / initialViewBox.width));
      expect(newViewBox.y).toBeCloseTo(zoomPoint.y - (zoomPoint.y * newViewBox.height / initialViewBox.height));
    });

    it('should zoom correctly with a different zoom point (e.g., top-left corner)', () => {
      const topLeftZoomPoint = { x: 0, y: 0 };
      const newViewBoxIn = ViewBoxManager.zoom(initialViewBox, 'in', topLeftZoomPoint, zoomFactor);
      expect(newViewBoxIn.x).toBeCloseTo(0); // x should change relative to the zoom point
      expect(newViewBoxIn.y).toBeCloseTo(0); // y should change relative to the zoom point

      const newViewBoxOut = ViewBoxManager.zoom(initialViewBox, 'out', topLeftZoomPoint, zoomFactor);
      expect(newViewBoxOut.x).toBeCloseTo(0);
      expect(newViewBoxOut.y).toBeCloseTo(0);
    });

     it('should zoom correctly with a zoom point at viewBox origin (0,0) even if viewBox x,y are not 0,0', () => {
      const offsetViewBox: ViewBox = { x: 10, y: 10, width: 100, height: 100 };
      const zoomPointRelativeToViewBoxOrigin = { x: 10, y: 10 }; // This is (0,0) in the viewBox's own coordinate system
      
      const newViewBox = ViewBoxManager.zoom(offsetViewBox, 'in', zoomPointRelativeToViewBoxOrigin, zoomFactor);
      // The new x should be such that the point (10,10) remains stationary relative to the SVG container's top-left.
      // new_x + (svg_mouse_x - new_x) * (new_width / old_width) = svg_mouse_x
      // new_x = svg_mouse_x - (svg_mouse_x - old_x) * (new_width / old_width)
      // new_x = zoom_point_x - (zoom_point_x - old_x) * (new_width / old_width)
      // new_x = 10 - (10 - 10) * (new_width / 100) = 10
      expect(newViewBox.x).toBeCloseTo(offsetViewBox.x);
      expect(newViewBox.y).toBeCloseTo(offsetViewBox.y);
      expect(newViewBox.width).lt(offsetViewBox.width);
      expect(newViewBox.height).lt(offsetViewBox.height);
    });


    it('should return the same viewBox if zoomFactor is 0', () => {
        const newViewBox = ViewBoxManager.zoom(initialViewBox, 'in', zoomPoint, 0);
        expect(newViewBox).toEqual(initialViewBox);
    });
  });

  describe('pan', () => {
    const initialViewBox: ViewBox = { x: 0, y: 0, width: 100, height: 100 };

    it('should pan in the positive x direction (dx > 0)', () => {
      const newViewBox = ViewBoxManager.pan(initialViewBox, 10, 0);
      expect(newViewBox.x).toBe(initialViewBox.x - 10); // Pan moves viewpoint, so content moves opposite
      expect(newViewBox.y).toBe(initialViewBox.y);
    });

    it('should pan in the negative x direction (dx < 0)', () => {
      const newViewBox = ViewBoxManager.pan(initialViewBox, -10, 0);
      expect(newViewBox.x).toBe(initialViewBox.x - (-10));
      expect(newViewBox.y).toBe(initialViewBox.y);
    });

    it('should pan in the positive y direction (dy > 0)', () => {
      const newViewBox = ViewBoxManager.pan(initialViewBox, 0, 10);
      expect(newViewBox.x).toBe(initialViewBox.x);
      expect(newViewBox.y).toBe(initialViewBox.y - 10);
    });

    it('should pan in the negative y direction (dy < 0)', () => {
      const newViewBox = ViewBoxManager.pan(initialViewBox, 0, -10);
      expect(newViewBox.x).toBe(initialViewBox.x);
      expect(newViewBox.y).toBe(initialViewBox.y - (-10));
    });

    it('should pan in both x and y directions', () => {
      const newViewBox = ViewBoxManager.pan(initialViewBox, 5, -5);
      expect(newViewBox.x).toBe(initialViewBox.x - 5);
      expect(newViewBox.y).toBe(initialViewBox.y - (-5));
    });
  });

  describe('clientToSVGCoordinates', () => {
    const viewBox: ViewBox = { x: 0, y: 0, width: 200, height: 100 };
    const mockSvgElement = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 20,
        width: 400, // SVG element is 400x200 on screen
        height: 200,
        right: 410,
        bottom: 220,
        x: 10,
        y: 20,
        toJSON: () => {},
      }),
    } as unknown as SVGSVGElement;

    it('should correctly convert client coordinates to SVG coordinates (no viewBox offset)', () => {
      // Client click at (60, 70) relative to viewport
      // SVG element is at (10, 20)
      // Click relative to SVG element: (60-10, 70-20) = (50, 50)
      // SVG display size: 400x200
      // ViewBox size: 200x100
      // Scale: (200/400, 100/200) = (0.5, 0.5)
      // SVG coordinates: (50 * 0.5, 50 * 0.5) = (25, 25)
      const coords = ViewBoxManager.clientToSVGCoordinates(60, 70, mockSvgElement, viewBox);
      expect(coords.x).toBe(25);
      expect(coords.y).toBe(25);
    });

    it('should correctly convert client coordinates when viewBox is panned (has x, y offset)', () => {
      const pannedViewBox: ViewBox = { x: 50, y: 25, width: 200, height: 100 };
      // Client click at (60, 70)
      // Click relative to SVG: (50, 50)
      // Scale: (0.5, 0.5)
      // Unpanned SVG coords: (25, 25)
      // Panned SVG coords: (25 + pannedViewBox.x, 25 + pannedViewBox.y) = (25 + 50, 25 + 25) = (75, 50)
      const coords = ViewBoxManager.clientToSVGCoordinates(60, 70, mockSvgElement, pannedViewBox);
      expect(coords.x).toBe(75);
      expect(coords.y).toBe(50);
    });

    it('should handle client coordinates at the top-left of the SVG element', () => {
        // Client click at (10, 20) which is SVG's top-left
        // Click relative to SVG: (0,0)
        // SVG coords: (0 * 0.5 + 0, 0 * 0.5 + 0) = (0,0) for viewBox {0,0,200,100}
      const coords = ViewBoxManager.clientToSVGCoordinates(10, 20, mockSvgElement, viewBox);
      expect(coords.x).toBe(0);
      expect(coords.y).toBe(0);
    });
    
    it('should handle client coordinates at the top-left of the SVG element with panned viewBox', () => {
        const pannedViewBox: ViewBox = { x: 50, y: 25, width: 200, height: 100 };
        // Client click at (10, 20)
        // Click relative to SVG: (0,0)
        // Panned SVG coords: (0 * 0.5 + 50, 0 * 0.5 + 25) = (50,25)
      const coords = ViewBoxManager.clientToSVGCoordinates(10, 20, mockSvgElement, pannedViewBox);
      expect(coords.x).toBe(50);
      expect(coords.y).toBe(25);
    });
  });

  describe('createDefault', () => {
    it('should return the default ViewBox object', () => {
      expect(ViewBoxManager.createDefault()).toEqual(DEFAULT_VIEW_BOX);
    });

    it('default object should match imported DEFAULT_VIEW_BOX', () => {
        const defaultVB = ViewBoxManager.createDefault();
        expect(defaultVB.x).toBe(0);
        expect(defaultVB.y).toBe(0);
        expect(defaultVB.width).toBe(100);
        expect(defaultVB.height).toBe(100);
    });
  });
});
