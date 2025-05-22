
import { SVGTemplate } from '../types';
import { SVG_EDITABLE_CLASS, SVG_PRIMARY_COLOR_CLASS, SVG_SECONDARY_COLOR_CLASS, SVG_ACCENT_COLOR_CLASS, SVG_NEUTRAL_COLOR_CLASS } from '../constants';

// Note: stroke-width on some elements is for visibility in template selection if fill is 'none' or same as bg.
// Actual stroke-width will be controlled by properties.
// Default colors here are placeholders, global palettes will override based on class.
export const SVG_TEMPLATES: SVGTemplate[] = [
  {
    id: 'template-geo-1',
    name: 'Intersecting Shapes',
    category: 'Angular',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect id="shape1-t1" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" x="20" y="20" width="60" height="30" fill="#4A90E2" opacity="0.9" />
      <circle id="shape2-t1" class="${SVG_EDITABLE_CLASS} ${SVG_SECONDARY_COLOR_CLASS}" cx="50" cy="65" r="25" fill="#F5A623" opacity="0.8" />
    </svg>`,
  },
  {
    id: 'template-geo-2',
    name: 'Stacked Bars',
    category: 'Minimalist',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect id="bar1-t2" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" x="15" y="20" width="70" height="15" fill="#50E3C2" />
      <rect id="bar2-t2" class="${SVG_EDITABLE_CLASS} ${SVG_SECONDARY_COLOR_CLASS}" x="15" y="45" width="70" height="15" fill="#4A90E2" />
      <rect id="bar3-t2" class="${SVG_EDITABLE_CLASS} ${SVG_ACCENT_COLOR_CLASS}" x="15" y="70" width="70" height="15" fill="#F5A623" />
    </svg>`,
  },
  {
    id: 'template-geo-3',
    name: 'Abstract Triangle',
    category: 'Angular',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polygon id="tri1-t3" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" points="50,10 90,80 10,80" fill="#7ED321" />
      <polygon id="tri2-t3" class="${SVG_EDITABLE_CLASS} ${SVG_SECONDARY_COLOR_CLASS}" points="50,30 70,70 30,70" fill="#FFFFFF" opacity="0.5"/>
    </svg>`,
  },
  {
    id: 'template-geo-4',
    name: 'Concentric Circles',
    category: 'Curved',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <circle id="circle1-t4" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" cx="50" cy="50" r="40" fill="#D0021B" />
      <circle id="circle2-t4" class="${SVG_EDITABLE_CLASS} ${SVG_SECONDARY_COLOR_CLASS}" cx="50" cy="50" r="30" fill="#F8E71C" />
      <circle id="circle3-t4" class="${SVG_EDITABLE_CLASS} ${SVG_ACCENT_COLOR_CLASS}" cx="50" cy="50" r="15" fill="#417505" />
    </svg>`,
  },
  {
    id: 'template-geo-5',
    name: 'Hexagon Core',
    category: 'Geometric',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polygon id="hex-outer-t5" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" points="50,5 93.3,27.5 93.3,72.5 50,95 6.7,72.5 6.7,27.5" fill="#BD10E0"/>
      <polygon id="hex-inner-t5" class="${SVG_EDITABLE_CLASS} ${SVG_NEUTRAL_COLOR_CLASS}" points="50,20 78.3,35 78.3,65 50,80 21.7,65 21.7,35" fill="#FFFFFF" opacity="0.7"/>
    </svg>`,
  },
   {
    id: 'template-geo-6',
    name: 'Split Square',
    category: 'Minimalist',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect id="rect-left-t6" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" x="10" y="10" width="38" height="80" fill="#007ACC"/>
      <rect id="rect-right-t6" class="${SVG_EDITABLE_CLASS} ${SVG_SECONDARY_COLOR_CLASS}" x="52" y="10" width="38" height="80" fill="#FF8C00"/>
    </svg>`,
  },
  {
    id: 'template-geo-7',
    name: 'Chevron Arrow',
    category: 'Angular',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polygon id="chevron1-t7" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" points="30,20 70,50 30,80" fill="#34D399"/>
      <polygon id="chevron2-t7" class="${SVG_EDITABLE_CLASS} ${SVG_ACCENT_COLOR_CLASS}" points="50,20 90,50 50,80" fill="#60A5FA" opacity="0.7"/>
    </svg>`,
  },
  {
    id: 'template-geo-8',
    name: 'Simple Cube',
    category: 'Geometric',
    svgContent: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <polygon id="cube-top-t8" class="${SVG_EDITABLE_CLASS} ${SVG_NEUTRAL_COLOR_CLASS}" points="50,15 75,30 50,45 25,30" fill="#E0E0E0"/>
      <polygon id="cube-left-t8" class="${SVG_EDITABLE_CLASS} ${SVG_PRIMARY_COLOR_CLASS}" points="25,30 50,45 50,75 25,60" fill="#A0A0A0"/>
      <polygon id="cube-right-t8" class="${SVG_EDITABLE_CLASS} ${SVG_SECONDARY_COLOR_CLASS}" points="50,45 75,30 75,60 50,75" fill="#C0C0C0"/>
    </svg>`,
  },
];
