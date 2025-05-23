
import React from 'react';
import { SVGTemplate } from '../types';

interface TemplateCardProps {
  template: SVGTemplate;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, isSelected }) => {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className={`bg-slate-700 p-4 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 ease-in-out
                  flex flex-col items-center text-center cursor-pointer group
                  focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-75
                  ${isSelected ? 'ring-2 ring-emerald-500 shadow-emerald-500/30' : 'hover:ring-1 hover:ring-slate-500'}`}
      aria-label={`Select ${template.name} template`}
    >
      <div className="w-32 h-32 mb-3 flex items-center justify-center bg-slate-600 rounded overflow-hidden p-1">
        <div 
          className="w-full h-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-150"
          dangerouslySetInnerHTML={{ __html: template.svgContent }}
        />
      </div>
      <h4 className="font-semibold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors">{template.name}</h4>
      <p className="text-xs text-slate-400">{template.category}</p>
    </button>
  );
};

export default TemplateCard;
