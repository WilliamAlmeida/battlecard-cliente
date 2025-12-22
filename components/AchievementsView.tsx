import React from 'react';
import { achievementsService } from '../services/achievementsService';

interface AchievementsViewProps {
  onClose?: () => void;
  onBack?: () => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ onClose, onBack }) => {
  const handleClose = onClose || onBack || (() => {});
  const achievements = achievementsService.getAchievements();
  const unlockedCount = achievementsService.getUnlockedCount();
  const totalCount = achievementsService.getTotalCount();

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-yellow-500">🏅 Conquistas</h1>
            <p className="text-slate-400">
              {unlockedCount} / {totalCount} desbloqueadas
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="bg-slate-700 px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-slate-600"
          >
            ✕ <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-800 rounded-full h-4 mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`
                p-6 rounded-2xl border-2 transition-all relative
                ${achievement.unlocked 
                  ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-500' 
                  : 'bg-slate-800/50 border-slate-700 opacity-60'
                }
              `}
            >
              {achievement.unlocked && (
                <div className="absolute top-2 right-2 text-2xl">✅</div>
              )}
              
              <div className="text-5xl mb-4">{achievement.icon}</div>
              <h3 className="text-xl font-black mb-2">{achievement.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{achievement.description}</p>
              
              {/* Progress Bar */}
              {achievement.maxProgress && !achievement.unlocked && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progresso</span>
                    <span>{achievement.progress || 0} / {achievement.maxProgress}</span>
                  </div>
                  <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Reward */}
              {achievement.reward && (
                <div className="bg-black/30 px-3 py-2 rounded-lg text-sm inline-block">
                  <span className="text-slate-500">Recompensa: </span>
                  {achievement.reward.type === 'COINS' && (
                    <span className="text-yellow-400">💰 {achievement.reward.value} moedas</span>
                  )}
                  {achievement.reward.type === 'PACK' && (
                    <span className="text-blue-400">📦 {achievement.reward.value} pacote(s)</span>
                  )}
                  {achievement.reward.type === 'CARD' && (
                    <span className="text-purple-400">🎴 Carta especial</span>
                  )}
                  {achievement.reward.type === 'TITLE' && (
                    <span className="text-green-400">👑 {achievement.reward.value}</span>
                  )}
                </div>
              )}

              {achievement.unlocked && achievement.unlockedAt && (
                <div className="text-xs text-slate-600 mt-4">
                  Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
