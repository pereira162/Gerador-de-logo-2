
import React from 'react';
import { useLogoStore } from '../store/logoStore';
import ShapePropertiesControls from './ShapePropertiesControls';
import TransformControls from './TransformControls';
import GlobalPalettes from './GlobalPalettes';

const PropertiesPanel: React.FC = () => {
  const selectedElementId = useLogoStore((state) => state.selectedElementId);
  const elementsProps = useLogoStore((state) => state.elementsProps);
  const updateElementProperty = useLogoStore((state) => state.updateElementProperty);

  const selectedElementProps = selectedElementId ? elementsProps[selectedElementId] : null;

  return (
    <div className="w-full lg:w-80 bg-slate-800 p-1 md:p-3 rounded-lg shadow-lg h-full overflow-y-auto space-y-6">
      <GlobalPalettes />
      {selectedElementId && selectedElementProps ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-emerald-400 mb-2 border-b border-slate-700 pb-2">
              Element: <span className="text-slate-300 font-mono text-sm">{selectedElementId}</span>
            </h3>
            <ShapePropertiesControls
              elementId={selectedElementId}
              properties={selectedElementProps}
              updateProperty={updateElementProperty}
            />
          </div>
          <div>
             <h3 className="text-lg font-semibold text-emerald-400 mb-2 border-b border-slate-700 pb-2">Transform</h3>
            <TransformControls
              elementId={selectedElementId}
              transform={selectedElementProps.transform}
              updateProperty={updateElementProperty}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-400 p-6 bg-slate-700 rounded-md">
          <p className="text-lg font-medium">Select an element on the canvas to edit its properties.</p>
          <p className="text-sm mt-2">Click on any shape in your logo to begin customization.</p>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel;
