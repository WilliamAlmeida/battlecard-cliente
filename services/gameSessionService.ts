/**
 * PvP Game Session Service
 * Manages WebSocket connection to the PvP server
 */

import { Card } from '../types';
import {
  ClientEvent,
  ServerEvent,
  PvPGameState,
  PvPStats,
  AuthSuccessPayload,
  MatchFoundPayload,
  GameOverPayload,
  ActionRejectedPayload,
  AttackResolvedPayload,
} from './pvpTypes';

// Server URL - change for production
declare const __VITE_WS_URL__: string | undefined;
const WS_URL = (typeof __VITE_WS_URL__ !== 'undefined' ? __VITE_WS_URL__ : null) 
  || (globalThis as Record<string, unknown>).VITE_WS_URL as string | undefined
  || 'ws://localhost:3001/ws';

type EventCallback<T = unknown> = (data: T) => void;

class GameSessionService {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<ServerEvent, Set<EventCallback>> = new Map();
  private pendingAuth = false;
  private isConnected = false;

  // Current session state
  odhi: string | null = null;
  displayName: string | null = null;
  stats: PvPStats | null = null;
  gameId: string | null = null;
  playerRole: 'player1' | 'player2' | null = null;

  constructor() {
    // Get or create sessionId
    const stored = localStorage.getItem('battlecard_session_id');
    if (stored) {
      this.sessionId = stored;
    } else {
      this.sessionId = crypto.randomUUID();
      localStorage.setItem('battlecard_session_id', this.sessionId);
    }
  }

  // ==================== CONNECTION ====================

  private connectPromise: Promise<void> | null = null;

  connect(): Promise<void> {
    // If already connected, return immediately
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[PvP] Already connected');
      return Promise.resolve();
    }

    // If currently connecting, return the existing promise
    if (this.ws?.readyState === WebSocket.CONNECTING && this.connectPromise) {
      console.log('[PvP] Connection already in progress');
      return this.connectPromise;
    }

    console.log('[PvP] Connecting to server...', WS_URL);

    this.connectPromise = new Promise((resolve, reject) => {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('[PvP] Connected! ReadyState:', this.ws?.readyState);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.connectPromise = null;
        this.authenticate();
        resolve();
      };

      this.ws.onclose = (event) => {
        console.log('[PvP] Disconnected - Code:', event.code, 'Reason:', event.reason, 'WasClean:', event.wasClean);
        console.log('[PvP] Close event details:', { 
          code: event.code, 
          reason: event.reason || '(empty)',
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        });
        console.trace('[PvP] Close trace');
        this.isConnected = false;
        this.emit(ServerEvent.ERROR, { code: 'DISCONNECTED', message: 'Connection closed' });
        
        // Only reconnect if it wasn't a clean close initiated by us
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[PvP] WebSocket error:', error);
        console.log('[PvP] Error ReadyState:', this.ws?.readyState);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        console.log('[PvP] Message received:', event.data.substring(0, 100));
        this.handleMessage(event.data);
      };
    });

    return this.connectPromise;
  }

  disconnect(): void {
    console.log('[PvP] Disconnect called explicitly');
    console.trace('[PvP] Disconnect trace');
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[PvP] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[PvP] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private authenticate(): void {
    if (this.pendingAuth) return;
    this.pendingAuth = true;

    this.send(ClientEvent.AUTHENTICATE, {
      sessionId: this.sessionId,
      displayName: localStorage.getItem('battlecard_display_name'),
      avatar: localStorage.getItem('battlecard_avatar'),
    });
  }

  // ==================== MESSAGE HANDLING ====================

  private handleMessage(data: string): void {
    try {
      const { event, data: payload } = JSON.parse(data) as { event: ServerEvent; data: unknown };
      
      // Handle internal state updates
      switch (event) {
        case ServerEvent.AUTH_SUCCESS: {
          const auth = payload as AuthSuccessPayload;
          this.pendingAuth = false;
          this.odhi = auth.odhi;
          this.displayName = auth.displayName;
          this.stats = auth.stats;
          console.log('[PvP] Authenticated as:', auth.displayName);
          
          if (auth.reconnectedToGame) {
            this.gameId = auth.reconnectedToGame;
            console.log('[PvP] Reconnected to game:', auth.reconnectedToGame);
          }
          break;
        }
        
        case ServerEvent.MATCH_FOUND: {
          const match = payload as MatchFoundPayload;
          this.gameId = match.gameId;
          this.playerRole = match.youAre;
          console.log('[PvP] Match found! Playing as:', match.youAre);
          break;
        }
        
        case ServerEvent.GAME_OVER: {
          this.gameId = null;
          this.playerRole = null;
          break;
        }
        
        case ServerEvent.QUEUE_LEFT: {
          console.log('[PvP] Left queue');
          break;
        }
      }

      // Emit to listeners
      this.emit(event, payload);
      
    } catch (error) {
      console.error('[PvP] Error parsing message:', error);
    }
  }

  private send(event: ClientEvent, data: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[PvP] Cannot send - not connected. ReadyState:', this.ws?.readyState);
      return;
    }

    console.log('[PvP] Sending:', event, JSON.stringify(data).substring(0, 100));
    this.ws.send(JSON.stringify({ event, data }));
  }

  // ==================== EVENT SYSTEM ====================

  on<T = unknown>(event: ServerEvent, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback as EventCallback);
    };
  }

  off(event: ServerEvent, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: ServerEvent, data: unknown): void {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[PvP] Error in event listener:', error);
      }
    });
  }

  // ==================== MATCHMAKING ====================

  joinQueue(deck: Card[]): void {
    // Send only card IDs with uniqueIds for deck
    const deckData = deck.map(card => ({
      ...card,
      uniqueId: card.uniqueId || crypto.randomUUID(),
    }));
    
    this.send(ClientEvent.JOIN_QUEUE, { deck: deckData });
  }

  leaveQueue(): void {
    this.send(ClientEvent.LEAVE_QUEUE, {});
  }

  // ==================== GAME ACTIONS ====================

  summonCard(cardUniqueId: string, sacrificeUniqueIds: string[] = []): void {
    this.send(ClientEvent.SUMMON_CARD, { cardUniqueId, sacrificeUniqueIds });
  }

  attack(attackerUniqueId: string, defenderUniqueId: string): void {
    this.send(ClientEvent.ATTACK, { attackerUniqueId, defenderUniqueId });
  }

  directAttack(attackerUniqueId: string): void {
    this.send(ClientEvent.DIRECT_ATTACK, { attackerUniqueId });
  }

  useSpell(spellUniqueId: string, targetUniqueId?: string): void {
    this.send(ClientEvent.USE_SPELL, { spellUniqueId, targetUniqueId });
  }

  setTrap(trapUniqueId: string): void {
    this.send(ClientEvent.SET_TRAP, { trapUniqueId });
  }

  endPhase(): void {
    this.send(ClientEvent.END_PHASE, {});
  }

  surrender(): void {
    this.send(ClientEvent.SURRENDER, {});
  }

  // ==================== UTILITY ====================

  ping(): void {
    this.send(ClientEvent.PING, {});
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      default: return 'disconnected';
    }
  }

  isInGame(): boolean {
    return this.gameId !== null;
  }

  isMyTurn(gameState: PvPGameState): boolean {
    return gameState.currentTurn === this.playerRole;
  }

  getMyPlayer(gameState: PvPGameState): PvPGameState['player1'] | null {
    if (!this.playerRole) return null;
    return gameState[this.playerRole];
  }

  getOpponentPlayer(gameState: PvPGameState): PvPGameState['player1'] | null {
    if (!this.playerRole) return null;
    return gameState[this.playerRole === 'player1' ? 'player2' : 'player1'];
  }

  updateDisplayName(name: string): void {
    localStorage.setItem('battlecard_display_name', name);
    this.displayName = name;
    // Send update to server to persist and propagate in-game
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.send(ClientEvent.UPDATE_DISPLAY_NAME, { displayName: name });
      } catch (err) {
        console.warn('[PvP] Failed to send update display name', err);
      }
    }
  }
}

// Export singleton
export const gameSessionService = new GameSessionService();
