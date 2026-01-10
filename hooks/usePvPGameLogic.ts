/**
 * usePvPGameLogic Hook
 * Manages PvP game state and actions via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../types';
import { gameSessionService } from '../services/gameSessionService';
import { 
  ServerEvent, 
  PvPGameState, 
  PvPStats,
  MatchFoundPayload,
  GameOverPayload,
  AttackResolvedPayload,
  ActionRejectedPayload,
} from '../services/pvpTypes';
import { soundService } from '../services/soundService';

export type PvPConnectionState = 'disconnected' | 'connecting' | 'connected' | 'in-queue' | 'in-game';

export interface PvPGameResult {
  won: boolean;
  reason: string;
  eloChange: number;
  stats: GameOverPayload['stats'];
}

export function usePvPGameLogic() {
  // Initialize from singleton to avoid loading flash on remount
  const getInitialConnectionState = (): PvPConnectionState => {
    const state = gameSessionService.getConnectionState();
    if (state === 'connected') return 'connected';
    if (state === 'connecting') return 'connecting';
    return 'disconnected';
  };

  // Connection state
  const [connectionState, setConnectionState] = useState<PvPConnectionState>(getInitialConnectionState);
  const [error, setError] = useState<string | null>(null);
  
  // User info
  const [displayName, setDisplayName] = useState<string | null>(gameSessionService.displayName);
  const [stats, setStats] = useState<PvPStats | null>(gameSessionService.stats);
  
  // Matchmaking
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [queueTime, setQueueTime] = useState(0);
  const [opponent, setOpponent] = useState<MatchFoundPayload['opponent'] | null>(null);
  
  // Game state - initialize from singleton if reconnecting
  const [gameState, setGameState] = useState<PvPGameState | null>(gameSessionService.currentGameState);
  const [gameResult, setGameResult] = useState<PvPGameResult | null>(null);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(() => {
    if (gameSessionService.currentGameState) {
      const elapsed = (Date.now() - gameSessionService.currentGameState.turnStartedAt) / 1000;
      return Math.max(0, gameSessionService.currentGameState.turnTimeoutSeconds - elapsed);
    }
    return 90;
  });
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [reconnectTimeout, setReconnectTimeout] = useState(0);
  
  // Selection state (for UI)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedSacrifices, setSelectedSacrifices] = useState<string[]>([]);
  const [attackingCard, setAttackingCard] = useState<Card | null>(null);
  // Last attack payload received from server (used to drive animations)
  const [lastAttack, setLastAttack] = useState<AttackResolvedPayload | null>(null);
  
  // Refs for intervals
  const queueTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== CONNECTION ====================

  const connect = useCallback(async () => {
    setError(null);
    const svcState = gameSessionService.getConnectionState();
    if (svcState === 'connected') {
      setConnectionState('connected');
      return;
    }
    if (svcState === 'connecting') {
      setConnectionState('connecting');
      return;
    }

    setConnectionState('connecting');

    try {
      await gameSessionService.connect();
    } catch (err) {
      setError('Failed to connect to server');
      setConnectionState('disconnected');
    }
  }, []);

  const disconnect = useCallback(() => {
    gameSessionService.disconnect();
    setConnectionState('disconnected');
    setGameState(null);
    setOpponent(null);
  }, []);

  // ==================== MATCHMAKING ====================

  const joinQueue = useCallback((deck: Card[]) => {
    if (connectionState !== 'connected') {
      setError('Not connected to server');
      return;
    }

    gameSessionService.joinQueue(deck);
    setConnectionState('in-queue');
    setQueueTime(0);
    
    // Start queue timer
    queueTimerRef.current = setInterval(() => {
      setQueueTime(t => t + 1);
    }, 1000);
  }, [connectionState]);

  const leaveQueue = useCallback(() => {
    gameSessionService.leaveQueue();
    setConnectionState('connected');
    setQueuePosition(null);
    setQueueTime(0);
    
    if (queueTimerRef.current) {
      clearInterval(queueTimerRef.current);
      queueTimerRef.current = null;
    }
  }, []);

  // ==================== GAME ACTIONS ====================

  const summonCard = useCallback((cardUniqueId: string, sacrificeUniqueIds: string[] = []) => {
    gameSessionService.summonCard(cardUniqueId, sacrificeUniqueIds);
    setSelectedCard(null);
    setSelectedSacrifices([]);
    soundService.playSummon();
  }, []);

  const attack = useCallback((attackerUniqueId: string, defenderUniqueId: string) => {
    gameSessionService.attack(attackerUniqueId, defenderUniqueId);
    setAttackingCard(null);
    soundService.playAttack();
  }, []);

  const directAttack = useCallback((attackerUniqueId: string) => {
    gameSessionService.directAttack(attackerUniqueId);
    setAttackingCard(null);
    soundService.playAttack();
  }, []);

  const useSpell = useCallback((spellUniqueId: string, targetUniqueId?: string) => {
    gameSessionService.useSpell(spellUniqueId, targetUniqueId);
    setSelectedCard(null);
    soundService.playClick();
  }, []);

  const setTrap = useCallback((trapUniqueId: string) => {
    gameSessionService.setTrap(trapUniqueId);
    setSelectedCard(null);
    soundService.playClick();
  }, []);

  const endPhase = useCallback(() => {
    gameSessionService.endPhase();
  }, []);

  const surrender = useCallback(() => {
    if (confirm('Tem certeza que deseja desistir?')) {
      gameSessionService.surrender();
    }
  }, []);

  // ==================== HELPERS ====================

  const isMyTurn = useCallback(() => {
    if (!gameState) return false;
    return gameSessionService.isMyTurn(gameState);
  }, [gameState]);

  const getMyPlayer = useCallback(() => {
    if (!gameState) return null;
    return gameSessionService.getMyPlayer(gameState);
  }, [gameState]);

  const getOpponentPlayer = useCallback(() => {
    if (!gameState) return null;
    return gameSessionService.getOpponentPlayer(gameState);
  }, [gameState]);

  const canSummon = useCallback((card: Card) => {
    if (!gameState || !isMyTurn()) return false;
    if (gameState.phase !== 'MAIN') return false;
    
    const myPlayer = getMyPlayer();
    if (!myPlayer) return false;
    
    // Check field space
    const availableFieldSpace = 3 - myPlayer.field.length;
    const fieldSacrificesNeeded = Math.min(card.sacrificeRequired, myPlayer.field.length);
    const resultingFieldSize = myPlayer.field.length - fieldSacrificesNeeded + 1;
    
    if (resultingFieldSize > 3) return false;
    
    // Check available sacrifices
    const totalSacrifices = myPlayer.hand.length - 1 + myPlayer.field.length;
    return totalSacrifices >= card.sacrificeRequired;
  }, [gameState, isMyTurn, getMyPlayer]);

  const canAttack = useCallback((card: Card) => {
    if (!gameState || !isMyTurn()) return false;
    if (gameState.phase !== 'BATTLE') return false;
    if (gameState.turnNumber === 1) return false;
    if (card.hasAttacked) return false;
    return true;
  }, [gameState, isMyTurn]);

  // ==================== EVENT HANDLERS ====================

  useEffect(() => {
    // Set up event listeners
    const unsubscribers: (() => void)[] = [];

    // Auth success
    unsubscribers.push(
      gameSessionService.on(ServerEvent.AUTH_SUCCESS, (data: unknown) => {
        const auth = data as { displayName: string; stats: PvPStats; reconnectedToGame?: string };
        setDisplayName(auth.displayName);
        setStats(auth.stats);
        
        // If reconnecting to a game, transition to in-game state
        if (auth.reconnectedToGame) {
          console.log('[usePvPGameLogic] Reconnected to game:', auth.reconnectedToGame);
          setConnectionState('in-game');
        } else {
          setConnectionState('connected');
        }
      })
    );

    // Auth error
    unsubscribers.push(
      gameSessionService.on(ServerEvent.AUTH_ERROR, (data: unknown) => {
        const err = data as { message: string };
        setError(err.message);
        setConnectionState('disconnected');
      })
    );

    // Queue joined
    unsubscribers.push(
      gameSessionService.on(ServerEvent.QUEUE_JOINED, (data: unknown) => {
        const queue = data as { position: number };
        setQueuePosition(queue.position);
      })
    );

    // Queue left
    unsubscribers.push(
      gameSessionService.on(ServerEvent.QUEUE_LEFT, () => {
        setConnectionState('connected');
        setQueuePosition(null);
        if (queueTimerRef.current) {
          clearInterval(queueTimerRef.current);
        }
      })
    );

    // Match found
    unsubscribers.push(
      gameSessionService.on(ServerEvent.MATCH_FOUND, (data: unknown) => {
        const match = data as MatchFoundPayload;
        setOpponent(match.opponent);
        setConnectionState('in-game');
        setQueuePosition(null);
        setQueueTime(0);
        setGameResult(null);
        
        if (queueTimerRef.current) {
          clearInterval(queueTimerRef.current);
        }
        
        soundService.playAchievement();
      })
    );

    // Game state update
    unsubscribers.push(
      gameSessionService.on(ServerEvent.GAME_STATE, (data: unknown) => {
        const state = data as PvPGameState;
        setGameState(state);
        
        // Update turn timer
        const elapsed = (Date.now() - state.turnStartedAt) / 1000;
        setTurnTimeRemaining(Math.max(0, state.turnTimeoutSeconds - elapsed));
      })
    );

    // Turn changed
    unsubscribers.push(
      gameSessionService.on(ServerEvent.TURN_CHANGED, () => {
        if (gameSessionService.currentGameState) {
          setTurnTimeRemaining(gameSessionService.currentGameState.turnTimeoutSeconds);
        }
        soundService.playClick();
      })
    );

    // Attack resolved
    unsubscribers.push(
      gameSessionService.on(ServerEvent.ATTACK_RESOLVED, (data: unknown) => {
        const result = data as AttackResolvedPayload;
        if (result.multiplier > 1) {
          soundService.playAttack();
        } else if (result.multiplier < 1) {
          soundService.playDamage();
        }
        if (result.attackerDestroyed || result.defenderDestroyed) {
          soundService.playDestroy();
        }
        // Expose last attack to UI for animations (short lived)
        setLastAttack(result);
        // Clear lastAttack after animation window
        setTimeout(() => setLastAttack(null), 1200);
      })
    );

    // Damage dealt (direct attacks and trap/spell damage to player HP)
    unsubscribers.push(
      gameSessionService.on(ServerEvent.DAMAGE_DEALT, (data: unknown) => {
        const payload = data as { attackerUniqueId: string; damage: number; isDirect?: boolean };

        // Build a minimal AttackResolved-like object so UI code can reuse the same rendering
        let damageToPlayer1 = 0;
        let damageToPlayer2 = 0;

        if (gameSessionService.currentGameState) {
          const state = gameSessionService.currentGameState;
          const p1HasAttacker = state.player1.field.some(c => c.uniqueId === payload.attackerUniqueId);
          const p2HasAttacker = state.player2.field.some(c => c.uniqueId === payload.attackerUniqueId);

          if (p1HasAttacker) {
            damageToPlayer2 = payload.damage;
          } else if (p2HasAttacker) {
            damageToPlayer1 = payload.damage;
          } else {
            // Fallback: assume damage applies to opponent of the attacker based on our role
            if (gameSessionService.playerRole === 'player1') {
              // If we are player1 and we don't find attacker, assume damage was to player2
              damageToPlayer2 = payload.damage;
            } else {
              damageToPlayer1 = payload.damage;
            }
          }
        } else {
          // No game state available - default to damageToPlayer2
          damageToPlayer2 = payload.damage;
        }

        const attackLike = {
          attackerUniqueId: payload.attackerUniqueId,
          defenderUniqueId: null as any,
          attackerDestroyed: false,
          defenderDestroyed: false,
          damageToPlayer1,
          damageToPlayer2,
          multiplier: 1
        } as AttackResolvedPayload;

        if (attackLike.damageToPlayer1 > 0 || attackLike.damageToPlayer2 > 0) {
          soundService.playDamage();
        }

        setLastAttack(attackLike);
        setTimeout(() => setLastAttack(null), 1200);
      })
    );

    // Action rejected
    unsubscribers.push(
      gameSessionService.on(ServerEvent.ACTION_REJECTED, (data: unknown) => {
        const rejected = data as ActionRejectedPayload;
        setError(rejected.reason);
        setTimeout(() => setError(null), 3000);
      })
    );

    // Game over
    unsubscribers.push(
      gameSessionService.on(ServerEvent.GAME_OVER, (data: unknown) => {
        const result = data as GameOverPayload;
        const won = result.winner === gameSessionService.playerRole;
        
        setGameResult({
          won,
          reason: result.reason,
          eloChange: result.eloChange,
          stats: result.stats,
        });
        
        if (turnTimerRef.current) {
          clearInterval(turnTimerRef.current);
        }
        
        if (won) {
          soundService.playVictory();
        } else {
          soundService.playDefeat();
        }
        // Update local PvP stats so UI reflects changes immediately
        try {
          if (stats) {
            const updated: PvPStats = { ...stats };

            // Apply win/loss and streak changes unless server skipped (surrender)
            if (result.reason !== 'surrender') {
              if (won) {
                updated.wins = (updated.wins || 0) + 1;
                updated.currentStreak = (updated.currentStreak || 0) + 1;
                updated.bestStreak = Math.max(updated.bestStreak || 0, updated.currentStreak);
              } else {
                updated.losses = (updated.losses || 0) + 1;
                updated.currentStreak = 0;
              }
            }

            // Apply ELO delta sent by server (server sends per-player delta)
            updated.elo = (updated.elo || 0) + (result.eloChange || 0);

            setStats(updated);
            // Keep singleton in sync so other mounts read new stats
            (gameSessionService as any).stats = updated;
          }
        } catch (e) {
          console.warn('[usePvPGameLogic] Failed to update local stats on GAME_OVER', e);
        }
      })
    );

    // Opponent disconnected
    unsubscribers.push(
      gameSessionService.on(ServerEvent.OPPONENT_DISCONNECTED, (data: unknown) => {
        const { reconnectTimeoutSeconds } = data as { reconnectTimeoutSeconds: number };
        setOpponentDisconnected(true);
        setReconnectTimeout(reconnectTimeoutSeconds);
        
        // Start countdown
        reconnectTimerRef.current = setInterval(() => {
          setReconnectTimeout(t => {
            if (t <= 1) {
              if (reconnectTimerRef.current) {
                clearInterval(reconnectTimerRef.current);
              }
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      })
    );

    // Opponent reconnected
    unsubscribers.push(
      gameSessionService.on(ServerEvent.OPPONENT_RECONNECTED, () => {
        setOpponentDisconnected(false);
        if (reconnectTimerRef.current) {
          clearInterval(reconnectTimerRef.current);
        }
      })
    );

    // Error
    unsubscribers.push(
      gameSessionService.on(ServerEvent.ERROR, (data: unknown) => {
        const err = data as { message: string };
        setError(err.message);
      })
    );

    // Turn timer
    turnTimerRef.current = setInterval(() => {
      setTurnTimeRemaining(t => Math.max(0, t - 1));
    }, 1000);

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
      if (turnTimerRef.current) clearInterval(turnTimerRef.current);
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
    };
  }, []);

  return {
    // Connection
    connectionState,
    error,
    connect,
    disconnect,
    
    // User
    displayName,
    stats,
    
    // Matchmaking
    joinQueue,
    leaveQueue,
    queuePosition,
    queueTime,
    opponent,
    
    // Game state
    gameState,
    gameResult,
    turnTimeRemaining,
    opponentDisconnected,
    reconnectTimeout,
    
    // Selection
    selectedCard,
    setSelectedCard,
    selectedSacrifices,
    setSelectedSacrifices,
    attackingCard,
    setAttackingCard,
    lastAttack,
    
    // Actions
    summonCard,
    attack,
    directAttack,
    useSpell,
    setTrap,
    endPhase,
    surrender,
    
    // Helpers
    isMyTurn,
    getMyPlayer,
    getOpponentPlayer,
    canSummon,
    canAttack,
    // Player role for damage calculations
    getPlayerRole: () => gameSessionService.playerRole,
  };
}
