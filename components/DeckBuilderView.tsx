import React, { useState, useEffect } from 'react';
import { Card, CardType, Rarity, ElementType } from '../types';
import { collectionService } from '../services/collectionService';
import { campaignService } from '../services/campaignService';
import { INITIAL_DECK, SPELL_CARDS, TRAP_CARDS, MIN_DECK_SIZE, MAX_DECK_SIZE } from '../constants';
import { soundService } from '../services/soundService';
import Tooltip from './Tooltip';

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
    case ElementType.GHOST: return '👻';
    case ElementType.PSYCHIC: return '🔮';
    case ElementType.FIGHTING: return '🥊';
    case ElementType.GROUND: return '🏜️';
    case ElementType.BUG: return '🐛';
    case ElementType.POISON: return '☠️';
    case ElementType.DRAGON: return '🐉';
    default: return '⚪';
  }
};

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

export const DeckBuilderView: React.FC<DeckBuilderViewProps> = ({ onBack, onClose }) => {
  const handleClose = onClose || onBack || (() => {});
  
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<string[]>([]);
  const [deckName, setDeckName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pokemon' | 'spell' | 'trap'>('all');
  const [typeFilter, setTypeFilter] = useState<ElementType | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [abilityOnly, setAbilityOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'none'|'atk'|'def'|'star'>('none');
  const [bossEditMode, setBossEditMode] = useState(false);
  const [bosses, setBosses] = useState<any[]>([]);
  const [editingBossId, setEditingBossId] = useState<string | null>(null);

  useEffect(() => {
    if (filter === 'spell' || filter === 'trap') {
      setSortBy('none');
      setAbilityOnly(false);
    }
  }, [filter]);

  const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];
  const customDecks = collectionService.getCustomDecks();
  useEffect(() => {
    try {
      const bs = campaignService.getBosses();
      setBosses(bs || []);
    } catch (e) {
      setBosses([]);
    }
  }, []);
  
  const filteredAvailableCards = allCards.filter(card => {
    if (!collectionService.hasCard(card.id)) return false;
    if (filter === 'pokemon' && card.cardType !== CardType.POKEMON) return false;
    if (filter === 'spell' && card.cardType !== CardType.SPELL) return false;
    if (filter === 'trap' && card.cardType !== CardType.TRAP) return false;
    if (typeFilter !== 'all' && card.type !== typeFilter) return false;
    if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
    if (abilityOnly && !card.ability) return false;
    return true;
  });

  const sortedAvailableCards = filteredAvailableCards.slice().sort((a, b) => {
    if (sortBy === 'atk') return (b.attack || 0) - (a.attack || 0);
    if (sortBy === 'def') return (b.defense || 0) - (a.defense || 0);
    if (sortBy === 'star') return (b.level || 0) - (a.level || 0);
    return 0;
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

    if (bossEditMode && editingBossId) {
      // In boss edit mode we don't persist changes to campaign file here.
      // The user can copy the resulting array with the copy button.
      soundService.playAchievement();
    } else {
      if (selectedDeckId) {
        collectionService.updateDeck(selectedDeckId, deckName, deckCards);
      } else {
        const newDeck = collectionService.createDeck(deckName, deckCards);
        // If there is no selected deck persisted yet, mark this new deck as selected
        if (!collectionService.getSelectedDeckId()) {
          collectionService.setSelectedDeckId(newDeck.id);
          setSelectedDeckId(newDeck.id);
        }
      }
    }

    soundService.playAchievement();
    setIsCreatingNew(false);
    setSelectedDeckId(null);
    setDeckCards([]);
    setDeckName('');
  };

  const handleLoadBossDeck = (bossId: string) => {
    const boss = bosses.find(b => b.id === bossId);
    if (!boss) return;
    soundService.playClick();
    setEditingBossId(bossId);
    setIsCreatingNew(true);
    setSelectedDeckId(null);
    setDeckCards([...boss.deck]);
    setDeckName(`Boss: ${boss.name}`);
  };

  const handleCopyArray = async () => {
    const arrString = `[${deckCards.map(c => `'${c}'`).join(', ')}]`;
    try {
      await navigator.clipboard.writeText(arrString);
      soundService.playAchievement();
      alert('Array copiado para a área de transferência!');
    } catch (e) {
      // fallback
      prompt('Copiar este array e cole no código:', arrString);
    }
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
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto sm:overflow-hidden select-none">
      <div className="p-8 h-full flex flex-col min-h-0">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-yellow-500">🔧 Deck Builder</h1>
            <p className="text-sm sm:text-base text-slate-400">Crie e edite seus decks personalizados</p>
          </div>
          <button 
            onClick={handleClose}
            className="bg-slate-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-slate-600"
          >
            ✕ <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        <div className="sm:grid sm:grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 space-y-4 sm:space-y-0">
          {/* Decks Salvos */}
          <div className="bg-slate-800 p-6 rounded-2xl flex flex-col h-full max-h-[50vh] lg:max-h-none min-h-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-y-1 sm:gap-y-0">
              <div>
                <h2 className="text-xl font-bold">
                  {bossEditMode ? 'Decks dos Bosses' : 'Meus Decks'}
                  <span className="ml-2 text-sm text-slate-400">({bossEditMode ? bosses.length : customDecks.length})</span>
                </h2>
                <div className="text-sm text-slate-400">{bossEditMode ? 'Selecione um boss para editar o deck' : 'Gerencie decks salvos e decks de bosses'}</div>
              </div>
              <div className="flex items-center gap-3 self-end">
                {!bossEditMode && (
                  <button
                    onClick={handleCreateNewDeck}
                    className="bg-green-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-500"
                  >
                    + Novo
                  </button>
                )}
                <button
                  onClick={() => {
                    const willEnable = !bossEditMode;
                    // when toggling mode (entering or exiting), clear any current deck selection/editor state
                    setBossEditMode(willEnable);
                    setEditingBossId(null);
                    setIsCreatingNew(false);
                    setSelectedDeckId(null);
                    setDeckCards([]);
                    setDeckName('');
                  }}
                  className={`px-4 py-2 rounded-xl font-bold text-sm ${bossEditMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {bossEditMode ? '✖ Sair do Modo Boss' : '✏️ Boss Decks'}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 overflow-y-auto flex-1 space-y-3 min-h-0">
              {bossEditMode ? (
                <>
                  <div className="text-xs text-slate-400 mt-2">Ao selecionar, o deck do boss será carregado no editor. Use "Copiar Array" para exportar.</div>

                  {bosses.map(b => (
                    <div 
                      key={b.id}
                      className={`
                        p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${editingBossId === b.id 
                          ? 'bg-yellow-900/30 border-yellow-500' 
                          : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                        }
                      `}
                      onClick={() => handleLoadBossDeck(b.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold flex items-center gap-2">
                            <span className="text-2xl">{b.avatar || '🎯'}</span>
                            <span>{b.name}</span>
                          </div>
                          <div className="text-sm text-slate-400">{(b.deck || []).length} cartas</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {bosses.length === 0 && (
                    <div className="text-center text-slate-500 py-8">Nenhum boss disponível</div>
                  )}
                </>
              ) : (
                <>
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
                          <div className="font-bold flex items-center gap-2">
                            {deck.name}
                            {customDecks[0]?.id === deck.id && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500 text-xs text-black font-bold">Padrão</span>
                            )}
                          </div>
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
                </>
              )}
            </div>
          </div>

          {/* Deck Atual */}
          <div className={`bg-slate-800 p-6 rounded-2xl flex flex-col max-h-screen sm:max-h-[50vh] lg:max-h-none min-h-0 ${(isCreatingNew || selectedDeckId) ? '' : 'hidden'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isCreatingNew || selectedDeckId ? 'Editando Deck' : 'Selecione um deck'}
              </h2>
              {(isCreatingNew || selectedDeckId) && (
                bossEditMode && editingBossId ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-slate-400 max-w-40">Copie o array pronto para colar no código do jogo</div>
                    <button
                      onClick={handleCopyArray}
                      className={`px-4 py-2 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500`}
                    >
                      📋 Copiar Array
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveDeck}
                    disabled={deckCards.length < MIN_DECK_SIZE || deckCards.length > MAX_DECK_SIZE || !deckName.trim()}
                    className={`
                      px-4 py-2 rounded-xl font-bold text-sm transition-all
                      ${deckCards.length >= MIN_DECK_SIZE && deckCards.length <= MAX_DECK_SIZE && deckName.trim()
                        ? 'bg-green-600 hover:bg-green-500'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }
                    `}
                  >
                    💾 Salvar
                  </button>
                )
              )}
            </div>
            {(isCreatingNew || selectedDeckId) && (
              <div className="flex flex-col flex-1 min-h-0">
                <input
                  type="text"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  placeholder="Nome do deck..."
                  className="w-full bg-slate-700 px-4 py-1 sm:py-3 rounded-xl mb-4 font-bold text-lg"
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
                <div className="bg-slate-900/50 rounded-xl p-4 overflow-y-auto flex-1 min-h-0">
                  {deckCards.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      Adicione cartas ao deck
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                            className={`p-3 rounded-xl border-2 transition-all relative cursor-pointer ${getRarityColor(card.rarity)}`}
                          >
                            {count > 1 && (
                              <div className="absolute -top-2 -right-2 bg-yellow-500 text-black w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">
                                {count}
                              </div>
                            )}

                            <div className="text-2xl mb-1 text-center">{getTypeIcon(card.type)}</div>
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

                            <div className="text-center mt-2">
                              {Array.from({ length: card.level }).map((_, i) => (
                                <span key={i} className="text-yellow-400 text-xs">★</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cartas Disponíveis */}
          <div className={`bg-slate-800 p-6 rounded-2xl flex flex-col max-h-screen sm:max-h-[50vh] lg:max-h-none min-h-0 ${(isCreatingNew || selectedDeckId) ? '' : 'col-span-2'}`}>
            <h2 className="text-xl font-bold mb-4">
              Cartas Disponíveis
              <span className="ml-2 text-sm text-slate-400">
                ({sortedAvailableCards.length})
              </span>
            </h2>

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

              <select 
                value={rarityFilter}
                onChange={e => setRarityFilter(e.target.value as any)}
                className="w-full bg-slate-700 px-3 py-2 rounded-xl text-sm"
              >
                <option value="all">Todas as Raridades</option>
                {Object.values(Rarity).map(r => (
                  <option key={r} value={r}>{getRarityLabel(r)}</option>
                ))}
              </select>

              {filter !== 'spell' && filter !== 'trap' && (
                <>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full bg-slate-700 px-3 py-2 rounded-xl text-sm"
                  >
                    <option value="none">Ordenar (Nenhum)</option>
                    <option value="atk">Ordenar por Ataque</option>
                    <option value="def">Ordenar por Defesa</option>
                    <option value="star">Ordenar por Estrelas</option>
                  </select>

                  <label className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={abilityOnly}
                      onChange={e => setAbilityOnly(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm text-slate-400">Somente com habilidade</span>
                  </label>
                </>
              )}
            </div>

            {/* Available Cards */}
              <div className="bg-slate-900/50 rounded-xl p-4 overflow-y-auto flex-1 min-h-0">
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${(isCreatingNew || selectedDeckId) ? '' : 'sm:grid-cols-4'}`}>
                {sortedAvailableCards.map(card => {
                  const inDeckCount = deckCards.filter(c => c === card.id).length;
                  const canAdd = inDeckCount < 3 && (isCreatingNew || selectedDeckId);
                  
                  return (
                    <div
                      key={card.id}
                      onClick={() => canAdd && handleAddCard(card.id)}
                      className={`p-3 rounded-xl border-2 transition-all relative ${getRarityColor(card.rarity)} ${canAdd ? 'cursor-pointer hover:scale-105' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      {inDeckCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-sm">
                          {inDeckCount}
                        </div>
                      )}

                      <div className="text-2xl mb-1 text-center">{getTypeIcon(card.type)}</div>
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

              {sortedAvailableCards.length === 0 && (
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
