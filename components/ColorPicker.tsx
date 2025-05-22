
import React, { useState, useEffect } from 'react';

interface ColorPickerProps {
  label: string;
  color: string; // HEX color string
  onChange: (color: string) => void;
  allowTransparent?: boolean;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, color, onChange, allowTransparent = false }) => {
  const [inputValue, setInputValue] = useState(color === 'none' && allowTransparent ? '#000000' : color); // input type color doesn't like 'none'
  const [isTransparent, setIsTransparent] = useState(color === 'none');

  useEffect(() => {
    if (isTransparent) {
      setInputValue('#000000'); // Reset input type=color to black if transparent
    } else {
      setInputValue(color);
    }
    setIsTransparent(color === 'none');
  }, [color, isTransparent]);

  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    setIsTransparent(false);
    onChange(newColor);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);
    // Basic validation for hex, can be improved
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(newColor) || newColor.length === 7) {
      setIsTransparent(false);
      onChange(newColor);
    } else if (newColor === '' && allowTransparent) { // Allow clearing to transparent
      setIsTransparent(true);
      onChange('none');
    }
  };
  
  const handleTransparentToggle = () => {
    if (isTransparent) { // Becoming opaque
      setIsTransparent(false);
      onChange(inputValue || '#000000'); // fallback to black if inputValue is somehow invalid
    } else { // Becoming transparent
      setIsTransparent(true);
      onChange('none');
    }
  };

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <div className="flex items-center space-x-2">
        <div className="relative w-10 h-10 rounded-md border border-slate-600 overflow-hidden">
          <input
            type="color"
            value={isTransparent ? '#000000' : inputValue} // input type color needs a valid hex
            onChange={handleColorInputChange}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
            disabled={isTransparent}
          />
          <div 
            className="w-full h-full"
            style={{ backgroundColor: isTransparent ? 'transparent' : inputValue, backgroundImage: isTransparent ? `url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='5' height='5' fill='%23ccc'/%3E%3Crect x='5' y='5' width='5' height='5' fill='%23ccc'/%3E%3C/svg%3E")` : 'none' }}
          ></div>
        </div>
        <input
          type="text"
          value={isTransparent ? 'none' : inputValue}
          onChange={handleTextInputChange}
          className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
          placeholder={isTransparent ? "Transparent" : "#RRGGBB"}
          disabled={isTransparent && !allowTransparent} // if transparent and not allowed, disable text input
        />
        {allowTransparent && (
          <button
            type="button"
            onClick={handleTransparentToggle}
            className={`px-3 py-2 text-xs rounded-md ${isTransparent ? 'bg-emerald-500 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}
          >
            {isTransparent ? 'Opaque' : 'None'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorPicker;
