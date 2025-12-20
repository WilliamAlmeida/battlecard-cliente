import React, { useState } from 'react';
import { ElementType } from '../types';
import { GameRules } from '../utils/gameRules';

interface TypeTableProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const TypeTable: React.FC<TypeTableProps> = ({ isOpen: externalOpen, onToggle }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof externalOpen === 'boolean' && typeof onToggle === 'function';
  const isOpen = isControlled ? externalOpen! : internalOpen;

  const toggle = () => {
    if (isControlled) return onToggle!();
    setInternalOpen(v => !v);
  };

  const cellClassFor = (mult?: number) => {
    if (mult === undefined || mult === 1) return 'bg-slate-800 text-slate-200';
    if (mult === 2) return 'bg-emerald-700 text-emerald-100 font-bold';
    if (mult === 0.5) return 'bg-amber-700 text-amber-50';
    if (mult === 0) return 'bg-red-800 text-red-100 line-through';
    return 'bg-slate-800 text-slate-200';
  };

  const getTypeColor = (type: ElementType) => {
    switch (type) {
      case ElementType.GRASS: return 'bg-green-600 border-green-800 text-white';
      case ElementType.FIRE: return 'bg-red-600 border-red-800 text-white';
      case ElementType.WATER: return 'bg-blue-600 border-blue-800 text-white';
      case ElementType.ELECTRIC: return 'bg-yellow-500 border-yellow-700 text-black';
      case ElementType.BUG: return 'bg-lime-600 border-lime-800 text-white';
      case ElementType.NORMAL: return 'bg-stone-400 border-stone-600 text-black';
      case ElementType.POISON: return 'bg-purple-600 border-purple-800 text-white';
      case ElementType.GROUND: return 'bg-amber-700 border-amber-900 text-black';
      case ElementType.FIGHTING: return 'bg-orange-700 border-orange-900 text-white';
      case ElementType.PSYCHIC: return 'bg-pink-600 border-pink-800 text-white';
      default: return 'bg-gray-500 border-gray-700 text-white';
    }
  };

  const getTypeIcon = (type: ElementType) => {
    switch(type) {
      case ElementType.GRASS: return '🌿';
      case ElementType.FIRE: return '🔥';
      case ElementType.WATER: return '💧';
      case ElementType.ELECTRIC: return '⚡';
      case ElementType.PSYCHIC: return '🔮';
      case ElementType.FIGHTING: return '🥊';
      case ElementType.GROUND: return '🏜️';
      case ElementType.BUG: return '🐛';
      case ElementType.POISON: return '☠️';
      default: return '⚪';
    }
  };

  return (
    <div className={`fixed right-0 top-72 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-56px)]'} ${isOpen ? '' : 'pointer-events-none'}`}>
      <div className="flex items-start">
        <button onClick={toggle} className="bg-slate-800 border-2 border-r-0 border-white/20 p-4 rounded-l-2xl shadow-2xl hover:bg-slate-700 transition-colors pointer-events-auto" aria-label="Abrir tabela">
          <span className="text-2xl">{isOpen ? '🔬' : '📊'}</span>
        </button>

        <div className="bg-slate-900/95 border-2 border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col rounded-l-none rounded-r-lg p-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="font-black text-lg text-slate-100">Tabela de Efeitos</div>
            <div className="flex items-center gap-2">
              <div className="text-slate-300 mr-2">Multiplicadores: <span className="font-semibold text-emerald-300">x2</span> / <span className="font-semibold text-amber-300">x0.5</span> / <span className="font-semibold text-red-300">x0</span></div>
              <button onClick={toggle} className="text-slate-300 hover:text-white bg-slate-800/50 px-2 py-1 rounded" aria-label="Fechar tabela">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-2 py-3">
            <table className="w-full text-sm table-auto border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 z-10">
                <tr>
                  <th className="p-2 text-left font-bold text-slate-200">Atk \ Def</th>
                  {Object.values(ElementType).map((def) => (
                    <th key={def} className="p-2 text-center font-semibold">
                      <div className={`inline-flex items-center justify-center gap-2 px-2 py-1 rounded ${getTypeColor(def as ElementType)}`}>
                        <span className="text-sm">{getTypeIcon(def as ElementType)}</span>
                        <span className="text-xs font-bold uppercase">{def}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.values(ElementType).map((atk) => (
                  <tr key={atk} className="border-t border-white/5">
                    <td className="p-2 font-bold text-slate-100 sticky left-0">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded ${getTypeColor(atk as ElementType)}`}>
                        <span className="text-sm">{getTypeIcon(atk as ElementType)}</span>
                        <span className="text-sm font-bold uppercase">{atk}</span>
                      </div>
                    </td>
                    {Object.values(ElementType).map((def) => {
                      const mult = GameRules.TYPE_TABLE[atk as ElementType]?.[def as ElementType];
                      const display = mult === undefined ? 'x1' : (mult === 0 ? 'x0' : `x${mult}`);
                      const cellClass = cellClassFor(mult);
                      return <td key={def} className={`p-2 text-center ${cellClass}`}>{display}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
