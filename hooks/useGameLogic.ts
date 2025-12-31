import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Card, Phase, GameLogEntry, StatusEffect, AIDifficulty, GameMode, AbilityTrigger, CardType, TrapCondition, SacrificeStrategy } from '../types';
import { INITIAL_DECK } from '../constants';
import { GameRules } from '../utils/gameRules';
import { AIController } from '../classes/AIController';
import { soundService } from '../services/soundService';
import { statsService } from '../services/statsService';
import { achievementsService } from '../services/achievementsService';
import { collectionService } from '../services/collectionService';

// Import refactored modules
import {
  CardBase,
  generateUniqueId,
  shuffle,
  buildNpcDeck,
  processStatusEffects,
  applyStatusEffect,
  processAbility,
  calculatePassiveStats,
  calculateOpponentPassiveDebuffs,
  checkAndActivateTraps
} from './gameLogic';

export const useGameLogic = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const [starter, setStarter] = useState<'player' | 'npc'>('player');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'player' | 'npc' | null>(null);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  
  const [player, setPlayer] = useState<Player>({ id: 'player', hp: 8000, hand: [], field: [], deck: [], graveyard: [], trapZone: [] });
  const [npc, setNpc] = useState<Player>({ id: 'npc', hp: 8000, hand: [], field: [], deck: [], graveyard: [], trapZone: [] });
  
  const [turnCount, setTurnCount] = useState(1);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<'player' | 'npc'>('player');
  const [phase, setPhase] = useState<Phase>(Phase.DRAW);
  
  const [attackingCardId, setAttackingCardId] = useState<string | null>(null);
  const [damagedCardId, setDamagedCardId] = useState<string | null>(null);
  const [attackTargetId, setAttackTargetId] = useState<string | null>(null);
  const [floatingDamage, setFloatingDamage] = useState<{id: string, value: number, targetId: string} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Game settings
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AIDifficulty.NORMAL);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.QUICK_BATTLE);
  // If true, running out of deck ends the game. If false, empty deck only prevents drawing.
  const [allowDeckOut, setAllowDeckOut] = useState<boolean>(false);

  // Stats tracking
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [cardsDestroyed, setCardsDestroyed] = useState(0);
  const [statusInflicted, setStatusInflicted] = useState<Record<string, number>>({});

  // Survival mode tracking
  const [survivalWave, setSurvivalWave] = useState<number>(0);

  const gameStateRef = useRef({ player, npc, phase, currentTurnPlayer, gameOver, gameStarted, isAnimating, turnCount, starter, difficulty, attackTargetId });

  useEffect(() => {
    gameStateRef.current = { player, npc, phase, currentTurnPlayer, gameOver, gameStarted, isAnimating, turnCount, starter, difficulty };
  }, [player, npc, phase, currentTurnPlayer, gameOver, gameStarted, isAnimating, turnCount, starter, difficulty, attackTargetId]);

  const addLog = useCallback((message: string, type: 'info' | 'combat' | 'effect' = 'info') => {
    const id = generateUniqueId();
    setLogs(prev => [{ id, message, type, timestamp: Date.now() }, ...prev].slice(0, 50));
    
    // Play sound effects based on log type
    if (type === 'combat') {
      soundService.playAttack();
    } else if (type === 'effect') {
      soundService.playBuff();
    }
  }, []);

  // Ensure game end is applied exactly once to avoid race conditions
  const finishGame = useCallback((who: 'player' | 'npc', reason?: string) => {
    if (gameStateRef.current.gameOver) return;
    // update ref so concurrent callers see the game is over
    gameStateRef.current = { ...gameStateRef.current, gameOver: true };
    setWinner(who);
    setGameOver(true);
    const reasonText = reason ? ` (${reason})` : '';
    addLog(`${who === 'player' ? 'Jogador' : 'CPU'} venceu o jogo${reasonText}`, 'info');
    // also helpful in console for debugging simultaneous updates
    console.debug('finishGame called ->', { winner: who, reason });
  }, [addLog]);

  // Process status effects at start of turn
  const processFieldStatusEffects = useCallback(() => {
    const isPlayer = gameStateRef.current.currentTurnPlayer === 'player';
    const current = isPlayer ? gameStateRef.current.player : gameStateRef.current.npc;
    
    let totalStatusDamage = 0;
    let totalHealAmount = 0;
    const processedField: Card[] = [];
    
    current.field.forEach(card => {
      const result = processStatusEffects(card);
      result.logs.forEach(log => addLog(log, 'effect'));
      totalStatusDamage += result.damage;
      
      if (result.damage > 0) {
        soundService.playDamage();
      }

      // Process ON_TURN_END abilities (rain_dish)
      if (card.ability?.trigger === AbilityTrigger.ON_TURN_END) {
        const abilityResult = processAbility(card, AbilityTrigger.ON_TURN_END, {
          owner: current,
          opponent: isPlayer ? gameStateRef.current.npc : gameStateRef.current.player
        });

        if (abilityResult) {
          abilityResult.logs.forEach(log => addLog(log, 'effect'));
          if (abilityResult.healOwner && abilityResult.healOwner > 0) {
            totalHealAmount += abilityResult.healOwner;
          }
        }
      }
      
      processedField.push({
        ...result.card,
        hasAttacked: card.hasAttacked || !result.canAct
      });
    });

    const fn = isPlayer ? setPlayer : setNpc;
    
    if (totalStatusDamage > 0 || totalHealAmount > 0) {
      fn(p => ({
        ...p,
        field: processedField,
        hp: Math.min(8000, Math.max(0, p.hp - totalStatusDamage + totalHealAmount))
      }));
      
      if (current.hp - totalStatusDamage + totalHealAmount <= 0) {
        finishGame(isPlayer ? 'npc' : 'player', 'status_damage');
      }
    } else {
      fn(p => ({ ...p, field: processedField }));
    }
  }, [addLog, finishGame]);

  const handleDrawPhase = useCallback(() => {
    const isPlayer = gameStateRef.current.currentTurnPlayer === 'player';
    const cur = isPlayer ? gameStateRef.current.player : gameStateRef.current.npc;
    
    // Process status effects at start of turn
    processFieldStatusEffects();
    
    if (cur.deck.length === 0) {
      if (allowDeckOut) {
        finishGame(isPlayer ? 'npc' : 'player', 'deck_out');
        return;
      } else {
        addLog(`${isPlayer ? 'Você' : 'Oponente'} não tem cartas no deck. Nenhuma carta comprada.`, 'info');
        // Stay in MAIN phase (no draw) — end draw phase early
        setPhase(Phase.MAIN);
        return;
      }
    }
    
    const newDeck = [...cur.deck];
    const card = newDeck.shift()!;
    const fn = isPlayer ? setPlayer : setNpc;
    
    fn(p => ({ ...p, deck: newDeck, hand: [...p.hand, card] }));
    soundService.playDraw();
    setPhase(Phase.MAIN);
    addLog(`${isPlayer ? 'Você' : 'Oponente'} comprou uma carta.`);
  }, [addLog, processFieldStatusEffects, allowDeckOut]);

  const startGame = (options?: { difficulty?: AIDifficulty, mode?: GameMode, customDeck?: CardBase[], npcDeck?: CardBase[], npcHp?: number, npcName?: string, npcAvatar?: string, sacrificeStrategy?: SacrificeStrategy }) => {
    const diff = options?.difficulty || AIDifficulty.NORMAL;
    const mode = options?.mode || GameMode.QUICK_BATTLE;
    
    setDifficulty(diff);
    setGameMode(mode);

    // Initialize survival wave if starting survival
    if (mode === GameMode.SURVIVAL) {
      setSurvivalWave(1);
    } else {
      setSurvivalWave(0);
    }
    
    // Configure AI difficulty and sacrifice strategy
    AIController.setDifficulty(diff);
    AIController.resetTurnCounters();
    if (options?.sacrificeStrategy) {
      AIController.setSacrificeStrategy(options.sacrificeStrategy);
    } else {
      AIController.setSacrificeStrategy(SacrificeStrategy.AUTO);
    }
    
    const fullDeck = options?.customDeck || INITIAL_DECK.map(c => ({ ...c }));
    const npDeck = options?.npcDeck || INITIAL_DECK.map(c => ({ ...c }));

    // Ensure NPC deck is trimmed to an appropriate game size (40) respecting rarity distribution
    const npcDeckForGame = buildNpcDeck(npDeck, 40, diff);

    const playerDeck = shuffle(fullDeck).map(c => ({ ...c, uniqueId: generateUniqueId(), hasAttacked: false }));
    const npcDeckShuffled = npcDeckForGame.map(c => ({ ...c, uniqueId: generateUniqueId(), hasAttacked: false }));

    const npcHp = options?.npcHp || 8000;

    setPlayer({ id: 'player', name: 'Player', avatar: '👤', hp: 8000, hand: playerDeck.splice(0, 5), deck: playerDeck, field: [], graveyard: [], trapZone: [] });
    setNpc({ id: 'npc', name: options?.npcName || 'CPU', avatar: options?.npcAvatar || '🤖', hp: npcHp, hand: npcDeckShuffled.splice(0, 5), deck: npcDeckShuffled, field: [], graveyard: [], trapZone: [] });
    setTurnCount(1);
    // Escolher aleatoriamente quem inicia (50% player, 50% npc)
    const starterChoice: 'player' | 'npc' = Math.random() < 0.5 ? 'player' : 'npc';
    setCurrentTurnPlayer(starterChoice);
    setStarter(starterChoice);
    setPhase(Phase.MAIN);
    setLogs([]);
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    addLog(starterChoice === 'player' ? "Batalha iniciada! Seu turno." : "Batalha iniciada! CPU começa.");
  };

  // Start the next wave in Survival mode without resetting the player state
  const startNextSurvivalWave = (options?: { npcDeck?: CardBase[], npcHp?: number, npcName?: string, npcAvatar?: string }) => {
    // Ensure we're in survival mode
    setGameMode(GameMode.SURVIVAL);
    const npDeck = options?.npcDeck || INITIAL_DECK.map(c => ({ ...c }));
    const npcDeckForGame = buildNpcDeck(npDeck, 40, gameStateRef.current.difficulty || difficulty);
    const npcDeckShuffled = npcDeckForGame.map(c => ({ ...c, uniqueId: generateUniqueId(), hasAttacked: false }));

    // Increment wave counter and compute NPC HP (NPC fica mais forte a cada onda)
    const nextWave = (survivalWave || 0) + 1;
    setSurvivalWave(nextWave);
    const npcHp = options?.npcHp || 8000 + Math.max(0, (nextWave - 1)) * 500;

    // Reset player to a fresh battle state but preserve current HP (no regeneration between waves)
    const playerFullDeck = shuffle(INITIAL_DECK.map(c => ({ ...c }))).map(c => ({ ...c, uniqueId: generateUniqueId(), hasAttacked: false }));
    const playerHand = playerFullDeck.splice(0, 5);
    const currentPlayerHp = gameStateRef.current.player?.hp ?? 8000;
    setPlayer({ id: 'player', name: 'Player', avatar: '👤', hp: currentPlayerHp, hand: playerHand, deck: playerFullDeck, field: [], graveyard: [], trapZone: [] });

    // Configure the new (mais forte) NPC for the next wave
    setNpc({ id: 'npc', name: options?.npcName || `Oponente Onda ${nextWave}`, avatar: options?.npcAvatar || '👹', hp: npcHp, hand: npcDeckShuffled.splice(0, 5), deck: npcDeckShuffled, field: [], graveyard: [], trapZone: [] });

    // Reset battle state
    setTurnCount(1);
    const starterChoice: 'player' | 'npc' = Math.random() < 0.5 ? 'player' : 'npc';
    setCurrentTurnPlayer(starterChoice);
    setStarter(starterChoice);
    setPhase(Phase.MAIN);
    setLogs([]);
    setGameStarted(true);
    setGameOver(false);
    setWinner(null);
    // Reset some session stats for the fresh battle
    setTotalDamageDealt(0);
    setCardsDestroyed(0);
    setStatusInflicted({});
    addLog(starterChoice === 'player' ? "Próxima onda iniciada! Seu turno." : "Próxima onda iniciada! CPU começa.");
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
    // mark the intended target immediately so UI can use attack-target from start
    setAttackTargetId(targetId);
    setAttackingCardId(attackerId);

    const isPlayer = ownerId === 'player';
    const attackerState = isPlayer ? gameStateRef.current.player : gameStateRef.current.npc;
    const defenderState = isPlayer ? gameStateRef.current.npc : gameStateRef.current.player;
    const attacker = attackerState.field.find(c => c.uniqueId === attackerId);

    if (!attacker) {
      setIsAnimating(false);
      setAttackingCardId(null);
      setAttackTargetId(null);
      return;
    }

    // Marcar ataque realizado
    if (isPlayer) {
      setPlayer(p => ({ ...p, field: p.field.map(c => c.uniqueId === attackerId ? { ...c, hasAttacked: true } : c) }));
    } else {
      setNpc(p => ({ ...p, field: p.field.map(c => c.uniqueId === attackerId ? { ...c, hasAttacked: true } : c) }));
    }

    await new Promise(r => setTimeout(r, 600));

    // Check for ON_ATTACK or ON_DIRECT_ATTACK traps from defender
    const trapCondition = targetId ? TrapCondition.ON_ATTACK : TrapCondition.ON_DIRECT_ATTACK;
    const defender = targetId ? defenderState.field.find(c => c.uniqueId === targetId) : undefined;
    const trapResult = checkAndActivateTraps(
      defenderState,
      attackerState,
      trapCondition,
      { attacker, defender, attackerOwner: ownerId },
      setPlayer,
      setNpc
    );

    // Log trap effects
    trapResult.logs.forEach(log => addLog(log, 'trap'));

    // Remove activated traps
    if (trapResult.activatedTraps.length > 0) {
      const fn = isPlayer ? setNpc : setPlayer;
      fn(prev => ({
        ...prev,
        trapZone: prev.trapZone.filter(t => !trapResult.activatedTraps.some(at => at.uniqueId === t.uniqueId)),
        graveyard: [...prev.graveyard, ...trapResult.activatedTraps.map(t => ({ ...t, destroyedAt: Date.now() }))]
      }));
    }

    // Handle negate attack trap
    if (trapResult.negateAttack) {
      addLog('Ataque negado pela armadilha!', 'trap');
      setAttackingCardId(null);
      setAttackTargetId(null);
      setDamagedCardId(null);
      setFloatingDamage(null);
      setIsAnimating(false);
      return;
    }

    // Apply trap damage to attacker's owner
    if (trapResult.damageToOpponentPlayer > 0) {
      setFloatingDamage({ id: generateUniqueId(), value: trapResult.damageToOpponentPlayer, targetId: isPlayer ? 'player-hp' : 'npc-hp' });
      const fn = isPlayer ? setPlayer : setNpc;
      fn(p => {
        const newHp = Math.max(0, p.hp - trapResult.damageToOpponentPlayer);
        if (newHp <= 0) { finishGame(isPlayer ? 'npc' : 'player', 'trap_damage'); }
        return { ...p, hp: newHp };
      });
      await new Promise(r => setTimeout(r, 400));
    }

    // Apply debuffs from traps
    if (trapResult.debuffTargets.length > 0) {
      const fn = isPlayer ? setPlayer : setNpc;
      fn(p => ({
        ...p,
        field: p.field.map(c => {
          const debuff = trapResult.debuffTargets.find(d => d.targetId === c.uniqueId);
          if (debuff) {
            if (debuff.stat) {
              const statToDecrease = debuff.stat.toLowerCase() as 'attack' | 'defense';
              return { ...c, [statToDecrease]: Math.max(0, c[statToDecrease] + debuff.value) };
            } else {
              return { ...c, attack: Math.max(0, c.attack + debuff.value), defense: Math.max(0, c.defense + debuff.value) };
            }
          }
          return c;
        })
      }));
    }

    // Apply status effects from traps
    if (trapResult.statusEffects.length > 0) {
      const fn = isPlayer ? setPlayer : setNpc;
      fn(p => ({
        ...p,
        field: p.field.map(c => {
          const statusTarget = trapResult.statusEffects.find(se => se.target.uniqueId === c.uniqueId);
          return statusTarget ? applyStatusEffect(c, statusTarget.status, 3) : c;
        })
      }));
    }

    // Destroy attacker if trap caused destruction
    if (trapResult.destroyTargets.includes(attacker.uniqueId)) {
      const fn = isPlayer ? setPlayer : setNpc;
      fn(p => ({
        ...p,
        field: p.field.filter(c => c.uniqueId !== attacker.uniqueId),
        graveyard: [...p.graveyard, { ...attacker, destroyedAt: Date.now() }]
      }));
      addLog(`${attacker.name} foi destruído pela armadilha!`, 'trap');
      setAttackingCardId(null);
      setAttackTargetId(null);
      setDamagedCardId(null);
      setFloatingDamage(null);
      setIsAnimating(false);
      return;
    }

    if (!targetId) {
      const damage = attacker.attack;
      addLog(`ATAQUE DIRETO! ${attacker.name} causou ${damage} de dano!`, 'combat');
      setFloatingDamage({ id: generateUniqueId(), value: damage, targetId: isPlayer ? 'npc-hp' : 'player-hp' });
      
      const fn = isPlayer ? setNpc : setPlayer;
      fn(prev => {
        const newHp = Math.max(0, prev.hp - damage);
        if (newHp <= 0) { finishGame(isPlayer ? 'player' : 'npc', 'direct_attack'); }
        return { ...prev, hp: newHp };
      });
    } else {
      const defender = defenderState.field.find(c => c.uniqueId === targetId);
      let defenderWouldDie: boolean | undefined;
      if (defender) {
        // Process ON_ATTACK ability (when attacking but not destroying yet)
        if (attacker.ability?.trigger === AbilityTrigger.ON_ATTACK) {
          const abilityResult = processAbility(attacker, AbilityTrigger.ON_ATTACK, {
            owner: attackerState,
            opponent: defenderState,
            attacker: attacker,
            defender: defender,
            destroyed: false
          });

          if (abilityResult && abilityResult.statusToApply && abilityResult.statusToApply.length > 0) {
            abilityResult.logs.forEach(log => addLog(log, 'effect'));
            // Apply status effects immediately (burn_touch, etc)
            const fn = isPlayer ? setNpc : setPlayer;
            fn(p => ({
              ...p,
              field: p.field.map(c => {
                const statusTarget = abilityResult.statusToApply!.find(se => se.target.uniqueId === c.uniqueId);
                return statusTarget ? applyStatusEffect(c, statusTarget.status, 3) : c;
              })
            }));
          }
        }

        // Process ON_DAMAGE ability (defender receiving damage)
        if (defender.ability?.trigger === AbilityTrigger.ON_DAMAGE) {
          const abilityResult = processAbility(defender, AbilityTrigger.ON_DAMAGE, {
            owner: defenderState,
            opponent: attackerState,
            attacker: attacker
          });

          if (abilityResult && abilityResult.statusToApply && abilityResult.statusToApply.length > 0) {
            abilityResult.logs.forEach(log => addLog(log, 'effect'));
            // Apply status effects to attacker (poison_point, static, synchronize)
            const fn = isPlayer ? setPlayer : setNpc;
            fn(p => ({
              ...p,
              field: p.field.map(c => {
                const statusTarget = abilityResult.statusToApply!.find(se => se.target.uniqueId === c.uniqueId);
                return statusTarget ? applyStatusEffect(c, statusTarget.status, 3) : c;
              })
            }));
          }
        }

        setDamagedCardId(targetId);
        
        // Apply passive bonuses/debuffs before combat
        const attackerPassive = calculatePassiveStats(attacker, attackerState, defenderState);
        const defenderPassive = calculatePassiveStats(defender, defenderState, attackerState);
        const attackerDebuffs = calculateOpponentPassiveDebuffs(attacker, defenderState);
        const defenderDebuffs = calculateOpponentPassiveDebuffs(defender, attackerState);

        // Check sand_veil evasion
        if (defenderPassive.evasion && Math.random() < defenderPassive.evasion) {
          addLog(`${defender.name} evadiu o ataque! (Véu de Areia)`, 'effect');
          setDamagedCardId(null);
          setAttackingCardId(null);
          setAttackTargetId(null);
          setFloatingDamage(null);
          setIsAnimating(false);
          return;
        }

        // Create modified cards with passive bonuses
        const modifiedAttacker = {
          ...attacker,
          attack: attacker.attack + attackerPassive.attack + attackerDebuffs.attack,
          defense: attacker.defense + attackerPassive.defense + attackerDebuffs.defense
        };
        const modifiedDefender = {
          ...defender,
          attack: defender.attack + defenderPassive.attack + defenderDebuffs.attack,
          defense: defender.defense + defenderPassive.defense + defenderDebuffs.defense
        };

        const result = GameRules.resolveCombat(modifiedAttacker, modifiedDefender);
        addLog(`${attacker.name} efetivo ${result.attackerEffective} (x${result.multiplier}) vs ${defender.name} efetivo ${result.defenderEffective}`, 'combat');
        
        if (result.damageToDefenderOwner > 0) {
          setFloatingDamage({ id: generateUniqueId(), value: result.damageToDefenderOwner, targetId: isPlayer ? 'npc-hp' : 'player-hp' });
          const fn = isPlayer ? setNpc : setPlayer;
          defenderWouldDie = (defenderState.hp - result.damageToDefenderOwner) <= 0;
          fn(p => ({ ...p, hp: Math.max(0, p.hp - result.damageToDefenderOwner) }));
          addLog(`Dono de ${defender.name} sofreu ${result.damageToDefenderOwner} de dano (DEF ${defender.defense} reduzido).`, 'combat');
        }

        if (result.damageToAttackerOwner > 0) {
          setFloatingDamage({ id: generateUniqueId(), value: result.damageToAttackerOwner, targetId: isPlayer ? 'player-hp' : 'npc-hp' });
          const fn = isPlayer ? setPlayer : setNpc;
          fn(p => ({ ...p, hp: Math.max(0, p.hp - result.damageToAttackerOwner) }));
          if (attackerState.hp - result.damageToAttackerOwner <= 0) { finishGame(isPlayer ? 'npc' : 'player', 'combat_attacker_dead'); }
          addLog(`Dono de ${attacker.name} sofreu ${result.damageToAttackerOwner} de dano (DEF ${attacker.defense} reduzido).`, 'combat');
        }

        addLog(`${attacker.name} (ATK ${attacker.attack}) desafiou ${defender.name} (ATK ${defender.attack} / DEF ${defender.defense})!`, 'combat');

        // Track stats for player
        if (isPlayer) {
          setTotalDamageDealt(prev => prev + (result.damageToDefenderOwner || 0));
        }

        setTimeout(() => {
          if (!result.defenderSurvived) {
            // Process ON_ATTACK ability (after destroying defender)
            if (attacker.ability?.trigger === AbilityTrigger.ON_ATTACK) {
              const abilityResult = processAbility(attacker, AbilityTrigger.ON_ATTACK, {
                owner: attackerState,
                opponent: defenderState,
                attacker: attacker,
                defender: defender,
                destroyed: true
              });

              if (abilityResult) {
                abilityResult.logs.forEach(log => addLog(log, 'effect'));

                // Apply draw cards (pickup ability)
                if (abilityResult.drawCards && abilityResult.drawCards > 0) {
                  const fn = isPlayer ? setPlayer : setNpc;
                  fn(p => {
                    const drawn = p.deck.slice(0, abilityResult.drawCards);
                    return {
                      ...p,
                      hand: [...p.hand, ...drawn],
                      deck: p.deck.slice(abilityResult.drawCards)
                    };
                  });
                }

                // Apply status effects (burn_touch)
                if (abilityResult.statusToApply && abilityResult.statusToApply.length > 0) {
                  const fn = isPlayer ? setNpc : setPlayer;
                  fn(p => ({
                    ...p,
                    field: p.field.map(c => {
                      const statusTarget = abilityResult.statusToApply!.find(se => se.target.uniqueId === c.uniqueId);
                      return statusTarget ? applyStatusEffect(c, statusTarget.status, 3) : c;
                    })
                  }));
                }
              }
            }

            // Process ON_DESTROY ability (defender being destroyed)
            if (defender.ability?.trigger === AbilityTrigger.ON_DESTROY) {
              const destroyAbilityResult = processAbility(defender, AbilityTrigger.ON_DESTROY, {
                owner: defenderState,
                opponent: attackerState
              });

              if (destroyAbilityResult) {
                destroyAbilityResult.logs.forEach(log => addLog(log, 'effect'));

                // Apply heal to owner
                if (destroyAbilityResult.healOwner && destroyAbilityResult.healOwner > 0) {
                  const fn = isPlayer ? setNpc : setPlayer;
                  fn(p => ({ ...p, hp: Math.min(8000, p.hp + destroyAbilityResult.healOwner!) }));
                }

                // Apply revive (remove from graveyard and add to hand)
                if (destroyAbilityResult.reviveCard) {
                  const fn = isPlayer ? setNpc : setPlayer;
                  setTimeout(() => {
                    fn(p => {
                      const revivedId = destroyAbilityResult.reviveCard!.uniqueId;
                      const newGrave: typeof p.graveyard = [];
                      let removed = false;
                      for (const g of p.graveyard) {
                        if (!removed && g.uniqueId === revivedId) { removed = true; continue; }
                        newGrave.push(g);
                      }

                      return {
                        ...p,
                        hand: [...p.hand, destroyAbilityResult.reviveCard!],
                        graveyard: newGrave
                      };
                    });
                    addLog(`${destroyAbilityResult.reviveCard!.name} renasceu na mão!`, 'effect');
                  }, 500);
                }
              }
            }

            const fn = isPlayer ? setNpc : setPlayer;
            fn(p => ({ ...p, field: p.field.filter(c => c.uniqueId !== targetId), graveyard: [...p.graveyard, { ...defender, destroyedAt: Date.now() }] }));
            addLog(`${defender.name} foi nocauteado!`, 'info');
            soundService.playDestroy();
            
            // Track destruction for player
            if (isPlayer) {
              setCardsDestroyed(prev => prev + 1);
            }

            // Check for ON_DESTROY traps from defender's owner
            const destroyTrapResult = checkAndActivateTraps(
              defenderState,
              attackerState,
              TrapCondition.ON_DESTROY,
              { destroyed: defender, attacker },
              setPlayer,
              setNpc
            );

            if (destroyTrapResult.activatedTraps.length > 0) {
              destroyTrapResult.logs.forEach(log => addLog(log, 'trap'));
              
              // Remove activated traps
              const fn = isPlayer ? setNpc : setPlayer;
              fn(prev => ({
                ...prev,
                trapZone: prev.trapZone.filter(t => !destroyTrapResult.activatedTraps.some(at => at.uniqueId === t.uniqueId)),
                graveyard: [...prev.graveyard, ...destroyTrapResult.activatedTraps.map(t => ({ ...t, destroyedAt: Date.now() }))]
              }));

              // Apply destruction to attacker if triggered (e.g., Destiny Bond)
              if (destroyTrapResult.destroyTargets.includes(attacker.uniqueId)) {
                const attackerFn = isPlayer ? setPlayer : setNpc;
                attackerFn(p => ({
                  ...p,
                  field: p.field.filter(c => c.uniqueId !== attacker.uniqueId),
                  graveyard: [...p.graveyard, { ...attacker, destroyedAt: Date.now() }]
                }));
                addLog(`${attacker.name} também foi destruído pela armadilha!`, 'trap');
                setAttackTargetId(null);
              }

              // Handle survive_1hp special: if trap triggered, ensure the owner survives with 1 HP
              if (destroyTrapResult.surviveTrap) {
                const ownerSetFn = isPlayer ? setNpc : setPlayer;
                ownerSetFn(p => ({ ...p, hp: 1 }));
                addLog(`${defender.name} foi salvo pela armadilha e o dono permaneceu com 1 HP!`, 'trap');
              }
            }

            // Check if defender's owner would have died from the damage (outside trap block)
            // Only finish if no surviveTrap was activated
            if (typeof defenderWouldDie !== 'undefined' && defenderWouldDie && !destroyTrapResult.surviveTrap) {
              finishGame(isPlayer ? 'player' : 'npc', 'combat_defender_dead');
            }
          }
          if (!result.attackerSurvived) {
            const fn = isPlayer ? setPlayer : setNpc;
            fn(p => ({ ...p, field: p.field.filter(c => c.uniqueId !== attackerId), graveyard: [...p.graveyard, { ...attacker, destroyedAt: Date.now() }] }));
            addLog(`${attacker.name} foi nocauteado no contra-ataque!`, 'info');
            soundService.playDestroy();
          }
        }, 200);
      }
    }

    setTimeout(() => {
      setAttackingCardId(null);
      setAttackTargetId(null);
      setDamagedCardId(null);
      setFloatingDamage(null);
      setIsAnimating(false);
    }, 600);
  }, [addLog]);

  // Handle game end - update stats and achievements
  useEffect(() => {
    if (gameOver && winner) {
      const playerWon = winner === 'player';
      
      // Play sound
      if (playerWon) {
        soundService.playVictory();
      } else {
        soundService.playDefeat();
      }
      
      // Update stats
      statsService.recordGame({
        won: playerWon,
        damageDealt: totalDamageDealt,
        cardsDestroyed: cardsDestroyed,
        turns: turnCount,
        mode: gameMode,
        perfect: playerWon && player.hp === 8000
      });
      // If in Survival and player won, record the wave and prepare next wave number
      if (gameMode === GameMode.SURVIVAL && playerWon) {
        const waveToRecord = survivalWave || 1;
        statsService.recordSurvivalWave(waveToRecord);
      }
      
      // Check achievements
      achievementsService.checkAchievements();

      // Award quick-battle coins to the player based on difficulty
      if (gameMode === GameMode.QUICK_BATTLE && playerWon) {
        let min = 0;
        let max = 0;
        switch (difficulty) {
          case AIDifficulty.EASY:
            min = 5; max = 10; break;
          case AIDifficulty.NORMAL:
            min = 7; max = 15; break;
          case AIDifficulty.HARD:
            min = 10; max = 15; break;
          case AIDifficulty.EXPERT:
            min = 10; max = 15; break;
          default:
            min = 7; max = 12; break;
        }
        const amount = Math.floor(Math.random() * (max - min + 1)) + min;
        try {
          collectionService.addCoins(amount);
          addLog(`Você ganhou ${amount} moedas por vencer a Batalha Rápida (${difficulty})`, 'info');
        } catch (e) {
          console.warn('Falha ao adicionar coins da Batalha Rápida', e);
        }
      }
    }
  }, [gameOver, winner, totalDamageDealt, cardsDestroyed, turnCount, gameMode, player.hp, survivalWave]);

  useEffect(() => {
    if (currentTurnPlayer === 'npc' && !gameOver && gameStarted && !isAnimating) {
      const timer = setTimeout(async () => {
        if (phase === Phase.DRAW) {
          handleDrawPhase();
        } else {
          const action = AIController.decideNextMove(npc, player, phase, gameStateRef.current.difficulty);
          if (action.type === 'SUMMON' && action.cardId) {
            summonCard('npc', action.cardId, action.sacrifices || []);
            // Não mudar para battle automaticamente - deixar a IA decidir
          } else if (action.type === 'USE_SPELL' && action.cardId) {
            useSpell('npc', action.cardId, action.targetId);
          } else if (action.type === 'SET_TRAP' && action.cardId) {
            setTrap('npc', action.cardId);
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

  // Summon with ability trigger
  const summonCard = useCallback((owner: 'player' | 'npc', cardId: string, sacrifices: string[]) => {
    const setFn = owner === 'player' ? setPlayer : setNpc;
    const state = owner === 'player' ? gameStateRef.current.player : gameStateRef.current.npc;
    const opponent = owner === 'player' ? gameStateRef.current.npc : gameStateRef.current.player;
    const card = state.hand.find(c => c.uniqueId === cardId);
    
    if (!card) return;
    
    setFn(p => {
      const removedFromField = p.field.filter(c => sacrifices.includes(c.uniqueId));
      const removedFromHand = p.hand.filter(c => sacrifices.includes(c.uniqueId));

      return {
        ...p,
        hand: p.hand.filter(c => c.uniqueId !== cardId && !sacrifices.includes(c.uniqueId)),
        field: [...p.field.filter(c => !sacrifices.includes(c.uniqueId)), { ...card, hasAttacked: false }],
        graveyard: [
          ...p.graveyard,
          ...removedFromField.map(c => ({ ...c, destroyedAt: Date.now() })),
          ...removedFromHand.map(c => ({ ...c, destroyedAt: Date.now() }))
        ]
      };
    });
    
    soundService.playSummon();

    // Log sacrifices
    if (sacrifices.length > 0) {
      const state = owner === 'player' ? gameStateRef.current.player : gameStateRef.current.npc;
      const sacrificedFromField = state.field.filter(c => sacrifices.includes(c.uniqueId));
      const sacrificedFromHand = state.hand.filter(c => sacrifices.includes(c.uniqueId));
      
      if (sacrificedFromField.length > 0) {
        sacrificedFromField.forEach(c => addLog(`${owner === 'player' ? 'Você' : 'CPU'} sacrificou ${c.name} do campo`, 'info'));
      }
      if (sacrificedFromHand.length > 0) {
        sacrificedFromHand.forEach(c => addLog(`${owner === 'player' ? 'Você' : 'CPU'} sacrificou ${c.name} da mão`, 'info'));
      }
    }
    
    addLog(`${owner === 'player' ? 'Você' : 'CPU'} invocou ${card.name}!`);
    
    // Trigger ON_SUMMON ability
    if (card.ability?.trigger === AbilityTrigger.ON_SUMMON) {
      const abilityResult = processAbility(card, AbilityTrigger.ON_SUMMON, {
        owner: state,
        opponent: opponent
      });
      
      if (abilityResult) {
        abilityResult.logs.forEach(log => addLog(log, 'effect'));
        soundService.playBuff();

        // Apply draw cards
        if (abilityResult.drawCards && abilityResult.drawCards > 0) {
          setFn(p => {
            const drawn = p.deck.slice(0, abilityResult.drawCards);
            return {
              ...p,
              hand: [...p.hand, ...drawn],
              deck: p.deck.slice(abilityResult.drawCards)
            };
          });
        }

        // Apply status effects to opponents
        if (abilityResult.statusToApply && abilityResult.statusToApply.length > 0) {
          const opponentSetFn = owner === 'player' ? setNpc : setPlayer;
          opponentSetFn(p => ({
            ...p,
            field: p.field.map(c => {
              const statusTarget = abilityResult.statusToApply!.find(se => se.target.uniqueId === c.uniqueId);
              return statusTarget ? applyStatusEffect(c, statusTarget.status, 3) : c;
            })
          }));
        }
      }
    }

    // Check for ON_SUMMON traps from opponent
    const trapResult = checkAndActivateTraps(
      opponent,
      state,
      TrapCondition.ON_SUMMON,
      { summoned: card },
      setPlayer,
      setNpc
    );

    if (trapResult.activatedTraps.length > 0) {
      trapResult.logs.forEach(log => addLog(log, 'trap'));
      
      // Remove activated traps
      const opponentSetFn = owner === 'player' ? setNpc : setPlayer;
      opponentSetFn(prev => ({
        ...prev,
        trapZone: prev.trapZone.filter(t => !trapResult.activatedTraps.some(at => at.uniqueId === t.uniqueId)),
        graveyard: [...prev.graveyard, ...trapResult.activatedTraps.map(t => ({ ...t, destroyedAt: Date.now() }))]
      }));

      // Apply status effects from traps to summoned card
      if (trapResult.statusEffects.length > 0) {
        setFn(p => ({
          ...p,
          field: p.field.map(c => {
            if (c.uniqueId === card.uniqueId) {
              const statusTarget = trapResult.statusEffects.find(se => se.target.uniqueId === c.uniqueId);
              return statusTarget ? applyStatusEffect(c, statusTarget.status, 3) : c;
            }
            return c;
          })
        }));
      }

      // Apply debuffs
      if (trapResult.debuffTargets.length > 0) {
        setFn(p => ({
          ...p,
          field: p.field.map(c => {
            const debuff = trapResult.debuffTargets.find(d => d.targetId === c.uniqueId);
            if (debuff) {
              if (debuff.stat) {
                const statToDecrease = debuff.stat.toLowerCase() as 'attack' | 'defense';
                return { ...c, [statToDecrease]: Math.max(0, c[statToDecrease] + debuff.value) };
              } else {
                return { ...c, attack: Math.max(0, c.attack + debuff.value), defense: Math.max(0, c.defense + debuff.value) };
              }
            }
            return c;
          })
        }));
      }
    }
  }, [addLog]);

  // Set trap card
  const setTrap = useCallback((owner: 'player' | 'npc', cardId: string) => {
    const setFn = owner === 'player' ? setPlayer : setNpc;
    const state = owner === 'player' ? gameStateRef.current.player : gameStateRef.current.npc;
    const card = state.hand.find(c => c.uniqueId === cardId);
    
    if (!card || card.cardType !== CardType.TRAP) return;
    if (state.trapZone.length >= 2) {
      addLog('Zona de armadilhas cheia! (máximo 2)');
      return;
    }
    
    setFn(p => ({
      ...p,
      hand: p.hand.filter(c => c.uniqueId !== cardId),
      trapZone: [...p.trapZone, { ...card, isSet: true }]
    }));
    
    addLog(`${owner === 'player' ? 'Você' : 'CPU'} setou uma armadilha!`);
    soundService.playBuff();
  }, [addLog]);

  // Use spell card
  const useSpell = useCallback((owner: 'player' | 'npc', cardId: string, targetId?: string) => {
    const state = owner === 'player' ? gameStateRef.current.player : gameStateRef.current.npc;
    const opponent = owner === 'player' ? gameStateRef.current.npc : gameStateRef.current.player;
    const card = state.hand.find(c => c.uniqueId === cardId);
    
    if (!card || card.cardType !== CardType.SPELL || !card.spellEffect) return;
    
    const effect = card.spellEffect;
    const ownerName = owner === 'player' ? 'Você' : 'CPU';
    
    // Remove from hand and add to graveyard
    const setFn = owner === 'player' ? setPlayer : setNpc;
    const opponentSetFn = owner === 'player' ? setNpc : setPlayer;
    
    setFn(p => ({
      ...p,
      hand: p.hand.filter(c => c.uniqueId !== cardId),
      graveyard: [...p.graveyard, { ...card, destroyedAt: Date.now() }]
    }));
    
    addLog(`${ownerName} usou ${card.name}!`, 'spell');
    soundService.playBuff();
    
    // Apply effect
    if (effect.type === 'HEAL') {
      const healAmount = effect.value || 1000;
      // Validar target: OWNER/SELF cura o dono. SINGLE_ALLY agora cura o dono (monstros não têm HP).
      if (effect.target === 'OWNER' || effect.target === 'SELF' || !effect.target) {
        setFn(p => ({ ...p, hp: Math.min(8000, p.hp + healAmount) }));
        addLog(`${ownerName} recuperou ${healAmount} HP!`, 'effect');
      } else if (effect.target === 'SINGLE_ALLY' && targetId) {
        // Monsters don't have HP — heal the owner instead, but mention the targeted ally in the log
        const target = state.field.find(c => c.uniqueId === targetId);
        if (target) {
          setFn(p => ({ ...p, hp: Math.min(8000, p.hp + healAmount) }));
          addLog(`${ownerName} recuperou ${healAmount} HP (alvo: ${target.name})!`, 'effect');
        }
      }
    }
    else if (effect.type === 'DAMAGE') {
      const damage = effect.value || 500;
      if (effect.target === 'SINGLE_ENEMY' && targetId) {
        const target = opponent.field.find(c => c.uniqueId === targetId);
        if (target) {
          if (damage >= target.defense) {
            opponentSetFn(p => ({
              ...p,
              field: p.field.filter(c => c.uniqueId !== targetId),
              graveyard: [...p.graveyard, { ...target, destroyedAt: Date.now() }]
            }));
            addLog(`${card.name} destruiu ${target.name}!`, 'combat');
          } else {
            // Subtract defense from the single target (do not remove other cards)
            opponentSetFn(p => ({
              ...p,
              field: p.field.map(c => c.uniqueId === targetId ? { ...c, defense: Math.max(0, c.defense - damage) } : c)
            }));
            addLog(`${card.name} causou ${damage} de dano em ${target.name}!`, 'combat');
          }
        }
      }
      else if (effect.target === 'ALL_ENEMIES') {
        // Apply damage to each enemy: subtract from defense, destroy if <= 0
        const affected = opponent.field || [];
        const destroyed: Card[] = [];
        const damaged: Card[] = [];

        affected.forEach(c => {
          if (c.defense <= damage) {
            destroyed.push(c);
          } else {
            damaged.push({ ...c, defense: Math.max(0, c.defense - damage) });
          }
        });

        opponentSetFn(p => ({
          ...p,
          field: damaged,
          graveyard: [...p.graveyard, ...destroyed.map(c => ({ ...c, destroyedAt: Date.now() }))]
        }));

        // Logs per target for clarity
        destroyed.forEach(d => addLog(`${card.name} destruiu ${d.name}!`, 'combat'));
        damaged.forEach(d => addLog(`${card.name} causou ${damage} de dano em ${d.name}!`, 'combat'));
        addLog(`${card.name} causou ${damage} de dano em todos os inimigos!`, 'combat');
      }
      else if (effect.target === 'OWNER') {
        // OWNER = dano direto ao oponente (HP do oponente)
        opponentSetFn(p => ({ ...p, hp: Math.max(0, p.hp - damage) }));
        addLog(`${card.name} causou ${damage} de dano direto ao oponente!`, 'combat');
      }
    }
    else if (effect.type === 'BUFF') {
      const buffAmount = effect.value || 500;
      const statToIncrease = effect.stat; // undefined => apply to both
      const statName = statToIncrease ? (statToIncrease === 'DEFENSE' ? 'DEF' : 'ATK') : 'ATK/DEF';

      // Validar target: SINGLE_ALLY/SELF precisa de targetId; ALL_ALLIES aplica a todo o campo do dono
      if ((effect.target === 'SINGLE_ALLY' || effect.target === 'SELF') && targetId) {
        const target = state.field.find(c => c.uniqueId === targetId);
        if (target) {
          setFn(p => ({
            ...p,
            field: p.field.map(c => c.uniqueId === targetId ? (
              statToIncrease ? { ...c, [statToIncrease.toLowerCase()]: c[statToIncrease.toLowerCase() as 'attack' | 'defense'] + buffAmount }
              : { ...c, attack: c.attack + buffAmount, defense: c.defense + buffAmount }
            ) : c)
          }));
          addLog(`${target.name} ganhou +${buffAmount} ${statName}!`, 'effect');
        } else {
          addLog(`Alvo inválido para ${card.name}!`, 'effect');
        }
      } else if (effect.target === 'ALL_ALLIES') {
        // Apply buff to all allied cards on field
        setFn(p => ({
          ...p,
          field: p.field.map(c => (
            statToIncrease ? { ...c, [statToIncrease.toLowerCase()]: c[statToIncrease.toLowerCase() as 'attack' | 'defense'] + buffAmount }
            : { ...c, attack: c.attack + buffAmount, defense: c.defense + buffAmount }
          ))
        }));
        addLog(`${ownerName} aplicou +${buffAmount} ${statName} a todos os aliados!`, 'effect');
      } else {
        addLog(`Alvo inválido para ${card.name}!`, 'effect');
      }
    }
    else if (effect.type === 'DRAW') {
      const drawCount = effect.value || 2;
      setFn(p => {
        const drawn = p.deck.slice(0, drawCount);
        return {
          ...p,
          hand: [...p.hand, ...drawn],
          deck: p.deck.slice(drawCount)
        };
      });
      addLog(`${ownerName} comprou ${drawCount} carta(s)!`, 'effect');
    }
    else if (effect.type === 'DESTROY' && targetId) {
      const target = opponent.field.find(c => c.uniqueId === targetId);
      if (target) {
        opponentSetFn(p => ({
          ...p,
          field: p.field.filter(c => c.uniqueId !== targetId),
          graveyard: [...p.graveyard, { ...target, destroyedAt: Date.now() }]
        }));
        addLog(`${card.name} destruiu ${target.name}!`, 'combat');
      }
    }
    else if (effect.type === 'STATUS' && effect.statusEffect && targetId) {
      const target = opponent.field.find(c => c.uniqueId === targetId);
      if (target) {
        opponentSetFn(p => ({
          ...p,
          field: p.field.map(c => c.uniqueId === targetId ? applyStatusEffect(c, effect.statusEffect!, effect.duration || 3) : c)
        }));
        addLog(`${card.name} aplicou ${effect.statusEffect} em ${target.name}!`, 'status');
      }
    }
    else if (effect.type === 'REVIVE' && effect.target === 'GRAVEYARD') {
      if (state.graveyard.length > 0) {
        const toRevive = state.graveyard[state.graveyard.length - 1];
        const revivedCard = effect.value === 1
          ? { ...toRevive, hasAttacked: false }
          : { ...toRevive, attack: Math.floor(toRevive.attack / 2), hasAttacked: false };

        const revivedId = toRevive.uniqueId;
        setFn(p => {
          // remove only the first matching entry by uniqueId to avoid race conditions
          const newGrave: typeof p.graveyard = [];
          let removed = false;
          for (const g of p.graveyard) {
            if (!removed && g.uniqueId === revivedId) { removed = true; continue; }
            newGrave.push(g);
          }
          return {
            ...p,
            hand: [...p.hand, revivedCard],
            graveyard: newGrave
          };
        });
        addLog(`${ownerName} reviveu ${toRevive.name} para a mão!`, 'effect');
      }
    }
  }, [addLog]);

  return {
    gameStarted, gameOver, winner, player, npc, turnCount, currentTurnPlayer, phase, logs,
    isAIProcessing: isAnimating,
    attackingCardId, damagedCardId, floatingDamage,
    attackTargetId,
    difficulty, gameMode,
    startGame, 
    survivalWave,
    setPhase, 
    summonCard,
    setTrap,
    useSpell,
    executeAttack,
    startNextSurvivalWave,
    endTurn: () => {
      setPhase(Phase.DRAW);
      setCurrentTurnPlayer('npc');
      AIController.resetTurnCounters();
      setPlayer(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
      setNpc(p => ({ ...p, field: p.field.map(c => ({ ...c, hasAttacked: false })) }));
      addLog("Encerrando turno. CPU está pensando...");
    },
    addLog,
    // Reset game
    resetGame: () => {
      setGameStarted(false);
      setGameOver(false);
      setWinner(null);
      setTotalDamageDealt(0);
      setCardsDestroyed(0);
    }
  };
};