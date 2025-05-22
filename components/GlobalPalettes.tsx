
import React from 'react';
import { useLogoStore } from '../store/logoStore';
import { ColorPalette } from '../types';

const PalettePreview: React.FC<{ paletteColors: ColorPalette['colors'] }> = ({ paletteColors }) => (
  <div className="flex space-x-1 h-4 rounded overflow-hidden">
    {Object.values(paletteColors).filter(Boolean).map((color, index) => (
      <div key={index} style={{ backgroundColor: color }} className="flex-1"></div>
    ))}
  </div>
);

const GlobalPalettes: React.FC = () => {
  const palettes = useLogoStore((state) => state.globalPalettes);
  const selectedPaletteName = useLogoStore((state) => state.selectedPaletteName);
  const applyGlobalPalette = useLogoStore((state) => state.applyGlobalPalette);

  if (!palettes.length) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-emerald-400 mb-3 border-b border-slate-700 pb-2">Color Palettes</h3>
      <div className="space-y-2">
        {palettes.map((palette) => (
          <button
            key={palette.name}
            onClick={() => applyGlobalPalette(palette.name)}
            className={`w-full p-3 rounded-lg text-left transition-all duration-150 ease-in-out
                        ${selectedPaletteName === palette.name 
                          ? 'bg-emerald-600 ring-2 ring-emerald-400 shadow-lg' 
                          : 'bg-slate-700 hover:bg-slate-600 focus:bg-slate-600'}`}
          >
            <p className={`font-medium text-sm ${selectedPaletteName === palette.name ? 'text-white' : 'text-slate-200'}`}>{palette.name}</p>
            <PalettePreview paletteColors={palette.colors} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default GlobalPalettes;
