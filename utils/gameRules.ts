
import { Card, Player, ElementType, CardType } from '../types';

export const GameRules = {
  MAX_FIELD_SIZE: 3,
  INITIAL_HAND_SIZE: 4,
  MAX_HP: 8000,

  canSummon: (player: Player, card: Card): boolean => {
    // Contar cartas válidas para sacrifício (todas exceto a própria carta que será invocada)
    const validInHand = player.hand.filter(c => c.uniqueId !== card.uniqueId).length;
    const validOnField = player.field.filter(c => c.uniqueId !== card.uniqueId).length;
    const availableSacrifices = validInHand + validOnField;

    // Se não há sacrifícios suficientes, não é possível invocar
    if (availableSacrifices < card.sacrificeRequired) return false;

    // Calcular quantos sacrifícios podem vir do campo (liberam espaço) — somente cartas válidas no campo
    const fieldSacrifices = Math.min(validOnField, card.sacrificeRequired);
    const resultingFieldSize = player.field.length - fieldSacrifices + 1; // +1 pelo monstro que será invocado

    // Permitir invocação apenas se, após sacrificar (preferencialmente do campo), couber no campo
    return resultingFieldSize <= GameRules.MAX_FIELD_SIZE;
  },

  // Tabela de multiplicadores semelhante ao estilo Pokémon (2, 0.5, 0)
  TYPE_TABLE: ((): Record<ElementType, Partial<Record<ElementType, number>>> => {
    const t: Record<ElementType, Partial<Record<ElementType, number>>> = {
      GRASS:  { WATER: 1.5, GROUND: 1.5, FIRE: 0.5, BUG: 0.5, POISON: 0.5 },
      FIRE:   { GRASS: 1.5, BUG: 1.5, WATER: 0.5, GROUND: 0.5 },
      WATER:  { FIRE: 1.5, GROUND: 1.5, GRASS: 0.5, ELECTRIC: 0.5 },
      ELECTRIC: { WATER: 1.5, GRASS: 0.5, GROUND: 0 },
      DRAGON: { DRAGON: 1.5},
      GHOST: { PSYCHIC: 1.5, GHOST: 1.5, NORMAL: 0.5, FIGHTING: 0.5 },
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

    const attackerEffective = Math.round(attacker.attack * atkMultiplier);
    const defenderEffective = Math.round(defender.defense);

    if (attackerEffective > defenderEffective) {
      defenderSurvived = false;
      damageToDefenderOwner = attackerEffective - defenderEffective;
    } else if (attackerEffective < defenderEffective) {
      attackerSurvived = false;
      damageToAttackerOwner = defenderEffective - attackerEffective;
    } else {
      // Empate: ambos são destruídos, mas ninguém leva dano
      attackerSurvived = false;
      defenderSurvived = false;
      damageToDefenderOwner = 0;
      damageToAttackerOwner = 0;
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
