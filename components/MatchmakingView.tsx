/**
 * MatchmakingView Component
 * Queue interface for finding PvP matches
 */

import React, { useState, useEffect } from 'react';
import { Card, CustomDeck } from '../types';
import { collectionService } from '../services/collectionService';
import { usePvPGameLogic, PvPConnectionState } from '../hooks/usePvPGameLogic';
import { INITIAL_DECK, SPELL_CARDS, TRAP_CARDS } from '../constants';

interface MatchmakingViewProps {
  onBack: () => void;
  onGameStart: () => void;
}

export const MatchmakingView: React.FC<MatchmakingViewProps> = ({ onBack, onGameStart }) => {
  const {
    connectionState,
    error,
    connect,
    disconnect,
    displayName,
    stats,
    joinQueue,
    leaveQueue,
    queuePosition,
    queueTime,
    opponent,
    gameState,
  } = usePvPGameLogic();

  const [selectedDeck, setSelectedDeck] = useState<CustomDeck | null>(null);
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Load decks on mount
  useEffect(() => {
    const collection = collectionService.getCollection();
    setCustomDecks(collection.customDecks);
    
    // Auto-select the currently selected deck
    if (collection.selectedDeckId) {
      const deck = collection.customDecks.find(d => d.id === collection.selectedDeckId);
      if (deck) setSelectedDeck(deck);
    } else if (collection.customDecks.length > 0) {
      setSelectedDeck(collection.customDecks[0]);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    console.log('[MatchmakingView] Mounting, connecting...');
    connect();
    
    // Don't disconnect on unmount - the connection should persist
    // Only disconnect when explicitly leaving PvP mode
    return () => {
      console.log('[MatchmakingView] Unmounting, NOT disconnecting (connection persists)');
      // We don't disconnect here because:
      // 1. If going to game, we need the connection
      // 2. If going back to menu, the singleton will handle reconnect if needed
    };
  }, []);

  // Redirect to game when match starts
  useEffect(() => {
    if (gameState) {
      onGameStart();
    }
  }, [gameState, onGameStart]);

  const handleStartQueue = () => {
    if (!selectedDeck) return;
    
    // Build full deck from card IDs
    const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];
    const deckCards: Card[] = selectedDeck.cards.map((cardId, index) => {
      const baseCard = allCards.find(c => c.id === cardId);
      if (!baseCard) return null;
      return {
        ...baseCard,
        uniqueId: `${cardId}_${index}_${Date.now()}`,
        hasAttacked: false,
        statusEffects: [],
        statusDuration: [],
      } as Card;
    }).filter((c): c is Card => c !== null);

    if (deckCards.length < 15) {
      alert('Deck precisa ter pelo menos 15 cartas!');
      return;
    }

    joinQueue(deckCards);
  };

  const handleCancelQueue = () => {
    leaveQueue();
  };

  const handleBack = () => {
    if (connectionState === 'in-queue') {
      leaveQueue();
    }
    onBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      localStorage.setItem('battlecard_display_name', tempName.trim());
      setEditingName(false);
    }
  };

  const renderConnectionStatus = () => {
    const statusColors: Record<PvPConnectionState, string> = {
      disconnected: 'bg-red-500',
      connecting: 'bg-yellow-500 animate-pulse',
      connected: 'bg-green-500',
      'in-queue': 'bg-blue-500 animate-pulse',
      'in-game': 'bg-purple-500',
    };

    const statusText: Record<PvPConnectionState, string> = {
      disconnected: 'Desconectado',
      connecting: 'Conectando...',
      connected: 'Conectado',
      'in-queue': 'Na Fila',
      'in-game': 'Em Jogo',
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${statusColors[connectionState]}`} />
        <span className="text-sm text-gray-400">{statusText[connectionState]}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Voltar</span>
          </button>
          {renderConnectionStatus()}
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          ⚔️ PvP Online
        </h1>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* User Info Card */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl">
                🎮
              </div>
              <div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="bg-gray-700 px-3 py-1 rounded text-white"
                      placeholder="Seu nome"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="bg-green-500 px-3 py-1 rounded text-white text-sm"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <h2 
                    className="text-xl font-bold text-white cursor-pointer hover:text-purple-400"
                    onClick={() => {
                      setTempName(displayName || '');
                      setEditingName(true);
                    }}
                  >
                    {displayName || 'Jogador Anônimo'} ✏️
                  </h2>
                )}
                <p className="text-gray-400">Clique para editar nome</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
                <div className="text-xs text-gray-400">Vitórias</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
                <div className="text-xs text-gray-400">Derrotas</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-yellow-400">{stats.currentStreak}</div>
                <div className="text-xs text-gray-400">Sequência</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-400">{stats.elo}</div>
                <div className="text-xs text-gray-400">ELO</div>
              </div>
            </div>
          )}
        </div>

        {/* Deck Selection */}
        {connectionState === 'connected' && (
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Selecionar Deck</h3>
            
            {customDecks.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Nenhum deck criado. Crie um deck no Deck Builder primeiro!
              </p>
            ) : (
              <div className="space-y-2">
                {customDecks.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => setSelectedDeck(deck)}
                    className={`w-full p-4 rounded-lg border transition-all ${
                      selectedDeck?.id === deck.id
                        ? 'bg-purple-500/30 border-purple-500'
                        : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{deck.name}</span>
                      <span className="text-sm text-gray-400">{deck.cards.length} cartas</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Queue Status */}
        {connectionState === 'in-queue' && (
          <div className="bg-gray-800/50 rounded-xl p-8 mb-6 border border-blue-500 text-center">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">Procurando Oponente...</h3>
            <p className="text-gray-400 mb-4">Tempo na fila: {formatTime(queueTime)}</p>
            {queuePosition && (
              <p className="text-sm text-gray-500">Posição na fila: #{queuePosition}</p>
            )}
            
            <button
              onClick={handleCancelQueue}
              className="mt-6 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-bold transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Match Found */}
        {opponent && connectionState === 'in-game' && !gameState && (
          <div className="bg-gray-800/50 rounded-xl p-8 mb-6 border border-green-500 text-center">
            <div className="text-6xl mb-4">⚔️</div>
            <h3 className="text-2xl font-bold text-white mb-4">Oponente Encontrado!</h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                  🎮
                </div>
                <p className="font-bold text-white">{displayName}</p>
              </div>
              <div className="text-3xl text-yellow-400">VS</div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                  👤
                </div>
                <p className="font-bold text-white">{opponent.displayName}</p>
                <p className="text-xs text-gray-400">
                  {opponent.stats.wins}W / {opponent.stats.losses}L • ELO {opponent.stats.elo}
                </p>
              </div>
            </div>
            <p className="text-gray-400 animate-pulse">Iniciando partida...</p>
          </div>
        )}

        {/* Action Buttons */}
        {connectionState === 'connected' && selectedDeck && (
          <button
            onClick={handleStartQueue}
            disabled={!selectedDeck || selectedDeck.cards.length < 15}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 rounded-xl font-bold text-xl transition-all transform hover:scale-[1.02] disabled:cursor-not-allowed"
          >
            🎮 Buscar Partida
          </button>
        )}

        {connectionState === 'disconnected' && (
          <button
            onClick={connect}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-xl transition-all"
          >
            🔌 Conectar ao Servidor
          </button>
        )}

        {connectionState === 'connecting' && (
          <div className="w-full py-4 bg-gray-600 rounded-xl font-bold text-xl text-center">
            Conectando...
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>💡 O primeiro jogador a zerar o HP do oponente vence!</p>
          <p className="mt-1">⏱️ Limite de 90 segundos por turno</p>
        </div>
      </div>
    </div>
  );
};
