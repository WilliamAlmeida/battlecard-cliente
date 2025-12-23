import React from 'react';
import { Card, ElementType, StatusEffect, CardType, Rarity } from '../types';
import Tooltip from './Tooltip';

interface CardProps {
  card: Card;
  compact?: boolean;
  isOpponent?: boolean;
  isActive?: boolean;
  canAttack?: boolean;
  isAttacking?: boolean;
  isDamaged?: boolean;
  showDetails?: boolean;
}

const getTypeColor = (type: ElementType) => {
  switch (type) {
    case ElementType.GRASS: return 'bg-green-600 border-green-800';
    case ElementType.FIRE: return 'bg-red-600 border-red-800';
    case ElementType.WATER: return 'bg-blue-600 border-blue-800';
    case ElementType.ELECTRIC: return 'bg-yellow-500 border-yellow-700';
    case ElementType.DRAGON: return 'bg-violet-700 border-violet-900';
    case ElementType.GHOST: return 'bg-indigo-700 border-indigo-900';
    case ElementType.BUG: return 'bg-lime-600 border-lime-800';
    case ElementType.NORMAL: return 'bg-stone-400 border-stone-600';
    case ElementType.POISON: return 'bg-purple-600 border-purple-800';
    case ElementType.GROUND: return 'bg-amber-700 border-amber-900';
    case ElementType.FIGHTING: return 'bg-orange-700 border-orange-900';
    case ElementType.PSYCHIC: return 'bg-pink-600 border-pink-800';
    default: return 'bg-gray-500 border-gray-700';
  }
};

const getSpellColor = () => 'bg-gradient-to-br from-purple-600 to-indigo-800 border-purple-400';
const getTrapColor = () => 'bg-gradient-to-br from-orange-600 to-red-800 border-orange-400';

const getTypeIcon = (type: ElementType) => {
    switch(type) {
        case ElementType.GRASS: return '🌿';
        case ElementType.FIRE: return '🔥';
        case ElementType.WATER: return '💧';
        case ElementType.ELECTRIC: return '⚡';
        case ElementType.DRAGON: return '🐉';
        case ElementType.GHOST: return '👻';
        case ElementType.PSYCHIC: return '🔮';
        case ElementType.FIGHTING: return '🥊';
        case ElementType.GROUND: return '🏜️';
        case ElementType.BUG: return '🐛';
        case ElementType.POISON: return '☠️';
        default: return '⚪';
    }
};

const getStatusIcon = (status: StatusEffect) => {
  switch(status) {
    case StatusEffect.BURN: return '🔥';
    case StatusEffect.FREEZE: return '🧊';
    case StatusEffect.PARALYZE: return '⚡';
    case StatusEffect.POISON: return '☠️';
    case StatusEffect.SLEEP: return '😴';
    case StatusEffect.CONFUSE: return '😵';
    default: return '';
  }
};

const getRarityGlow = (rarity: Rarity) => {
  switch(rarity) {
    case Rarity.LEGENDARY: return 'shadow-[0_0_30px_rgba(234,179,8,0.5)]';
    case Rarity.EPIC: return 'shadow-[0_0_20px_rgba(168,85,247,0.4)]';
    case Rarity.RARE: return 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    default: return '';
  }
};

export const CardComponent: React.FC<CardProps> = ({ card, compact, isOpponent, isActive, canAttack, isAttacking, isDamaged, showDetails }) => {
  let animationClass = '';
  if (isAttacking) {
    animationClass = isOpponent ? 'animate-attack-down' : 'animate-attack-up';
  } else if (isDamaged) {
    animationClass = 'animate-shake';
  }

  // Determine card color based on type
  const getCardColor = () => {
    if (card.cardType === CardType.SPELL) return getSpellColor();
    if (card.cardType === CardType.TRAP) return getTrapColor();
    return getTypeColor(card.type);
  };

  const activeStatuses = card.statusEffects?.filter(s => s !== StatusEffect.NONE) || [];

  const renderEffect = (effect: any) => {
    if (!effect) return 'Nenhum';
    const parts: string[] = [];
    parts.push(effect.type);
    if (typeof effect.value !== 'undefined') parts.push(`value: ${effect.value}`);
    if (effect.statusEffect) parts.push(`status: ${effect.statusEffect}`);
    if (effect.target) parts.push(`target: ${effect.target}`);
    if (effect.specialId) parts.push(`${effect.specialId}`);
    if (effect.duration) parts.push(`duration: ${effect.duration}`);
    if (typeof effect.stat !== 'undefined') {
      const s = effect.stat === 'DEFENSE' ? 'DEF' : effect.stat === 'ATTACK' ? 'ATK' : effect.stat;
      parts.push(`stat: ${s}`);
    } else if (effect.type === 'BUFF' || effect.type === 'DEBUFF') {
      // when stat not provided, it affects both
      parts.push(`stat: ATK/DEF`);
    }
    return parts.join(' | ');
  };

  const baseClasses = `
    relative rounded-2xl border-[3px] shadow-2xl transition-all select-none
    flex flex-col text-white overflow-hidden cursor-pointer
    ${getCardColor()}
    ${getRarityGlow(card.rarity)}
    ${isActive ? 'ring-4 ring-white -translate-y-4 z-10' : 'hover:brightness-110'}
    ${canAttack ? 'animate-pulse ring-[3px] sm:ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]' : ''}
    ${compact ? 'w-[110px] h-[155px] md:w-32 md:h-[180px] text-lg p-2 sm:px-3' : 'w-32 h-44 md:w-40 md:h-56 text-lg p-3'}
    ${animationClass}
    ${activeStatuses.length > 0 ? 'ring-4 ring-red-500' : ''}
  `;

  // Opponent hidden card
  if (isOpponent) {
    return (
      <div className={`${compact ? 'w-32 h-44 md:w-40 md:h-56' : 'w-32 h-44 md:w-40 md:h-56'} ${animationClass} bg-gradient-to-br from-slate-700 to-slate-900 border-[3px] border-slate-500 rounded-2xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group`}>
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

  // Spell Card
  if (card.cardType === CardType.SPELL) {
    return (
      <div className={baseClasses}>
        <div className="absolute top-2 right-2 text-2xl">
          <Tooltip content={(
            <div>
              <div className="font-black text-base">{card.name}</div>
              <div className="text-sm mt-1 leading-tight">{card.spellEffect ? renderEffect(card.spellEffect) : 'Efeito desconhecido'}</div>
            </div>
          )}>
            <span className="cursor-help">🪄</span>
          </Tooltip>
        </div>
        <div className="flex justify-between items-start mb-2 pointer-events-none">
          <span className="font-black text-lg truncate leading-tight drop-shadow-lg">{card.name}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-6xl">✨</span>
        </div>
        <div className="bg-black/60 rounded-xl p-2 text-xs text-center">
          <span className="text-purple-300">MAGIA</span>
        </div>
      </div>
    );
  }

  // Trap Card
  if (card.cardType === CardType.TRAP) {
    return (
      <div className={baseClasses}>
        <div className="absolute top-2 right-2 text-2xl">
          <Tooltip content={(
            <div>
              <div className="font-black text-base">{card.name}</div>
              <div className="text-sm mt-1 leading-tight">{card.trapEffect ? renderEffect(card.trapEffect) : 'Efeito desconhecido'}</div>
            </div>
          )}>
            <span className="cursor-help">🪤</span>
          </Tooltip>
        </div>
        <div className="flex justify-between items-start mb-2 pointer-events-none">
          <span className="font-black text-lg truncate leading-tight drop-shadow-lg">{card.name}</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-6xl">{card.isSet ? '❓' : '⚠️'}</span>
        </div>
        <div className="bg-black/60 rounded-xl p-2 text-xs text-center">
          <span className="text-orange-300">{card.isSet ? 'SETADA' : 'ARMADILHA'}</span>
        </div>
      </div>
    );
  }

  // Pokemon Card
  // Build background URL from card name (lowercase, spaces -> '-') and apply
  const imageName = card.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const bgUrl = `https://img.pokemondb.net/sprites/scarlet-violet/icon/avif/${imageName || 'voltorb'}.avif`;
  const previewBgStyle: React.CSSProperties = {
    backgroundImage: `url('${bgUrl}')`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center top',
    backgroundSize: compact ? '120px 112px' : '120px 112px',
  };

  return (
    <div className={baseClasses}>
      <div
        className="absolute inset-0 pointer-events-none -top-1 -left-9 z-[1]"
        style={{
          ...previewBgStyle,
          transform: 'scaleX(-1)',
          transformOrigin: 'center',
        }}
      />

      {/* Status Effects */}
      {activeStatuses.length > 0 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center">
          {activeStatuses.map((status, i) => (
            <span key={i} className="text-base animate-pulse">{getStatusIcon(status)}</span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-start pointer-events-none mt-1 mb-2 z-[2]">
        <span className="font-semibold sm:font-bold text-s md:text-base truncate leading-tight drop-shadow-lg tracking-tighter italic max-w-full overflow-hidden">{card.name}</span>
      </div>

      {/* Rarity indicator for legendaries */}
      {card.rarity === Rarity.LEGENDARY && (
        <div className="absolute top-0 left-0 rotate-[-30deg] pointer-events-none">
          <span className="text-yellow-400 text-sm sm:text-lg">👑</span>
        </div>
      )}

      <div className="absolute top-0 right-2 pointer-events-none">
        {!compact ? (
          <div className="flex items-center space-x-1">
            <span className="text-yellow-300 text-lg drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">★</span>
            <span className="text-yellow-100 text-lg font-bold">{card.level}</span>
          </div>
        ) : (
          <div className="flex space-x-1">
          {Array.from({length: card.level}).map((_, i) => (
            <span key={i} className="text-yellow-300 text-sm drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">★</span>
          ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center px-1 py-1 sm:py-2 bg-black/30 rounded-t-lg sm:rounded-t-xl border-t border-x border-white/10">
        <Tooltip width="w-auto" content={(<div className="text-sm">Tipo: <span className="font-mono">{card.type}</span></div>)}>
          <span className="sm:text-3xl cursor-help h-10 w-10 block">
            {/* {getTypeIcon(card.type)} */}
          </span>
        </Tooltip>

        {/* Ability Indicator */}
        {card.ability ? (
          <div className="translate-x-1 translate-y-3">
            <Tooltip content={(
              <div>
                <div className="font-black text-base">{card.ability.name}</div>
                <div className="text-sm mt-1 leading-tight">{card.ability.description}</div>
                <div className="text-sm mt-2 opacity-80">Trigger: <span className="font-mono">{card.ability.trigger}</span></div>
                <div className="text-sm mt-1 opacity-80">Effect: <span className="font-mono">{renderEffect(card.ability.effect)}</span></div>
              </div>
            )}>
              <span className="cursor-help text-2xl">💫</span>
            </Tooltip>
          </div>
        ) : (
            <span className="grayscale text-2xl opacity-35 pointer-events-none translate-x-1 translate-y-3">💫</span>
        )}
      </div>

      <div className="bg-black/60 rounded-b-lg sm:rounded-b-xl py-1 sm:py-2 px-1 flex gap-x-1 justify-around font-mono font-black border-b-2 border-x-2 border-white/10 shadow-lg">
        <div className="text-red-400 flex flex-col items-center justify-center">
            <span className="text-[10px] md:text-xs uppercase opacity-60 font-sans tracking-widest leading-none">ATK</span>
            <span className={`drop-shadow-sm ${compact ? 'text-sm' : 'text-sm'}`}>{card.attack}</span>
        </div>
        <div className="text-blue-400 flex flex-col items-center justify-center">
            <span className="text-[10px] md:text-xs uppercase opacity-60 font-sans tracking-widest leading-none">DEF</span>
            <span className={`drop-shadow-sm ${compact ? 'text-sm' : 'text-sm'}`}>{card.defense}</span>
        </div>
      </div>
      
      {card.hasAttacked && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none backdrop-blur-[2px] z-20">
            <span className={`${compact ? 'text-sm px-2 py-1 border-4' : 'text-sm px-2 py-1 border-4'} font-black text-white/80 uppercase -rotate-12 border-white/30 rounded-2xl scale-125 tracking-tighter italic shadow-2xl`}>EXAUSTO</span>
        </div>
      )}
    </div>
  );
};