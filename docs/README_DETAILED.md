
# Battlecard — Documentação Completa

Este documento descreve em detalhes tudo que existe no jogo Battlecard (PokéCard Battle gen1), como as mecânicas funcionam, arquitetura do projeto, serviços, modos, e como estender ou testar o jogo.

## Visão Geral do Jogo
- Tipo: Jogo de cartas de batalha por turnos.
- Componentes principais: deck de cartas, mão, tabuleiro, pontos de vida, efeitos de status, habilidades, magias e armadilhas.
- Objetivo: derrotar o(s)ponente(s) reduzindo seus pontos de vida a zero usando e gerenciando cartas do deck.

## Mecânicas Principais

- Turnos: Jogadores (humano vs AI ou humano vs humano, dependendo do modo) jogam cartas, atacam e ativam habilidades por turnos.
- Cartas: cada carta tem `ataque`, `defesa`/`vida`, `custo` (se aplicável), `tipo`, `raridade`, e possivelmente `habilidades` ou ser `spell/trap`.
- Status Effects: efeitos persistentes que alteram comportamento das unidades (ex.: `Poison`, `Burn`, `Freeze`, `Stun`). Implementados em `types.ts` e processados em `useGameLogic.ts` via funções como `processStatusEffects` e `applyStatusEffect`.
- Habilidades (Abilities): habilidades passivas/ativas ligadas à cartas — podem ativar ao entrar em campo, ao atacar, ao morrer, ou em condições específicas.
- Spells e Traps: cartas de efeito único (magias) ou condicionais (armadilhas). Traps podem ativar em resposta a eventos e são verificadas por `TrapCondition`/`SpellEffect` no motor do jogo.
- Limite de Deck: configurado por `constants.ts` (`MIN_DECK_SIZE = 15`, `MAX_DECK_SIZE = 40`). DeckBuilder impõe regras (ex.: máximo de 3 cópias de uma mesma carta).

## Modos de Jogo

- Menu Principal: seleção entre modos.
- Campaign: sequência de batalhas contra chefes com progressão (persistida em `campaignService`).
- Draft / Arena: modos alternativos (esqueleto implementado, pode ser estendido).
- Survival: lida com ondas de inimigos em sequência.
- Single Match: partida rápida contra AI com dificuldades configuráveis (`AIDifficulty` em `types.ts`).

## IA

- `AIController.ts` contém lógica de decisão da IA. Considera vantagem de tipo, ameaça no tabuleiro e uso de magias/armadilhas.
- Suporta níveis de dificuldade que alteram agressividade e profundidade de simulação.

## Arquitetura do Projeto

- Frontend: React + TypeScript, bundling com Vite.
- Componentes principais:
  - `App.tsx` — roteamento de views (`menu`, `game`, `collection`, `deckbuilder`, `achievements`, `stats`).
  - `components/` — `DeckBuilderView.tsx`, `CardComponent.tsx`, `GameBoard.tsx`, `BattleLog.tsx`, `Modal.tsx`, `TypeTable.tsx`, etc.
  - `hooks/useGameLogic.ts` — motor de regras do jogo, resolução de turnos, aplicação de efeitos, integração com serviços (sound, stats, achievements).
  - `services/` — serviços que encapsulam persistência e lógica auxiliares:
    - `collectionService.ts` — gerencia coleção de cartas, packs, e decks customizados (create/update/delete/getCustomDecks).
    - `statsService.ts` — grava estatísticas do jogador (partidas jogadas, vitórias, derrotas, etc.) em `localStorage`.
    - `achievementsService.ts` — define conquistas e lógica de desbloqueio; notifica UI.
    - `campaignService.ts` — controla progresso da campanha e inimigos/chefes.
    - `soundService.ts` — reproduz efeitos sonoros (sintetizados via WebAudio ou samples).
    - `geminiService.ts` — integração opcional com AI (requere `GEMINI_API_KEY`).
  - `utils/gameRules.ts`, `types.ts`, `constants.ts` — regras, tipos e valores centrais (incluindo `MIN_DECK_SIZE` / `MAX_DECK_SIZE`).

## Persistência

- A maioria dos dados do jogador (coleção, decks salvos, estatísticas e progresso) é armazenada em `localStorage` via os serviços listados.

## Interface e Componentes Relevantes

- `DeckBuilderView.tsx` — UI para criar/editar decks: busca de cartas, filtros, validação de tamanho, limite de cópias, salvar/carregar/excluir decks.
- `CollectionView.tsx` — navegação e visualização da coleção de cartas; separado do Deck Builder por decisão de UX.
- `CardComponent.tsx` — renderiza cartas com ícones de status, habilidade, tipo e tooltip com efeitos.
- `GameBoard.tsx` — rende o tabuleiro e resolve interações entre unidades.

## Como Jogar (Fluxo Básico)

1. Abrir o jogo (executar `npm run dev` e abrir no navegador).
2. No menu, criar ou carregar um deck via `Deck Builder`.
3. Iniciar uma partida: durante o turno, você pode jogar cartas da mão, atacar com unidades, usar magias, e posicionar traps.
4. Efeitos de status são aplicados automaticamente ao final/início de turnos conforme definido nas cartas.

## Como Rodar e Desenvolver

1. Instalar dependências:

```bash
npm install
```

2. Rodar em desenvolvimento:

```bash
npm run dev
```

3. Build para produção:

```bash
npm run build
npm run preview
```

4. Variáveis de ambiente (opcional):
- Defina `GEMINI_API_KEY` em `.env.local` para habilitar integração AI no `geminiService`.

## Como Estender o Jogo

- Adicionar uma nova carta: editar/acompanhar onde as cartas são definidas (tipicamente em `constants.ts` ou em um arquivo de catálogo de cartas). A carta deve seguir a interface `Card` em `types.ts`.
- Nova habilidade: definir novo `Ability` em `types.ts` e implementar lógica de ativação no `useGameLogic.ts` ou em handlers específicos.
- Novas spells/traps: adicionar tipos e efeitos em `constants.ts` e assegurar que `useGameLogic` e `AIController` considerem essas ações.
- Nova modalidade: adicionar rota/estado em `App.tsx` e implementar UI + regras (usar `campaignService` como referência).

## Debug e Troubleshooting

- Erro ao rodar `npm run dev` (ex.: `Exit Code: 1`): verifique versões do Node, mensagens do terminal e se dependências estão instaladas corretamente.
- Se algo parece quebrado após mudanças de código, cheque o console do navegador e o terminal do Vite para erros de build/compilação.

## Boas Práticas de Contribuição

- Faça PRs pequenos e focados (uma feature ou bugfix por PR).
- Inclua descrições claras e passos para reproduzir/testar.
- Mantenha compatibilidade com `localStorage` se você alterar formatos persistidos (incluir migrations se necessário).

## Itens Conhecidos / Planejados

- Polimento visual: partículas, efeitos e transições planejados.
- Completar a UI de `CardComponent` com todos os indicadores visuais e tooltips detalhados.
- Expandir modos `Draft` e `Survival` com regras completas.

---

Se quiser, posso:
- Gerar um `cards_catalog.md` listando todas as cartas existentes com estatísticas e habilidades.
- Adicionar screenshots e badges ao `README.md` principal.
- Incluir exemplos de como criar novas cartas e um template de carta em `cards/example_card.ts`.

Diga qual desses extras prefere que eu gere em seguida.