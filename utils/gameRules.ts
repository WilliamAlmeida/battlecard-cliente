
import { Card, Player, ElementType } from '../types';

export const GameRules = {
  MAX_FIELD_SIZE: 3,
  INITIAL_HAND_SIZE: 4,
  MAX_HP: 8000,

  canSummon: (player: Player, card: Card): boolean => {
    if (player.field.length >= GameRules.MAX_FIELD_SIZE) return false;
    // Contar apenas Pokémons disponíveis para sacrifício (mão + campo), excluindo a carta sendo invocada
    const pokemonsInHand = player.hand.filter(c => c.cardType === 'POKEMON' && c.uniqueId !== card.uniqueId).length;
    const availableSacrifices = pokemonsInHand + player.field.length;
    return availableSacrifices >= card.sacrificeRequired;
  },

  // Tabela de multiplicadores semelhante ao estilo Pokémon (2, 0.5, 0)
  TYPE_TABLE: ((): Record<ElementType, Partial<Record<ElementType, number>>> => {
    const t: Record<ElementType, Partial<Record<ElementType, number>>> = {
      GRASS:  { WATER: 1.5, GROUND: 1.5, FIRE: 0.5, BUG: 0.5, POISON: 0.5 },
      FIRE:   { GRASS: 1.5, BUG: 1.5, WATER: 0.5, GROUND: 0.5 },
      WATER:  { FIRE: 1.5, GROUND: 1.5, GRASS: 0.5, ELECTRIC: 0.5 },
      ELECTRIC: { WATER: 1.5, GRASS: 0.5, GROUND: 0 },
      NORMAL: {},
      BUG:    { GRASS: 1.5, PSYCHIC: 1.5, FIRE: 0.5, FIGHTING: 0.5, POISON: 0.5 },
      POISON: { GRASS: 1.5, POISON: 0.5 },
      GROUND: { FIRE: 1.5, ELECTRIC: 1.5, POISON: 1.5, GRASS: 0.5 },
      FIGHTING: { NORMAL: 1.5, BUG: 1.5, PSYCHIC: 0.5 },
      PSYCHIC: { FIGHTING: 1.5, POISON: 1.5, PSYCHIC: 0.5 }
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
