
import React from 'react';
import { SVGElementProperties } from '../types';
import ColorPicker from './ColorPicker';

interface ShapePropertiesControlsProps {
  elementId: string;
  properties: Partial<SVGElementProperties>;
  updateProperty: (elementId: string, propertyPath: string, value: any) => void;
}

const ShapePropertiesControls: React.FC<ShapePropertiesControlsProps> = ({ elementId, properties, updateProperty }) => {
  const handleNumericChange = (propertyPath: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateProperty(elementId, propertyPath, numValue);
    } else if (value === "") { // Allow clearing input, potentially revert to default or handle as 0
      updateProperty(elementId, propertyPath, 0);
    }
  };
  
  return (
    <div className="space-y-4">
      <ColorPicker
        label="Fill Color"
        color={properties.fill ?? '#000000'}
        onChange={(color) => updateProperty(elementId, 'fill', color)}
        allowTransparent
      />
      <ColorPicker
        label="Stroke Color"
        color={properties.stroke ?? 'none'}
        onChange={(color) => updateProperty(elementId, 'stroke', color)}
        allowTransparent
      />
      <div>
        <label htmlFor={`${elementId}-strokeWidth`} className="block text-sm font-medium text-slate-300 mb-1">Stroke Width</label>
        <input
          type="number"
          id={`${elementId}-strokeWidth`}
          name="strokeWidth"
          value={properties.strokeWidth ?? 0}
          onChange={(e) => handleNumericChange('strokeWidth', e.target.value)}
          min="0"
          step="0.1"
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <div>
        <label htmlFor={`${elementId}-opacity`} className="block text-sm font-medium text-slate-300 mb-1">Opacity ({((properties.opacity ?? 1) * 100).toFixed(0)}%)</label>
        <input
          type="range"
          id={`${elementId}-opacity`}
          name="opacity"
          value={properties.opacity ?? 1}
          onChange={(e) => handleNumericChange('opacity', e.target.value)}
          min="0"
          max="1"
          step="0.01"
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
};

export default ShapePropertiesControls;
