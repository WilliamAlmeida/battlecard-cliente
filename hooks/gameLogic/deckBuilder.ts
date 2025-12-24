import { CardBase } from './types';
import { shuffle } from './helpers';
import { AIDifficulty, Rarity } from '../../types';

// Build NPC deck of fixed size (defaults to 40) respecting rarity distribution
export const buildNpcDeck = (cards: CardBase[], size = 40, difficulty?: AIDifficulty) => {
  if (!cards || cards.length === 0) return [] as CardBase[];
  const poolOne: CardBase[] = []; // COMMON
  const poolTwo: CardBase[] = []; // UNCOMMON
  const poolThree: CardBase[] = []; // RARE+EPIC+LEGENDARY

  cards.forEach(c => {
    if (c.rarity === Rarity.COMMON) poolOne.push(c);
    else if (c.rarity === Rarity.UNCOMMON) poolTwo.push(c);
    else poolThree.push(c);
  });

  // Choose distribution based on difficulty
  let tOne = Math.floor(size * 0.6);
  let tTwo = Math.floor(size * 0.3);
  let tThree = size - tOne - tTwo;

  if (difficulty === AIDifficulty.EASY) {
    tOne = 28; tTwo = 10; tThree = 2;
  } else if (difficulty === AIDifficulty.NORMAL) {
    tOne = 24; tTwo = 12; tThree = 4;
  } else if (difficulty === AIDifficulty.HARD) {
    tOne = 15; tTwo = 15; tThree = 10;
  } else if (difficulty === AIDifficulty.EXPERT) {
    tOne = 10; tTwo = 20; tThree = 10;
  }

  const targetOne = Math.max(0, Math.min(size, tOne));
  const targetTwo = Math.max(0, Math.min(size - targetOne, tTwo));
  const targetThree = Math.max(0, size - targetOne - targetTwo);

  const pickFrom = (pool: CardBase[], n: number) => shuffle(pool).slice(0, Math.min(n, pool.length));

  let selected: CardBase[] = [];
  selected = selected.concat(pickFrom(poolOne, targetOne));
  selected = selected.concat(pickFrom(poolTwo, targetTwo));
  selected = selected.concat(pickFrom(poolThree, targetThree));

  const remainingNeeded = size - selected.length;
  if (remainingNeeded > 0) {
    const remainingPool = shuffle(cards.filter(c => !selected.includes(c)));
    selected = selected.concat(remainingPool.slice(0, remainingNeeded));
  }

  if (selected.length > size) selected = selected.slice(0, size);

  return shuffle(selected);
};
