/**
 * Shared PvP types - Client side copy
 * Keep in sync with server/src/shared/types.ts
 */

import type { Card, Phase, ElementType, StatusEffect, CardType, Rarity, Ability, SpellEffect, TrapCondition, AbilityTrigger } from '../types';

// Re-export needed types from main types
export type { Card, Phase, ElementType, StatusEffect, CardType, Rarity };

// ==================== PLAYER & GAME STATE ====================

export interface PvPPlayer {
  odhi: string;
  odhnima: string;
  avatar?: string;
  hp: number;
  handCount: number;
  hand: Card[];
  field: Card[];
  deckCount: number;
  graveyard: Card[];
  trapZone: Card[];
}

export interface PvPGameState {
  gameId: string;
  player1: PvPPlayer;
  player2: PvPPlayer;
  currentTurn: 'player1' | 'player2';
  phase: Phase;
  turnNumber: number;
  turnStartedAt: number;
  turnTimeoutSeconds: number;
  gameLog: GameLogEntry[];
  isGameOver: boolean;
  winner?: 'player1' | 'player2' | null;
  endReason?: 'victory' | 'surrender' | 'timeout' | 'disconnect';
}

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'effect' | 'status' | 'ability' | 'spell' | 'trap';
  timestamp: number;
}

// ==================== WEBSOCKET EVENTS ====================

export enum ClientEvent {
  AUTHENTICATE = 'authenticate',
  UPDATE_DISPLAY_NAME = 'update_display_name',
  JOIN_QUEUE = 'join_queue',
  LEAVE_QUEUE = 'leave_queue',
  SUMMON_CARD = 'summon_card',
  ATTACK = 'attack',
  DIRECT_ATTACK = 'direct_attack',
  USE_SPELL = 'use_spell',
  SET_TRAP = 'set_trap',
  END_PHASE = 'end_phase',
  SURRENDER = 'surrender',
  PING = 'ping'
}

export enum ServerEvent {
  AUTH_SUCCESS = 'auth_success',
  AUTH_ERROR = 'auth_error',
  QUEUE_JOINED = 'queue_joined',
  QUEUE_LEFT = 'queue_left',
  MATCH_FOUND = 'match_found',
  GAME_STATE = 'game_state',
  GAME_STARTED = 'game_started',
  TURN_CHANGED = 'turn_changed',
  PHASE_CHANGED = 'phase_changed',
  ACTION_SUCCESS = 'action_success',
  ACTION_REJECTED = 'action_rejected',
  ATTACK_RESOLVED = 'attack_resolved',
  CARD_DESTROYED = 'card_destroyed',
  DAMAGE_DEALT = 'damage_dealt',
  ABILITY_TRIGGERED = 'ability_triggered',
  SPELL_RESOLVED = 'spell_resolved',
  TRAP_ACTIVATED = 'trap_activated',
  STATUS_APPLIED = 'status_applied',
  GAME_OVER = 'game_over',
  OPPONENT_DISCONNECTED = 'opponent_disconnected',
  OPPONENT_RECONNECTED = 'opponent_reconnected',
  PONG = 'pong',
  TURN_TIMER = 'turn_timer',
  ERROR = 'error'
}

// ==================== EVENT PAYLOADS ====================

export interface AuthSuccessPayload {
  odhi: string;
  displayName: string;
  stats: PvPStats;
  reconnectedToGame?: string;
}

export interface MatchFoundPayload {
  gameId: string;
  opponent: {
    displayName: string;
    avatar?: string;
    stats: { wins: number; losses: number; elo: number };
  };
  youAre: 'player1' | 'player2';
  startsFirst: boolean;
}

export interface GameOverPayload {
  winner: 'player1' | 'player2' | null;
  reason: 'victory' | 'surrender' | 'timeout' | 'disconnect';
  finalState: PvPGameState;
  eloChange: number;
  stats: {
    totalTurns: number;
    durationSeconds: number;
    damageDealt: number;
    cardsDestroyed: number;
  };
}

export interface ActionRejectedPayload {
  action: ClientEvent;
  reason: string;
  code: string;
}

export interface AttackResolvedPayload {
  attackerUniqueId: string;
  defenderUniqueId: string;
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
  damageToPlayer1: number;
  damageToPlayer2: number;
  multiplier: number;
}

// ==================== STATS ====================

export interface PvPStats {
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  elo: number;
}
