
import { create } from 'zustand';
import { LogoProjectState, Screen, SVGTemplate, ColorPalette, TextProperties, PALETTE_CLASS_MAP, SVGElementProperties } from '../types';
import { INITIAL_SCREEN, DEFAULT_FONTS, DEFAULT_TEXT_COLOR, DEFAULT_FONT_SIZE } from '../constants';
import { PREDEFINED_PALETTES } from '../data/colorPalettes';
import { SVG_TEMPLATES } from '../data/svgTemplates';
import { 
  applyElementPropertiesToSvg, 
  extractInitialElementsProperties,
  applyPaletteToSvgString,
  addTextElementsToSvg,
  getViewBox,
} from '../utils/svgUtils';

const initialTextProps = (content: string, yPos: number): TextProperties => ({
  content,
  fontFamily: DEFAULT_FONTS[0].family,
  fontSize: DEFAULT_FONT_SIZE,
  fill: DEFAULT_TEXT_COLOR,
  x: 50, // Center X for viewBox 0 0 100 100, textAnchor middle
  y: yPos, // Placeholder Y
  textAnchor: 'middle',
});

const useLogoStore = create<LogoProjectState>((set, get) => ({
  currentScreen: INITIAL_SCREEN,
  templates: SVG_TEMPLATES,
  selectedTemplateId: null,
  originalIconSvg: null,
  editedIconSvg: null,
  elementsProps: {},
  selectedElementId: null,
  globalPalettes: PREDEFINED_PALETTES,
  selectedPaletteName: PREDEFINED_PALETTES[0]?.name || null,
  companyName: initialTextProps("Company Name", 80),
  tagline: null, // Initially disabled

  setScreen: (screen) => set({ currentScreen: screen }),
  loadTemplates: (templates) => set({ templates }),

  selectTemplate: (templateId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (template) {
      const initialProps = extractInitialElementsProperties(template.svgContent);
      const editedSvg = applyElementPropertiesToSvg(template.svgContent, initialProps);
      
      // Adjust initial text positions based on viewBox
      const viewBox = getViewBox(template.svgContent) || { x: 0, y: 0, width: 100, height: 100 };
      const companyNameY = viewBox.y + viewBox.height * 0.85;
      const taglineY = viewBox.y + viewBox.height * 0.95;

      set({
        selectedTemplateId: templateId,
        originalIconSvg: template.svgContent,
        elementsProps: initialProps,
        editedIconSvg: editedSvg, 
        currentScreen: Screen.Editor,
        selectedElementId: null, // Reset selected element
        companyName: initialTextProps("Company Name", companyNameY),
        tagline: get().tagline ? initialTextProps("Your awesome tagline", taglineY) : null,
      });
    }
  },

  setSelectedElementId: (elementId) => set({ selectedElementId: elementId }),

  updateElementProperty: (elementId, propertyPath, value) => {
    set((state) => {
      const newElementsProps = JSON.parse(JSON.stringify(state.elementsProps)); // Deep clone
      const props = newElementsProps[elementId] || {};
      
      // Handle nested transform properties
      const pathParts = propertyPath.split('.');
      let currentLevel = props;
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!currentLevel[pathParts[i]]) {
          currentLevel[pathParts[i]] = {};
        }
        currentLevel = currentLevel[pathParts[i]];
      }
      currentLevel[pathParts[pathParts.length - 1]] = value;
      
      newElementsProps[elementId] = props;

      if (state.originalIconSvg) {
        const newEditedIconSvg = applyElementPropertiesToSvg(state.originalIconSvg, newElementsProps);
        return { elementsProps: newElementsProps, editedIconSvg: newEditedIconSvg };
      }
      return { elementsProps: newElementsProps };
    });
  },
  
  applyGlobalPalette: (paletteName) => {
    set(state => {
      const palette = state.globalPalettes.find(p => p.name === paletteName);
      if (!palette || !state.originalIconSvg) return {};

      // Create a new set of element properties based on the palette
      const newElementsProps = { ...state.elementsProps };
      const tempDoc = new DOMParser().parseFromString(state.originalIconSvg, "image/svg+xml");

      Object.keys(PALETTE_CLASS_MAP).forEach(className => {
        const colorKey = PALETTE_CLASS_MAP[className];
        const colorValue = palette.colors[colorKey];
        if (colorValue) {
          tempDoc.querySelectorAll(`.${className}`).forEach(element => {
            const elId = element.id;
            if (elId) {
              if (!newElementsProps[elId]) newElementsProps[elId] = {} as Partial<SVGElementProperties>;
              if (!newElementsProps[elId]!.transform) { // Ensure transform object exists
                 const existingProps = extractInitialElementsProperties(state.originalIconSvg!);
                 newElementsProps[elId]!.transform = existingProps[elId]?.transform || { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0};
              }
              newElementsProps[elId]!.fill = colorValue; 
              // Potentially also set stroke if design calls for it, or make it configurable.
              // For now, mainly targeting fill.
            }
          });
        }
      });
      
      const newEditedIconSvg = applyElementPropertiesToSvg(state.originalIconSvg, newElementsProps);
      
      return { 
        selectedPaletteName: paletteName,
        elementsProps: newElementsProps,
        editedIconSvg: newEditedIconSvg
      };
    });
  },

  updateTextProperty: (textType, property, value) => {
    set((state) => {
      const currentTextState = state[textType];
      if (!currentTextState) return {};
      
      const newTextState = { ...currentTextState, [property]: value };
      if (textType === 'companyName') {
        return { companyName: newTextState };
      } else if (textType === 'tagline') {
        return { tagline: newTextState as TextProperties };
      }
      return {};
    });
  },

  setTaglineEnabled: (enabled: boolean) => {
    set(state => {
      if (enabled && !state.tagline) {
        const viewBox = state.originalIconSvg ? getViewBox(state.originalIconSvg) : { x: 0, y: 0, width: 100, height: 100 };
        const taglineY = (viewBox?.y ?? 0) + (viewBox?.height ?? 100) * 0.95;
        return { tagline: initialTextProps("Your awesome tagline", taglineY) };
      } else if (!enabled) {
        return { tagline: null };
      }
      return {};
    });
  },

  getFinalSvgForExport: () => {
    const { editedIconSvg, companyName, tagline } = get();
    if (!editedIconSvg) return "";

    const textElements: TextProperties[] = [companyName];
    if (tagline) {
      textElements.push(tagline);
    }
    return addTextElementsToSvg(editedIconSvg, textElements);
  },

}));

// Initialize with default templates and palettes
useLogoStore.getState().loadTemplates(SVG_TEMPLATES);
const initialPaletteName = useLogoStore.getState().selectedPaletteName;
if (initialPaletteName) {
 // Apply default palette on init if a template was auto-selected or for general setup.
 // This might be better done after a template is explicitly selected.
 // For now, we just ensure selectedPaletteName is set.
}


export { useLogoStore };
