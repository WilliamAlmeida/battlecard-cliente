import { Card, ElementType, CardType, Rarity, Ability, AbilityTrigger, StatusEffect, SpellEffect, TrapCondition } from './types';
import { GEN1_RAW } from './pokemons/gen1';

// Função auxiliar para criar cartas de Pokémon
const createCard = (
  id: string,
  name: string,
  type: ElementType,
  attack: number,
  defense: number,
  level: number,
  rarity: Rarity = Rarity.COMMON,
  ability?: Ability
): Omit<Card, 'uniqueId' | 'hasAttacked' | 'statusEffects' | 'statusDuration'> => ({
  id,
  name,
  type,
  cardType: CardType.POKEMON,
  attack,
  defense,
  level,
  sacrificeRequired: level === 1 ? 0 : level === 2 ? 1 : 2,
  rarity,
  ability,
});

// Função auxiliar para criar cartas de magia
const createSpell = (
  id: string,
  name: string,
  effect: SpellEffect,
  rarity: Rarity = Rarity.COMMON
): Omit<Card, 'uniqueId' | 'hasAttacked' | 'statusEffects' | 'statusDuration'> => ({
  id,
  name,
  type: ElementType.NORMAL,
  cardType: CardType.SPELL,
  attack: 0,
  defense: 0,
  level: 1,
  sacrificeRequired: 0,
  rarity,
  spellEffect: effect,
});

// Função auxiliar para criar cartas de armadilha
const createTrap = (
  id: string,
  name: string,
  condition: TrapCondition,
  effect: SpellEffect,
  rarity: Rarity = Rarity.UNCOMMON
): Omit<Card, 'uniqueId' | 'hasAttacked' | 'statusEffects' | 'statusDuration'> => ({
  id,
  name,
  type: ElementType.NORMAL,
  cardType: CardType.TRAP,
  attack: 0,
  defense: 0,
  level: 1,
  sacrificeRequired: 0,
  rarity,
  trapCondition: condition,
  trapEffect: effect,
});

// Deck size constraints
export const MIN_DECK_SIZE = 15;
export const MAX_DECK_SIZE = 40;

// Helper para definir raridade baseada em level
const getRarityByLevel = (level: number, isLegendary?: boolean): Rarity => {
  if (isLegendary) return Rarity.LEGENDARY;
  if (level === 3) return Rarity.EPIC;
  if (level === 2) return Rarity.RARE;
  return Rarity.COMMON;
};

// Tipo base para cartas (usado internamente)
type CardBase = Omit<Card, 'uniqueId' | 'hasAttacked' | 'statusEffects' | 'statusDuration'>;

// Map raw entries to the shape returned by createCard
export const INITIAL_DECK: CardBase[] = GEN1_RAW.map(c =>
  createCard(c.id, c.name, c.type, c.attack, c.defense, c.level, c.rarity ?? getRarityByLevel(c.level), c.ability)
);

// === CARTAS DE MAGIA ===
export const SPELL_CARDS: CardBase[] = [
  // Cura
  createSpell('spell_potion', 'Poção', { type: 'HEAL', value: 1000, target: 'OWNER' }, Rarity.COMMON),
  createSpell('spell_super_potion', 'Super Poção', { type: 'HEAL', value: 2000, target: 'OWNER' }, Rarity.UNCOMMON),
  createSpell('spell_hyper_potion', 'Hyper Poção', { type: 'HEAL', value: 3500, target: 'OWNER' }, Rarity.RARE),
  createSpell('spell_full_restore', 'Restauração Total', { type: 'HEAL', value: 5000, target: 'OWNER' }, Rarity.EPIC),
  
  // Buff
  createSpell('spell_x_attack', 'X-Attack', { type: 'BUFF', value: 500, target: 'SINGLE_ALLY', stat: 'ATTACK' }, Rarity.COMMON),
  createSpell('spell_x_defense', 'X-Defense', { type: 'BUFF', value: 500, target: 'SINGLE_ALLY', stat: 'DEFENSE'}, Rarity.COMMON),
  createSpell('spell_rare_candy', 'Rare Candy', { type: 'BUFF', value: 800, target: 'SINGLE_ALLY', stat: 'ATTACK' }, Rarity.UNCOMMON),
  createSpell('spell_protein', 'Proteína', { type: 'BUFF', value: 800, target: 'SINGLE_ALLY', stat: 'DEFENSE' }, Rarity.RARE),
  createSpell('spell_mass_protein', 'Proteína em Massa', { type: 'BUFF', value: 500, target: 'ALL_ALLIES', stat: 'ATTACK' }, Rarity.RARE),
  
  // Dano
  createSpell('spell_thunder', 'Trovão', { type: 'DAMAGE', value: 800, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createSpell('spell_fire_blast', 'Explosão de Fogo', { type: 'DAMAGE', value: 1200, target: 'SINGLE_ENEMY' }, Rarity.RARE),
  createSpell('spell_blizzard', 'Nevasca', { type: 'DAMAGE', value: 600, target: 'ALL_ENEMIES' }, Rarity.RARE),
  createSpell('spell_earthquake', 'Terremoto', { type: 'DAMAGE', value: 500, target: 'ALL_ENEMIES' }, Rarity.UNCOMMON),
  
  // Destruição
  createSpell('spell_pokeball', 'Pokébola', { type: 'DESTROY', target: 'SINGLE_ENEMY', specialId: 'capture' }, Rarity.UNCOMMON),
  createSpell('spell_great_ball', 'Great Ball', { type: 'DESTROY', target: 'SINGLE_ENEMY', specialId: 'capture_better' }, Rarity.RARE),
  createSpell('spell_master_ball', 'Master Ball', { type: 'DESTROY', target: 'SINGLE_ENEMY', specialId: 'capture_guaranteed' }, Rarity.LEGENDARY),
  
  // Comprar cartas
  createSpell('spell_bill', 'Bill', { type: 'DRAW', value: 1, target: 'OWNER' }, Rarity.COMMON),
  createSpell('spell_professor_oak', 'Professor Oak', { type: 'DRAW', value: 2, target: 'OWNER' }, Rarity.RARE),
  
  // Status
  createSpell('spell_sleep_powder', 'Pó do Sono', { type: 'STATUS', statusEffect: StatusEffect.SLEEP, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createSpell('spell_toxic', 'Tóxico', { type: 'STATUS', statusEffect: StatusEffect.POISON, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createSpell('spell_will_o_wisp', 'Fogo Fátuo', { type: 'STATUS', statusEffect: StatusEffect.BURN, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createSpell('spell_thunder_wave', 'Onda de Choque', { type: 'STATUS', statusEffect: StatusEffect.PARALYZE, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createSpell('spell_confuse_ray', 'Raio Confuso', { type: 'STATUS', statusEffect: StatusEffect.CONFUSE, target: 'SINGLE_ENEMY' }, Rarity.RARE),
  
  // Reviver
  createSpell('spell_revive', 'Reviver', { type: 'REVIVE', target: 'GRAVEYARD' }, Rarity.RARE),
  createSpell('spell_max_revive', 'Reviver Máximo', { type: 'REVIVE', value: 1, target: 'GRAVEYARD' }, Rarity.EPIC),
];

// === CARTAS DE ARMADILHA ===
export const TRAP_CARDS: CardBase[] = [
  // Contra-ataque
  createTrap('trap_counter', 'Contra-Ataque', TrapCondition.ON_ATTACK, 
    { type: 'DAMAGE', value: 500, target: 'SINGLE_ENEMY' }, Rarity.COMMON),
  createTrap('trap_mirror_coat', 'Manto Espelho', TrapCondition.ON_ATTACK,
    { type: 'DAMAGE', value: 0, target: 'SINGLE_ENEMY', specialId: 'reflect_damage' }, Rarity.RARE),
  
  // Proteção
  createTrap('trap_protect', 'Proteção', TrapCondition.ON_DIRECT_ATTACK,
    { type: 'SPECIAL', specialId: 'negate_attack' }, Rarity.UNCOMMON),
  createTrap('trap_endure', 'Resistência', TrapCondition.ON_DESTROY,
    { type: 'SPECIAL', specialId: 'survive_1hp' }, Rarity.RARE),
  
  // Status ao atacar
  createTrap('trap_poison_spikes', 'Espinhos Venenosos', TrapCondition.ON_SUMMON,
    { type: 'STATUS', statusEffect: StatusEffect.POISON, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createTrap('trap_thunder_trap', 'Armadilha Trovão', TrapCondition.ON_ATTACK,
    { type: 'STATUS', statusEffect: StatusEffect.PARALYZE, target: 'SINGLE_ENEMY' }, Rarity.UNCOMMON),
  createTrap('trap_freeze_trap', 'Armadilha Gelo', TrapCondition.ON_ATTACK,
    { type: 'STATUS', statusEffect: StatusEffect.FREEZE, target: 'SINGLE_ENEMY' }, Rarity.RARE),
  
  // Destruição
  createTrap('trap_destiny_bond', 'Laço do Destino', TrapCondition.ON_DESTROY,
    { type: 'DESTROY', target: 'SINGLE_ENEMY' }, Rarity.EPIC),
  createTrap('trap_explosion', 'Explosão', TrapCondition.ON_ATTACK,
    { type: 'DAMAGE', value: 1500, target: 'ALL_ENEMIES' }, Rarity.RARE),
  
  // Debuff
  createTrap('trap_scary_face', 'Cara Assustadora', TrapCondition.ON_SUMMON,
    { type: 'DEBUFF', value: -400, target: 'ALL_ENEMIES', stat: 'ATTACK' }, Rarity.UNCOMMON),
  createTrap('trap_intimidate', 'Intimidar', TrapCondition.ON_ATTACK,
    { type: 'DEBUFF', value: -600, target: 'SINGLE_ENEMY', stat: 'ATTACK' }, Rarity.RARE),
];

// === HELPER FUNCTIONS ===
// Get cards by their IDs (used for building campaign boss decks)
export const getCardsByIds = (ids: string[]): CardBase[] => {
  const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];
  const result: CardBase[] = [];
  
  ids.forEach(id => {
    const card = allCards.find(c => c.id === id);
    if (card) {
      result.push({ ...card });
    } else {
      console.warn(`Card with ID ${id} not found in catalog`);
    }
  });
  
  return result;
};