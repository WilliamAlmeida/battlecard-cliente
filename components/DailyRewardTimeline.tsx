import React, { useState } from 'react';
import { dailyRewardService, DailyReward } from '../services/dailyRewardService';
import { soundService } from '../services/soundService';
import { GEN1_RAW } from '../pokemons/gen1';
import { Card, CardType } from '../types';
import { CardComponent } from './CardComponent';

interface DailyRewardTimelineProps {
  onClose: () => void;
  onClaim: (reward?: DailyReward | null) => void;
}

export const DailyRewardTimeline: React.FC<DailyRewardTimelineProps> = ({ onClose, onClaim }) => {
  
  const pending = dailyRewardService.getPendingReward();
  const pendingDay = pending?.day ?? 1;
  const claimedCount = Math.max(0, pendingDay - 1);
  const dailyAvailable = dailyRewardService.isClaimAvailable();

  const getCardById = (cardId: string): Card | null => {
    const rawCard = GEN1_RAW.find(c => c.id === cardId);
    if (!rawCard) return null;
    
    return {
      id: rawCard.id,
      uniqueId: `daily-${cardId}`,
      name: rawCard.name,
      type: rawCard.type,
      attack: rawCard.attack,
      defense: rawCard.defense,
      level: rawCard.level,
      rarity: rawCard.rarity,
      ability: rawCard.ability,
      imageUrl: rawCard.imageUrl,
      cardType: CardType.POKEMON,
      sacrificeRequired: rawCard.level,
      hasAttacked: false
    };
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-hidden select-none">
      <div className="flex flex-col h-full p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-black text-yellow-500 mb-2">🎁 Recompensas Diárias</h1>
            <p className="text-slate-400">Progresso: <span className="text-yellow-400 font-bold">{claimedCount}/30</span> dias reivindicados</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { soundService.playClick(); onClose(); }}
              className="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold"
            >
              ✕ Fechar
            </button>
          </div>
        </div>

        {/* Timeline Horizontal */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-8 h-full items-center px-8 py-4" style={{ minWidth: 'max-content' }}>
            {Array.from({ length: 30 }, (_, i) => {
              const day = i + 1;
              let state: 'claimed' | 'available' | 'upcoming' = 'upcoming';
              if (day < pendingDay) state = 'claimed';
              else if (day === pendingDay) state = dailyAvailable ? 'available' : 'upcoming';
              
              const rewardForDay = dailyRewardService.getRewardForDay(day);
              const isDay30 = day === 30;
              const hasCard = rewardForDay?.cards && rewardForDay.cards.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (state === 'available' && day === pendingDay && dailyAvailable) {
                      const reward = dailyRewardService.claim();
                      if (reward) {
                        soundService.playAchievement();
                        onClaim(reward);
                      } else {
                        soundService.playError();
                      }
                    }
                  }}
                  className={`
                    flex flex-col items-center gap-4 transition-all relative
                    ${state === 'available' ? 'scale-110 z-10 cursor-pointer' : ''}
                  `}
                >
                  {/* Connection Line */}
                  {day > 1 && (
                    <div className={`
                      absolute h-2 -left-8 top-6 w-8
                        ${day < pendingDay ? 'bg-gradient-to-r from-green-600 to-green-500' : 'bg-slate-700'}
                      ${state === 'available' ? 'animate-pulse' : ''}
                    `} />
                  )}

                  {/* Day Number Badge */}
                  <div className={`
                    px-5 py-2 rounded-full font-black text-lg shadow-lg relative z-10
                    ${isDay30 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 ring-4 ring-indigo-400 text-white animate-pulse' : 
                      state === 'claimed' ? 'bg-green-600 text-white' : 
                      state === 'available' ? 'bg-yellow-500 text-black shadow-yellow-500/50 shadow-2xl animate-bounce' : 
                      'bg-slate-700 text-slate-300'}
                  `}>
                    {isDay30 && '🌟 '}Dia {day}
                  </div>

                  {/* Reward Display */}
                  <div className={`
                    relative rounded-2xl border-4 p-6 transition-all shadow-xl
                    ${state === 'claimed' ? 'bg-slate-800/80 border-green-600 opacity-60 grayscale' : 
                      state === 'available' ? 'bg-gradient-to-br from-yellow-900/50 to-amber-900/50 border-yellow-500 shadow-yellow-500/30' : 
                      'bg-slate-800 border-slate-600'}
                    ${isDay30 ? 'ring-4 ring-purple-500/50' : ''}
                    ${state === 'available' ? 'animate-pulse' : ''}
                  `}
                  style={{ width: hasCard ? '300px' : '240px', minHeight: hasCard ? '420px' : '220px' }}
                  >
                    {/* State Icon */}
                    {state === 'claimed' && (
                      <div className="absolute -top-4 -right-4 text-5xl z-20 drop-shadow-lg">✅</div>
                    )}
                    {state === 'available' && (
                      <div className="absolute -top-4 -right-4 text-5xl z-20 animate-bounce drop-shadow-lg">🎯</div>
                    )}

                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      {/* Title */}
                      {rewardForDay?.title && (
                        <div className={`text-center font-bold text-lg ${state === 'available' ? 'text-yellow-300' : ''}`}>
                          {rewardForDay.title}
                        </div>
                      )}

                      {/* Card Display */}
                      {hasCard && rewardForDay.cards.length > 0 ? (
                        <div className="scale-95 transform hover:scale-100 transition-transform">
                          {rewardForDay.cards.map(cardId => {
                            const card = getCardById(cardId);
                            return card ? (
                              <CardComponent key={cardId} card={card} compact showDetails={true} />
                            ) : (
                              <div key={cardId} className="text-6xl">🎴</div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Coins/Packs Display */
                        <div className="flex flex-col gap-4 items-center">
                          {rewardForDay?.coins > 0 && (
                            <div className="flex items-center gap-3 text-3xl bg-slate-900/50 px-4 py-2 rounded-xl">
                              <span>💰</span>
                              <span className="font-bold text-yellow-400">{rewardForDay.coins}</span>
                            </div>
                          )}
                          {rewardForDay?.packs > 0 && (
                            <div className="flex items-center gap-3 text-3xl bg-slate-900/50 px-4 py-2 rounded-xl">
                              <span>📦</span>
                              <span className="font-bold text-blue-400">{rewardForDay.packs}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* State Label */}
                      <div className={`text-sm font-bold px-4 py-2 rounded-full ${
                        state === 'claimed' ? 'bg-green-600/30 text-green-300' :
                        state === 'available' ? 'bg-yellow-500/30 text-yellow-300 animate-pulse' :
                        'bg-slate-700/50 text-slate-400'
                      }`}>
                        {state === 'claimed' ? '✓ Reivindicado' :
                         state === 'available' ? '→ Disponível Agora' :
                         '○ Em breve'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
