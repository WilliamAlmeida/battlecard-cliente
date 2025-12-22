import React, { useEffect, useState } from 'react';
import { Card, CardType, Rarity, ElementType } from '../types';
import { collectionService } from '../services/collectionService';
import Tooltip from './Tooltip';
import { INITIAL_DECK, SPELL_CARDS, TRAP_CARDS } from '../constants';
import { soundService } from '../services/soundService';

interface CollectionViewProps {
  onClose?: () => void;
  onBack?: () => void;
}

const getRarityColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return 'border-slate-500 bg-slate-800';
    case Rarity.UNCOMMON: return 'border-green-500 bg-green-900/30';
    case Rarity.RARE: return 'border-blue-500 bg-blue-900/30';
    case Rarity.EPIC: return 'border-purple-500 bg-purple-900/30';
    case Rarity.LEGENDARY: return 'border-yellow-500 bg-yellow-900/30 animate-pulse';
    default: return 'border-slate-500';
  }
};

const getRarityLabel = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return '⚪ Comum';
    case Rarity.UNCOMMON: return '🟢 Incomum';
    case Rarity.RARE: return '🔵 Raro';
    case Rarity.EPIC: return '🟣 Épico';
    case Rarity.LEGENDARY: return '🌟 Lendário';
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

export const CollectionView: React.FC<CollectionViewProps> = ({ onClose, onBack }) => {
  const handleClose = onClose || onBack || (() => {});
  const [filter, setFilter] = useState<'all' | 'pokemon' | 'spell' | 'trap'>('all');
  const [typeFilter, setTypeFilter] = useState<ElementType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [openingPack, setOpeningPack] = useState(false);
  const [packResults, setPackResults] = useState<string[]>([]);

  const [collection, setCollection] = useState(collectionService.getCollection());
  const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];

  const filteredCards = allCards.filter(card => {
    if (filter === 'pokemon' && card.cardType !== CardType.POKEMON) return false;
    if (filter === 'spell' && card.cardType !== CardType.SPELL) return false;
    if (filter === 'trap' && card.cardType !== CardType.TRAP) return false;
    if (typeFilter !== 'all' && card.type !== typeFilter) return false;
    if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
    if (showOnlyOwned && !collectionService.hasCard(card.id)) return false;
    return true;
  });

  const handleOpenPack = () => {
    if (collection.packs <= 0) {
      soundService.playError();
      return;
    }
    
    soundService.playSummon();
    setOpeningPack(true);
    
    setTimeout(() => {
      const results = collectionService.openPack();
      setPackResults(results);
      // refresh local state after opening pack so UI updates
      setCollection(collectionService.getCollection());
      soundService.playAchievement();
    }, 1500);
  };

  const handleBuyPack = () => {
    if (collectionService.buyPack()) {
      soundService.playClick();
      // refresh local state after successful purchase so UI updates
      setCollection(collectionService.getCollection());
    } else {
      soundService.playError();
    }
  };

  if (openingPack) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
        {packResults.length === 0 ? (
          <div className="text-center">
            <div className="text-9xl animate-bounce mb-8">📦</div>
            <h2 className="text-4xl font-black text-yellow-500 animate-pulse">Abrindo pacote...</h2>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-4xl font-black text-yellow-500 mb-8">Você obteve!</h2>
            <div className="flex gap-4 flex-wrap justify-center mb-8">
              {packResults.map((cardId, i) => {
                const card = allCards.find(c => c.id === cardId);
                if (!card) return null;
                return (
                  <div 
                    key={i}
                    className={`p-4 rounded-xl border-4 ${getRarityColor(card.rarity)} animate-in zoom-in duration-500`}
                    style={{ animationDelay: `${i * 200}ms` }}
                  >
                    <div className="text-4xl mb-2">{getTypeIcon(card.type)}</div>
                    <div className="font-bold">{card.name}</div>
                    <div className="text-xs text-slate-400">{getRarityLabel(card.rarity)}</div>
                  </div>
                );
              })}
            </div>
            <button 
              onClick={() => { setOpeningPack(false); setPackResults([]); }}
              className="bg-yellow-500 text-black px-8 py-4 rounded-xl font-bold text-xl hover:bg-yellow-400"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto select-none">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-yellow-500">📚 Coleção</h1>
            <p className="text-slate-400">
              {collectionService.getObtainedCardsCount()} / {allCards.length} cartas coletadas
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="bg-slate-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-slate-600"
          >
            ✕ <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        {/* Packs Section */}
        <div className="bg-slate-800 p-6 rounded-2xl mb-8 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl">📦</div>
            <div>
              <div className="text-2xl font-bold">{collection.packs} Pacotes</div>
              <div className="text-slate-400">💰 {collection.coins} moedas</div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleOpenPack}
              disabled={collection.packs <= 0}
              className={`px-8 py-4 rounded-xl font-bold text-xl ${
                collection.packs > 0 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:scale-105' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Abrir Pacote
            </button>
            <button
              onClick={handleBuyPack}
              disabled={collection.coins < 200}
              className={`px-8 py-4 rounded-xl font-bold text-xl ${
                collection.coins >= 200 
                  ? 'bg-green-600 hover:bg-green-500' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Comprar (💰 200)
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="bg-slate-800 px-4 py-2 rounded-xl"
          >
            <option value="all">Todos os Tipos</option>
            <option value="pokemon">Pokémon</option>
            <option value="spell">Magias</option>
            <option value="trap">Armadilhas</option>
          </select>

          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-slate-800 px-4 py-2 rounded-xl"
          >
            <option value="all">Todos os Elementos</option>
            {Object.values(ElementType).map(type => (
              <option key={type} value={type}>{getTypeIcon(type)} {type}</option>
            ))}
          </select>

          <select 
            value={rarityFilter}
            onChange={e => setRarityFilter(e.target.value as any)}
            className="bg-slate-800 px-4 py-2 rounded-xl"
          >
            <option value="all">Todas as Raridades</option>
            {Object.values(Rarity).map(rarity => (
              <option key={rarity} value={rarity}>{getRarityLabel(rarity)}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl cursor-pointer">
            <input 
              type="checkbox"
              checked={showOnlyOwned}
              onChange={e => setShowOnlyOwned(e.target.checked)}
              className="w-5 h-5"
            />
            Mostrar apenas obtidas
          </label>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredCards.map(card => {
            const owned = collectionService.hasCard(card.id);
            const quantity = collectionService.getCardQuantity(card.id);
            
            return (
              <div 
                key={card.id}
                className={`
                  p-4 rounded-xl border-2 transition-all relative
                  ${getRarityColor(card.rarity)}
                  ${!owned && 'opacity-30 grayscale'}
                `}
              >
                {quantity > 1 && (
                  <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">
                    {quantity}
                  </div>
                )}
                
                <div className="text-3xl mb-2 text-center">{getTypeIcon(card.type)}</div>
                <div className="font-bold text-sm text-center truncate">{card.name}</div>

                {card.cardType === CardType.POKEMON && card.ability && (
                  <div className="text-center text-xs text-purple-300 mt-1">
                    <Tooltip content={(
                      <div>
                        <div className="font-black text-sm">{card.ability.name}</div>
                        <div className="text-xs mt-1">{card.ability.description}</div>
                        <div className="text-xs mt-1 opacity-80">Trigger: <span className="font-mono">{card.ability.trigger}</span></div>
                      </div>
                    )}>
                      <span className="cursor-help">💫 {card.ability.name}</span>
                    </Tooltip>
                  </div>
                )}
                
                {card.cardType === CardType.POKEMON && (
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-red-400">⚔️ {card.attack}</span>
                    <span className="text-blue-400">🛡️ {card.defense}</span>
                  </div>
                )}
                
                {card.cardType === CardType.SPELL && (
                  <div className="text-center text-xs text-purple-400 mt-2">
                    <Tooltip content={(
                      <div>
                        <div className="font-black text-sm">{card.name}</div>
                        <div className="text-xs mt-1">{card.spellEffect ? String(card.spellEffect.type) + (card.spellEffect.value ? ` (${card.spellEffect.value})` : '') : 'Efeito desconhecido'}</div>
                      </div>
                    )}>
                      <span className="cursor-help">🪄 Magia</span>
                    </Tooltip>
                  </div>
                )}
                
                {card.cardType === CardType.TRAP && (
                  <div className="text-center text-xs text-orange-400 mt-2">
                    <Tooltip content={(
                      <div>
                        <div className="font-black text-sm">{card.name}</div>
                        <div className="text-xs mt-1">{card.trapEffect ? String(card.trapEffect.type) + (card.trapEffect.value ? ` (${card.trapEffect.value})` : '') : 'Efeito desconhecido'}</div>
                      </div>
                    )}>
                      <span className="cursor-help">🪤 Armadilha</span>
                    </Tooltip>
                  </div>
                )}
                
                <div className="text-center mt-2">
                  {Array.from({ length: card.level }).map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xs">★</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
