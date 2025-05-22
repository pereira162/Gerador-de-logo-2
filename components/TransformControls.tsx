
import React from 'react';
import { SVGElementProperties } from '../types';

interface TransformControlsProps {
  elementId: string;
  transform: Partial<SVGElementProperties['transform']>;
  updateProperty: (elementId: string, propertyPath: string, value: any) => void;
}

const TransformInput: React.FC<{
  label: string;
  idSuffix: string;
  elementId: string;
  value: number | undefined;
  onChange: (value: string) => void;
  step?: number;
}> = ({ label, idSuffix, elementId, value, onChange, step = 1 }) => (
  <div>
    <label htmlFor={`${elementId}-${idSuffix}`} className="block text-xs font-medium text-slate-400 mb-0.5">{label}</label>
    <input
      type="number"
      id={`${elementId}-${idSuffix}`}
      value={value ?? 0}
      onChange={(e) => onChange(e.target.value)}
      step={step}
      className="w-full p-1.5 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500"
    />
  </div>
);

const TransformControls: React.FC<TransformControlsProps> = ({ elementId, transform, updateProperty }) => {
  const currentTransform = transform || { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0 };

  const handleChange = (propName: keyof SVGElementProperties['transform'], value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateProperty(elementId, `transform.${propName}`, numValue);
    } else if (value === "") {
      updateProperty(elementId, `transform.${propName}`, 0);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TransformInput label="Translate X" idSuffix="translateX" elementId={elementId} value={currentTransform.translateX} onChange={(v) => handleChange('translateX', v)} />
        <TransformInput label="Translate Y" idSuffix="translateY" elementId={elementId} value={currentTransform.translateY} onChange={(v) => handleChange('translateY', v)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TransformInput label="Scale X" idSuffix="scaleX" elementId={elementId} value={currentTransform.scaleX} onChange={(v) => handleChange('scaleX', v)} step={0.01} />
        <TransformInput label="Scale Y" idSuffix="scaleY" elementId={elementId} value={currentTransform.scaleY} onChange={(v) => handleChange('scaleY', v)} step={0.01} />
      </div>
      <TransformInput label="Rotate (°)" idSuffix="rotate" elementId={elementId} value={currentTransform.rotate} onChange={(v) => handleChange('rotate', v)} />
    </div>
  );
};

export default TransformControls;
