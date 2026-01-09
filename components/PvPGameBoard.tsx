/**
 * PvPGameBoard Component
 * Real-time multiplayer game board
 */

import React, { useState, useEffect, useRef } from 'react';
import { usePvPGameLogic } from '../hooks/usePvPGameLogic';
import { Card, Phase, CardType } from '../types';
import { CardComponent } from './CardComponent';
import { BattleLog } from './BattleLog';

interface PvPGameBoardProps {
  onGameEnd: () => void;
}

export const PvPGameBoard: React.FC<PvPGameBoardProps> = ({ onGameEnd }) => {
  const {
    gameState,
    gameResult,
    turnTimeRemaining,
    opponentDisconnected,
    reconnectTimeout,
    selectedCard,
    setSelectedCard,
    selectedSacrifices,
    setSelectedSacrifices,
    attackingCard,
    setAttackingCard,
    summonCard,
    attack,
    directAttack,
    useSpell,
    setTrap,
    endPhase,
    surrender,
    isMyTurn,
    getMyPlayer,
    getOpponentPlayer,
    canSummon,
    canAttack,
  } = usePvPGameLogic();

  const [showBattleLog, setShowBattleLog] = useState(false);
  const [targetingMode, setTargetingMode] = useState<'attack' | 'spell' | null>(null);
  
  const myPlayer = getMyPlayer();
  const opponentPlayer = getOpponentPlayer();

  // Format turn timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (turnTimeRemaining <= 15) return 'text-red-500 animate-pulse';
    if (turnTimeRemaining <= 30) return 'text-yellow-500';
    return 'text-white';
  };

  // Handle card click in hand
  const handleHandCardClick = (card: Card) => {
    if (!isMyTurn() || !gameState || gameState.phase !== 'MAIN') return;
    
    if (card.cardType === CardType.POKEMON) {
      if (selectedCard?.uniqueId === card.uniqueId) {
        // Deselect
        setSelectedCard(null);
        setSelectedSacrifices([]);
      } else {
        setSelectedCard(card);
        setSelectedSacrifices([]);
      }
    } else if (card.cardType === CardType.SPELL) {
      // Check if spell needs target
      if (card.spellEffect?.target === 'SINGLE_ENEMY' || card.spellEffect?.target === 'SINGLE_ALLY') {
        setSelectedCard(card);
        setTargetingMode('spell');
      } else {
        // Use immediately
        useSpell(card.uniqueId);
      }
    } else if (card.cardType === CardType.TRAP) {
      setTrap(card.uniqueId);
    }
  };

  // Handle sacrifice selection
  const handleSacrificeClick = (card: Card) => {
    if (!selectedCard || card.uniqueId === selectedCard.uniqueId) return;
    
    const isSelected = selectedSacrifices.includes(card.uniqueId);
    if (isSelected) {
      setSelectedSacrifices(prev => prev.filter(id => id !== card.uniqueId));
    } else if (selectedSacrifices.length < selectedCard.sacrificeRequired) {
      setSelectedSacrifices(prev => [...prev, card.uniqueId]);
    }
  };

  // Handle summon
  const handleSummon = () => {
    if (!selectedCard) return;
    if (selectedSacrifices.length !== selectedCard.sacrificeRequired) return;
    
    summonCard(selectedCard.uniqueId, selectedSacrifices);
  };

  // Handle field card click for attack or spell targeting
  const handleMyFieldCardClick = (card: Card) => {
    if (!isMyTurn() || !gameState) return;
    
    // Allow selecting own field cards as sacrifices when summoning in MAIN phase
    if (selectedCard && selectedCard.cardType === CardType.POKEMON && gameState.phase === 'MAIN' && selectedCard.sacrificeRequired > 0) {
      handleSacrificeClick(card);
      return;
    }

    // If in spell targeting mode for SINGLE_ALLY spells
    if (targetingMode === 'spell' && selectedCard) {
      useSpell(selectedCard.uniqueId, card.uniqueId);
      setSelectedCard(null);
      setTargetingMode(null);
      return;
    }
    
    // If in battle phase, allow attack
    if (gameState.phase === 'BATTLE') {
      if (canAttack(card)) {
        setAttackingCard(card);
        setTargetingMode('attack');
      }
    }
  };

  // Handle opponent field card click (for attack target)
  const handleOpponentFieldCardClick = (card: Card) => {
    if (!targetingMode) return;
    
    if (targetingMode === 'attack' && attackingCard) {
      attack(attackingCard.uniqueId, card.uniqueId);
      setAttackingCard(null);
      setTargetingMode(null);
    } else if (targetingMode === 'spell' && selectedCard) {
      useSpell(selectedCard.uniqueId, card.uniqueId);
      setSelectedCard(null);
      setTargetingMode(null);
    }
  };

  // Handle direct attack
  const handleDirectAttack = () => {
    if (!attackingCard) return;
    directAttack(attackingCard.uniqueId);
    setAttackingCard(null);
    setTargetingMode(null);
  };

  // Cancel targeting
  const cancelTargeting = () => {
    setTargetingMode(null);
    setAttackingCard(null);
    setSelectedCard(null);
  };

  // Render game over modal
  if (gameResult) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">
            {gameResult.won ? '🏆' : '💀'}
          </div>
          <h2 className={`text-3xl font-bold mb-4 ${gameResult.won ? 'text-green-400' : 'text-red-400'}`}>
            {gameResult.won ? 'VITÓRIA!' : 'DERROTA'}
          </h2>
          <p className="text-gray-400 mb-6">
            {gameResult.reason === 'surrender' && 'Oponente desistiu'}
            {gameResult.reason === 'timeout' && 'Tempo esgotado'}
            {gameResult.reason === 'disconnect' && 'Oponente desconectou'}
            {gameResult.reason === 'victory' && (gameResult.won ? 'Você venceu a batalha!' : 'Você foi derrotado')}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xl font-bold text-white">{gameResult.stats.totalTurns}</div>
              <div className="text-xs text-gray-400">Turnos</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xl font-bold text-white">
                {Math.floor(gameResult.stats.durationSeconds / 60)}:{(gameResult.stats.durationSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-400">Duração</div>
            </div>
          </div>
          
          <div className={`text-lg font-bold mb-6 ${gameResult.eloChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ELO: {gameResult.eloChange >= 0 ? '+' : ''}{gameResult.eloChange}
          </div>
          
          <button
            onClick={onGameEnd}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    );
  }

  if (!gameState || !myPlayer || !opponentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-400 animate-pulse">Carregando jogo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Opponent Disconnected Overlay */}
      {opponentDisconnected && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Oponente Desconectou</h3>
            <p className="text-gray-400 mb-4">
              Aguardando reconexão... {reconnectTimeout}s
            </p>
            <div className="w-48 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${(reconnectTimeout / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Targeting Mode Overlay: allow clicks to pass through to board (pointer-events-none),
          but keep the small control clickable (pointer-events-auto) so Cancel works. */}
      {targetingMode && (
        <div className="absolute inset-0 bg-black/30 z-[10] pointer-events-none">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 px-4 py-2 rounded-lg pointer-events-auto">
            {targetingMode === 'attack' ? 'Selecione um alvo para atacar' : 'Selecione um alvo para a magia'}
            <button className="ml-4 text-red-300 hover:text-red-100" onClick={cancelTargeting}>
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* HUD Superior */}
      <header className="flex flex-wrap justify-around items-center p-2 bg-slate-800/95 border-b-4 border-white/5 z-30 shadow-2xl gap-2 md:gap-6">

        {/* My Info */}
        <div className="flex items-center gap-2 md:gap-2 flex-1 md:flex-none">
          <div className="w-12 md:w-20 h-12 md:h-20 bg-blue-600 rounded-3xl border-4 border-white flex items-center justify-center text-2xl md:text-5xl shadow-lg flex-shrink-0">{myPlayer?.avatar || '👤'}</div>
          <div className="flex flex-col">
            <div className="font-black text-xs sm:text-lg drop-shadow-md">{myPlayer.odhnima || 'Player'}</div>
            <div className="relative">
              <div className="w-32 md:w-80 h-5 md:h-7 bg-black rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700" style={{width: `${(myPlayer.hp/8000)*100}%`}}></div>
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-xs md:text-lg font-black drop-shadow-md">{myPlayer.hp} LP</span>
              {/* {floatingDamage?.targetId === 'player-hp' && <div className="damage-popup left-0 top-0 text-3xl md:text-5xl">-{floatingDamage.value}</div>} */}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-400">🎴 {myPlayer.deckCount}</div>
            </div>
          </div>
        </div>
        
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 mt-2">
          <div className="text-center bg-black/30 px-2 md:px-5 py-[2px] sm:py-2 rounded-b-lg sm:rounded-b-3xl border-b-2 border-x-2 border-white/10 shadow-2xl flex gap-x-1">
            <div className="text-[10px] sm:text-base lg:text-xl font-bold text-yellow-500 tracking-tighter">TURNO {gameState.turnNumber} -</div>
            <div className={`text-[10px] sm:text-base lg:text-xl font-bold uppercase tracking-widest ${isMyTurn() ? 'text-blue-400 animate-pulse' : 'text-red-400'}`}>
              {isMyTurn() ? 'SEU TURNO' : 'OPONENTE'}
            </div>
          </div>
        </div>
      
        {/* Opponent Info */}
        <div className="flex items-center gap-2 md:gap-2 flex-1 md:flex-none flex-row-reverse">
          <div className="w-12 md:w-20 h-12 md:h-20 bg-red-600 rounded-3xl border-4 border-white flex items-center justify-center text-2xl md:text-5xl shadow-lg flex-shrink-0">{opponentPlayer?.avatar || '👤'}</div>
          <div className="flex flex-col items-end">
            <div className="font-black text-xs sm:text-lg drop-shadow-md">{opponentPlayer.odhnima || 'Player'}</div>
            <div className="relative">
              <div className="w-32 md:w-80 h-5 md:h-7 bg-black rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700" style={{width: `${(opponentPlayer.hp/8000)*100}%`}}></div>
              </div>
              <span className="absolute inset-0 flex items-center justify-center text-xs md:text-lg font-black drop-shadow-md">{opponentPlayer.hp} LP</span>
              {/* {floatingDamage?.targetId === 'player-hp' && <div className="damage-popup left-0 top-0 text-3xl md:text-5xl">-{floatingDamage.value}</div>} */}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-400">🃏 {opponentPlayer.handCount}</div>
              <div className="text-sm text-gray-400">🎴 {opponentPlayer.deckCount}</div>
            </div>
          </div>
        </div>

      </header>

      

      {/* Game Area */}
      <main className="flex-1 flex flex-col justify-center gap-y-10 gap-x-20 relative px-4 sm:px-4 py-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
        {/* Opponent Field */}
        <div className="relative z-[11]">
          <div className="flex justify-center gap-3 min-h-[140px]">
            {opponentPlayer.field.length === 0 ? (
              <div 
                className={`w-24 h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-600 cursor-pointer ${
                  targetingMode === 'attack' ? 'border-red-500 bg-red-500/10 hover:bg-red-500/20' : ''
                }`}
                onClick={targetingMode === 'attack' ? handleDirectAttack : undefined}
              >
                {targetingMode === 'attack' ? '⚔️ Ataque Direto' : 'Vazio'}
              </div>
            ) : (
              opponentPlayer.field.map(card => (
                <div 
                  key={card.uniqueId}
                  className={`cursor-pointer transition-transform ${
                    targetingMode ? 'hover:scale-110 ring-2 ring-red-500' : ''
                  }`}
                  onClick={() => targetingMode && handleOpponentFieldCardClick(card)}
                >
                  <CardComponent 
                    card={card} 
                    size="small" 
                    hasStatusEffects={card.statusEffects?.some(s => s !== 'NONE')}
                  />
                </div>
              ))
            )}
          </div>

          {/* Opponent Trap Zone */}
          {opponentPlayer.trapZone.length > 0 && (
            <div className={`absolute -bottom-14 sm:bottom-0 -right-8 sm:-right-3 flex gap-3 z-10 scale-50 sm:scale-75`}>
              {opponentPlayer.trapZone.map(trap => (
                <div key={trap.uniqueId}>
                  <CardComponent card={trap} compact faceDown />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Turn & Phase Indicator */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 text-xs sm:text-base">
          <div className="bg-gray-700 px-4 py-2 rounded-lg">
            Fase: {gameState.phase}
          </div>
          <div className={`px-4 py-2 rounded-lg bg-gray-700 ${getTimerColor()}`}>
            ⏱️ {formatTimer(turnTimeRemaining)}
          </div>
        </div>

        {/* My Field */}
        <div className="relative z-[11]">
          <div className="flex justify-center gap-3 min-h-[140px]">
            {myPlayer.field.length === 0 ? (
              <div className="w-24 h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center text-gray-600">
                Vazio
              </div>
            ) : (
              myPlayer.field.map(card => (
                <div 
                    key={card.uniqueId} 
                    className={`cursor-pointer transition-all
                      ${attackingCard?.uniqueId === card.uniqueId ? 'scale-105 ring-0 ring-yellow-500' : ''}
                      ${canAttack(card) && !attackingCard ? 'hover:ring-2 hover:ring-green-500' : ''}
                      ${selectedSacrifices.includes(card.uniqueId) ? 'ring-2 ring-red-500 opacity-70' : ''}`}
                    onClick={() => handleMyFieldCardClick(card)}
                  >
                  <CardComponent 
                    card={card} 
                    size="small" 
                    showAttacked={card.hasAttacked}
                    canAttack={canAttack(card) && !attackingCard}
                    isActive={attackingCard?.uniqueId === card.uniqueId}
                    hasStatusEffects={card.statusEffects?.some(s => s !== 'NONE')}
                  />
                </div>
              ))
            )}
          </div>

          {/* My Trap Zone (compact corner, outside the field like PvE) */}
          {myPlayer.trapZone.length > 0 && (
            <div className={`absolute -bottom-14 sm:bottom-0 -right-8 sm:-right-3 flex gap-3 z-10 scale-50 sm:scale-75`}>
              {myPlayer.trapZone.map(trap => (
                <div key={trap.uniqueId}>
                  <CardComponent card={trap} compact />
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Bottom Bar - My Info & Hand */}
      <div className="bg-slate-900 p-2 sm:p-5 border-t-8 border-white/5 shadow-[0_-30px_60px_rgba(0,0,0,0.6)] min-h-[266px]">
        {/* My Hand */}
        <div className="flex justify-start sm:justify-center gap-2 overflow-x-auto pb-2">
          {myPlayer.hand.map(card => (
            <div 
              key={card.uniqueId}
              className={`cursor-pointer transition-all flex-shrink-0 ${
                selectedCard?.uniqueId === card.uniqueId 
                  ? 'scale-110 ring-2 ring-yellow-500 -translate-y-2' 
                  : 'hover:scale-105 hover:-translate-y-1'
              } ${
                selectedSacrifices.includes(card.uniqueId) 
                  ? 'ring-2 ring-red-500 opacity-70' 
                  : ''
              }`}
              onClick={() => {
                if (selectedCard && card.uniqueId !== selectedCard.uniqueId && card.cardType === CardType.POKEMON) {
                  handleSacrificeClick(card);
                } else {
                  handleHandCardClick(card);
                }
              }}
            >
              <CardComponent 
                card={card} 
                size="small" 
                isActive={selectedCard?.uniqueId === card.uniqueId}
                hasStatusEffects={card.statusEffects?.some(s => s !== 'NONE')}
              />
            </div>
          ))}
        </div>

        {/* Summon Button */}
        {selectedCard && selectedCard.cardType === CardType.POKEMON && (
          <div className="flex justify-center gap-4 mt-3">
            {selectedCard.sacrificeRequired > 0 && (
              <span className="text-gray-400 self-center">
                Sacrifícios: {selectedSacrifices.length}/{selectedCard.sacrificeRequired}
              </span>
            )}
            <button
              onClick={handleSummon}
              disabled={selectedSacrifices.length !== selectedCard.sacrificeRequired}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-emerald-600 transition-all"
            >
              Invocar {selectedCard.name}
            </button>
            <button
              onClick={() => {
                setSelectedCard(null);
                setSelectedSacrifices([]);
              }}
              className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-all"
            >
              Cancelar
            </button>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-3">
          {/* Phase Controls */}
            {isMyTurn() && !selectedCard && !targetingMode && gameState.phase === 'MAIN' && (
              <button
                onClick={endPhase}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all"
              >
                ⚔️ Ir para Batalha
              </button>
            )}
            {isMyTurn() && !selectedCard && !targetingMode && gameState.phase === 'BATTLE' && (
              <button
                onClick={endPhase}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg font-bold hover:from-blue-600 hover:to-indigo-600 transition-all"
              >
                ➡️ Encerrar Turno
              </button>
            )}
            {/* Surrender button available even when it's opponent's turn */}
            {!targetingMode && !selectedCard && (
              <button
                onClick={surrender}
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-all"
              >
                🏳️ Desistir
              </button>
            )}
            {!targetingMode && !selectedCard && (
              <button
                onClick={() => setShowBattleLog(!showBattleLog)}
                className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-all"
              >
                📜 Log
              </button>
            )}
        </div>
      </div>

      {/* Battle Log (uses shared BattleLog component) */}
      <BattleLog
        logs={[...gameState.gameLog].reverse()}
        isOpen={showBattleLog}
        onToggle={() => setShowBattleLog(v => !v)}
      />
    </div>
  );
};
