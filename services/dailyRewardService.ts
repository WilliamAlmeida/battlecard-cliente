// Daily Reward Service - sistema de login diário
import { collectionService } from './collectionService';

const DAILY_KEY = 'pokecard_daily_reward';

interface DailyState {
  lastClaimDate?: string | null; // ISO date
  dayIndex: number; // 1..30
}

interface DailyReward {
  day: number;
  coins?: number;
  packs?: number;
  cards?: string[];
  title?: string;
}

const DEFAULT_STATE: DailyState = {
  lastClaimDate: null,
  dayIndex: 1
};

// Schedule: 30-day progression
// Pattern repeats the original 7-day values across the month.
// Cards given on intermediate milestones are at most 2-star; day 30 gives a 3-star (non-epic/non-legendary).
const DAILY_SCHEDULE: DailyReward[] = [
  { day: 1, coins: 100, packs: 0, title: 'Boas-vindas!' },
  { day: 2, coins: 150, packs: 0, title: 'Dia 2' },
  { day: 3, coins: 200, packs: 1, title: 'Pequeno pacote' },
  { day: 4, coins: 250, packs: 0, title: 'Dia 4' },
  { day: 5, coins: 300, packs: 1, title: 'Pacote e moedas' },
  { day: 6, coins: 500, packs: 1, title: 'Recompensa grande' },
  { day: 7, coins: 800, packs: 2, cards: ['133'], title: 'Mega Dia 7' }, // Eevee (1-star)

  { day: 8, coins: 100, packs: 0, title: 'Semana 2 - Dia 1' },
  { day: 9, coins: 150, packs: 0, title: 'Semana 2 - Dia 2' },
  { day: 10, coins: 200, packs: 1, title: 'Semana 2 - Pequeno pacote' },
  { day: 11, coins: 250, packs: 0, title: 'Semana 2 - Dia 4' },
  { day: 12, coins: 300, packs: 1, title: 'Semana 2 - Pacote e moedas' },
  { day: 13, coins: 500, packs: 1, title: 'Semana 2 - Recompensa grande' },
  { day: 14, coins: 800, packs: 2, cards: ['025'], title: 'Semana 2 - Mega Dia' }, // Picachu (2-star)

  { day: 15, coins: 100, packs: 0, title: 'Semana 3 - Dia 1' },
  { day: 16, coins: 150, packs: 0, title: 'Semana 3 - Dia 2' },
  { day: 17, coins: 200, packs: 1, title: 'Semana 3 - Pequeno pacote' },
  { day: 18, coins: 250, packs: 0, title: 'Semana 3 - Dia 4' },
  { day: 19, coins: 300, packs: 1, title: 'Semana 3 - Pacote e moedas' },
  { day: 20, coins: 500, packs: 1, title: 'Semana 3 - Recompensa grande' },
  { day: 21, coins: 800, packs: 2, cards: ['017'], title: 'Semana 3 - Mega Dia' }, // Pidgeotto (2-star)

  { day: 22, coins: 100, packs: 0, title: 'Semana 4 - Dia 1' },
  { day: 23, coins: 150, packs: 0, title: 'Semana 4 - Dia 2' },
  { day: 24, coins: 200, packs: 1, title: 'Semana 4 - Pequeno pacote' },
  { day: 25, coins: 250, packs: 0, title: 'Semana 4 - Dia 4' },
  { day: 26, coins: 300, packs: 1, title: 'Semana 4 - Pacote e moedas' },
  { day: 27, coins: 500, packs: 1, title: 'Semana 4 - Recompensa grande' },
  { day: 28, coins: 800, packs: 2, title: 'Semana 4 - Mega Dia' },

  { day: 29, coins: 800, packs: 0, title: 'Quase lá!' },
  // Day 30: special 3-star card (non-epic, non-legendary). Using 003 (Venusaur) as a safe 3-star.
  { day: 30, coins: 0, packs: 0, cards: ['003'], title: 'Dia 30 - Grande Recompensa' }
];

class DailyRewardService {
  private state: DailyState = { ...DEFAULT_STATE };

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(DAILY_KEY);
      if (raw) this.state = JSON.parse(raw);
    } catch (e) {
      this.state = { ...DEFAULT_STATE };
    }
  }

  private save() {
    try {
      localStorage.setItem(DAILY_KEY, JSON.stringify(this.state));
    } catch (e) {
      // ignore
    }
  }

  private isoDate(date = new Date()) {
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  isClaimAvailable(): boolean {
    const today = this.isoDate();
    return this.state.lastClaimDate !== today;
  }

  // returns the reward that will be given if claimed now (based on state progression)
  getPendingReward(): DailyReward {
      const idx = Math.max(1, Math.min(DAILY_SCHEDULE.length, this.state.dayIndex));
      return DAILY_SCHEDULE[idx - 1];
  }

  // Get reward for a specific day (1-based index), or null if out of range
  getRewardForDay(day: number): DailyReward | null {
    if (day < 1 || day > DAILY_SCHEDULE.length) return null;
    return DAILY_SCHEDULE[day - 1];
  }

  // Claim the reward: applies to collectionService and advances the state.
  claim(): DailyReward | null {
    if (!this.isClaimAvailable()) return null;

    // Determine if streak continues or resets
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayIso = this.isoDate(yesterday);
    const last = this.state.lastClaimDate;

    if (last === yesterdayIso) {
      // continue streak
      this.state.dayIndex = Math.min(DAILY_SCHEDULE.length, this.state.dayIndex + 1);
    } else if (last === this.isoDate(today)) {
      // already claimed today (should be blocked earlier)
    } else {
      // reset streak
      this.state.dayIndex = 1;
    }

    const reward = DAILY_SCHEDULE[this.state.dayIndex - 1];

    // Apply rewards
    if (reward.coins) collectionService.addCoins(reward.coins);
    if (reward.packs) collectionService.addPack(reward.packs);
    if (reward.cards && reward.cards.length > 0) {
      reward.cards.forEach(c => collectionService.addCard(c));
    }

    // Update lastClaimDate to today and advance dayIndex for next claim
    this.state.lastClaimDate = this.isoDate(today);
    this.save();
    return reward;
  }

  // TEST METHOD: Force claim for testing purposes (bypasses date check)
  testClaim(): DailyReward | null {
    // Advance to next day regardless of date
    this.state.dayIndex = Math.min(DAILY_SCHEDULE.length, this.state.dayIndex + 1);
    const reward = DAILY_SCHEDULE[this.state.dayIndex - 1];

    // Apply rewards
    if (reward.coins) collectionService.addCoins(reward.coins);
    if (reward.packs) collectionService.addPack(reward.packs);
    if (reward.cards && reward.cards.length > 0) {
      reward.cards.forEach(c => collectionService.addCard(c));
    }

    // Update state (use a fake date to allow continuous testing)
    this.state.lastClaimDate = this.isoDate(new Date(Date.now() - 86400000 * 2)); // 2 days ago
    this.save();
    return reward;
  }

  // For UI: how many consecutive days the user currently has (based on lastClaimDate)
  getCurrentStreak(): number {
    const last = this.state.lastClaimDate;
    if (!last) return 0;
    const lastDate = new Date(last + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayIso = this.isoDate(yesterday);

    if (last === this.isoDate(today)) return this.state.dayIndex;
    if (last === yesterdayIso) return this.state.dayIndex; // still same streak value until claim
    return 0;
  }
}

export const dailyRewardService = new DailyRewardService();

export type { DailyReward };
