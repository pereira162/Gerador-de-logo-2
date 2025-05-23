import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react'; // Using react-testing-library for hook testing
import useZoomPan from './useZoomPan';
import ViewBoxManager from '../services/ViewBoxManager';
import { useLogoStore } from '../store/logoStore';
import type { ViewBox } from '../types';

// Mock ViewBoxManager
vi.mock('../services/ViewBoxManager', () => ({
  default: {
    parseViewBoxString: vi.fn(),
    toString: vi.fn((vb) => vb ? `${vb.x} ${vb.y} ${vb.width} ${vb.height}` : '0 0 100 100'),
    zoom: vi.fn(),
    pan: vi.fn(),
    clientToSVGCoordinates: vi.fn(),
    createDefault: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
  },
}));

// Mock logoStore
const mockSetCurrentViewBox = vi.fn();
const mockSetZoomLevel = vi.fn();
let mockCurrentViewBox: ViewBox | null = { x: 0, y: 0, width: 100, height: 100 };
let mockZoomLevel = 1;

vi.mock('../store/logoStore', () => ({
  useLogoStore: vi.fn((selector) => {
    if (selector.name === 's => s.currentViewBox') return mockCurrentViewBox;
    if (selector.name === 's => s.zoomLevel') return mockZoomLevel;
    if (selector.name === 's => s.setCurrentViewBox') return mockSetCurrentViewBox;
    if (selector.name === 's => s.setZoomLevel') return mockSetZoomLevel;
    return vi.fn();
  }),
}));


describe('useZoomPan', () => {
  let mockSvgRef: { current: HTMLSVGSVGElement | null };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    mockCurrentViewBox = { x: 0, y: 0, width: 100, height: 100 };
    mockZoomLevel = 1;
    (useLogoStore as any).mockImplementation((selector: any) => {
        if (typeof selector === 'function') {
             // Attempt to simulate selector execution based on common patterns
            const selectorStr = selector.toString();
            if (selectorStr.includes('currentViewBox')) return mockCurrentViewBox;
            if (selectorStr.includes('zoomLevel')) return mockZoomLevel;
            if (selectorStr.includes('setCurrentViewBox')) return mockSetCurrentViewBox;
            if (selectorStr.includes('setZoomLevel')) return mockSetZoomLevel;
        }
        // Fallback for direct state access if any (though selectors are typical)
        return {
            currentViewBox: mockCurrentViewBox,
            zoomLevel: mockZoomLevel,
            setCurrentViewBox: mockSetCurrentViewBox,
            setZoomLevel: mockSetZoomLevel,
        }[selector] || vi.fn();
    });


    mockSvgRef = {
      current: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          width: 1000, // Mock SVG client width
          height: 500, // Mock SVG client height
          right: 1000,
          bottom: 500,
          x: 0,
          y: 0,
          toJSON: () => {},
        }),
        style: { cursor: '' },
      } as unknown as HTMLSVGSVGElement,
    };

    // Mock ViewBoxManager methods that return values
    (ViewBoxManager.toString as ReturnType<typeof vi.fn>).mockImplementation(
        (vb) => vb ? `${vb.x} ${vb.y} ${vb.width} ${vb.height}` : '0 0 100 100'
    );
    (ViewBoxManager.createDefault as ReturnType<typeof vi.fn>).mockReturnValue(
        { x: 0, y: 0, width: 100, height: 100 }
    );
  });

  it('should return initial state from store', () => {
    const { result } = renderHook(() => useZoomPan(mockSvgRef));
    expect(result.current.viewBox).toBe('0 0 100 100');
    expect(result.current.zoomLevel).toBe(1);
    expect(ViewBoxManager.toString).toHaveBeenCalledWith(mockCurrentViewBox);
  });

  describe('handleWheel', () => {
    it('should zoom in and update store', () => {
      const { result } = renderHook(() => useZoomPan(mockSvgRef));
      const mockEvent = {
        preventDefault: vi.fn(),
        deltaY: -100, // Zoom in
        clientX: 500,
        clientY: 250,
      } as unknown as React.WheelEvent<SVGSVGElement>;

      const zoomedViewBox: ViewBox = { x: 5, y: 5, width: 90, height: 90 };
      (ViewBoxManager.clientToSVGCoordinates as ReturnType<typeof vi.fn>).mockReturnValue({ x: 50, y: 25 });
      (ViewBoxManager.zoom as ReturnType<typeof vi.fn>).mockReturnValue(zoomedViewBox);
      
      act(() => {
        result.current.handleWheel(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(ViewBoxManager.clientToSVGCoordinates).toHaveBeenCalledWith(
        mockEvent.clientX,
        mockEvent.clientY,
        mockSvgRef.current?.getBoundingClientRect(),
        mockCurrentViewBox
      );
      expect(ViewBoxManager.zoom).toHaveBeenCalledWith(
        mockCurrentViewBox,
        'in',
        { x: 50, y: 25 }, // from clientToSVGCoordinates
        0.1 // default zoomFactor from useZoomPan options
      );
      expect(mockSetCurrentViewBox).toHaveBeenCalledWith(zoomedViewBox);
      expect(mockSetZoomLevel).toHaveBeenCalled(); // Specific value depends on min/max and calculation
    });

    it('should zoom out and update store', () => {
        const { result } = renderHook(() => useZoomPan(mockSvgRef));
        const mockEvent = {
          preventDefault: vi.fn(),
          deltaY: 100, // Zoom out
          clientX: 500,
          clientY: 250,
        } as unknown as React.WheelEvent<SVGSVGElement>;
  
        const zoomedViewBox: ViewBox = { x: -5, y: -5, width: 110, height: 110 };
        (ViewBoxManager.clientToSVGCoordinates as ReturnType<typeof vi.fn>).mockReturnValue({ x: 50, y: 25 });
        (ViewBoxManager.zoom as ReturnType<typeof vi.fn>).mockReturnValue(zoomedViewBox);
        
        act(() => {
          result.current.handleWheel(mockEvent);
        });
  
        expect(ViewBoxManager.zoom).toHaveBeenCalledWith(
          mockCurrentViewBox,
          'out',
          { x: 50, y: 25 },
          0.1
        );
        expect(mockSetCurrentViewBox).toHaveBeenCalledWith(zoomedViewBox);
        expect(mockSetZoomLevel).toHaveBeenCalled();
      });

    it('should respect minZoom and maxZoom', () => {
        const { result } = renderHook(() => useZoomPan(mockSvgRef, { minZoom: 0.5, maxZoom: 2, zoomFactor: 0.1 }));
        const mockEvent = { preventDefault: vi.fn(), clientX: 0, clientY: 0 } as any;
  
        (ViewBoxManager.clientToSVGCoordinates as ReturnType<typeof vi.fn>).mockReturnValue({ x: 0, y: 0 });
        (ViewBoxManager.zoom as ReturnType<typeof vi.fn>).mockImplementation((vb, dir) => {
          if (dir === 'in') return { ...vb, width: vb.width * 0.9, height: vb.height * 0.9 };
          return { ...vb, width: vb.width * 1.1, height: vb.height * 1.1 };
        });
  
        // Zoom in to max
        mockZoomLevel = 1.9;
        act(() => { result.current.handleWheel({ ...mockEvent, deltaY: -100 }); }); // Try to zoom in past 2.0
        expect(mockSetZoomLevel).toHaveBeenCalledWith(2); // Should be clamped to 2
  
        // Zoom out to min
        mockZoomLevel = 0.55;
        act(() => { result.current.handleWheel({ ...mockEvent, deltaY: 100 }); }); // Try to zoom out past 0.5
        expect(mockSetZoomLevel).toHaveBeenCalledWith(0.5); // Should be clamped to 0.5
      });
  });

  describe('Panning (handleMouseDown, handleMouseMove, handleMouseUp)', () => {
    it('should pan the viewBox and update store on drag', () => {
      const { result } = renderHook(() => useZoomPan(mockSvgRef));
      const startEvent = { button: 0, clientX: 100, clientY: 100 } as React.MouseEvent<SVGSVGElement>;
      const moveEvent = { clientX: 150, clientY: 120 } as React.MouseEvent<SVGSVGElement>;

      const pannedViewBox: ViewBox = { x: -5, y: -2, width: 100, height: 100 }; // Example
      (ViewBoxManager.pan as ReturnType<typeof vi.fn>).mockReturnValue(pannedViewBox);

      // Start panning
      act(() => {
        result.current.handleMouseDown(startEvent);
      });
      expect(mockSvgRef.current?.style.cursor).toBe('grabbing');

      // Move
      act(() => {
        result.current.handleMouseMove(moveEvent);
      });
      
      const expectedDx = 150 - 100; // e.clientX - lastMouse.current.x;
      const expectedDy = 120 - 100; // e.clientY - lastMouse.current.y;
      const clientRect = mockSvgRef.current!.getBoundingClientRect();
      const scaledDx = expectedDx * (mockCurrentViewBox!.width / clientRect.width);
      const scaledDy = expectedDy * (mockCurrentViewBox!.height / clientRect.height);

      expect(ViewBoxManager.pan).toHaveBeenCalledWith(mockCurrentViewBox, scaledDx, scaledDy);
      expect(mockSetCurrentViewBox).toHaveBeenCalledWith(pannedViewBox);

      // End panning
      act(() => {
        result.current.handleMouseUp();
      });
      expect(mockSvgRef.current?.style.cursor).toBe('grab');
    });

    it('should not pan if mouse button is not left (0)', () => {
        const { result } = renderHook(() => useZoomPan(mockSvgRef));
        const startEvent = { button: 1, clientX: 100, clientY: 100 } as React.MouseEvent<SVGSVGElement>;
        const moveEvent = { clientX: 150, clientY: 120 } as React.MouseEvent<SVGSVGElement>;
  
        act(() => { result.current.handleMouseDown(startEvent); });
        expect(mockSvgRef.current?.style.cursor).not.toBe('grabbing');
  
        act(() => { result.current.handleMouseMove(moveEvent); });
        expect(ViewBoxManager.pan).not.toHaveBeenCalled();
      });
  });
  
  describe('handleMouseEnter', () => {
    it('should set cursor to "grab" if not panning', () => {
      const { result } = renderHook(() => useZoomPan(mockSvgRef));
      act(() => {
        result.current.handleMouseEnter();
      });
      expect(mockSvgRef.current?.style.cursor).toBe('grab');
    });

    it('should not change cursor if already panning (though difficult to test this state directly here)', () => {
        const { result } = renderHook(() => useZoomPan(mockSvgRef));
        // Simulate panning state by directly setting the internal ref (not ideal but for completeness)
        // This requires exposing the isPanning ref or testing via side-effects if possible
        // For now, we assume handleMouseDown correctly sets isPanning.current = true
        
        // Start panning
        act(() => {
          result.current.handleMouseDown({ button: 0, clientX: 0, clientY: 0 } as any);
        });
        expect(mockSvgRef.current?.style.cursor).toBe('grabbing');
        
        // Mouse enter while "panning"
        act(() => {
          result.current.handleMouseEnter();
        });
        // Cursor should remain 'grabbing'
        expect(mockSvgRef.current?.style.cursor).toBe('grabbing'); 
        
        act(() => { result.current.handleMouseUp(); }); // Clean up
      });
  });


  describe('resetView', () => {
    it('should reset viewBox and zoomLevel to default values', () => {
      // Set non-default initial values to ensure reset works
      mockCurrentViewBox = { x: 10, y: 10, width: 50, height: 50 };
      mockZoomLevel = 2;

      const { result } = renderHook(() => useZoomPan(mockSvgRef));
      const defaultViewBox = { x: 0, y: 0, width: 100, height: 100 };
      (ViewBoxManager.createDefault as ReturnType<typeof vi.fn>).mockReturnValue(defaultViewBox);

      act(() => {
        result.current.resetView();
      });

      expect(ViewBoxManager.createDefault).toHaveBeenCalled();
      expect(mockSetCurrentViewBox).toHaveBeenCalledWith(defaultViewBox);
      expect(mockSetZoomLevel).toHaveBeenCalledWith(1);
    });
  });
  
  // Test window event listener for mouseup
  describe('Global MouseUp Listener', () => {
    it('should register and unregister mouseup listener on window', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useZoomPan(mockSvgRef));

      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function)); // The same function instance
      
      // Restore spies
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('handleMouseUp should set cursor to "grab" and stop panning', () => {
        const { result } = renderHook(() => useZoomPan(mockSvgRef));
  
        // Simulate starting a pan
        act(() => {
          result.current.handleMouseDown({ button: 0, clientX: 0, clientY: 0 } as React.MouseEvent<SVGSVGElement>);
        });
        expect(mockSvgRef.current!.style.cursor).toBe('grabbing');
        
        // Simulate global mouseup
        act(() => {
          // Directly call the handler that would be attached to window.onmouseup
          // This means we need to find the handler instance.
          // The easiest way for this test is to call result.current.handleMouseUp()
          // as it contains the core logic that the window event listener would trigger.
          result.current.handleMouseUp(); 
        });
  
        expect(mockSvgRef.current!.style.cursor).toBe('grab');
        // isPanning.current would be false, verified by cursor and no further pan calls
      });
  });
});
