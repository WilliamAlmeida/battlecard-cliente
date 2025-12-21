import React, { useState } from 'react';
import { GameLogEntry } from '../types';

interface BattleLogProps {
  logs: GameLogEntry[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, isOpen: externalOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState();
  const isControlled = typeof externalOpen === 'boolean' && typeof onToggle === 'function';
  const isOpen = isControlled ? externalOpen! : internalOpen;

  const toggle = () => {
    if (isControlled) return onToggle!();
    setInternalOpen(v => !v);
  };

  return (
    <div className={`fixed right-0 top-48 z-50 transition-all duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-56px)]'} ${isOpen ? '' : 'pointer-events-none'}`}>
      <div className="flex items-start">
        {/* Toggle Button */}
        <button 
          onClick={toggle}
          className="bg-slate-800 border-2 border-r-0 border-white/20 p-4 rounded-l-2xl shadow-2xl hover:bg-slate-700 transition-colors pointer-events-auto"
        >
          <span className="text-2xl">{isOpen ? '👉' : '📜'}</span>
        </button>

        {/* Log Panel */}
        <div className="w-80 h-[60vh] bg-slate-900/95 border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col rounded-l-none rounded-r-none">
          <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
            <h3 className="font-black text-xl text-yellow-500 uppercase tracking-tighter italic">Log de Batalha</h3>
            <span className="text-xs font-bold text-slate-500">{logs.length} eventos</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide flex flex-col-reverse">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`
                  p-4 rounded-xl text-sm md:text-base font-bold shadow-md border-l-8 animate-in slide-in-from-right-10 duration-300
                  ${log.type === 'combat' ? 'bg-red-950/40 border-red-500 text-red-100' : ''}
                  ${log.type === 'effect' ? 'bg-purple-950/40 border-purple-500 text-purple-100' : ''}
                  ${log.type === 'info' ? 'bg-blue-950/40 border-blue-500 text-blue-100' : ''}
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="opacity-50 text-[10px] mt-1 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span>{log.message}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 font-black italic text-center p-8">
                Nenhuma ação registrada ainda...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};