import React, { useState, useEffect } from 'react';
import { GameMode, AIDifficulty } from '../types';
import { statsService } from '../services/statsService';
import { collectionService } from '../services/collectionService';
import { campaignService } from '../services/campaignService';
import { achievementsService } from '../services/achievementsService';
import { dailyRewardService } from '../services/dailyRewardService';
import { soundService } from '../services/soundService';
import { DailyRewardTimeline } from './DailyRewardTimeline';

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
  const [showCampaignCategory, setShowCampaignCategory] = useState(false);
  const [selectedCampaignCategory, setSelectedCampaignCategory] = useState<string | null>(null);
  const [showSurvival, setShowSurvival] = useState(false);
  const [deckSelectorOpen, setDeckSelectorOpen] = useState(false);
  const [showDailyTimeline, setShowDailyTimeline] = useState(false);

  const stats = statsService.getStats();
  const collection = collectionService.getCollection();
  const campaignProgress = campaignService.getProgress();
  const achievementCount = achievementsService.getUnlockedCount();
  const totalAchievements = achievementsService.getTotalCount();
  const [dailyAvailable, setDailyAvailable] = useState<boolean>(false);
  const [dailyRewardPreview, setDailyRewardPreview] = useState<any>(null);

  const handleModeSelect = (mode: GameMode) => {
    soundService.playClick();
    if (mode === GameMode.CAMPAIGN) {
      setShowCampaignCategory(true);
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

  useEffect(() => {
    setDailyAvailable(dailyRewardService.isClaimAvailable());
    setDailyRewardPreview(null);
  }, []);

  const handleTimelineRefresh = (reward?: any) => {
    setDailyAvailable(dailyRewardService.isClaimAvailable());
    if (reward) {
      // Update preview/state but DO NOT open the reveal modal — timeline shows the visual
      setDailyRewardPreview(reward);
    } else {
      setDailyRewardPreview(dailyRewardService.getPendingReward());
    }
  };

  // Deck selector component (reusable) - compact view + overlay
  const customDecks = collectionService.getCustomDecks();
  const currentDeck = customDecks.find(d => d.id === selectedDeckId);
  const DeckSelector = () => {
    return (
      <>
        <div className="bg-slate-800 p-4 rounded-3xl border-4 border-white/10 mb-8 flex items-center justify-between min-w-80">
          {customDecks.length > 0 && (
          <div>
            <div className="font-bold">{currentDeck ? currentDeck.name : 'Selecione um Deck'}</div>
            <div className="text-sm text-slate-400">{currentDeck ? `${currentDeck.cards.length} cartas` : ''}</div>
          </div>
          )}

            {customDecks.length === 0 ? (
              <button
                onClick={() => { soundService.playClick(); onOpenDeckBuilder(); }}
                className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-xl font-bold w-full"
              >
                Criar Deck
              </button>
            ) : (
              <button
                onClick={() => { soundService.playClick(); setDeckSelectorOpen(true); }}
                className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded-xl font-bold"
              >
                {!selectedDeckId
                  ? 'Selecionar'
                  : currentDeck && currentDeck.cards.length === 0
                    ? 'Trocar'
                    : 'Trocar'
                }
              </button>
            )}
        </div>

        {deckSelectorOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-8 overflow-y-auto">
            <div className="bg-slate-800 p-8 rounded-3xl border-4 border-white/10 w-full max-w-2xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Selecione seu Deck</h2>
                <button
                  onClick={() => { soundService.playClick(); setDeckSelectorOpen(false); }}
                  className="bg-slate-700 px-4 py-2 rounded-xl hover:bg-slate-600"
                >
                  Fechar
                </button>
              </div>

              {customDecks.length === 0 ? (
                <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-6 text-center mb-4">
                  <p className="text-red-300 font-bold mb-2">⚠️ Nenhum deck personalizado encontrado!</p>
                  <p className="text-sm text-slate-300 mb-3">Você está usando o deck padrão. Crie seu deck no Deck Builder!</p>
                  <button
                    onClick={() => { soundService.playClick(); setDeckSelectorOpen(false); onOpenDeckBuilder(); }}
                    className="bg-yellow-600 hover:bg-yellow-500 px-6 py-2 rounded-xl font-bold"
                  >
                    🔧 Abrir Deck Builder
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3 mb-4 max-h-60 overflow-y-auto px-2">
                    {customDecks.map((deck, idx) => (
                      <button
                        key={deck.id}
                        onClick={() => {
                          soundService.playClick();
                          onSelectDeck(deck.id);
                          setDeckSelectorOpen(false);
                        }}
                        className={`p-2 rounded-xl border-2 transition-all text-left ${selectedDeckId === deck.id ? 'bg-yellow-900/30 border-yellow-500' : 'bg-slate-700 border-slate-600 hover:border-slate-500'}`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          {deck.name}
                          {idx === 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500 text-xs text-black font-bold">Padrão</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">{deck.cards.length} cartas</div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      soundService.playClick();
                      if (customDecks.length > 0) {
                        onSelectDeck(customDecks[0].id);
                      }
                      setDeckSelectorOpen(false);
                    }}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-center text-sm ${selectedDeckId === (customDecks[0]?.id ?? null) ? 'bg-slate-600 border-slate-400' : 'bg-slate-700 border-slate-600 hover:border-slate-500'}`}
                  >
                    Usar Deck Padrão
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  // Calendar helpers
  const pending = dailyRewardService.getPendingReward();
  const pendingDay = pending?.day ?? 1;
  const claimedCount = Math.max(0, pendingDay - 1);

  // Campaign Category Selection Screen
  if (showCampaignCategory) {
    const categories = campaignService.getCategories();
    
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto select-none">
        <div className="flex flex-col items-center justify-start min-h-screen p-8">
          <button 
            onClick={() => setShowCampaignCategory(false)}
            className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
          >
            👈 Voltar
          </button>

          <h1 className="text-5xl font-black text-yellow-500 italic mb-2 mt-24 sm:mt-12 text-center">SELECIONE SUA JORNADA</h1>
          <p className="text-slate-400 mb-12 text-center">Escolha qual campanha você deseja enfrentar</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
            {categories.map(category => {
              const progress = campaignService.getCategoryProgress(category.id);
              const isCompleted = progress.defeated === progress.total;
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    if (category.unlocked) {
                      soundService.playClick();
                      setSelectedCampaignCategory(category.id);
                      setShowCampaign(true);
                      setShowCampaignCategory(false);
                    }
                  }}
                  disabled={!category.unlocked}
                  className={`
                    relative p-8 rounded-3xl border-4 transition-all text-left
                    ${category.unlocked
                      ? `bg-gradient-to-br ${category.color} hover:scale-105 cursor-pointer shadow-2xl border-white/20`
                      : 'bg-slate-900/50 border-slate-700 opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  {!category.unlocked && (
                    <div className="absolute inset-0 flex items-start justify-end pt-2 z-10">
                      <span className="text-8xl">🔒</span>
                    </div>
                  )}
                  
                  {isCompleted && category.unlocked && (
                    <div className="absolute top-4 right-4 text-4xl animate-pulse">✅</div>
                  )}

                  <div className="text-7xl mb-6">{category.icon}</div>
                  <h2 className="text-4xl font-black mb-3">{category.name}</h2>
                  <p className="text-white/80 mb-6 text-lg">{category.description}</p>
                  
                  {category.unlocked && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white/60">Progresso</span>
                        <span className="text-sm font-bold">
                          {progress.defeated}/{progress.total}
                        </span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-yellow-400 h-full transition-all rounded-full"
                          style={{ width: `${(progress.defeated / progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-12 text-center text-slate-500 max-w-2xl">
            <p className="text-sm">💡 Complete cada campanha para desbloquear a próxima!</p>
          </div>
        </div>
      </div>
    );
  }

  if (showCampaign) {
    const bosses = selectedCampaignCategory 
      ? campaignService.getBossesByCategory(selectedCampaignCategory)
      : campaignService.getBosses();
    
    const categoryInfo = selectedCampaignCategory 
      ? campaignService.getCategories().find(c => c.id === selectedCampaignCategory)
      : null;
    
    const progress = selectedCampaignCategory 
      ? campaignService.getCategoryProgress(selectedCampaignCategory)
      : campaignProgress;

    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto select-none">
        <div className="flex flex-col items-center justify-start min-h-screen p-8">
          <button 
            onClick={() => {
              setShowCampaign(false);
              setShowCampaignCategory(true);
            }}
            className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
          >
            👈 Voltar
          </button>

          <div className="text-center mb-8 mt-24 sm:mt-12">
            {categoryInfo && (
              <div className="text-6xl mb-3">{categoryInfo.icon}</div>
            )}
            <h1 className="text-4xl font-black text-yellow-500 italic mb-2">
              {categoryInfo ? categoryInfo.name.toUpperCase() : 'CAMPANHA'}
            </h1>
            <p className="text-slate-400">
              Progresso: {progress.defeated}/{progress.total} derrotados
            </p>
          </div>

          <div className="max-w-2xl ">
            <DeckSelector />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
            {bosses.map(boss => (
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

            {selectedCampaignCategory === 'gym_leaders' && (
              <div className="p-6 rounded-2xl border-4 border-dashed border-slate-600 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500">
                <div className="text-5xl mb-4">⏳</div>
                <h3 className="text-2xl font-black mb-2">Em Breve</h3>
                <p className="text-sm text-slate-400 text-center">Novos líderes estão a caminho!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (selectedMode === GameMode.QUICK_BATTLE || selectedMode === GameMode.DRAFT) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto select-none">
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <button 
          onClick={() => setSelectedMode(null)}
          className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
        >
          👈 Voltar
        </button>

        <h1 className="text-4xl font-black text-yellow-500 italic mb-4 sm:mb-8">
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
          className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-3 sm:px-16 sm:py-6 rounded-full text-lg sm:text-3xl font-black hover:scale-110 transition-all shadow-2xl border-b-8 border-red-900"
        >
          {selectedMode === GameMode.QUICK_BATTLE ? '⚔️ INICIAR BATALHA!' : '🎴 INICIAR DRAFT!'}
        </button>
        </div>
      </div>
    );
  }

  if (showSurvival) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto select-none">
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <button 
          onClick={() => setShowSurvival(false)}
          className="absolute top-8 left-8 bg-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-600 transition-colors"
        >
          👈 Voltar
        </button>

        <h1 className="text-4xl font-black text-yellow-500 italic mb-4">MODO SURVIVAL</h1>
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
          className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 sm:px-16 sm:py-6 rounded-full text-lg sm:text-3xl font-black hover:scale-110 transition-all shadow-2xl border-b-8 border-purple-900"
        >
          🛡️ INICIAR SURVIVAL!
        </button>
        </div>
      </div>
    );
  }

  // Menu Principal
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-y-auto select-none">
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-7xl md:text-8xl font-black mb-4 text-yellow-500 italic drop-shadow-2xl text-center tracking-tighter">
        PokéCard Battle
      </h1>
      <p className="text-slate-400 mb-6 text-lg">Seja o melhor duelista de PokéCards!</p>

      {/* Stats rápidos */}
      <div className="flex gap-4 mb-6 flex-wrap justify-center">
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalWins}</div>
          <div className="text-xs text-slate-500 uppercase">Vitórias</div>
        </div>
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.bestStreak}</div>
          <div className="text-xs text-slate-500 uppercase">Melhor Streak</div>
        </div>
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-blue-400">{collectionService.getObtainedCardsCount()}/187</div>
          <div className="text-xs text-slate-500 uppercase">Coleção</div>
        </div>
        <div className="bg-slate-800/50 px-6 py-3 rounded-xl text-center">
          <div className="text-2xl font-bold text-purple-400">{achievementCount}/{totalAchievements}</div>
          <div className="text-xs text-slate-500 uppercase">Conquistas</div>
        </div>
      </div>

      {/* Daily Reward */}
      <div className="w-full flex justify-center mb-6">
        <div className="bg-slate-800 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row gap-y-3 items-center justify-between w-full max-w-4xl">
          <div>
            <div className="text-lg font-bold">🎁 Recompensa Diária</div>
            <div className="text-sm text-slate-400">
              {dailyAvailable
                ? `Disponível — Dia ${pendingDay} (${claimedCount} reivindicados)`
                : (dailyRewardPreview ? '✅ Reivindicado — confira sua recompensa' : 'Já reivindicado hoje')
              }
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dailyAvailable ? (
              <button
                onClick={() => { soundService.playClick(); setShowDailyTimeline(true); }}
                className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-sm font-bold text-black"
                aria-label="Reivindicar recompensa diária"
              >
                🎉 Reivindicar
              </button>
            ) : dailyRewardPreview ? (
              <button
                onClick={() => { soundService.playClick(); setShowDailyTimeline(true); }}
                className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-sm text-white"
                aria-label="Ver recompensa recebida"
              >
                🪄 Ver Recompensa
              </button>
            ) : (
              <button
                onClick={() => { soundService.playClick(); setShowDailyTimeline(true); }}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-200"
                aria-label="Ver linha do tempo"
              >
                📅 Ver Linha do Tempo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Daily Timeline Modal */}
      {showDailyTimeline && (
        <DailyRewardTimeline 
          onClose={() => setShowDailyTimeline(false)}
          onClaim={handleTimelineRefresh}
        />
      )}

      {/* Modos de Jogo */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-12 max-w-4xl">
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

        <div className="text-xs text-slate-600 mt-4">
          Last updated: 31/12/2025 | v1.7.3
        </div>
      </div>
    </div>
  );
};
