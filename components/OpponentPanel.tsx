import React, { useState } from 'react';
import { Card } from '../types';
import { CardComponent } from './CardComponent';

interface OpponentPanelProps {
  npcHand: Card[];
  npcDeck: Card[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export const OpponentPanel: React.FC<OpponentPanelProps> = ({ npcHand, npcDeck, isOpen: externalOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof externalOpen === 'boolean' && typeof onToggle === 'function';
  const isOpen = isControlled ? externalOpen! : internalOpen;

  const toggle = () => {
    if (isControlled) return onToggle && onToggle();
    setInternalOpen(v => !v);
  };

  const [reveal, setReveal] = useState(false);

  return (
    <div className={`fixed right-0 top-[305px] sm:top-[365px] z-[32] transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-56px)]'} ${isOpen ? '' : 'pointer-events-none'}`}>
      <div className="flex items-start">
        <button onClick={toggle} className="bg-slate-800 border-2 border-r-0 border-white/20 p-4 rounded-l-2xl shadow-2xl hover:bg-slate-700 transition-colors pointer-events-auto" aria-label="Abrir painel do oponente">
          <span className="sm:text-2xl">{isOpen ? '👉' : '👁️'}</span>
        </button>

        <div className="w-80 sm:w-[40vw] h-[60vh] sm:h-auto bg-slate-900/95 border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col rounded-l-none rounded-r-lg p-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 border-b border-white/5">
            <div className="font-black text-lg text-slate-100">Oponente</div>
            <div className="text-xs text-slate-400">Mão: {npcHand.length} • Deck: {npcDeck.length}</div>
          </div>

          <div className="p-3 border-b border-white/5 flex gap-2 items-center">
            <button onClick={() => setReveal(false)} className={`px-2 py-1 rounded ${!reveal ? 'text-yellow-600 font-bold' : 'bg-slate-800 text-slate-200'}`}>Ocultar</button>
            <button onClick={() => setReveal(true)} className={`px-2 py-1 rounded ${reveal ? 'text-blue-600 font-bold' : 'bg-slate-800 text-slate-200'}`}>Revelar</button>
            <div className="ml-auto text-sm text-slate-400">(Modo dev: revele para inspecionar cartas)</div>
          </div>

          <div className="flex-1 p-3 flex flex-col gap-3 overflow-auto">
            <div>
              <div className="font-semibold text-slate-300 mb-2">Mão do Oponente</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {npcHand.length === 0 && <div className="text-slate-600 italic">Mão vazia</div>}
                {npcHand.map((c, i) => (
                  <div key={`${c.uniqueId}-${i}`} className="p-1">
                    <CardComponent card={c} compact faceDown={!reveal} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="font-semibold text-slate-300 mb-2">Deck do Oponente ({npcDeck.length})</div>
              <div className="flex gap-2 items-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-28 bg-gradient-to-br from-slate-700 to-slate-900 border-2 border-slate-600 rounded-2xl flex items-center justify-center text-4xl text-slate-300">🂠</div>
                  <div className="text-xs text-slate-400 mt-1">{npcDeck.length} cartas</div>
                </div>

                <div className="flex-1">
                  {reveal ? (
                    <div className="flex flex-row gap-2 max-w-80 sm:max-w-[33.5vw] overflow-x-auto">
                      {npcDeck.map((c, i) => (
                        <div key={`${c.uniqueId}-deck-${i}`} className="p-1">
                          <CardComponent card={c} compact />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">Deck oculto — habilite "Revelar" para depuração.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpponentPanel;
