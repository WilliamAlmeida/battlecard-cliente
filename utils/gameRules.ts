
import { Card, Player, ElementType } from '../types';

export const GameRules = {
  MAX_FIELD_SIZE: 3,
  INITIAL_HAND_SIZE: 4,
  MAX_HP: 8000,

  canSummon: (player: Player, card: Card): boolean => {
    if (player.field.length >= GameRules.MAX_FIELD_SIZE) return false;
    const availableSacrifices = (player.hand.length - 1) + player.field.length; // -1 pois a carta em si não conta
    return availableSacrifices >= card.sacrificeRequired;
  },

  // Tabela de multiplicadores semelhante ao estilo Pokémon (2, 0.5, 0)
  TYPE_TABLE: ((): Record<ElementType, Partial<Record<ElementType, number>>> => {
    const t: Record<ElementType, Partial<Record<ElementType, number>>> = {
      GRASS:  { WATER: 2, GROUND: 2, FIRE: 0.5, BUG: 0.5, POISON: 0.5 },
      FIRE:   { GRASS: 2, BUG: 2, WATER: 0.5, GROUND: 0.5 },
      WATER:  { FIRE: 2, GROUND: 2, GRASS: 0.5, ELECTRIC: 0.5 },
      ELECTRIC: { WATER: 2, GRASS: 0.5, GROUND: 0 },
      NORMAL: {},
      BUG:    { GRASS: 2, PSYCHIC: 2, FIRE: 0.5, FIGHTING: 0.5, POISON: 0.5 },
      POISON: { GRASS: 2, POISON: 0.5 },
      GROUND: { FIRE: 2, ELECTRIC: 2, POISON: 2, GRASS: 0.5 },
      FIGHTING: { NORMAL: 2, BUG: 2, PSYCHIC: 0.5 },
      PSYCHIC: { FIGHTING: 2, POISON: 2, PSYCHIC: 0.5 }
    };
    return t;
  })(),

  resolveCombat: (attacker: Card, defender: Card) => {
    let attackerSurvived = true;
    let defenderSurvived = true;
    let damageToDefenderOwner = 0;
    let damageToAttackerOwner = 0;

    const atkMultiplier = GameRules.TYPE_TABLE[attacker.type]?.[defender.type] ?? 1;
    const defMultiplier = GameRules.TYPE_TABLE[defender.type]?.[attacker.type] ?? 1;

    const attackerEffective = Math.round(attacker.attack * atkMultiplier);
    const defenderEffective = Math.round(defender.attack * defMultiplier);

    if (attackerEffective > defenderEffective) {
      defenderSurvived = false;
      damageToDefenderOwner = Math.max(0, attackerEffective - defender.defense);
    } else if (attackerEffective < defenderEffective) {
      attackerSurvived = false;
      damageToAttackerOwner = Math.max(0, defenderEffective - attacker.defense);
    } else {
      attackerSurvived = false;
      defenderSurvived = false;
    }

    return {
      attackerSurvived,
      defenderSurvived,
      damageToDefenderOwner,
      damageToAttackerOwner,
      multiplier: atkMultiplier,
      attackerEffective,
      defenderEffective
    };
  }
};
