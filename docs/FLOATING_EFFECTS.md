# Sistema de Floating Effects

## Visão Geral

O sistema de **Floating Effects** fornece feedback visual para efeitos aplicados nas cartas durante o jogo, similar ao sistema de dano flutuante, mas com suporte para buffs, debuffs, heals e status effects.

## Componentes do Sistema

### 1. Tipo `FloatingEffect` (types.ts)

```typescript
export interface FloatingEffect {
  id: string;
  text: string;
  color: string;
  animation: 'up' | 'down' | 'none';
  targetId: string;
}
```

- **id**: Identificador único do efeito
- **text**: Texto a ser exibido (ex: "+500 ATK", "🔥")
- **color**: Cor do texto em formato hex (ex: "#22c55e")
- **animation**: Tipo de animação
  - `up`: Texto sobe (usado para buffs e heals)
  - `down`: Texto desce (usado para debuffs)
  - `none`: Texto pulsa no lugar (usado para status effects)
- **targetId**: ID da carta ou HP bar onde o efeito será exibido

### 2. Função `showFloatingEffect`

```typescript
showFloatingEffect(text: string, color: string, animation: 'up' | 'down' | 'none', targetId: string)
```

Cria e exibe um floating effect. O efeito é automaticamente removido após 1 segundo.

**Parâmetros:**
- `text`: O texto a ser exibido
- `color`: Cor em formato hex
- `animation`: Tipo de animação ('up', 'down', 'none')
- `targetId`: ID da carta alvo ou 'player-hp'/'npc-hp' para HP bars

### 3. Animações CSS (index.html)

```css
@keyframes float-effect-up {
  0% { opacity: 0; transform: translateY(0) scale(0.8); }
  20% { opacity: 1; transform: translateY(-15px) scale(1.1); }
  80% { opacity: 1; transform: translateY(-35px) scale(1); }
  100% { opacity: 0; transform: translateY(-50px) scale(0.9); }
}

@keyframes float-effect-down {
  0% { opacity: 0; transform: translateY(0) scale(0.8); }
  20% { opacity: 1; transform: translateY(15px) scale(1.1); }
  80% { opacity: 1; transform: translateY(35px) scale(1); }
  100% { opacity: 0; transform: translateY(50px) scale(0.9); }
}

@keyframes float-effect-none {
  0% { opacity: 0; transform: scale(0.5); }
  20% { opacity: 1; transform: scale(1.2); }
  80% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.8); }
}
```

## Uso no Jogo

### BUFF (Aumento de Status)

```typescript
// Buff de ataque
showFloatingEffect('+500 ATK', '#22c55e', 'up', targetCardId);

// Buff de defesa
showFloatingEffect('+300 DEF', '#22c55e', 'up', targetCardId);

// Buff duplo
showFloatingEffect('+500 ATK/DEF', '#22c55e', 'up', targetCardId);
```

**Cor padrão:** `#22c55e` (verde)  
**Animação:** `up` (sobe)

### DEBUFF (Redução de Status)

```typescript
// Debuff de ataque
showFloatingEffect('-400 ATK', '#ef4444', 'down', targetCardId);

// Debuff de defesa
showFloatingEffect('-300 DEF', '#ef4444', 'down', targetCardId);

// Debuff duplo
showFloatingEffect('-500 ATK/DEF', '#ef4444', 'down', targetCardId);
```

**Cor padrão:** `#ef4444` (vermelho)  
**Animação:** `down` (desce)

### HEAL (Cura)

```typescript
showFloatingEffect('+1000 HP', '#10b981', 'up', 'player-hp');
showFloatingEffect('+2000 HP', '#10b981', 'up', 'npc-hp');
```

**Cor padrão:** `#10b981` (verde esmeralda)  
**Animação:** `up` (sobe)  
**Target:** `'player-hp'` ou `'npc-hp'`

### STATUS EFFECTS

```typescript
const statusIcons = {
  'BURN': '🔥',
  'FREEZE': '🧊',
  'PARALYZE': '⚡',
  'POISON': '☠️',
  'SLEEP': '😴',
  'CONFUSE': '😵'
};

showFloatingEffect('🔥', '#9333ea', 'none', targetCardId);
```

**Cor padrão:** `#9333ea` (roxo)  
**Animação:** `none` (pulsa no lugar)

## Exemplos de Implementação

### Aplicar BUFF via Spell

```typescript
// Em useSpell quando effect.type === 'BUFF'
if ((effect.target === 'SINGLE_ALLY' || effect.target === 'SELF') && targetId) {
  const target = state.field.find(c => c.uniqueId === targetId);
  if (target) {
    // Aplicar buff
    setFn(p => ({...}));
    
    // Mostrar feedback visual
    const statName = effect.stat ? (effect.stat === 'DEFENSE' ? 'DEF' : 'ATK') : 'ATK/DEF';
    showFloatingEffect(`+${buffAmount} ${statName}`, '#22c55e', 'up', targetId);
  }
}
```

### Aplicar DEBUFF via Trap

```typescript
// Quando trap é ativada e aplica debuff
trapResult.debuffTargets.forEach(debuff => {
  const statName = debuff.stat ? (debuff.stat === 'DEFENSE' ? 'DEF' : 'ATK') : 'ATK/DEF';
  showFloatingEffect(`${debuff.value} ${statName}`, '#ef4444', 'down', debuff.targetId);
});
```

### Aplicar STATUS via Spell

```typescript
// Em useSpell quando effect.type === 'STATUS'
const statusIcons: Record<string, string> = {
  'BURN': '🔥',
  'FREEZE': '🧊',
  'PARALYZE': '⚡',
  'POISON': '☠️',
  'SLEEP': '😴',
  'CONFUSE': '😵'
};
const icon = statusIcons[effect.statusEffect] || '✨';
showFloatingEffect(icon, '#9333ea', 'none', targetId);
```

## Paleta de Cores Recomendada

| Efeito | Cor | Hex |
|--------|-----|-----|
| Buff | Verde | `#22c55e` |
| Debuff | Vermelho | `#ef4444` |
| Heal | Verde Esmeralda | `#10b981` |
| Status | Roxo | `#9333ea` |
| Draw | Azul | `#3b82f6` |
| Damage | Vermelho Escuro | `#dc2626` |

## Integração com CardComponent

O `CardComponent` automaticamente renderiza todos os floating effects destinados à carta:

```tsx
{floatingEffects.filter(e => e.targetId === card.uniqueId).map(effect => (
  <div 
    key={effect.id} 
    className={`effect-popup anim-${effect.animation}`}
    style={{ 
      color: effect.color,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)'
    }}
  >
    {effect.text}
  </div>
))}
```

## Notas

- Os efeitos são exibidos por 1 segundo antes de serem removidos automaticamente
- Múltiplos efeitos podem ser exibidos simultaneamente na mesma carta
- O sistema é independente do sistema de dano flutuante (`floatingDamage`)
- Os efeitos funcionam tanto para o player quanto para o NPC
- Em modo PvP, os efeitos também funcionam normalmente

## Locais onde Floating Effects são Aplicados

1. **useSpell** (useGameLogic.ts)
   - HEAL: quando jogador é curado
   - BUFF: quando carta recebe aumento de status
   - STATUS: quando status effect é aplicado em carta inimiga

2. **Traps** (useGameLogic.ts)
   - DEBUFF: quando trap aplica redução de status
   - STATUS: quando trap aplica status effect

3. **Abilities** (futuro)
   - Pode ser integrado quando habilidades aplicam buffs/debuffs/status
