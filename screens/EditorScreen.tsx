
import React from 'react';
import { useLogoStore } from '../store/logoStore';
import EditingCanvas from '../components/EditingCanvas';
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
    <div className="flex flex-col gap-4 md:gap-6 animate-fadeIn"> {/* Outer container for vertical flow */}
      {/* Inner container for side-by-side Canvas and Properties on large screens */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Canvas Column */}
        <div className="flex-grow lg:w-2/3"> {/* Canvas wrapper */}
          <EditingCanvas
            svgContent={editedIconSvg}
            className="w-full aspect-square lg:max-h-[65vh]" // Canvas styled: full width, aspect square, max height on large screens
          />
        </div>

        {/* Properties Panel Column */}
        <div className="lg:w-1/3 xl:w-1/4 lg:max-h-[65vh] overflow-y-auto"> {/* Properties wrapper: max height, scrolls if needed */}
          <PropertiesPanel /> {/* PropertiesPanel has internal h-full & overflow-y-auto */}
        </div>
      </div>

      {/* Navigation Buttons - full width, below the canvas/properties row */}
      <div className="w-full flex justify-end mt-4">
        <button
            onClick={() => setScreen(Screen.Typography)}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
        >
            Next: Add Text &rarr;
        </button>
      </div>
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
