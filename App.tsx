
import React from 'react';
import { useLogoStore } from './store/logoStore';
import { Screen } from './types';
import TemplateSelectionScreen from './screens/TemplateSelectionScreen';
import EditorScreen from './screens/EditorScreen';
import TypographyScreen, { ErrorBoundary } from './screens/TypographyScreen';
import ExportScreen from './screens/ExportScreen';

const App: React.FC = () => {
  const currentScreen = useLogoStore((state) => state.currentScreen);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.TemplateSelection:
        return <TemplateSelectionScreen />;
      case Screen.Editor:
        return <EditorScreen />;
      case Screen.Typography:
        return <React.Suspense fallback={<div>Loading...</div>}>
          <ErrorBoundary>
            <TypographyScreen />
          </ErrorBoundary>
        </React.Suspense>;
      case Screen.Export:
        return <ExportScreen />;
      default:
        return <TemplateSelectionScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center p-4">
      <header className="w-full max-w-6xl mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 py-2">
          Geometric Logo Platform
        </h1>
        <p className="text-slate-400">Craft your unique brand identity with ease.</p>
      </header>
      <main className="w-full max-w-6xl bg-slate-800 shadow-2xl rounded-lg p-2 sm:p-4 md:p-6">
        {renderScreen()}
      </main>
      <footer className="w-full max-w-6xl mt-8 text-center text-slate-500 text-sm">
        <p>&copy; 2024 Geometric Logo Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
