export enum ElementType {
  GRASS = 'GRASS',
  FIRE = 'FIRE',
  WATER = 'WATER',
  ELECTRIC = 'ELECTRIC',
  DRAGON = 'DRAGON',
  GHOST = 'GHOST',
  NORMAL = 'NORMAL',
  BUG = 'BUG',
  POISON = 'POISON',
  GROUND = 'GROUND',
  FIGHTING = 'FIGHTING',
  PSYCHIC = 'PSYCHIC'
}

// Efeitos de Status
export enum StatusEffect {
  NONE = 'NONE',
  BURN = 'BURN',           // Dano por turno, -25% ATK
  FREEZE = 'FREEZE',       // 50% chance de pular turno
  PARALYZE = 'PARALYZE',   // Não pode atacar 1 turno
  POISON = 'POISON',       // Dano progressivo por turno
  SLEEP = 'SLEEP',         // Pula 2 turnos
  CONFUSE = 'CONFUSE'      // 30% chance de se auto-atacar
}

// Tipos de Cartas
export enum CardType {
  POKEMON = 'POKEMON',
  SPELL = 'SPELL',         // Magia - efeito instantâneo
  TRAP = 'TRAP'            // Armadilha - ativa em condição
}

// Raridades
export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

// Dificuldade da IA
export enum AIDifficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}

// Estratégias de Sacrifício da IA
export enum SacrificeStrategy {
  RANDOM = 'RANDOM',                     // Aleatório (EASY)
  FIELD_FIRST = 'FIELD_FIRST',           // Prioriza campo
  HAND_FIRST = 'HAND_FIRST',             // Prioriza mão
  SMART_HYBRID = 'SMART_HYBRID',         // Mão se possível, campo se necessário
  SCORE_BASED = 'SCORE_BASED',           // Score híbrido (atk+def+habilidade+tipo)
  AUTO = 'AUTO'                          // Automático por dificuldade
}

// Modos de Jogo
export enum GameMode {
  QUICK_BATTLE = 'QUICK_BATTLE',
  CAMPAIGN = 'CAMPAIGN',
  SURVIVAL = 'SURVIVAL',
  BOSS_RUSH = 'BOSS_RUSH',
  DRAFT = 'DRAFT'
}

// Efeitos de Habilidades
export enum AbilityTrigger {
  ON_SUMMON = 'ON_SUMMON',
  ON_ATTACK = 'ON_ATTACK',
  ON_DESTROY = 'ON_DESTROY',
  ON_TURN_START = 'ON_TURN_START',
  ON_TURN_END = 'ON_TURN_END',
  PASSIVE = 'PASSIVE',
  ON_DAMAGE = 'ON_DAMAGE'
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  trigger: AbilityTrigger;
  effect: AbilityEffect;
}

export interface AbilityEffect {
  type: 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'STATUS' | 'DRAW' | 'REVIVE' | 'DESTROY' | 'SPECIAL';
  value?: number;
  statusEffect?: StatusEffect;
  target?: 'SELF' | 'ENEMY' | 'ALL_ENEMIES' | 'ALL_ALLIES' | 'RANDOM_ENEMY' | 'OWNER';
  duration?: number;
  stat?: 'ATTACK' | 'DEFENSE';
}

// Condições de Trap
export enum TrapCondition {
  ON_ATTACK = 'ON_ATTACK',
  ON_SUMMON = 'ON_SUMMON',
  ON_DIRECT_ATTACK = 'ON_DIRECT_ATTACK',
  ON_DESTROY = 'ON_DESTROY'
}

export interface SpellEffect {
  type: 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'DRAW' | 'DESTROY' | 'REVIVE' | 'STATUS' | 'SPECIAL';
  value?: number;
  target?: 'SINGLE_ENEMY' | 'ALL_ENEMIES' | 'SINGLE_ALLY' | 'ALL_ALLIES' | 'SELF' | 'OWNER' | 'GRAVEYARD';
  statusEffect?: StatusEffect;
  duration?: number;
  specialId?: string;
  stat?: 'ATTACK' | 'DEFENSE';
}

export interface Card {
  id: string;
  uniqueId: string;
  name: string;
  type: ElementType;
  cardType: CardType;
  attack: number;
  defense: number;
  sacrificeRequired: number;
  level: number;
  hasAttacked: boolean;
  rarity: Rarity;
  ability?: Ability;
  statusEffects?: StatusEffect[];
  statusDuration?: number[];
  spellEffect?: SpellEffect;
  trapCondition?: TrapCondition;
  trapEffect?: SpellEffect;
  isSet?: boolean;
  destroyedAt?: number;
  imageUrl?: string;
}

export interface Player {
  id: string;
  name?: string;
  avatar?: string;
  hp: number;
  hand: Card[];
  field: Card[];
  deck: Card[];
  graveyard: Card[];
  trapZone: Card[];
}

export enum Phase {
  DRAW = 'DRAW',
  MAIN = 'MAIN',
  BATTLE = 'BATTLE',
  END = 'END'
}

export interface GameLogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'effect' | 'status' | 'ability' | 'spell' | 'trap';
  timestamp: number;
}

export interface FloatingEffect {
  id: string;
  text: string;
  color: string;
  animation: 'up' | 'down' | 'none';
  targetId: string;
}

export type AIActionType = 'SUMMON' | 'ATTACK' | 'END_TURN' | 'GO_TO_BATTLE' | 'WAIT' | 'USE_SPELL' | 'SET_TRAP';

export interface AIAction {
  type: AIActionType;
  cardId?: string;
  targetId?: string;
  sacrifices?: string[];
}

// Achievements
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  reward?: AchievementReward;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface AchievementCondition {
  type: 'WINS' | 'WINS_STREAK' | 'DAMAGE_DEALT' | 'CARDS_DESTROYED' | 
        'PERFECT_WIN' | 'TYPE_WIN' | 'SURVIVAL_WAVES' | 'BOSS_DEFEATED' |
        'CARDS_COLLECTED' | 'SPELLS_USED' | 'TRAPS_ACTIVATED' | 'REVIVES' |
        'STATUS_INFLICTED' | 'ABILITIES_TRIGGERED' | 'LEGENDARY_SUMMON';
  value: number;
  elementType?: ElementType;
  bossId?: string;
}

export interface AchievementReward {
  type: 'CARD' | 'PACK' | 'COINS' | 'TITLE';
  value: string | number;
}

// Campanha
export interface CampaignBoss {
  id: string;
  name: string;
  category: string;
  avatar: string;
  description: string;
  deck: string[];
  specialRules?: SpecialRule[];
  hp: number;
  reward: CampaignReward;
  unlocked: boolean;
  defeated: boolean;
  difficulty: AIDifficulty;
  sacrificeStrategy?: SacrificeStrategy;
}

export interface CampaignReward {
  coins: number;
  cards?: string[];
  packs?: number;
}

export interface SpecialRule {
  id: string;
  name: string;
  description: string;
  effect: 'HP_MODIFIER' | 'FIELD_SIZE' | 'TURN_TIMER' | 'TYPE_BOOST' | 'STARTING_CARDS';
  value: number;
  elementType?: ElementType;
}

// Coleção
export interface CardCollection {
  cardId: string;
  quantity: number;
  obtained: boolean;
}

export interface PlayerCollection {
  cards: CardCollection[];
  coins: number;
  packs: number;
  customDecks: CustomDeck[];
  // Id do deck atualmente selecionado pelo jogador (opcional)
  selectedDeckId?: string | null;
}

export interface CustomDeck {
  id: string;
  name: string;
  cards: string[];
  createdAt: number;
}

// Estatísticas
export interface PlayerStats {
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  totalDamageDealt: number;
  totalDamageReceived: number;
  cardsDestroyed: number;
  cardsLost: number;
  perfectWins: number;
  survivalBestWave: number;
  bossesDefeated: string[];
  spellsUsed: number;
  trapsActivated: number;
  abilitiesTriggered: number;
  statusInflicted: Record<StatusEffect, number>;
  gamesPlayedByMode: Record<GameMode, number>;
  favoriteType?: ElementType;
}

// Survival Mode
export interface SurvivalState {
  currentWave: number;
  playerHp: number;
  modifiers: SpecialRule[];
}

// Draft Mode
export interface DraftState {
  availableCards: Card[];
  selectedCards: Card[];
  round: number;
  maxRounds: number;
}

// Game Settings
export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  difficulty: AIDifficulty;
}
