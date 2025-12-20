import React, { useState, useEffect } from 'react';
import { Card, Phase } from './types';
import { useGameLogic } from './hooks/useGameLogic';
import { CardComponent } from './components/CardComponent';
import { BattleLog } from './components/BattleLog';

export default function App() {
  const {
    gameStarted, gameOver, winner, player, npc, turnCount, currentTurnPlayer, phase, logs,
    isAIProcessing, attackingCardId, damagedCardId, floatingDamage,
    startGame, setPhase, summonCard, executeAttack, endTurn, addLog
  } = useGameLogic();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tributeSelectionMode, setTributeSelectionMode] = useState(false);
  const [cardsToSacrifice, setCardsToSacrifice] = useState<string[]>([]);
  const [pendingSummonCardId, setPendingSummonCardId] = useState<string | null>(null);
  const [attackMode, setAttackMode] = useState(false);

  // Auto-start the game on mount to help debug blank screen in dev.
  useEffect(() => {
    if (!gameStarted) startGame();
    // intentionally run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isBusy = isAIProcessing || gameOver;

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
      executeAttack(selectedCardId, target.uniqueId, 'player');
      setAttackMode(false);
      setSelectedCardId(null);
    }
  };

  const handleDirectAttack = () => {
    if (attackMode && selectedCardId && npc.field.length === 0 && !isBusy) {
      executeAttack(selectedCardId, null, 'player');
      setAttackMode(false);
      setSelectedCardId(null);
    }
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 px-4">
        <h1 className="text-7xl md:text-9xl font-black mb-12 text-yellow-500 italic drop-shadow-2xl text-center select-none tracking-tighter">PokéCard Battle</h1>
        <button onClick={startGame} className="bg-red-600 px-20 py-10 rounded-[2.5rem] text-4xl md:text-5xl font-black hover:bg-red-500 transition-all border-b-[16px] border-red-900 active:border-b-0 active:translate-y-4 shadow-2xl">JOGAR AGORA</button>
        <p className="mt-12 text-slate-500 font-bold uppercase tracking-[0.5em] text-xl">Desktop Premium Edition</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white overflow-hidden relative font-sans select-none">
      
      {/* HUD Superior */}
      <header className="flex justify-between p-6 bg-slate-800/95 border-b-4 border-white/5 z-30 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-red-600 rounded-3xl border-4 border-white flex items-center justify-center text-5xl shadow-lg">🤖</div>
          <div className="relative">
             <div className="w-80 h-10 bg-black rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-700" style={{width: `${(npc.hp/4000)*100}%`}}></div>
             </div>
             <span className="absolute inset-0 flex items-center justify-center text-lg font-black drop-shadow-md">{npc.hp} / 4000 LP</span>
             {floatingDamage?.targetId === 'npc-hp' && <div className="damage-popup right-0 top-0 text-5xl">-{floatingDamage.value}</div>}
          </div>
        </div>
        
        <div className="text-center bg-black/30 px-12 py-3 rounded-3xl border-2 border-white/10 shadow-2xl">
          <div className="text-4xl font-black text-yellow-500 tracking-tighter italic">TURNO {turnCount}</div>
          <div className={`text-xl font-black uppercase tracking-widest ${currentTurnPlayer === 'player' ? 'text-blue-400 animate-pulse' : 'text-red-400'}`}>
            {currentTurnPlayer === 'player' ? 'SEU TURNO' : 'CPU JOGANDO'}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative text-right">
             <div className="w-80 h-10 bg-black rounded-full border-2 border-white/20 overflow-hidden shadow-inner">
                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-700" style={{width: `${(player.hp/4000)*100}%`}}></div>
             </div>
             <span className="absolute inset-0 flex items-center justify-center text-lg font-black drop-shadow-md">{player.hp} / 4000 LP</span>
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
      </main>

      {/* Footer / Mão */}
      <footer className="bg-slate-950 p-10 border-t-8 border-white/5 z-30 shadow-[0_-30px_60px_rgba(0,0,0,0.6)] min-h-[400px]">
         <div className="flex justify-between items-center mb-10 max-w-screen-2xl mx-auto">
            <div className="flex gap-10 items-center">
               <div className="flex flex-col bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                  <span className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Fase Atual</span>
                  <span className="text-3xl font-black uppercase text-yellow-500 drop-shadow-md">{phase} PHASE</span>
               </div>
               
               {currentTurnPlayer === 'player' && !isBusy && (
                 <button 
                  onClick={() => phase === Phase.MAIN ? setPhase(Phase.BATTLE) : endTurn()} 
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
         <div className="flex gap-8 h-64 md:h-80 items-center justify-center pb-6 scrollbar-hide max-w-screen-2xl mx-auto">
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

      {/* NOVO LOG LATERAL */}
      <BattleLog logs={logs} />

      {/* Tela de Fim de Jogo */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/98 z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 backdrop-blur-3xl">
           <div className={`text-[15rem] font-black italic mb-12 drop-shadow-[0_0_100px_rgba(255,255,255,0.2)] ${winner === 'player' ? 'text-yellow-500' : 'text-red-600'}`}>
              {winner === 'player' ? 'VITÓRIA!' : 'DERROTA!'}
           </div>
           <button onClick={startGame} className="bg-white text-black px-32 py-10 rounded-full font-black text-5xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)]">REVANCHE</button>
        </div>
      )}
    </div>
  );
}