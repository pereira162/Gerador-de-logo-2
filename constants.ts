
import { Screen } from './types';

export const INITIAL_SCREEN = Screen.TemplateSelection;

export const DEFAULT_FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif' },
  { name: 'Merriweather', family: 'Merriweather, serif' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif' },
  { name: 'Roboto Mono', family: 'Roboto Mono, monospace' },
];

export const DEFAULT_TEXT_COLOR = '#FFFFFF'; // White for dark theme
export const DEFAULT_FILL_COLOR = '#3B82F6'; // Tailwind blue-500
export const DEFAULT_STROKE_COLOR = '#1F2937'; // Tailwind gray-800
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 128;
export const DEFAULT_FONT_SIZE = 24;

export const EXPORT_RESOLUTIONS = [
  { label: '1x (512px)', value: 1, defaultSize: 512 },
  { label: '2x (1024px)', value: 2, defaultSize: 1024 },
  { label: '3x (1536px)', value: 3, defaultSize: 1536 },
];

export const DEFAULT_SVG_EXPORT_WIDTH = 512;
export const DEFAULT_SVG_EXPORT_HEIGHT = 512;

export const SVG_EDITABLE_CLASS = "editable";
export const SVG_PRIMARY_COLOR_CLASS = "primary-color-element";
export const SVG_SECONDARY_COLOR_CLASS = "secondary-color-element";
export const SVG_ACCENT_COLOR_CLASS = "accent-color-element";
export const SVG_NEUTRAL_COLOR_CLASS = "neutral-color-element";

