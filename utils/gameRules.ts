
import { Card, Player } from '../types';

export const GameRules = {
  MAX_FIELD_SIZE: 3,
  INITIAL_HAND_SIZE: 4,
  MAX_HP: 4000,

  canSummon: (player: Player, card: Card): boolean => {
    if (player.field.length >= GameRules.MAX_FIELD_SIZE) return false;
    const availableSacrifices = (player.hand.length - 1) + player.field.length; // -1 pois a carta em si não conta
    return availableSacrifices >= card.sacrificeRequired;
  },

  resolveCombat: (attacker: Card, defender: Card) => {
    let attackerSurvived = true;
    let defenderSurvived = true;
    let damageToDefenderOwner = 0;
    let damageToAttackerOwner = 0;

    if (attacker.attack > defender.attack) {
      // Atacante vence; defender é nocauteado. Defesa reduz o dano recebido pelo dono do defensor.
      defenderSurvived = false;
      damageToDefenderOwner = Math.max(0, attacker.attack - defender.defense);
    } else if (attacker.attack < defender.attack) {
      // Defensor vence; atacante é nocauteado. Defesa do atacante reduz o dano ao dono do atacante.
      attackerSurvived = false;
      damageToAttackerOwner = Math.max(0, defender.attack - attacker.defense);
    } else {
      // Empate: ambos são nocauteados, sem dano direto aos donos (mantido comportamento anterior)
      attackerSurvived = false;
      defenderSurvived = false;
    }

    return {
      attackerSurvived,
      defenderSurvived,
      damageToDefenderOwner,
      damageToAttackerOwner
    };
  }
};
