
export enum Screen {
  TemplateSelection = 'TemplateSelection',
  Editor = 'Editor',
  Typography = 'Typography',
  Export = 'Export',
}

export interface SVGTemplate {
  id: string;
  name: string;
  category: string; // e.g., "angular", "curved", "minimalist"
  svgContent: string; // Raw SVG string
}

export interface SVGElementProperties {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  transform: {
    translateX: number;
    translateY: number;
    scaleX: number;
    scaleY: number;
    rotate: number;
  };
}

export interface ColorPalette {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral?: string; // Optional neutral color
  };
}

export interface TextProperties {
  content: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  x: number;
  y: number;
  textAnchor: 'start' | 'middle' | 'end';
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LogoProjectState {
  currentScreen: Screen;
  templates: SVGTemplate[];
  selectedTemplateId: string | null;
  
  originalIconSvg: string | null; // Original SVG of the selected template icon
  editedIconSvg: string | null; // Icon SVG after element property modifications
  
  elementsProps: Record<string, Partial<SVGElementProperties>>; // id -> properties
  selectedElementId: string | null;
  
  globalPalettes: ColorPalette[];
  selectedPaletteName: string | null;

  companyName: TextProperties;
  tagline: TextProperties | null;
  
  // ViewBox state for canvas navigation
  currentViewBox: ViewBox | null;
  zoomLevel: number;
  
  // For P1 Undo/Redo - not implemented in P0
  // history: Partial<LogoProjectState>[]; 
  // historyIndex: number;

  // Actions
  setScreen: (screen: Screen) => void;
  loadTemplates: (templates: SVGTemplate[]) => void;
  selectTemplate: (templateId: string) => void;
  setSelectedElementId: (elementId: string | null) => void;
  updateElementProperty: (elementId: string, propertyPath: string, value: any) => void;
  applyGlobalPalette: (paletteName: string) => void;
  
  updateTextProperty: (
    textType: 'companyName' | 'tagline',
    property: keyof TextProperties,
    value: any
  ) => void;
  setTaglineEnabled: (enabled: boolean) => void;

  getFinalSvgForExport: () => string;
}

// Map element classes to palette color keys
export const PALETTE_CLASS_MAP: Record<string, keyof ColorPalette['colors']> = {
  'primary-color-element': 'primary',
  'secondary-color-element': 'secondary',
  'accent-color-element': 'accent',
  'neutral-color-element': 'neutral',
};
