import React, { useState } from 'react';
import { Card } from '../types';
import { CardComponent } from './CardComponent';

interface GraveyardProps {
  playerGrave: Card[];
  npcGrave: Card[];
  isOpen?: boolean;
  onToggle?: () => void;
  // When true, component will force showing only player's graveyard (for future PvP)
  restrictToMine?: boolean;
}

export const Graveyard: React.FC<GraveyardProps> = ({ playerGrave, npcGrave, isOpen: externalOpen, onToggle, restrictToMine }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof externalOpen === 'boolean' && typeof onToggle === 'function';
  const isOpen = isControlled ? externalOpen! : internalOpen;

  const [filter, setFilter] = useState<'all' | 'mine' | 'opponent'>(restrictToMine ? 'mine' : 'all');

  const toggle = () => {
    if (isControlled) return onToggle && onToggle();
    setInternalOpen(v => !v);
  };

  // Build combined list. If cards include a timestamp (e.g. `destroyedAt`), use it to
  // produce a true chronological interleaving between owners. Otherwise fall back
  // to the current concatenation behavior (player then npc).
  const combinedWithTs = [
    ...playerGrave.map(c => ({ card: c, owner: 'Você' as const, ts: (c as any).destroyedAt ?? 0 })),
    ...npcGrave.map(c => ({ card: c, owner: 'Oponente' as const, ts: (c as any).destroyedAt ?? 0 }))
  ];

  // If any timestamp is present (>0), sort by timestamp (oldest -> newest). Otherwise
  // keep the concatenated order.
  const hasTimestamps = combinedWithTs.some(e => !!e.ts && e.ts > 0);
  const combined = hasTimestamps ? combinedWithTs.sort((a, b) => a.ts - b.ts) : combinedWithTs;

  const entriesToShow = (() => {
    if (restrictToMine) return combined.filter(e => e.owner === 'Você');
    if (filter === 'mine') return combined.filter(e => e.owner === 'Você');
    if (filter === 'opponent') return combined.filter(e => e.owner === 'Oponente');
    return combined;
  })();

  return (
    <div className={`fixed right-0 top-[305px] sm:top-[365px] z-[32] transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-56px)]'} ${isOpen ? '' : 'pointer-events-none'}`}>
      <div className="flex items-start">
        <button onClick={toggle} className="bg-slate-800 border-2 border-r-0 border-white/20 p-4 rounded-l-2xl shadow-2xl hover:bg-slate-700 transition-colors pointer-events-auto" aria-label="Abrir cemitério">
          <span className="sm:text-2xl">{isOpen ? '👉' : '⚰️'}</span>
        </button>

        <div className="w-80 sm:w-[40vw] h-[60vh] sm:h-auto bg-slate-900/95 border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col rounded-l-none rounded-r-lg p-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 border-b border-white/5">
            <div className="font-black text-lg text-slate-100">Cemitério</div>
            <div className="text-xs text-slate-400">{entriesToShow.length} cartas</div>
          </div>

          <div className="p-3 border-b border-white/5 flex gap-2 items-center">
            {!restrictToMine && (
              <>
                <button onClick={() => setFilter('all')} className={`px-2 py-1 rounded ${filter === 'all' ? 'text-yellow-600 font-bold' : 'bg-slate-800 text-slate-200'}`}>Todos</button>
                <button onClick={() => setFilter('mine')} className={`px-2 py-1 rounded ${filter === 'mine' ? 'text-blue-600 font-bold' : 'bg-slate-800 text-slate-200'}`}>Meus</button>
                <button onClick={() => setFilter('opponent')} className={`px-2 py-1 rounded ${filter === 'opponent' ? 'text-red-600 font-bold' : 'bg-slate-800 text-slate-200'}`}>Oponente</button>
              </>
            )}
            {restrictToMine && (
              <div className="text-sm text-slate-300 font-semibold">Visão restrita: Apenas suas cartas</div>
            )}
          </div>

          <div className="flex-1 p-3 flex overflow-x-auto">
            {entriesToShow.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 font-black italic text-center p-8">Nenhuma carta no cemitério ainda.</div>
            )}

            {entriesToShow.map((entry, idx) => (
                <div key={`${entry.card.uniqueId}-${idx}`} className={`p-2 rounded-xl bg-slate-800/40 border-l-4 scale-95 h-30 ${entry.owner !== 'Oponente' ? 'border-blue-500' : 'border-red-500'}`}>
                    <CardComponent
                    // render a shallow clone without statusEffects and force inactive flags
                    card={{ ...entry.card, statusEffects: [] }} compact isActive={false} canAttack={false} isAttacking={false} isDamaged={false}
                    />
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Graveyard;
