import React, { useState } from 'react';
import { Card, CardType, Rarity, ElementType } from '../types';
import { collectionService } from '../services/collectionService';
import { INITIAL_DECK, SPELL_CARDS, TRAP_CARDS, MIN_DECK_SIZE, MAX_DECK_SIZE } from '../constants';
import { soundService } from '../services/soundService';

interface DeckBuilderViewProps {
  onBack?: () => void;
  onClose?: () => void;
}

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

const getRarityColor = (rarity: Rarity) => {
  switch (rarity) {
    case Rarity.COMMON: return 'border-slate-500';
    case Rarity.UNCOMMON: return 'border-green-500';
    case Rarity.RARE: return 'border-blue-500';
    case Rarity.EPIC: return 'border-purple-500';
    case Rarity.LEGENDARY: return 'border-yellow-500';
    default: return 'border-slate-500';
  }
};

export const DeckBuilderView: React.FC<DeckBuilderViewProps> = ({ onBack, onClose }) => {
  const handleClose = onClose || onBack || (() => {});
  
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<string[]>([]);
  const [deckName, setDeckName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pokemon' | 'spell' | 'trap'>('all');
  const [typeFilter, setTypeFilter] = useState<ElementType | 'all'>('all');

  const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];
  const customDecks = collectionService.getCustomDecks();
  
  const filteredAvailableCards = allCards.filter(card => {
    if (!collectionService.hasCard(card.id)) return false;
    if (filter === 'pokemon' && card.cardType !== CardType.POKEMON) return false;
    if (filter === 'spell' && card.cardType !== CardType.SPELL) return false;
    if (filter === 'trap' && card.cardType !== CardType.TRAP) return false;
    if (typeFilter !== 'all' && card.type !== typeFilter) return false;
    return true;
  });

  const handleCreateNewDeck = () => {
    soundService.playClick();
    setIsCreatingNew(true);
    setSelectedDeckId(null);
    setDeckCards([]);
    setDeckName('');
  };

  const handleLoadDeck = (deckId: string) => {
    soundService.playClick();
    const deck = customDecks.find(d => d.id === deckId);
    if (deck) {
      setSelectedDeckId(deck.id);
      setDeckCards([...deck.cards]);
      setDeckName(deck.name);
      setIsCreatingNew(false);
    }
  };

  const handleSaveDeck = () => {
    if (!deckName.trim()) {
      soundService.playError();
      alert('Digite um nome para o deck!');
      return;
    }
      if (deckCards.length < MIN_DECK_SIZE) {
        soundService.playError();
        alert(`Um deck precisa ter pelo menos ${MIN_DECK_SIZE} cartas!`);
        return;
      }

      if (deckCards.length > MAX_DECK_SIZE) {
        soundService.playError();
        alert(`Um deck pode ter no máximo ${MAX_DECK_SIZE} cartas!`);
        return;
      }

    if (selectedDeckId) {
      collectionService.updateDeck(selectedDeckId, deckName, deckCards);
    } else {
      collectionService.createDeck(deckName, deckCards);
    }

    soundService.playAchievement();
    setIsCreatingNew(false);
    setSelectedDeckId(null);
    setDeckCards([]);
    setDeckName('');
  };

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Tem certeza que deseja excluir este deck?')) {
      collectionService.deleteDeck(deckId);
      soundService.playClick();
      if (selectedDeckId === deckId) {
        setSelectedDeckId(null);
        setDeckCards([]);
        setDeckName('');
        setIsCreatingNew(false);
      }
    }
  };

  const handleAddCard = (cardId: string) => {
    const cardCount = deckCards.filter(c => c === cardId).length;
    if (cardCount >= 3) {
      soundService.playError();
      return;
    }
    soundService.playClick();
    setDeckCards([...deckCards, cardId]);
  };

  const handleRemoveCard = (index: number) => {
    soundService.playClick();
    setDeckCards(deckCards.filter((_, i) => i !== index));
  };

  const getDeckCardCounts = () => {
    const counts: Record<string, number> = {};
    deckCards.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-yellow-500">🔧 Deck Builder</h1>
            <p className="text-slate-400">Crie e edite seus decks personalizados</p>
          </div>
          <button 
            onClick={handleClose}
            className="bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600"
          >
            ✕ Fechar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Decks Salvos */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Meus Decks</h2>
              <button
                onClick={handleCreateNewDeck}
                className="bg-green-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-500"
              >
                + Novo
              </button>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 max-h-[690px] overflow-y-auto space-y-3">
              {customDecks.map(deck => (
                <div 
                  key={deck.id}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedDeckId === deck.id 
                      ? 'bg-yellow-900/30 border-yellow-500' 
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                    }
                  `}
                  onClick={() => handleLoadDeck(deck.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{deck.name}</div>
                      <div className="text-sm text-slate-400">{deck.cards.length} cartas</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeck(deck.id);
                      }}
                      className="text-red-400 hover:text-red-300 text-xl"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}

              {customDecks.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  Nenhum deck criado ainda
                </div>
              )}
            </div>
          </div>

          {/* Deck Atual */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">
              {isCreatingNew || selectedDeckId ? 'Editando Deck' : 'Selecione um deck'}
            </h2>

            {(isCreatingNew || selectedDeckId) && (
              <>
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Nome do deck..."
                  className="w-full bg-slate-700 px-4 py-3 rounded-xl mb-4 font-bold text-lg"
                />

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Cartas: {deckCards.length}</span>
                    <span className={`font-bold ${
                      deckCards.length < MIN_DECK_SIZE ? 'text-red-400' :
                      deckCards.length > MAX_DECK_SIZE ? 'text-red-400' :
                      'text-green-400'
                    }`}>
                      {deckCards.length < MIN_DECK_SIZE && `Mínimo: ${MIN_DECK_SIZE}`}
                      {deckCards.length >= MIN_DECK_SIZE && deckCards.length <= MAX_DECK_SIZE && `✓ OK`}
                      {deckCards.length > MAX_DECK_SIZE && `Máximo: ${MAX_DECK_SIZE}`}
                    </span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        deckCards.length < 20 ? 'bg-red-500' :
                        deckCards.length > 40 ? 'bg-red-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((deckCards.length / MAX_DECK_SIZE) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Deck Cards */}
                <div className="bg-slate-900/50 rounded-xl p-4 max-h-[500px] overflow-y-auto mb-4">
                  {deckCards.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      Adicione cartas ao deck
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(getDeckCardCounts()).map(([cardId, count]) => {
                        const card = allCards.find(c => c.id === cardId);
                        if (!card) return null;
                        return (
                          <div
                            key={cardId}
                            onClick={() => {
                              const firstIndex = deckCards.indexOf(cardId);
                              if (firstIndex !== -1) handleRemoveCard(firstIndex);
                            }}
                            className="relative p-2 bg-slate-800 rounded-lg border-2 cursor-pointer hover:border-red-400 transition-all"
                          >
                            <div className="text-2xl text-center">{getTypeIcon(card.type)}</div>
                            <div className="text-xs text-center truncate">{card.name}</div>
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">
                              {count}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveDeck}
                  disabled={deckCards.length < MIN_DECK_SIZE || deckCards.length > MAX_DECK_SIZE || !deckName.trim()}
                  className={`
                    w-full py-4 rounded-xl font-bold text-lg transition-all
                    ${deckCards.length >= MIN_DECK_SIZE && deckCards.length <= MAX_DECK_SIZE && deckName.trim()
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }
                  `}
                >
                  💾 Salvar Deck
                </button>
              </>
            )}
          </div>

          {/* Cartas Disponíveis */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Cartas Disponíveis</h2>

            {/* Filters */}
            <div className="space-y-2 mb-4">
              <select 
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
                className="w-full bg-slate-700 px-3 py-2 rounded-xl text-sm"
              >
                <option value="all">Todos os Tipos</option>
                <option value="pokemon">Pokémon</option>
                <option value="spell">Magias</option>
                <option value="trap">Armadilhas</option>
              </select>

              <select 
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="w-full bg-slate-700 px-3 py-2 rounded-xl text-sm"
              >
                <option value="all">Todos os Elementos</option>
                {Object.values(ElementType).map(type => (
                  <option key={type} value={type}>{getTypeIcon(type)} {type}</option>
                ))}
              </select>
            </div>

            {/* Available Cards */}
            <div className="bg-slate-900/50 rounded-xl p-4 max-h-[600px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {filteredAvailableCards.map(card => {
                  const inDeckCount = deckCards.filter(c => c === card.id).length;
                  const canAdd = inDeckCount < 3 && (isCreatingNew || selectedDeckId);
                  
                  return (
                    <div
                      key={card.id}
                      onClick={() => canAdd && handleAddCard(card.id)}
                      className={`
                        relative p-2 bg-slate-800 rounded-lg border-2 transition-all select-none
                        ${getRarityColor(card.rarity)}
                        ${canAdd ? 'cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed'}
                      `}
                    >
                      <div className="text-2xl text-center">{getTypeIcon(card.type)}</div>
                      <div className="text-xs text-center truncate">{card.name}</div>
                      
                      {inDeckCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs">
                          {inDeckCount}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredAvailableCards.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  Nenhuma carta disponível
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
