
// This file is mostly for reference or if we need to load fonts dynamically later.
// For P0, fonts are linked in index.html and listed in constants.ts.
// No active code here for P0.

export interface FontDefinition {
  name: string;
  family: string;
  weights?: (number | string)[];
  styles?: string[];
}

// Example, not directly used by P0 logic if fonts are globally available
export const AVAILABLE_FONTS: FontDefinition[] = [
  { name: 'Inter', family: 'Inter, sans-serif', weights: [400, 500, 600, 700] },
  { name: 'Merriweather', family: 'Merriweather, serif', weights: [400, 700], styles: ['italic'] },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', weights: [400, 500, 700] },
  { name: 'Roboto Mono', family: 'Roboto Mono, monospace', weights: [400, 500, 700] },
];
