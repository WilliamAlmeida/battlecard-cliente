import React, { useState, useEffect } from 'react';
import { GameMode, AIDifficulty } from '../types';
import { statsService } from '../services/statsService';
import { collectionService } from '../services/collectionService';
import { campaignService } from '../services/campaignService';
import { achievementsService } from '../services/achievementsService';
import { soundService } from '../services/soundService';

interface MainMenuProps {
  onStartGame: (mode: GameMode, difficulty: AIDifficulty, bossId?: string, deckId?: string) => void;
  onOpenCollection: () => void;
  onOpenDeckBuilder: () => void;
  onOpenAchievements: () => void;
  onOpenStats: () => void;
  selectedDeckId: string | null;
  onSelectDeck: (deckId: string | null) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStartGame, 
  onOpenCollection, 
  onOpenDeckBuilder,
  onOpenAchievements,
  onOpenStats,
  selectedDeckId,
  onSelectDeck
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [difficulty, setDifficulty] = useState<AIDifficulty>(AIDifficulty.NORMAL);
  const [showCampaign, setShowCampaign] = useState(false);
  const [showSurvival, setShowSurvival] = useState(false);

  const stats = statsService.getStats();
  const collection = collectionService.getCollection();
  const campaignProgress = campaignService.getProgress();
  const achievementCount = achievementsService.getUnlockedCount();
  const totalAchievements = achievementsService.getTotalCount();

  const handleModeSelect = (mode: GameMode) => {
    soundService.playClick();
    if (mode === GameMode.CAMPAIGN) {
      setShowCampaign(true);
    } else if (mode === GameMode.SURVIVAL) {
      setShowSurvival(true);
    } else {
      setSelectedMode(mode);
    }
  };

  const handleStartQuickBattle = () => {
    soundService.playSummon();
    onStartGame(GameMode.QUICK_BATTLE, difficulty, undefined, selectedDeckId || undefined);
  };

  const handleStartCampaign = (bossId: string) => {
    soundService.playSummon();
    const boss = campaignService.getBoss(bossId);
    if (boss) {
      onStartGame(GameMode.CAMPAIGN, boss.difficulty, bossId, selectedDeckId || undefined);
    }
  };

  const handleStartSurvival = () => {
    soundService.playSummon();
    onStartGame(GameMode.SURVIVAL, difficulty, undefined, selectedDeckId || undefined);
  };

  const handleStartDraft = () => {
    soundService.playSummon();
    onStartGame(GameMode.DRAFT, difficulty, undefined, selectedDeckId || undefined);
  };

  // Deck selector component (reusable)
  const customDecks = collectionService.getCustomDecks();
  const DeckSelector = () => (
    <div className="bg-slate-800 p-8 rounded-3xl border-4 border-white/10 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Selecione seu Deck</h2>
      
      {customDecks.length === 0 ? (
        <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6 text-center mb-4">
          <p className="text-red-300 font-bold mb-2">⚠️ Nenhum deck personalizado encontrado!</p>
          <p className="text-sm text-slate-300 mb-3">Você está usando o deck padrão. Crie seu deck no Deck Builder!</p>
          <button
            onClick={onOpenDeckBuilder}
            className="bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded-xl font-bold"
          >
            🔧 Abrir Deck Builder
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 mb-4">
            {customDecks.map(deck => (
              <button
                key={deck.id}
                onClick={() => {
                  soundService.playClick();
                  onSelectDeck(deck.id);
                }}
                className={`
                  p-4 rounded-xl border-2 transition-all text-left
                  ${selectedDeckId === deck.id
                    ? 'bg-yellow-900/30 border-yellow-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                  }
                `}
              >
                <div className="font-bold">{deck.name}</div>
                <div className="text-sm text-slate-400">{deck.cards.length} cartas</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              soundService.playClick();
              onSelectDeck(null);
            }}
            className={`
              w-full p-3 rounded-xl border-2 transition-all text-center text-sm
              ${selectedDeckId === null
                ? 'bg-slate-600 border-slate-400'
                : 'bg-slate-700 border-slate-600 hover:border-slate-500'
              }
            `}
          >
            Usar Deck Padrão
          </button>
        </>
      )}
    </div>
  );

  if (showCampaign) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto">
        <div className="flex flex-col items-center justify-start min-h-screen p-8">
        <button 
          onClick={() => setShowCampaign(false)}
          className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
        >
          ← Voltar
        </button>

        <h1 className="text-5xl font-black text-yellow-500 italic mb-2 mt-8">CAMPANHA</h1>
        <p className="text-slate-400 mb-8">Progresso: {campaignProgress.defeated}/{campaignProgress.total} bosses derrotados</p>

        <div className="max-w-2xl mb-8">
          <DeckSelector />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {campaignService.getBosses().map(boss => (
            <div 
              key={boss.id}
              className={`
                relative p-6 rounded-2xl border-4 transition-all cursor-pointer
                ${boss.unlocked 
                  ? boss.defeated 
                    ? 'bg-green-900/30 border-green-600 hover:bg-green-900/50' 
                    : 'bg-slate-800 border-yellow-500 hover:bg-slate-700 hover:scale-105'
                  : 'bg-slate-900/50 border-slate-700 opacity-50 cursor-not-allowed'
                }
              `}
              onClick={() => boss.unlocked && handleStartCampaign(boss.id)}
            >
              {boss.defeated && (
                <div className="absolute top-2 right-2 text-3xl">✅</div>
              )}
              {!boss.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">🔒</span>
                </div>
              )}
              
              <div className="text-5xl mb-4">{boss.avatar}</div>
              <h3 className="text-2xl font-black mb-2">{boss.name}</h3>
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{boss.description}</p>
              
              <div className="flex justify-between items-center text-sm">
                <span className={`px-3 py-1 rounded-full font-bold ${
                  boss.difficulty === AIDifficulty.EASY ? 'bg-green-600' :
                  boss.difficulty === AIDifficulty.NORMAL ? 'bg-yellow-600' :
                  boss.difficulty === AIDifficulty.HARD ? 'bg-orange-600' :
                  'bg-red-600'
                }`}>
                  {boss.difficulty}
                </span>
                <span className="text-yellow-400">💰 {boss.reward.coins}</span>
              </div>
              
              {boss.specialRules && boss.specialRules.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-500 mb-2">Regras Especiais:</p>
                  {boss.specialRules.map(rule => (
                    <p key={rule.id} className="text-xs text-purple-400">{rule.name}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>        </div>      </div>
    );
  }

  if (selectedMode === GameMode.QUICK_BATTLE || selectedMode === GameMode.DRAFT) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <button 
          onClick={() => setSelectedMode(null)}
          className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
        >
          ← Voltar
        </button>

        <h1 className="text-5xl font-black text-yellow-500 italic mb-8">
          {selectedMode === GameMode.QUICK_BATTLE ? 'BATALHA RÁPIDA' : 'MODO DRAFT'}
        </h1>

        <DeckSelector />

        <div className="bg-slate-800 p-8 rounded-3xl border-4 border-white/10 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Selecione a Dificuldade</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.values(AIDifficulty).map(diff => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`
                  px-8 py-4 rounded-xl font-bold text-lg transition-all
                  ${difficulty === diff 
                    ? 'bg-yellow-500 text-black scale-105' 
                    : 'bg-slate-700 hover:bg-slate-600'
                  }
                `}
              >
                {diff === AIDifficulty.EASY && '😊 Fácil'}
                {diff === AIDifficulty.NORMAL && '😐 Normal'}
                {diff === AIDifficulty.HARD && '😤 Difícil'}
                {diff === AIDifficulty.EXPERT && '💀 Expert'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={selectedMode === GameMode.QUICK_BATTLE ? handleStartQuickBattle : handleStartDraft}
          className="bg-gradient-to-r from-red-600 to-orange-600 px-16 py-6 rounded-full text-3xl font-black hover:scale-110 transition-all shadow-2xl border-b-8 border-red-900"
        >
          {selectedMode === GameMode.QUICK_BATTLE ? '⚔️ INICIAR BATALHA!' : '🎴 INICIAR DRAFT!'}
        </button>
        </div>
      </div>
    );
  }

  if (showSurvival) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <button 
          onClick={() => setShowSurvival(false)}
          className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
        >
          ← Voltar
        </button>

        <h1 className="text-5xl font-black text-yellow-500 italic mb-4">MODO SURVIVAL</h1>
        <p className="text-slate-400 mb-8">Vença o máximo de batalhas seguidas! Seu recorde: <span className="text-yellow-400 font-bold">{stats.survivalBestWave} ondas</span></p>

        <DeckSelector />

        <div className="bg-slate-800 p-8 rounded-3xl border-4 border-white/10 mb-8 text-center">
          <h2 className="text-xl font-bold mb-4">Como funciona:</h2>
          <ul className="text-slate-400 space-y-2 text-left">
            <li>• Seu HP NÃO regenera entre batalhas</li>
            <li>• Cada onda, o inimigo fica mais forte</li>
            <li>• A cada 5 ondas, ganhe recompensas</li>
            <li>• Continue até perder!</li>
          </ul>
        </div>

        <button
          onClick={handleStartSurvival}
          className="bg-gradient-to-r from-purple-600 to-pink-600 px-16 py-6 rounded-full text-3xl font-black hover:scale-110 transition-all shadow-2xl border-b-8 border-purple-900"
        >
          🛡️ INICIAR SURVIVAL!
        </button>
        </div>
      </div>
    );
  }

  // Menu Principal
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-7xl md:text-8xl font-black mb-4 text-yellow-500 italic drop-shadow-2xl text-center select-none tracking-tighter">
        PokéCard Battle
      </h1>
      <p className="text-slate-400 mb-12 text-lg">Generation 1 Edition</p>

      {/* Stats rápidos */}
      <div className="flex gap-8 mb-12 flex-wrap justify-center">
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalWins}</div>
          <div className="text-xs text-slate-500 uppercase">Vitórias</div>
        </div>
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.bestStreak}</div>
          <div className="text-xs text-slate-500 uppercase">Melhor Streak</div>
        </div>
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-blue-400">{collectionService.getObtainedCardsCount()}/151</div>
          <div className="text-xs text-slate-500 uppercase">Coleção</div>
        </div>
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-400">{achievementCount}/{totalAchievements}</div>
          <div className="text-xs text-slate-500 uppercase">Conquistas</div>
        </div>
      </div>

      {/* Modos de Jogo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-4xl">
        <button
          onClick={() => handleModeSelect(GameMode.QUICK_BATTLE)}
          className="bg-gradient-to-br from-red-600 to-orange-600 p-8 rounded-3xl text-left hover:scale-105 transition-all shadow-2xl border-b-8 border-red-900 group"
        >
          <span className="text-5xl mb-4 block group-hover:animate-bounce">⚔️</span>
          <h3 className="text-2xl font-black">Batalha Rápida</h3>
          <p className="text-sm text-white/70">Enfrente a CPU em uma batalha única</p>
        </button>

        <button
          onClick={() => handleModeSelect(GameMode.CAMPAIGN)}
          className="bg-gradient-to-br from-blue-600 to-cyan-600 p-8 rounded-3xl text-left hover:scale-105 transition-all shadow-2xl border-b-8 border-blue-900 group"
        >
          <span className="text-5xl mb-4 block group-hover:animate-bounce">🏆</span>
          <h3 className="text-2xl font-black">Campanha</h3>
          <p className="text-sm text-white/70">Derrote os 8 líderes e a Elite Four</p>
          <div className="mt-2 text-xs bg-black/30 px-2 py-1 rounded-full inline-block">
            {campaignProgress.defeated}/{campaignProgress.total}
          </div>
        </button>

        <button
          onClick={() => handleModeSelect(GameMode.SURVIVAL)}
          className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-3xl text-left hover:scale-105 transition-all shadow-2xl border-b-8 border-purple-900 group"
        >
          <span className="text-5xl mb-4 block group-hover:animate-bounce">🛡️</span>
          <h3 className="text-2xl font-black">Survival</h3>
          <p className="text-sm text-white/70">Quantas ondas você aguenta?</p>
          <div className="mt-2 text-xs bg-black/30 px-2 py-1 rounded-full inline-block">
            Recorde: {stats.survivalBestWave}
          </div>
        </button>

        <button
          onClick={() => handleModeSelect(GameMode.DRAFT)}
          className="bg-gradient-to-br from-green-600 to-emerald-600 p-8 rounded-3xl text-left hover:scale-105 transition-all shadow-2xl border-b-8 border-green-900 group"
        >
          <span className="text-5xl mb-4 block group-hover:animate-bounce">🎴</span>
          <h3 className="text-2xl font-black">Draft</h3>
          <p className="text-sm text-white/70">Monte um deck único antes de jogar</p>
        </button>

        <button
          onClick={onOpenCollection}
          className="bg-gradient-to-br from-yellow-600 to-amber-600 p-8 rounded-3xl text-left hover:scale-105 transition-all shadow-2xl border-b-8 border-yellow-900 group"
        >
          <span className="text-5xl mb-4 block group-hover:animate-bounce">📚</span>
          <h3 className="text-2xl font-black">Coleção</h3>
          <p className="text-sm text-white/70">Veja suas cartas e abra pacotes</p>
          <div className="mt-2 text-xs bg-black/30 px-2 py-1 rounded-full inline-block">
            💰 {collection.coins} | 📦 {collection.packs}
          </div>
        </button>

        <button
          onClick={onOpenDeckBuilder}
          className="bg-gradient-to-br from-slate-600 to-slate-700 p-8 rounded-3xl text-left hover:scale-105 transition-all shadow-2xl border-b-8 border-slate-800 group"
        >
          <span className="text-5xl mb-4 block group-hover:animate-bounce">🔧</span>
          <h3 className="text-2xl font-black">Deck Builder</h3>
          <p className="text-sm text-white/70">Crie e edite seus decks</p>
        </button>
      </div>

      {/* Links secundários */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button 
          onClick={onOpenAchievements}
          className="bg-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          🏅 Conquistas <span className="text-sm text-slate-500">({achievementCount}/{totalAchievements})</span>
        </button>
        <button 
          onClick={onOpenStats}
          className="bg-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center gap-2"
        >
          📊 Estatísticas
        </button>
      </div>
      </div>
    </div>
  );
};
