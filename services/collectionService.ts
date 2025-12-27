// Collection Service - Sistema de coleção de cartas
import { PlayerCollection, CardCollection, CustomDeck, Rarity } from '../types';
import { INITIAL_DECK, SPELL_CARDS, TRAP_CARDS } from '../constants';

const COLLECTION_KEY = 'pokecard_collection';

// Presets de decks iniciais (escolhe 1 aleatoriamente).
// Preencha cada array até 15 cartas conforme desejar.
const STARTER_DECKS: string[][] = [
  // Deck 1 - Bulbasaur como carta principal
  [
    '001', // Starter
    '010', '016', '019', '011', '021', '023', '046', '050', '098', '035', '014', // Commons
    'spell_potion', 'spell_pokeball', // Spells básicas
    'trap_counter', // Trap básica
  ],
  // Deck 2 - Charmander como carta principal
  [
    '004', // Starter
    '010', '016', '019', '011', '021', '023', '046', '050', '098', '035', '014', // Commons
    'spell_potion', 'spell_pokeball', // Spells básicas
    'trap_counter', // Trap básica
  ],
  // Deck 3 - Squirtle como carta principal
  [
    '007', // Starter
    '010', '016', '019', '011', '021', '023', '046', '050', '098', '035', '014', // Commons
    'spell_potion', 'spell_pokeball', // Spells básicas
    'trap_counter', // Trap básica
  ]
];

// Pikachu pode ser adicionado como fator de sorte (30%) independente do deck escolhido
const PIKACHU_ID = '025';
const PIKACHU_LUCK_FACTOR = 0.3; // 30%

class CollectionService {
  private collection: PlayerCollection = {
    cards: [],
    coins: 200,
    packs: 1,
    customDecks: [],
    selectedDeckId: null
  };

  constructor() {
    this.loadCollection();
  }

  private loadCollection() {
    try {
      const saved = localStorage.getItem(COLLECTION_KEY);
      if (saved) {
        this.collection = JSON.parse(saved);
      } else {
        // Inicializar com cartas iniciais
        this.initializeStarterCollection();
      }
    } catch (e) {
      console.warn('Failed to load collection');
      this.initializeStarterCollection();
    }
  }

  private initializeStarterCollection() {
    const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];

    // Escolhe aleatoriamente um dos decks iniciais
    const chosenDeck = STARTER_DECKS[Math.floor(Math.random() * STARTER_DECKS.length)] || [];

    // Aplica fator de sorte para Pikachu (30%) — adiciona Pikachu além das 15 cartas caso ocorra
    const starterCards = [...chosenDeck];
    if (Math.random() < PIKACHU_LUCK_FACTOR && !starterCards.includes(PIKACHU_ID)) {
      starterCards.push(PIKACHU_ID);
    }

    this.collection = {
      cards: allCards.map(card => ({
        cardId: card.id,
        quantity: starterCards.includes(card.id) ? 1 : 0,
        obtained: starterCards.includes(card.id)
      })),
      coins: 200,
      packs: 1,
      customDecks: [],
      selectedDeckId: null
    };
    
    this.saveCollection();
  }

  private saveCollection() {
    try {
      localStorage.setItem(COLLECTION_KEY, JSON.stringify(this.collection));
    } catch (e) {
      console.warn('Failed to save collection');
    }
  }

  getCollection(): PlayerCollection {
    return { ...this.collection };
  }

  getCoins(): number {
    return this.collection.coins;
  }

  getPacks(): number {
    return this.collection.packs;
  }

  addCoins(amount: number) {
    this.collection.coins += amount;
    this.saveCollection();
  }

  spendCoins(amount: number): boolean {
    if (this.collection.coins >= amount) {
      this.collection.coins -= amount;
      this.saveCollection();
      return true;
    }
    return false;
  }

  addPack(count: number = 1) {
    this.collection.packs += count;
    this.saveCollection();
  }

  hasCard(cardId: string): boolean {
    const card = this.collection.cards.find(c => c.cardId === cardId);
    return card ? card.quantity > 0 : false;
  }

  getCardQuantity(cardId: string): number {
    const card = this.collection.cards.find(c => c.cardId === cardId);
    return card?.quantity ?? 0;
  }

  addCard(cardId: string, quantity: number = 1) {
    const cardEntry = this.collection.cards.find(c => c.cardId === cardId);
    if (cardEntry) {
      cardEntry.quantity += quantity;
      cardEntry.obtained = true;
    } else {
      this.collection.cards.push({
        cardId,
        quantity,
        obtained: true
      });
    }
    this.saveCollection();
  }

  getObtainedCardsCount(): number {
    return this.collection.cards.filter(c => c.obtained).length;
  }

  // Abrir pack - retorna cartas obtidas
  openPack(): string[] {
    if (this.collection.packs <= 0) return [];
    
    this.collection.packs--;
    
    const allCards = [...INITIAL_DECK, ...SPELL_CARDS, ...TRAP_CARDS];
    const obtained: string[] = [];
    
    // 5 cartas por pack
    // 3 Common, 1 Uncommon, 1 Rare+ (10% Epic, 2% Legendary)
    const getCardsByRarity = (rarity: Rarity) => 
      allCards.filter(c => c.rarity === rarity);
    
    // 3 Commons
    const commons = getCardsByRarity(Rarity.COMMON);
    for (let i = 0; i < 3; i++) {
      const card = commons[Math.floor(Math.random() * commons.length)];
      if (card) {
        this.addCard(card.id);
        obtained.push(card.id);
      }
    }
    
    // 1 Uncommon
    const uncommons = getCardsByRarity(Rarity.UNCOMMON);
    if (uncommons.length > 0) {
      const card = uncommons[Math.floor(Math.random() * uncommons.length)];
      this.addCard(card.id);
      obtained.push(card.id);
    }
    
    // 1 Rare+ (2% Legendary, 10% Epic, 25% Rare, otherwise Uncommon)
    const roll = Math.random();
    let rarePool: typeof allCards;

    if (roll < 0.02) {
      rarePool = getCardsByRarity(Rarity.LEGENDARY);
    } else if (roll < 0.12) {
      rarePool = getCardsByRarity(Rarity.EPIC);
    } else if (roll < 0.37) { // 0.12 + 0.25 = 0.37
      rarePool = getCardsByRarity(Rarity.RARE);
    } else {
      rarePool = getCardsByRarity(Rarity.UNCOMMON);
    }
    
    if (rarePool.length > 0) {
      const card = rarePool[Math.floor(Math.random() * rarePool.length)];
      this.addCard(card.id);
      obtained.push(card.id);
    }
    
    this.saveCollection();
    return obtained;
  }

  // Custom Decks
  getCustomDecks(): CustomDeck[] {
    return [...this.collection.customDecks];
  }

  // Selected deck persistence
  getSelectedDeckId(): string | null {
    return this.collection.selectedDeckId ?? null;
  }

  setSelectedDeckId(deckId: string | null) {
    this.collection.selectedDeckId = deckId;
    this.saveCollection();
  }

  createDeck(name: string, cards: string[]): CustomDeck {
    const deck: CustomDeck = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      cards,
      createdAt: Date.now()
    };
    this.collection.customDecks.push(deck);
    this.saveCollection();
    return deck;
  }

  updateDeck(deckId: string, name: string, cards: string[]) {
    const deck = this.collection.customDecks.find(d => d.id === deckId);
    if (deck) {
      deck.name = name;
      deck.cards = cards;
      this.saveCollection();
    }
  }

  deleteDeck(deckId: string) {
    this.collection.customDecks = this.collection.customDecks.filter(d => d.id !== deckId);
    this.saveCollection();
  }

  // Comprar pack com coins
  buyPack(): boolean {
    const PACK_PRICE = 200;
    if (this.spendCoins(PACK_PRICE)) {
      this.addPack();
      return true;
    }
    return false;
  }

  resetCollection() {
    this.initializeStarterCollection();
  }
}

export const collectionService = new CollectionService();
