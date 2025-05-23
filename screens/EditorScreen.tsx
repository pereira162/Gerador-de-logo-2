
import React from 'react';
import { useLogoStore } from '../store/logoStore';
import EnhancedEditingCanvas from '../components/EnhancedEditingCanvas';
import PropertiesPanel from '../components/PropertiesPanel';
import { Screen } from '../types';

const EditorScreen: React.FC = () => {
  const editedIconSvg = useLogoStore((state) => state.editedIconSvg);
  const setScreen = useLogoStore((state) => state.setScreen);

  if (!editedIconSvg) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-slate-300 mb-4">No template selected.</p>
        <button
          onClick={() => setScreen(Screen.TemplateSelection)}
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          Go to Templates
        </button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-200px)] min-h-[500px] animate-fadeIn">
      <div className="flex-grow lg:w-3/5 h-full lg:h-auto">
        <EnhancedEditingCanvas svgContent={editedIconSvg} className="w-full max-h-[600px] md:max-h-[600px] object-contain" />
      </div>
      <div className="lg:w-2/5 xl:w-2/5 h-full lg:h-auto overflow-y-auto">
        <PropertiesPanel />
      </div>
      <div className="w-full lg:col-span-full flex justify-between mt-4">
        <button
            onClick={() => setScreen(Screen.TemplateSelection)}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
        >
            &larr; Back to Templates
        </button>
        <button
            onClick={() => setScreen(Screen.Typography)}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
        >
            Next: Add Text &rarr;
        </button>
      </div>
      {/* Fix: Removed non-standard 'jsx' and 'global' attributes from style tag. Standard CSS-in-JS or a global CSS file is preferred for styles. */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EditorScreen;