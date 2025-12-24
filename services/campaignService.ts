// Campaign Data - Sistema de campanha com bosses temáticos
import { CampaignBoss, AIDifficulty, SpecialRule, ElementType, SacrificeStrategy } from '../types';

export const CAMPAIGN_BOSSES: CampaignBoss[] = [
  // Liga Pokémon - 8 Líderes de Ginásio
  {
    id: 'brock',
    name: 'Brock',
    avatar: '🪨',
    description: 'Líder do Ginásio de Pewter City. Especialista em Pokémon de Pedra.',
    deck: ['027', '050', '074', '104', '111', '028', '051', '075', '095', '112', '105', '076', '084', '076', '095', '075', '111', '074', '074', '050'],
    hp: 8000,
    reward: { coins: 200, packs: 1 },
    unlocked: true,
    defeated: false,
    difficulty: AIDifficulty.EASY,
    sacrificeStrategy: SacrificeStrategy.FIELD_FIRST,
    specialRules: [
      { id: 'rock_boost', name: 'Força da Pedra', description: 'Pokémon GROUND têm +200 ATK', effect: 'TYPE_BOOST', value: 200, elementType: ElementType.GROUND }
    ]
  },
  {
    id: 'misty',
    name: 'Misty',
    avatar: '🌊',
    description: 'Líder do Ginásio de Cerulean City. Especialista em Pokémon de Água.',
    deck: ['120', '121', '054', '055', '116', '117', '007', '008', '009', '131', '072', '073', '090', '091', '098', '099', '118', '119', '134', '138'],
    hp: 8500,
    reward: { coins: 250, packs: 1 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.EASY,
    sacrificeStrategy: SacrificeStrategy.HAND_FIRST,
    specialRules: [
      { id: 'water_boost', name: 'Torrente', description: 'Pokémon WATER têm +200 ATK', effect: 'TYPE_BOOST', value: 200, elementType: ElementType.WATER }
    ]
  },
  {
    id: 'lt_surge',
    name: 'Lt. Surge',
    avatar: '⚡',
    description: 'Líder do Ginásio de Vermilion City. Especialista em Pokémon Elétricos.',
    deck: ['025', '026', '100', '101', '081', '082', '125', '135', '133', '100', '101', '115', '053', '137', '103', '103', '025', '026', '125', '082'],
    hp: 9000,
    reward: { coins: 300, packs: 1 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.NORMAL,
    sacrificeStrategy: SacrificeStrategy.SMART_HYBRID,
    specialRules: [
      { id: 'electric_boost', name: 'Descarga', description: 'Pokémon ELECTRIC têm +300 ATK', effect: 'TYPE_BOOST', value: 300, elementType: ElementType.ELECTRIC }
    ]
  },
  {
    id: 'erika',
    name: 'Erika',
    avatar: '🌸',
    description: 'Líder do Ginásio de Celadon City. Especialista em Pokémon de Planta.',
    deck: ['001', '043', '069', '102', '114', '002', '044', '070', '103', '003', '045', '114', '114', '103', '002', '070', '044', '003', '071', '045'],
    hp: 9000,
    reward: { coins: 300, packs: 1 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.NORMAL,
    sacrificeStrategy: SacrificeStrategy.HAND_FIRST,
    specialRules: [
      { id: 'grass_boost', name: 'Fotossíntese', description: 'Pokémon GRASS têm +200 ATK e curam 100 HP/turno', effect: 'TYPE_BOOST', value: 200, elementType: ElementType.GRASS }
    ]
  },
  {
    id: 'koga',
    name: 'Koga',
    avatar: '☠️',
    description: 'Líder do Ginásio de Fuchsia City. Mestre Ninja e especialista em Veneno.',
    deck: ['088', '023', '029', '032', '109', '041', '015', '089', '110', '042', '033', '030', '034', '031', '034', '031', '015', '089', '110', '088'],
    hp: 9500,
    reward: { coins: 350, packs: 1 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.NORMAL,
    sacrificeStrategy: SacrificeStrategy.SMART_HYBRID,
    specialRules: [
      { id: 'poison_boost', name: 'Veneno Mortal', description: 'Pokémon POISON causam envenenamento ao atacar', effect: 'TYPE_BOOST', value: 0, elementType: ElementType.POISON }
    ]
  },
  {
    id: 'sabrina',
    name: 'Sabrina',
    avatar: '🔮',
    description: 'Líder do Ginásio de Saffron City. Mestre dos poderes psíquicos.',
    deck: ['096', '063', '096', '063', '124', '122', '122', '124', '097', '064', '097', '064', '065', '065', '065', '151', '092', '093', '094', '093'],
    hp: 10000,
    reward: { coins: 400, packs: 2 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.HARD,
    sacrificeStrategy: SacrificeStrategy.SMART_HYBRID,
    specialRules: [
      { id: 'psychic_boost', name: 'Telepatia', description: 'Pokémon PSYCHIC têm +400 ATK', effect: 'TYPE_BOOST', value: 400, elementType: ElementType.PSYCHIC }
    ]
  },
  {
    id: 'blaine',
    name: 'Blaine',
    avatar: '🔥',
    description: 'Líder do Ginásio de Cinnabar Island. Cientista e mestre do fogo.',
    deck: ['004', '037', '058', '077', '005', '038', '059', '078', '126', '136', '006', '004', '077', '059', '136', '126', '006', '038', '077', '004'],
    hp: 10000,
    reward: { coins: 400, packs: 2 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.HARD,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'fire_boost', name: 'Inferno', description: 'Pokémon FIRE têm +400 ATK e queimam ao atacar', effect: 'TYPE_BOOST', value: 400, elementType: ElementType.FIRE }
    ]
  },
  {
    id: 'giovanni',
    name: 'Giovanni',
    avatar: '🏴',
    description: 'Líder do Ginásio de Viridian City e chefe da Team Rocket.',
    deck: ['111', '111', '053', '053', '029', '032', '029', '032', '030', '033', '030', '033', '031', '034', '031', '034', '112', '112', '051', '052'],
    hp: 10500,
    reward: { coins: 500, packs: 2, cards: ['150'] },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.HARD,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'ground_boost', name: 'Terremoto', description: 'Pokémon GROUND têm +500 ATK', effect: 'TYPE_BOOST', value: 500, elementType: ElementType.GROUND },
      { id: 'extra_hp', name: 'Líder Supremo', description: 'Giovanni começa com +1000 HP', effect: 'HP_MODIFIER', value: 1000 }
    ]
  },
  
  // Elite Four
  {
    id: 'lorelei',
    name: 'Lorelei',
    avatar: '🧊',
    description: 'Membro da Elite Four. Mestre do Gelo.',
    deck: ['087', '091', '131', '124', '144', '007', '008', '009', '072', '073', '090', '060', '061', '062', '116', '117', '134', '138', '139', '130'],
    hp: 11000,
    reward: { coins: 600, packs: 2 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.HARD,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'ice_boost', name: 'Era Glacial', description: 'Inimigos têm 20% chance de congelar ao atacar', effect: 'TYPE_BOOST', value: 0, elementType: ElementType.WATER }
    ]
  },
  {
    id: 'bruno',
    name: 'Bruno',
    avatar: '🥊',
    description: 'Membro da Elite Four. Mestre das Lutas.',
    deck: ['066', '067', '068', '095', '056', '057', '106', '107', '115', '128', '127', '016', '021', '018', '019', '020', '083', '132', '133', '137'],
    hp: 11500,
    reward: { coins: 650, packs: 2 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.HARD,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'fighting_boost', name: 'Poder Bruto', description: 'Pokémon FIGHTING têm +500 ATK', effect: 'TYPE_BOOST', value: 500, elementType: ElementType.FIGHTING }
    ]
  },
  {
    id: 'agatha',
    name: 'Agatha',
    avatar: '👻',
    description: 'Membro da Elite Four. Mestre dos Fantasmas.',
    deck: ['092', '093', '094', '042', '024', '110', '041', '023', '029', '030', '088', '089', '109', '049', '048', '015', '094', '094', '094', '150'],
    hp: 12000,
    reward: { coins: 700, packs: 3 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.EXPERT,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'ghost_boost', name: 'Maldição', description: 'Pokémon PSYCHIC têm 25% de reviver ao morrer', effect: 'TYPE_BOOST', value: 0, elementType: ElementType.PSYCHIC }
    ]
  },
  {
    id: 'lance',
    name: 'Lance',
    avatar: '🐉',
    description: 'Membro da Elite Four. Mestre dos Dragões.',
    deck: ['147', '148', '149', '149', '130', '142', '006', '150', '149', '131', '133', '137', '143', '144', '145', '146', '129', '128', '127', '130', '147', '147'],
    hp: 12000,
    reward: { coins: 800, packs: 3 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.EXPERT,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'dragon_boost', name: 'Fúria Dracônica', description: 'Todos Pokémon de Lance têm +600 ATK', effect: 'TYPE_BOOST', value: 600, elementType: ElementType.PSYCHIC }
    ]
  },
  
  // Champion
  {
    id: 'champion',
    name: 'Blue',
    avatar: '👑',
    description: 'O Campeão da Liga Pokémon! Seu maior rival.',
    deck: ['018', '059', '065', '103', '130', '112', '149', '150', '151', '131', '143', '129', '133', '137', '146', '144', '145', '125', '126', '127', '114', '007', '114'],
    hp: 14000,
    reward: { coins: 1500, packs: 5, cards: ['151'] },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.EXPERT,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'champion_boost', name: 'Campeão', description: 'Todos Pokémon do Campeão têm +800 ATK', effect: 'TYPE_BOOST', value: 800 },
      { id: 'champion_field', name: 'Campo Expandido', description: 'Campeão pode ter 4 Pokémon no campo', effect: 'FIELD_SIZE', value: 4 },
      { id: 'champion_cards', name: 'Mão Cheia', description: 'Campeão começa com 6 cartas', effect: 'STARTING_CARDS', value: 6 }
    ]
  },
  
  // Bonus Bosses
  {
    id: 'mewtwo_boss',
    name: 'Mewtwo',
    avatar: '🧬',
    description: 'O Pokémon mais poderoso criado pela ciência. BOSS SECRETO!',
    deck: ['150', '150', '065', '094', '151', '149', '144', '145', '146', '137', '133', '139', '131', '130', '143', '138', '151', '150', '149', '114', '007', '114'],
    hp: 17000,
    reward: { coins: 3000, packs: 10, cards: ['150', '151'] },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.EXPERT,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'mewtwo_power', name: 'Poder Absoluto', description: 'Mewtwo tem +1000 ATK em todos Pokémon', effect: 'TYPE_BOOST', value: 1000 },
      { id: 'mewtwo_psychic', name: 'Mente Superior', description: 'Pokémon PSYCHIC são imunes a status', effect: 'TYPE_BOOST', value: 0, elementType: ElementType.PSYCHIC }
    ]
  },

  // Additional Bonus Bosses
  {
    id: 'safari_guardian',
    name: 'Safari Guardian',
    avatar: '🦌',
    description: 'Guardião do Safari Zone — usa muitos Pokémon comuns e versáteis.',
    deck: ['052','053','016','017','018','032','033','034','083','084','085','108','113','115','128','129','133','137','060','061'],
    hp: 12000,
    reward: { coins: 1000, packs: 2 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.NORMAL,
    sacrificeStrategy: SacrificeStrategy.HAND_FIRST,
    specialRules: [
      { id: 'safari_swarm', name: 'Multidão', description: 'Tem muitas cartas comuns — maior probabilidade de baixar campo rapidamente', effect: 'FIELD_SIZE', value: 0 }
    ]
  },
  {
    id: 'rocket_admin',
    name: 'Team Rocket Admin',
    avatar: '🎩',
    description: 'Chefe da equipe Rocket — trap/poison/ground focus e táticas sujas.',
    deck: ['023','024','041','042','050','051','074','075','076','095','111','112','031','034','129','130','083','052','015','049'],
    hp: 14000,
    reward: { coins: 1500, packs: 3 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.HARD,
    sacrificeStrategy: SacrificeStrategy.SMART_HYBRID,
    specialRules: [
      { id: 'rocket_tricks', name: 'Truques da Rocket', description: 'Usa armadilhas e descartes para atrapalhar o jogador', effect: 'FIELD_SIZE', value: 0 }
    ]
  },
  {
    id: 'fossil_hunter',
    name: 'Fossil Hunter',
    avatar: '🗿',
    description: 'Caçador de fósseis — muita presença de Rock/Bug/Water e cartas resistentes.',
    deck: ['140','141','132','133','127','128','074','075','076','050','051','072','073','138','139','130','142','137','131','143'],
    hp: 13000,
    reward: { coins: 1200, packs: 2 },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.NORMAL,
    sacrificeStrategy: SacrificeStrategy.FIELD_FIRST,
    specialRules: [
      { id: 'fossil_resilience', name: 'Resiliência', description: 'Pokémon Rock têm bônus de defesa', effect: 'TYPE_BOOST', value: 200, elementType: ElementType.GROUND }
    ]
  },
  {
    id: 'dragon_master',
    name: 'Dragon Master',
    avatar: '🐲',
    description: 'Mestre dos dragões — decks cheios de ameaças grandes e raras.',
    deck: ['147', '148', '149', '149', '130', '142', '150', '149', '149', '131', '143', '137', '126', '125', '144', '145', '146', '129', '133', '151', '114', '007', '108'],
    hp: 16000,
    reward: { coins: 2000, packs: 4, cards: ['149'] },
    unlocked: false,
    defeated: false,
    difficulty: AIDifficulty.EXPERT,
    sacrificeStrategy: SacrificeStrategy.SCORE_BASED,
    specialRules: [
      { id: 'dragon_fury', name: 'Fúria Dracônica', description: 'Dragões têm grande bônus de ataque', effect: 'TYPE_BOOST', value: 600, elementType: ElementType.DRAGON }
    ]
  }
];

// Serviço de Campanha
const CAMPAIGN_KEY = 'pokecard_campaign';

class CampaignService {
  private bosses: CampaignBoss[] = [];

  constructor() {
    this.loadCampaign();
  }

  private loadCampaign() {
    try {
      const saved = localStorage.getItem(CAMPAIGN_KEY);
      if (saved) {
        const savedState: Record<string, { unlocked: boolean; defeated: boolean }> = JSON.parse(saved);
        this.bosses = CAMPAIGN_BOSSES.map(boss => ({
          ...boss,
          unlocked: savedState[boss.id]?.unlocked ?? boss.unlocked,
          defeated: savedState[boss.id]?.defeated ?? boss.defeated
        }));
      } else {
        this.bosses = [...CAMPAIGN_BOSSES];
      }
    } catch (e) {
      console.warn('Failed to load campaign');
      this.bosses = [...CAMPAIGN_BOSSES];
    }
  }

  private saveCampaign() {
    try {
      const toSave: Record<string, { unlocked: boolean; defeated: boolean }> = {};
      this.bosses.forEach(boss => {
        toSave[boss.id] = { unlocked: boss.unlocked, defeated: boss.defeated };
      });
      localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save campaign');
    }
  }

  getBosses(): CampaignBoss[] {
    return [...this.bosses];
  }

  getBoss(id: string): CampaignBoss | undefined {
    return this.bosses.find(b => b.id === id);
  }

  getNextBoss(): CampaignBoss | undefined {
    return this.bosses.find(b => b.unlocked && !b.defeated);
  }

  defeatBoss(id: string) {
    const bossIndex = this.bosses.findIndex(b => b.id === id);
    if (bossIndex >= 0) {
      this.bosses[bossIndex].defeated = true;
      // Desbloquear próximo boss
      if (bossIndex + 1 < this.bosses.length) {
        this.bosses[bossIndex + 1].unlocked = true;
      }
      this.saveCampaign();
    }
  }

  getProgress(): { defeated: number; total: number } {
    return {
      defeated: this.bosses.filter(b => b.defeated).length,
      total: this.bosses.length
    };
  }

  resetCampaign() {
    this.bosses = CAMPAIGN_BOSSES.map(boss => ({
      ...boss,
      unlocked: boss.id === 'brock',
      defeated: false
    }));
    this.saveCampaign();
  }
}

export const campaignService = new CampaignService();
