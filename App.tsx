import React, { useState } from 'react';
import SmartGlassesHUD from './components/SmartGlassesHUD';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');

  return (
    <div className="min-h-screen bg-black text-cyan-400 overflow-hidden relative">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }}>
      </div>

      <main className="relative z-10 h-full flex flex-col">
        <header className="p-4 border-b border-cyan-900/50 flex justify-between items-center bg-black/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
            <h1 className="text-xl font-bold tracking-widest uppercase text-cyan-100">Jorjin/UVC Link</h1>
          </div>
          <div className="text-xs text-cyan-600 font-mono">
            SYS.STATUS: ONLINE
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <SmartGlassesHUD />
        </div>
      </main>
    </div>
  );
};

export default App;