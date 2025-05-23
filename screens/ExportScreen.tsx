
import React, { useState } from 'react';
import { useLogoStore } from '../store/logoStore';
import { Screen } from '../types';
import { EXPORT_RESOLUTIONS, DEFAULT_SVG_EXPORT_WIDTH, DEFAULT_SVG_EXPORT_HEIGHT } from '../constants';
import EditingCanvas from '../components/EditingCanvas';
import { downloadSVG, downloadPNG } from '../utils/exportUtils';
import { getViewBox } from '../utils/svgUtils';

const ExportScreen: React.FC = () => {
  const { getFinalSvgForExport, setScreen } = useLogoStore(state => ({
     getFinalSvgForExport: state.getFinalSvgForExport,
     setScreen: state.setScreen,
  }));
  const [filename, setFilename] = useState('my-geometric-logo');
  const [selectedResolution, setSelectedResolution] = useState(EXPORT_RESOLUTIONS[0]);

  const finalSvg = getFinalSvgForExport();
  
  const handleExportSVG = () => {
    if (finalSvg) {
      downloadSVG(finalSvg, `${filename}.svg`);
    }
  };

  const handleExportPNG = () => {
    if (finalSvg) {
      const viewBox = getViewBox(finalSvg) || { x:0, y:0, width: DEFAULT_SVG_EXPORT_WIDTH, height: DEFAULT_SVG_EXPORT_HEIGHT };
      const baseWidth = viewBox.width;
      const baseHeight = viewBox.height;
      downloadPNG(finalSvg, `${filename}.png`, selectedResolution.value, baseWidth, baseHeight);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-3xl font-semibold mb-6 text-center text-emerald-400">Export Your Logo</h2>
      
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        <div className="lg:w-2/5 bg-slate-700 p-4 rounded-lg shadow-inner flex items-center justify-center">
          {finalSvg ? (
            <EditingCanvas svgContent={finalSvg} className="w-full max-h-[350px] object-contain"/>
          ) : (
            <p className="text-slate-400">Generating preview...</p>
          )}
        </div>

        <div className="lg:w-3/5 space-y-6 p-6 bg-slate-700 rounded-lg shadow">
          <div>
            <label htmlFor="filename" className="block text-sm font-medium text-slate-300 mb-1">Filename</label>
            <input
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <h4 className="text-lg font-medium text-slate-200 mb-2">Export SVG (Vector)</h4>
            <button
              onClick={handleExportSVG}
              className="w-full px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <DownloadIcon />
              <span>Download .SVG</span>
            </button>
          </div>

          <div>
            <h4 className="text-lg font-medium text-slate-200 mb-2">Export PNG (Raster)</h4>
            <div className="mb-3">
              <label htmlFor="resolution" className="block text-sm font-medium text-slate-300 mb-1">Resolution</label>
              <select
                id="resolution"
                value={selectedResolution.value}
                onChange={(e) => {
                  const newRes = EXPORT_RESOLUTIONS.find(r => r.value === parseInt(e.target.value));
                  if (newRes) setSelectedResolution(newRes);
                }}
                className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                {EXPORT_RESOLUTIONS.map(res => (
                  <option key={res.value} value={res.value}>{res.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleExportPNG}
              className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <DownloadIcon />
              <span>Download .PNG</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full flex justify-between mt-8">
        <div>
          <button
              onClick={() => setScreen(Screen.Typography)}
              className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-semibold rounded-lg shadow-md transition-colors text-lg"
          >
              &larr; Back to Typography
          </button>
        </div>
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

const DownloadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export default ExportScreen;