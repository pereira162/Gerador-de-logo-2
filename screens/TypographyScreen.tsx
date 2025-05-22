
import React, { useMemo } from 'react'; // Import useMemo
import { useLogoStore } from '../store/logoStore';
import { Screen, TextProperties } from '../types';
import { DEFAULT_FONTS, MIN_FONT_SIZE, MAX_FONT_SIZE } from '../constants';
import ColorPicker from '../components/ColorPicker';
import EditingCanvas from '../components/EditingCanvas'; // For preview

const TextPropertyControls: React.FC<{
  textType: 'companyName' | 'tagline';
  textProps: TextProperties;
  updateProperty: (textType: 'companyName' | 'tagline', property: keyof TextProperties, value: any) => void;
  title: string;
}> = ({ textType, textProps, updateProperty, title }) => {
  return (
    <div className="p-4 bg-slate-700 rounded-lg shadow mb-6">
      <h3 className="text-xl font-semibold text-emerald-400 mb-3">{title}</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor={`${textType}-content`} className="block text-sm font-medium text-slate-300 mb-1">Text</label>
          <input
            type="text"
            id={`${textType}-content`}
            value={textProps.content}
            onChange={(e) => updateProperty(textType, 'content', e.target.value)}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor={`${textType}-fontFamily`} className="block text-sm font-medium text-slate-300 mb-1">Font</label>
          <select
            id={`${textType}-fontFamily`}
            value={textProps.fontFamily}
            onChange={(e) => updateProperty(textType, 'fontFamily', e.target.value)}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
          >
            {DEFAULT_FONTS.map(font => (
              <option key={font.name} value={font.family} style={{ fontFamily: font.family }}>{font.name}</option>
            ))}
          </select>
        </div>
        <ColorPicker
          label="Text Color"
          color={textProps.fill}
          onChange={(color) => updateProperty(textType, 'fill', color)}
        />
        <div>
          <label htmlFor={`${textType}-fontSize`} className="block text-sm font-medium text-slate-300 mb-1">Font Size ({textProps.fontSize}px)</label>
          <input
            type="range"
            id={`${textType}-fontSize`}
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            value={textProps.fontSize}
            onChange={(e) => updateProperty(textType, 'fontSize', parseInt(e.target.value))}
            className="w-full h-2 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor={`${textType}-x`} className="block text-sm font-medium text-slate-300 mb-1">Position X (%)</label>
                <input type="number" id={`${textType}-x`} value={textProps.x} onChange={(e) => updateProperty(textType, 'x', parseFloat(e.target.value))}
                className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500" step="0.5" />
            </div>
            <div>
                <label htmlFor={`${textType}-y`} className="block text-sm font-medium text-slate-300 mb-1">Position Y (%)</label>
                <input type="number" id={`${textType}-y`} value={textProps.y} onChange={(e) => updateProperty(textType, 'y', parseFloat(e.target.value))}
                className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500" step="0.5" />
            </div>
        </div>
        <div>
            <label htmlFor={`${textType}-textAnchor`} className="block text-sm font-medium text-slate-300 mb-1">Text Align</label>
            <select id={`${textType}-textAnchor`} value={textProps.textAnchor} onChange={(e) => updateProperty(textType, 'textAnchor', e.target.value as TextProperties['textAnchor'])}
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500">
                <option value="start">Left</option>
                <option value="middle">Center</option>
                <option value="end">Right</option>
            </select>
        </div>
      </div>
    </div>
  );
};

const TypographyScreen: React.FC = () => {
  const { 
    companyName, 
    tagline, 
    updateTextProperty, 
    setTaglineEnabled,
    setScreen,
    getFinalSvgForExport,
    editedIconSvg // Fetch editedIconSvg for useMemo dependency
  } = useLogoStore(state => ({
    companyName: state.companyName,
    tagline: state.tagline,
    updateTextProperty: state.updateTextProperty,
    setTaglineEnabled: state.setTaglineEnabled,
    setScreen: state.setScreen,
    getFinalSvgForExport: state.getFinalSvgForExport,
    editedIconSvg: state.editedIconSvg, // Add editedIconSvg to selector
  }));

  // Memoize the result of getFinalSvgForExport
  const finalSvgPreview = useMemo(() => {
    return getFinalSvgForExport();
  }, [editedIconSvg, companyName, tagline, getFinalSvgForExport]);


  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-200px)] min-h-[600px] animate-fadeIn">
      <div className="lg:w-1/2 xl:w-2/3 flex flex-col space-y-4">
        <h2 className="text-3xl font-semibold text-center text-emerald-400 mb-2">Add Your Text</h2>
        <div className="flex-grow bg-slate-700 p-2 rounded-lg shadow-inner">
            <EditingCanvas svgContent={finalSvgPreview} className="w-full h-full aspect-square object-contain"/>
        </div>
      </div>

      <div className="lg:w-1/2 xl:w-1/3 space-y-6 overflow-y-auto max-h-[calc(100vh-240px)] pr-2">
        <TextPropertyControls title="Company Name" textType="companyName" textProps={companyName} updateProperty={updateTextProperty} />
        
        <div>
          <label className="flex items-center space-x-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!tagline}
              onChange={(e) => setTaglineEnabled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-emerald-500 bg-slate-600 border-slate-500 rounded focus:ring-emerald-400"
            />
            <span className="text-slate-200">Enable Tagline</span>
          </label>
          {tagline && (
            <TextPropertyControls title="Tagline" textType="tagline" textProps={tagline} updateProperty={updateTextProperty} />
          )}
        </div>
      </div>
      
      <div className="w-full lg:col-span-full flex justify-between mt-4 items-center fixed bottom-4 right-4 left-4 px-4 lg:static lg:px-0">
        <button
            onClick={() => setScreen(Screen.Editor)}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
        >
            &larr; Back to Icon
        </button>
        <button
            onClick={() => setScreen(Screen.Export)}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
        >
            Next: Export Logo &rarr;
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

export default TypographyScreen;
