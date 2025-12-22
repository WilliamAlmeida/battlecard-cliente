import React from 'react';
import { statsService } from '../services/statsService';
import { StatusEffect, GameMode } from '../types';

interface StatsViewProps {
  onClose?: () => void;
  onBack?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ onClose, onBack }) => {
  const handleClose = onClose || onBack || (() => {});
  const stats = statsService.getStats();
  const winRate = statsService.getWinRate();

  const getModeLabel = (mode: GameMode) => {
    switch (mode) {
      case GameMode.QUICK_BATTLE: return '⚔️ Batalha Rápida';
      case GameMode.CAMPAIGN: return '🏆 Campanha';
      case GameMode.SURVIVAL: return '🛡️ Survival';
      case GameMode.BOSS_RUSH: return '👹 Boss Rush';
      case GameMode.DRAFT: return '🎴 Draft';
    }
  };

  const getStatusIcon = (status: StatusEffect) => {
    switch (status) {
      case StatusEffect.BURN: return '🔥';
      case StatusEffect.FREEZE: return '🧊';
      case StatusEffect.PARALYZE: return '⚡';
      case StatusEffect.POISON: return '☠️';
      case StatusEffect.SLEEP: return '😴';
      case StatusEffect.CONFUSE: return '😵';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-yellow-500">📊 Estatísticas</h1>
            <p className="text-slate-400">Seu histórico de batalhas</p>
          </div>
          <button 
            onClick={handleClose}
            className="bg-slate-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-slate-600"
          >
            ✕ <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-600/30 to-green-800/30 p-6 rounded-2xl border-2 border-green-600 text-center">
            <div className="text-5xl font-black text-green-400">{stats.totalWins}</div>
            <div className="text-sm text-slate-400">Vitórias</div>
          </div>
          <div className="bg-gradient-to-br from-red-600/30 to-red-800/30 p-6 rounded-2xl border-2 border-red-600 text-center">
            <div className="text-5xl font-black text-red-400">{stats.totalLosses}</div>
            <div className="text-sm text-slate-400">Derrotas</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-600/30 to-yellow-800/30 p-6 rounded-2xl border-2 border-yellow-600 text-center">
            <div className="text-5xl font-black text-yellow-400">{winRate}%</div>
            <div className="text-sm text-slate-400">Taxa de Vitória</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600/30 to-purple-800/30 p-6 rounded-2xl border-2 border-purple-600 text-center">
            <div className="text-5xl font-black text-purple-400">{stats.bestStreak}</div>
            <div className="text-sm text-slate-400">Melhor Streak</div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Combat Stats */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-red-400">⚔️ Combate</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Dano Total Causado</span>
                <span className="font-bold">{stats.totalDamageDealt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dano Total Recebido</span>
                <span className="font-bold">{stats.totalDamageReceived.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pokémon Destruídos</span>
                <span className="font-bold">{stats.cardsDestroyed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pokémon Perdidos</span>
                <span className="font-bold">{stats.cardsLost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vitórias Perfeitas</span>
                <span className="font-bold text-yellow-400">{stats.perfectWins}</span>
              </div>
            </div>
          </div>

          {/* Special Stats */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-purple-400">✨ Especial</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Magias Usadas</span>
                <span className="font-bold">{stats.spellsUsed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Armadilhas Ativadas</span>
                <span className="font-bold">{stats.trapsActivated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Habilidades Ativadas</span>
                <span className="font-bold">{stats.abilitiesTriggered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bosses Derrotados</span>
                <span className="font-bold text-orange-400">{stats.bossesDefeated.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Melhor Onda Survival</span>
                <span className="font-bold text-blue-400">{stats.survivalBestWave}</span>
              </div>
            </div>
          </div>

          {/* Status Effects */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-orange-400">💫 Status Infligidos</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(stats.statusInflicted)
                .filter(([status]) => status !== StatusEffect.NONE)
                .map(([status, count]) => (
                  <div key={status} className="flex justify-between bg-black/30 px-3 py-2 rounded-lg">
                    <span>{getStatusIcon(status as StatusEffect)} {status}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Games by Mode */}
          <div className="bg-slate-800 p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 text-blue-400">🎮 Jogos por Modo</h3>
            <div className="space-y-3">
              {Object.entries(stats.gamesPlayedByMode).map(([mode, count]) => (
                <div key={mode} className="flex justify-between">
                  <span className="text-slate-400">{getModeLabel(mode as GameMode)}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Info */}
        <div className="mt-6 bg-slate-800 p-6 rounded-2xl text-center">
          <div className="text-lg text-slate-400 mb-2">Streak Atual</div>
          <div className="text-6xl font-black text-yellow-400">
            {stats.currentStreak} 🔥
          </div>
        </div>
      </div>
    </div>
  );
};
