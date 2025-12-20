import React from 'react';
import { Card, ElementType } from '../types';

interface CardProps {
  card: Card;
  compact?: boolean;
  isOpponent?: boolean;
  isActive?: boolean;
  canAttack?: boolean;
  isAttacking?: boolean;
  isDamaged?: boolean;
}

const getTypeColor = (type: ElementType) => {
  switch (type) {
    case ElementType.GRASS: return 'bg-green-600 border-green-800';
    case ElementType.FIRE: return 'bg-red-600 border-red-800';
    case ElementType.WATER: return 'bg-blue-600 border-blue-800';
    case ElementType.ELECTRIC: return 'bg-yellow-500 border-yellow-700';
    case ElementType.BUG: return 'bg-lime-600 border-lime-800';
    case ElementType.NORMAL: return 'bg-stone-400 border-stone-600';
    case ElementType.POISON: return 'bg-purple-600 border-purple-800';
    case ElementType.GROUND: return 'bg-amber-700 border-amber-900';
    case ElementType.FIGHTING: return 'bg-orange-700 border-orange-900';
    case ElementType.PSYCHIC: return 'bg-pink-600 border-pink-800';
    default: return 'bg-gray-500 border-gray-700';
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
}

export const CardComponent: React.FC<CardProps> = ({ card, compact, isOpponent, isActive, canAttack, isAttacking, isDamaged }) => {
  let animationClass = '';
  if (isAttacking) {
    animationClass = isOpponent ? 'animate-attack-down' : 'animate-attack-up';
  } else if (isDamaged) {
    animationClass = 'animate-shake';
  }

  const baseClasses = `
    relative rounded-2xl border-[3px] shadow-2xl transition-all select-none
    flex flex-col text-white overflow-hidden cursor-pointer
    ${getTypeColor(card.type)}
    ${isActive ? 'ring-8 ring-white -translate-y-4 z-10' : 'hover:brightness-110'}
    ${canAttack ? 'animate-pulse ring-8 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]' : ''}
    ${compact ? 'w-32 h-44 md:w-40 md:h-56 text-lg p-3' : 'w-44 h-64 md:w-56 md:h-80 p-5'}
    ${animationClass}
  `;

  if (isOpponent) {
    return (
      <div className={`${compact ? 'w-32 h-44 md:w-40 md:h-56' : 'w-44 h-64 md:w-56 md:h-80'} ${animationClass} bg-gradient-to-br from-slate-700 to-slate-900 border-[3px] border-slate-500 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group`}>
         <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-600 shadow-inner group-hover:scale-125 transition-transform duration-500">
            <span className="text-6xl filter grayscale opacity-30">⚡</span>
         </div>
         <div className="absolute top-4 left-4 text-xs text-slate-500 font-black uppercase tracking-[0.2em]">OPONENTE</div>
         <div className="absolute bottom-6 px-4 py-2 bg-black/60 rounded-xl text-lg font-mono font-black text-slate-400 border border-white/5">
            ????
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div className={baseClasses}>
      <div className="flex justify-between items-start mb-4">
        <span className="font-black text-xl md:text-2xl truncate leading-tight drop-shadow-lg tracking-tighter italic max-w-full overflow-hidden">{card.name}</span>
      </div>

      <div className="flex justify-between items-center px-4 py-2 mb-4 bg-black/30 rounded-2xl border border-white/10">
         <span className="text-3xl">{getTypeIcon(card.type)}</span>
         <div className="flex space-x-1">
           {Array.from({length: card.level}).map((_, i) => (
             <span key={i} className="text-yellow-300 text-lg drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">★</span>
           ))}
         </div>
      </div>

      {!compact && (
      <div className="flex-1 bg-black/20 rounded-2xl flex items-center justify-center mb-4 border-2 border-white/5 shadow-inner">
         <span className={`font-black text-white/10 text-4xl italic`}>
            {card.name[0]}
         </span>
      </div>
      )}

      <div className="bg-black/60 rounded-2xl py-4 px-1 flex gap-x-1 justify-between text-xl md:text-2xl font-mono font-black border-2 border-white/10 shadow-lg">
        <div className="text-red-400 flex flex-col items-center">
            <span className="text-[10px] md:text-xs uppercase opacity-60 font-sans tracking-widest">ATK</span>
            <span className="drop-shadow-sm">{card.attack}</span>
        </div>
        <div className="text-blue-400 flex flex-col items-center">
             <span className="text-[10px] md:text-xs uppercase opacity-60 font-sans tracking-widest">DEF</span>
             <span className="drop-shadow-sm">{card.defense}</span>
        </div>
      </div>
      
      {card.hasAttacked && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none backdrop-blur-[2px] z-20">
            <span className={`${compact ? 'text-sm px-2 py-1 border-4' : 'text-xl px-6 py-3 border-8'} font-black text-white/80 uppercase -rotate-12 border-white/30 rounded-2xl scale-125 tracking-tighter italic shadow-2xl`}>EXAUSTO</span>
        </div>
      )}
    </div>
  );
};