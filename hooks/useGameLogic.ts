import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Card, Phase, GameLogEntry, ElementType } from '../types';
import { INITIAL_DECK } from '../constants';
import { GameRules } from '../utils/gameRules';
import { AIController } from '../classes/AIController';

const generateUniqueId = () => Math.random().toString(36).substr(2, 9);
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const useGameLogic = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [starter, setStarter] = useState<'player' | 'npc'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'npc' | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  
  const [player, setPlayer] = useState<Player>({ id: 'player', hp: 4000, hand: [], field: [], deck: [], graveyard: [] });
  const [npc, setNpc] = useState<Player>({ id: 'npc', hp: 4000, hand: [], field: [], deck: [], graveyard: [] });
  
  const [turnCount, setTurnCount] = useState(1);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<'player' | 'npc'>('player');
  const [phase, setPhase] = useState<Phase>(Phase.DRAW);
  
  const [attackingCardId, setAttackingCardId] = useState<string | null>(null);
  const [damagedCardId, setDamagedCardId] = useState<string | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{id: string, value: number, targetId: string} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const gameStateRef = useRef({ player, npc, phase, currentTurnPlayer, gameOver, gameStarted, isAnimating, turnCount, starter });

  useEffect(() => {
    gameStateRef.current = { player, npc, phase, currentTurnPlayer, gameOver, gameStarted, isAnimating, turnCount, starter };
  }, [player, npc, phase, currentTurnPlayer, gameOver, gameStarted, isAnimating, turnCount, starter]);

  const addLog = useCallback((message: string, type: 'info' | 'combat' | 'effect' = 'info') => {
    const id = generateUniqueId();
    setLogs(prev => [{ id, message, type, timestamp: Date.now() }, ...prev].slice(0, 50));
  }, []);

  const handleDrawPhase = useCallback(() => {
    const isPlayer = gameStateRef.current.currentTurnPlayer === 'player';
    const cur = isPlayer ? gameStateRef.current.player : gameStateRef.current.npc;
    
    if (cur.deck.length === 0) { 
      setWinner(isPlayer ? 'npc' : 'player'); 
      setGameOver(true); 
      return; 
    }
    
    const newDeck = [...cur.deck];
    const card = newDeck.shift()!;
    const fn = isPlayer ? setPlayer : setNpc;
    
    fn(p => ({ ...p, deck: newDeck, hand: [...p.hand, card] }));
    setPhase(Phase.MAIN);
    addLog(`${isPlayer ? 'Você' : 'Oponente'} comprou uma carta.`);
  }, [addLog]);

  const startGame = () => {
    const fullDeck = INITIAL_DECK.map(c => ({ ...c }));
    const playerDeck = shuffle(fullDeck).map(c => ({ ...c, uniqueId: generateUniqueId(), hasAttacked: false }));
    const npcDeck = shuffle(fullDeck).map(c => ({ ...c, uniqueId: generateUniqueId(), hasAttacked: false }));

    setPlayer({ id: 'player', hp: 4000, hand: playerDeck.splice(0, 5), deck: playerDeck, field: [], graveyard: [] });
    setNpc({ id: 'npc', hp: 4000, hand: npcDeck.splice(0, 5), deck: npcDeck, field: [], graveyard: [] });
    setTurnCount(1);
    setCurrentTurnPlayer('player');
    setStarter('player');
    setPhase(Phase.MAIN);
    setLogs([]);
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    addLog("Batalha iniciada! Seu turno.");
  };

  useEffect(() => {
    // Se entrarmos em BATTLE no primeiro turno, quem iniciou não pode atacar — passar a vez imediatamente
    if (phase === Phase.BATTLE && gameStarted && !gameOver && gameStateRef.current.turnCount === 1) {
      const current = gameStateRef.current.currentTurnPlayer;
      const whoStarted = gameStateRef.current.starter;
      if (current === whoStarted) {
        addLog('Quem iniciou não pode atacar no primeiro turno. Passando a vez...');
        setPhase(Phase.DRAW);
        setCurrentTurnPlayer(current === 'player' ? 'npc' : 'player');
        setTurnCount(c => c + 1);
        setPlayer(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
        setNpc(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
        return;
      }
    }
  }, [phase, gameStarted, gameOver]);

  const executeAttack = useCallback(async (attackerId: string, targetId: string | null, ownerId: 'player' | 'npc') => {
    if (gameStateRef.current.isAnimating) return;

    // Não permitir atacar no primeiro turno quem iniciou o jogo
    if (gameStateRef.current.turnCount === 1 && gameStateRef.current.currentTurnPlayer === ownerId) {
      addLog('Quem começou o jogo não pode atacar no primeiro turno.');
      return;
    }

    setIsAnimating(true);
    setAttackingCardId(attackerId);

    const isPlayer = ownerId === 'player';
    const attackerState = isPlayer ? gameStateRef.current.player : gameStateRef.current.npc;
    const defenderState = isPlayer ? gameStateRef.current.npc : gameStateRef.current.player;
    const attacker = attackerState.field.find(c => c.uniqueId === attackerId);

    if (!attacker) {
      setIsAnimating(false);
      setAttackingCardId(null);
      return;
    }

    // Marcar ataque realizado
    if (isPlayer) {
      setPlayer(p => ({ ...p, field: p.field.map(c => c.uniqueId === attackerId ? { ...c, hasAttacked: true } : c) }));
    } else {
      setNpc(p => ({ ...p, field: p.field.map(c => c.uniqueId === attackerId ? { ...c, hasAttacked: true } : c) }));
    }

    await new Promise(r => setTimeout(r, 600));

    if (!targetId) {
      const damage = attacker.attack;
      addLog(`ATAQUE DIRETO! ${attacker.name} causou ${damage} de dano!`, 'combat');
      setFloatingDamage({ id: generateUniqueId(), value: damage, targetId: isPlayer ? 'npc-hp' : 'player-hp' });
      
      const fn = isPlayer ? setNpc : setPlayer;
      fn(prev => {
        const newHp = Math.max(0, prev.hp - damage);
        if (newHp <= 0) { setWinner(isPlayer ? 'player' : 'npc'); setGameOver(true); }
        return { ...prev, hp: newHp };
      });
    } else {
      const defender = defenderState.field.find(c => c.uniqueId === targetId);
      if (defender) {
        setDamagedCardId(targetId);
        const result = GameRules.resolveCombat(attacker, defender);
        addLog(`${attacker.name} efetivo ${result.attackerEffective} (x${result.multiplier}) vs ${defender.name} efetivo ${result.defenderEffective}`, 'combat');
        
        if (result.damageToDefenderOwner > 0) {
          setFloatingDamage({ id: generateUniqueId(), value: result.damageToDefenderOwner, targetId: isPlayer ? 'npc-hp' : 'player-hp' });
          const fn = isPlayer ? setNpc : setPlayer;
          fn(p => ({ ...p, hp: Math.max(0, p.hp - result.damageToDefenderOwner) }));
          if (defenderState.hp - result.damageToDefenderOwner <= 0) { setWinner(isPlayer ? 'player' : 'npc'); setGameOver(true); }
          addLog(`Dono de ${defender.name} sofreu ${result.damageToDefenderOwner} de dano (DEF ${defender.defense} reduzido).`, 'combat');
        }

        if (result.damageToAttackerOwner > 0) {
          setFloatingDamage({ id: generateUniqueId(), value: result.damageToAttackerOwner, targetId: isPlayer ? 'player-hp' : 'npc-hp' });
          const fn = isPlayer ? setPlayer : setNpc;
          fn(p => ({ ...p, hp: Math.max(0, p.hp - result.damageToAttackerOwner) }));
          if (attackerState.hp - result.damageToAttackerOwner <= 0) { setWinner(isPlayer ? 'npc' : 'player'); setGameOver(true); }
          addLog(`Dono de ${attacker.name} sofreu ${result.damageToAttackerOwner} de dano (DEF ${attacker.defense} reduzido).`, 'combat');
        }

        addLog(`${attacker.name} (ATK ${attacker.attack}) desafiou ${defender.name} (ATK ${defender.attack} / DEF ${defender.defense})!`, 'combat');

        setTimeout(() => {
          if (!result.defenderSurvived) {
            const fn = isPlayer ? setNpc : setPlayer;
            fn(p => ({ ...p, field: p.field.filter(c => c.uniqueId !== targetId), graveyard: [...p.graveyard, defender] }));
            addLog(`${defender.name} foi nocauteado!`, 'info');
          }
          if (!result.attackerSurvived) {
            const fn = isPlayer ? setPlayer : setNpc;
            fn(p => ({ ...p, field: p.field.filter(c => c.uniqueId !== attackerId), graveyard: [...p.graveyard, attacker] }));
            addLog(`${attacker.name} foi nocauteado no contra-ataque!`, 'info');
          }
        }, 200);
      }
    }

    setTimeout(() => {
      setAttackingCardId(null);
      setDamagedCardId(null);
      setFloatingDamage(null);
      setIsAnimating(false);
    }, 600);
  }, [addLog]);

  useEffect(() => {
    if (currentTurnPlayer === 'npc' && !gameOver && gameStarted && !isAnimating) {
      const timer = setTimeout(async () => {
        if (phase === Phase.DRAW) {
          handleDrawPhase();
        } else {
          const action = AIController.decideNextMove(npc, player, phase);
          if (action.type === 'SUMMON' && action.cardId) {
            const card = npc.hand.find(c => c.uniqueId === action.cardId);
            if (card) {
               setNpc(p => {
                 const newHand = p.hand.filter(c => c.uniqueId !== action.cardId && !(action.sacrifices || []).includes(c.uniqueId));
                 const newField = p.field.filter(c => !(action.sacrifices || []).includes(c.uniqueId));
                 return { ...p, hand: newHand, field: [...newField, { ...card, hasAttacked: false }], graveyard: [...p.graveyard] };
               });
               addLog(`CPU invocou ${card.name}!`);
               setPhase(Phase.BATTLE);
            }
          } else if (action.type === 'ATTACK' && action.cardId) {
            executeAttack(action.cardId, action.targetId || null, 'npc');
          } else if (action.type === 'GO_TO_BATTLE') {
            setPhase(Phase.BATTLE);
          } else {
            setPhase(Phase.DRAW);
            setCurrentTurnPlayer('player');
            setTurnCount(c => c + 1);
            setPlayer(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
            setNpc(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
            addLog("Seu Turno! Compre uma carta.");
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // Auto draw phase para o player
    if (currentTurnPlayer === 'player' && phase === Phase.DRAW && !gameOver && gameStarted && !isAnimating) {
      const timer = setTimeout(() => {
        handleDrawPhase();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentTurnPlayer, phase, gameOver, gameStarted, isAnimating, npc, player, handleDrawPhase, executeAttack, addLog]);

  return {
    gameStarted, gameOver, winner, player, npc, turnCount, currentTurnPlayer, phase, logs,
    isAIProcessing: isAnimating,
    attackingCardId, damagedCardId, floatingDamage,
    startGame, 
    setPhase, 
    summonCard: (owner: any, id: string, sacs: string[]) => {
      setPlayer(p => {
        const card = p.hand.find(c => c.uniqueId === id)!;
        return {
          ...p,
          hand: p.hand.filter(c => c.uniqueId !== id && !sacs.includes(c.uniqueId)),
          field: [...p.field.filter(c => !sacs.includes(c.uniqueId)), { ...card, hasAttacked: false }],
          graveyard: [...p.graveyard]
        };
      });
      addLog(`Você invocou ${player.hand.find(c => c.uniqueId === id)?.name}!`);
    },
    executeAttack,
    endTurn: () => {
      setPhase(Phase.DRAW);
      setCurrentTurnPlayer('npc');
      setPlayer(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
      setNpc(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
      addLog("Encerrando turno. CPU está pensando...");
    },
    addLog
  };
};