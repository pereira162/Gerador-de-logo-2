
import React from 'react';
import { useLogoStore } from '../store/logoStore';
import TemplateCard from '../components/TemplateCard';

const TemplateSelectionScreen: React.FC = () => {
  const templates = useLogoStore((state) => state.templates);
  const selectTemplate = useLogoStore((state) => state.selectTemplate);
  const selectedTemplateId = useLogoStore((state) => state.selectedTemplateId);

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-semibold mb-6 text-center text-emerald-400">Choose a Base Template</h2>
      {templates.length === 0 ? (
         <p className="text-center text-slate-400">Loading templates...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={selectTemplate}
              isSelected={selectedTemplateId === template.id}
            />
          ))}
        </div>
      )}
       {/* Fix: Removed non-standard 'jsx' and 'global' attributes from style tag. Standard CSS-in-JS or a global CSS file is preferred for styles. */}
       <style>{` 
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default TemplateSelectionScreen;