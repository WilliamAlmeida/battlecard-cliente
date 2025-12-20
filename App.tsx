import React, { useState, useEffect } from 'react';
import { Card, Phase, ElementType, AIDifficulty, GameMode } from './types';
import { GameRules } from './utils/gameRules';
import { TypeTable } from './components/TypeTable';
import { useGameLogic } from './hooks/useGameLogic';
import { CardComponent } from './components/CardComponent';
import { BattleLog } from './components/BattleLog';
import { MainMenu } from './components/MainMenu';
import { CollectionView } from './components/CollectionView';
import { AchievementsView } from './components/AchievementsView';
import { StatsView } from './components/StatsView';
import { AchievementNotification } from './components/AchievementNotification';
import { DeckBuilderView } from './components/DeckBuilderView';
import { achievementsService } from './services/achievementsService';
import { campaignService } from './services/campaignService';
import { soundService } from './services/soundService';
import { getCardsByIds } from './constants';
import { collectionService } from './services/collectionService';
import { statsService } from './services/statsService';

type AppView = 'menu' | 'game' | 'collection' | 'achievements' | 'stats' | 'deckbuilder';

export default function App() {
  const {
    gameStarted, gameOver, winner, player, npc, turnCount, currentTurnPlayer, phase, logs,
    isAIProcessing, attackingCardId, damagedCardId, floatingDamage, difficulty, gameMode,
    startGame, setPhase, summonCard, setTrap, useSpell, executeAttack, endTurn, addLog, resetGame
  } = useGameLogic();

  const [currentView, setCurrentView] = useState<AppView>('menu');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tributeSelectionMode, setTributeSelectionMode] = useState(false);
  const [cardsToSacrifice, setCardsToSacrifice] = useState<string[]>([]);
  const [pendingSummonCardId, setPendingSummonCardId] = useState<string | null>(null);
  const [attackMode, setAttackMode] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'log' | 'types' | null>('log');
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [lastBossId, setLastBossId] = useState<string | null>(null);
  
  // Achievement notification
  const [achievementNotification, setAchievementNotification] = useState<{name: string, icon: string} | null>(null);

  // Listen for achievement unlocks
  useEffect(() => {
    achievementsService.setOnUnlockCallback((achievement) => {
      setAchievementNotification({ name: achievement.name, icon: achievement.icon });
      soundService.playAchievement();
    });
  }, []);

  // When game ends, show game over then allow return to menu
  useEffect(() => {
    if (gameOver && currentView === 'game') {
      // Game over screen is shown inline
    }
  }, [gameOver, currentView]);

  // If player finished a campaign boss, apply campaign rewards and mark defeated
  useEffect(() => {
    if (gameOver && winner === 'player' && gameMode === GameMode.CAMPAIGN && lastBossId) {
      const boss = campaignService.getBoss(lastBossId);
      if (boss) {
        // Grant rewards
        if (boss.reward?.coins) collectionService.addCoins(boss.reward.coins);
        if (boss.reward?.packs) collectionService.addPack(boss.reward.packs);
        if (boss.reward?.cards) boss.reward.cards.forEach(cardId => collectionService.addCard(cardId));

        // Mark boss defeated and record stats
        campaignService.defeatBoss(lastBossId);
        statsService.recordBossDefeated(lastBossId);

        addLog(`${boss.name} derrotado! Recebido: ${boss.reward?.coins || 0} moedas, ${boss.reward?.packs || 0} pacotes.`, 'info');
      }
    }
  }, [gameOver, winner, gameMode, lastBossId, addLog]);

  const isBusy = isAIProcessing || gameOver;

  const handlePhaseButton = () => {
    if (phase === Phase.MAIN) {
      setPhase(Phase.BATTLE);
      return;
    }

    // Ao encerrar o turno, limpar seleções e modos locais da UI
    setAttackMode(false);
    setSelectedCardId(null);
    setTributeSelectionMode(false);
    setCardsToSacrifice([]);
    setPendingSummonCardId(null);
    endTurn();
  };

  const handleCardClick = (card: Card, location: 'hand' | 'field') => {
    if (isBusy || currentTurnPlayer !== 'player') return;

    // Lógica de Sacrifício
    if (tributeSelectionMode) {
      const required = player.hand.find(c => c.uniqueId === pendingSummonCardId)?.sacrificeRequired || 0;
      if (card.uniqueId === pendingSummonCardId) {
        addLog("Você não pode sacrificar o próprio Pokémon que está tentando invocar!");
        return;
      }
      setCardsToSacrifice(prev => {
        if (prev.includes(card.uniqueId)) return prev.filter(id => id !== card.uniqueId);
        if (prev.length >= required) {
          addLog(`Você já selecionou ${required} sacrifício(s). Remova um para selecionar outro.`);
          return prev;
        }
        return [...prev, card.uniqueId];
      });
      return;
    }

    // Clique no Campo
    if (location === 'field') {
      if (phase === Phase.BATTLE) {
        if (!card.hasAttacked) {
          setSelectedCardId(card.uniqueId);
          setAttackMode(true);
          addLog(`Ataque: ${card.name} pronto! Escolha o alvo ou clique na carta novamente para cancelar.`);
        } else {
          addLog(`${card.name} já atacou e está exausto.`);
        }
      } else if (phase === Phase.MAIN) {
        addLog(`Você só pode atacar na BATTLE PHASE.`);
      }
      
      // Cancelar seleção ao clicar na mesma carta
      if (selectedCardId === card.uniqueId) {
        setSelectedCardId(null);
        setAttackMode(false);
        addLog("Ataque cancelado.");
      }
    }

    // Clique na Mão (Invocação)
    if (location === 'hand' && phase === Phase.MAIN) {
      // Handle SPELL cards
      if (card.cardType === 'SPELL') {
        const effect = card.spellEffect;
        if (effect?.target === 'SINGLE_ENEMY' || effect?.target === 'SINGLE_ALLY') {
          // Need to select target
          addLog(`Selecione um alvo para ${card.name}`);
          setSelectedCardId(card.uniqueId);
          setAttackMode(true); // Reuse attack mode for target selection
          return;
        } else {
          // Direct cast
          useSpell('player', card.uniqueId);
          return;
        }
      }

      // Handle TRAP cards
      if (card.cardType === 'TRAP') {
        if (player.trapZone.length >= 2) {
          addLog("Zona de armadilhas cheia! (máximo 2)");
          return;
        }
        setTrap('player', card.uniqueId);
        return;
      }

      // Verificar limite de campo
      if (player.field.length >= 3) {
        addLog("CAMPO CHEIO! Você não pode ter mais de 3 Pokémon simultâneos.");
        return;
      }

      if (card.sacrificeRequired === 0) {
        summonCard('player', card.uniqueId, []);
      } else {
        const availableTotal = player.field.length;
        if (availableTotal < card.sacrificeRequired) {
          addLog(`Sacrifícios insuficientes! ${card.name} exige ${card.sacrificeRequired} Pokémon no campo.`);
          return;
        }
        setPendingSummonCardId(card.uniqueId);
        setTributeSelectionMode(true);
        setCardsToSacrifice([]);
        addLog(`MODO SACRIFÍCIO: Selecione ${card.sacrificeRequired} Pokémon no campo para invocar ${card.name}.`);
      }
    }
  };

  const handleEnemyClick = (target: Card) => {
    if (attackMode && selectedCardId && !isBusy) {
      const selectedCard = player.hand.find(c => c.uniqueId === selectedCardId) || player.field.find(c => c.uniqueId === selectedCardId);
      if (selectedCard?.cardType === 'SPELL') {
        useSpell('player', selectedCardId, target.uniqueId);
        setAttackMode(false);
        setSelectedCardId(null);
      } else {
        executeAttack(selectedCardId, target.uniqueId, 'player');
        setAttackMode(false);
        setSelectedCardId(null);
      }
    }
  };

  const handleDirectAttack = () => {
    if (attackMode && selectedCardId && npc.field.length === 0 && !isBusy) {
      executeAttack(selectedCardId, null, 'player');
      setAttackMode(false);
      setSelectedCardId(null);
    }
  };

  // Handle starting a game from menu
  const handleStartGame = (mode: GameMode, difficulty: AIDifficulty, bossId?: string, deckId?: string) => {
    // Try to use the selected custom deck, or last one if not specified
    const customDecks = collectionService.getCustomDecks();
    let playerDeckBase = undefined;
    
    if (customDecks && customDecks.length > 0) {
      const targetDeck = deckId 
        ? customDecks.find(d => d.id === deckId)
        : customDecks[customDecks.length - 1];
      
      if (targetDeck) {
        playerDeckBase = getCardsByIds(targetDeck.cards);
        console.log('Using player custom deck:', targetDeck.name, 'with', targetDeck.cards.length, 'cards');
      }
    } else {
      console.log('No custom decks found, using default INITIAL_DECK');
    }

    if (mode === GameMode.CAMPAIGN && bossId) {
      const boss = campaignService.getBoss(bossId);
      if (boss) {
        // Build boss deck from their card IDs
        const bossDeck = getCardsByIds(boss.deck);
        console.log('Boss deck:', boss.deck, 'Cards found:', bossDeck.length, bossDeck.map(c => c.name));
        startGame({
          difficulty: boss.difficulty,
          mode: mode,
          npcHp: boss.hp,
          npcDeck: bossDeck,
          customDeck: playerDeckBase
        });
        setLastBossId(bossId);
      }
    } else {
      startGame({
        difficulty: difficulty,
        mode: mode,
        customDeck: playerDeckBase
      });
      setLastBossId(null);
    }
    setCurrentView('game');
  };

  // Return to menu
  const handleBackToMenu = () => {
    resetGame();
    setCurrentView('menu');
  };

  // Render different views
  if (currentView === 'menu') {
    return (
      <>
        <MainMenu
          onStartGame={handleStartGame}
          onOpenCollection={() => setCurrentView('collection')}
          onOpenDeckBuilder={() => setCurrentView('deckbuilder')}
          onOpenAchievements={() => setCurrentView('achievements')}
          onOpenStats={() => setCurrentView('stats')}
          selectedDeckId={selectedDeckId}
          onSelectDeck={setSelectedDeckId}
        />
        <AchievementNotification
          achievement={achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
      </>
    );
  }

  if (currentView === 'collection') {
    return (
      <>
        <CollectionView onBack={() => setCurrentView('menu')} />
        <AchievementNotification
          achievement={achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
      </>
    );
  }

  if (currentView === 'achievements') {
    return (
      <>
        <AchievementsView onBack={() => setCurrentView('menu')} />
        <AchievementNotification
          achievement={achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
      </>
    );
  }

  if (currentView === 'stats') {
    return (
      <>
        <StatsView onBack={() => setCurrentView('menu')} />
        <AchievementNotification
          achievement={achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
      </>
    );
  }

  if (currentView === 'deckbuilder') {
    return (
      <>
        <DeckBuilderView onBack={() => setCurrentView('menu')} />
        <AchievementNotification
          achievement={achievementNotification}
          onClose={() => setAchievementNotification(null)}
        />
      </>
    );
  }

  // Game view
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden relative font-sans select-none">
      
      {/* Achievement notification overlay */}
      <AchievementNotification
        achievement={achievementNotification}
        onClose={() => setAchievementNotification(null)}
      />
      
      {/* HUD Superior */}
      <header className="flex justify-between p-6 bg-slate-800/95 border-b-4 border-white/5 z-30 shadow-2xl">
        {/* Back to Menu Button */}
        <button 
          onClick={handleBackToMenu}
          className="absolute top-4 left-4 z-40 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          ← Menu
        </button>
        
        <div className="flex items-center gap-6 ml-20">
          <div className="w-20 h-20 bg-red-600 rounded-3xl border-4 border-white flex items-center justify-center text-5xl shadow-lg">🤖</div>
          <div className="relative">
             <div className="w-80 h-10 bg-black rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700" style={{width: `${(npc.hp/8000)*100}%`}}></div>
             </div>
             <span className="absolute inset-0 flex items-center justify-center text-lg font-black drop-shadow-md">{npc.hp} / 8000 LP</span>
             {floatingDamage?.targetId === 'npc-hp' && <div className="damage-popup right-0 top-0 text-5xl">-{floatingDamage.value}</div>}
          </div>
        </div>
        {/* side panels are controlled via their own toggles — no header buttons here */}
        
        <div className="text-center bg-black/30 px-12 py-3 rounded-3xl border-2 border-white/10 shadow-2xl">
          <div className="text-4xl font-black text-yellow-500 tracking-tighter italic">TURNO {turnCount}</div>
          <div className={`text-xl font-black uppercase tracking-widest ${currentTurnPlayer === 'player' ? 'text-blue-400 animate-pulse' : 'text-red-400'}`}>
            {currentTurnPlayer === 'player' ? 'SEU TURNO' : 'CPU JOGANDO'}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative text-right">
             <div className="w-80 h-10 bg-black rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700" style={{width: `${(player.hp/8000)*100}%`}}></div>
             </div>
             <span className="absolute inset-0 flex items-center justify-center text-lg font-black drop-shadow-md">{player.hp} / 8000 LP</span>
             {floatingDamage?.targetId === 'player-hp' && <div className="damage-popup left-0 top-0 text-5xl">-{floatingDamage.value}</div>}
          </div>
          <div className="w-20 h-20 bg-blue-600 rounded-3xl border-4 border-white flex items-center justify-center text-5xl shadow-lg">👤</div>
        </div>
      </header>

      {/* Campo Central */}
      <main className="flex-1 flex flex-col items-center justify-center gap-20 relative p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
        
        {/* Campo Oponente */}
        <div className="flex gap-12 min-h-[260px] items-center">
           {npc.field.map(card => (
             <div key={card.uniqueId} onClick={() => handleEnemyClick(card)} className={`cursor-pointer transition-transform ${attackMode ? 'hover:scale-110' : ''}`}>
               <CardComponent 
                 card={card} 
                 isAttacking={attackingCardId === card.uniqueId} 
                 isDamaged={damagedCardId === card.uniqueId}
               />
             </div>
           ))}
           {npc.field.length === 0 && <div className="text-white/5 font-black text-8xl uppercase tracking-tighter italic opacity-20">Oponente Limpo</div>}
        </div>

        {/* Linha de Combate */}
        <div className="w-full h-1 bg-white/5 flex items-center justify-center relative">
           {attackMode && npc.field.length === 0 && (
             <button onClick={handleDirectAttack} className="bg-gradient-to-r from-red-600 to-orange-600 px-16 py-6 rounded-full font-black text-3xl animate-bounce shadow-[0_0_80px_rgba(220,38,38,0.7)] border-4 border-white transition-all hover:scale-110 active:scale-90">⚔️ ATAQUE DIRETO!</button>
           )}
           {attackMode && npc.field.length > 0 && (
             <div className="bg-yellow-500 text-black px-10 py-3 rounded-full font-black text-2xl animate-pulse shadow-2xl border-4 border-black">SELECIONE UM POKÉMON INIMIGO</div>
           )}
        </div>

        {/* Campo Player */}
        <div className="flex gap-12 min-h-[260px] items-center">
           {player.field.map(card => (
             <div
               key={card.uniqueId}
               onClick={() => handleCardClick(card, 'field')}
               className={`transition-all duration-300 ${selectedCardId === card.uniqueId ? '-translate-y-12 shadow-[0_50px_100px_rgba(250,204,21,0.4)]' : ''} ${cardsToSacrifice.includes(card.uniqueId) ? 'opacity-30 scale-95 grayscale' : ''}`}
             >
               <CardComponent 
                 card={card} 
                 isAttacking={attackingCardId === card.uniqueId} 
                 isDamaged={damagedCardId === card.uniqueId}
                 canAttack={!card.hasAttacked && phase === Phase.BATTLE && currentTurnPlayer === 'player'}
               />
             </div>
           ))}
           {player.field.length === 0 && <div className="text-white/5 font-black text-8xl uppercase tracking-tighter italic opacity-20">Seu Campo Limpo</div>}
        </div>

        {/* Trap Zone (Player) */}
        {player.trapZone.length > 0 && (
          <div className="absolute bottom-4 right-4 flex gap-3">
            {player.trapZone.map(trap => (
              <div key={trap.uniqueId} className="scale-75">
                <CardComponent card={trap} compact />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer / Mão */}
      <footer className="bg-slate-950 p-10 border-t-8 border-white/5 z-30 shadow-[0_-30px_60px_rgba(0,0,0,0.6)] min-h-[400px]">
         <div className="flex justify-between items-center mb-10">
            <div className="flex gap-10 items-center">
               <div className="flex flex-col bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Fase Atual</span>
                  <span className="text-3xl font-black uppercase text-yellow-500 drop-shadow-md">{phase} PHASE</span>
               </div>
               
               {currentTurnPlayer === 'player' && !isBusy && (
                 <button 
                  onClick={handlePhaseButton}
                  className="bg-gradient-to-b from-yellow-400 to-orange-600 px-16 py-6 rounded-3xl text-3xl font-black uppercase hover:scale-110 active:scale-95 transition-all shadow-2xl border-b-8 border-orange-900 text-black italic tracking-tighter"
                 >
                   {phase === Phase.MAIN ? '➔ Batalhar!' : '➔ Encerrar Turno'}
                 </button>
               )}
            </div>

            {tributeSelectionMode && (
              <div className="flex gap-6 bg-red-950/40 p-6 rounded-3xl border-2 border-red-500/50 animate-pulse">
                 <div className="flex flex-col justify-center mr-8">
                    <span className="text-sm font-bold text-red-400 uppercase tracking-widest">Aguardando Sacrifícios</span>
                    <span className="text-lg font-black">Selecione {player.hand.find(c => c.uniqueId === pendingSummonCardId)?.sacrificeRequired || 0} cartas (mão ou campo)</span>
                 </div>
                 <button onClick={() => {
                   const card = player.hand.find(c => c.uniqueId === pendingSummonCardId);
                   if (card && cardsToSacrifice.length === card.sacrificeRequired) {
                     summonCard('player', pendingSummonCardId!, cardsToSacrifice);
                     setTributeSelectionMode(false);
                   } else { addLog(`Erro: Escolha exatamente ${card?.sacrificeRequired} Pokémon.`); }
                 }} className="bg-green-600 px-12 py-5 rounded-2xl font-black text-xl hover:bg-green-500 transition-colors shadow-2xl border-b-4 border-green-800">CONFIRMAR</button>
                 <button onClick={() => setTributeSelectionMode(false)} className="bg-slate-700 px-12 py-5 rounded-2xl font-black text-xl hover:bg-slate-600 transition-colors">CANCELAR</button>
              </div>
            )}
         </div>

         {/* Mão do Jogador */}
         <div className="flex gap-8 h-64 md:h-80 items-center justify-center pb-6 scrollbar-hide max-w-screen-2xl w-fit mx-auto -translate-y-32">
            {player.hand.map((card, idx) => (
              <div 
                key={card.uniqueId} 
                onClick={() => handleCardClick(card, 'hand')} 
                className={`shrink-0 transition-all duration-500 cursor-pointer hover:-translate-y-20 hover:scale-125 hover:z-50 ${cardsToSacrifice.includes(card.uniqueId) ? 'opacity-10 scale-50 grayscale blur-sm' : ''} ${tributeSelectionMode && pendingSummonCardId === card.uniqueId ? 'ring-8 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] rounded-2xl' : ''}`}
                style={{ zIndex: 10 + idx }}
              >
                <CardComponent card={card} compact />
              </div>
            ))}
         </div>
      </footer>

      {/* Painéis laterais: Log ou Tabela de Tipos (toggle) */}
      <BattleLog
        logs={logs}
        isOpen={activeSidePanel === 'log'}
        onToggle={() => setActiveSidePanel(v => v === 'log' ? null : 'log')}
      />

      <TypeTable
        isOpen={activeSidePanel === 'types'}
        onToggle={() => setActiveSidePanel(v => v === 'types' ? null : 'types')}
      />

      {/* Tela de Fim de Jogo */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/98 z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 backdrop-blur-3xl">
           <div className={`text-[10rem] md:text-[15rem] font-black italic mb-12 drop-shadow-[0_0_100px_rgba(255,255,255,0.2)] ${winner === 'player' ? 'text-yellow-500' : 'text-red-600'}`}>
              {winner === 'player' ? 'VITÓRIA!' : 'DERROTA!'}
           </div>
           <div className="flex gap-8">
             <button 
               onClick={() => handleStartGame(gameMode, difficulty, lastBossId || undefined, selectedDeckId || undefined)} 
               className="bg-white text-black px-24 py-8 rounded-full font-black text-4xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)]"
             >
               🔄 REVANCHE
             </button>
             <button 
               onClick={handleBackToMenu} 
               className="bg-slate-700 text-white px-16 py-8 rounded-full font-black text-4xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(0,0,0,0.3)]"
             >
               📋 MENU
             </button>
           </div>
        </div>
      )}
    </div>
  );
}