export interface Pokemon {
  species: string;
  speciesId: number;
  level: number;
  experience: number;
  shiny: boolean;
  gender: string;
  nature: string;
  ability: string;
  friendship: number;
  ball: string;
  ivs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  evs: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  moves: string[];
  heldItem?: string;
  currentHealth: number;
  maxHealth: number;
  status?: string;
}

export interface Starter {
  pokemonId: number;
  name: string;
  nameEs: string;
  generation: number;
  types: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  abilities: Array<{
    name: string;
    description: string;
    isHidden: boolean;
  }>;
  signatureMoves: Array<{
    name: string;
    type: string;
    power: number;
    accuracy: number;
  }>;
  evolutions: Array<{
    name: string;
    level?: number;
    method: string;
  }>;
  description: string;
  height: number;
  weight: number;
  sprites: {
    sprite: string;
    spriteAnimated: string;
    shiny: string;
    shinyAnimated: string;
    artwork: string;
    cry: string;
  };
  isClaimed: boolean;
  claimedBy?: string;
  claimedAt?: string;
  isShiny?: boolean;
}

export interface PlayerSummary {
  uuid: string;
  username: string;
  totalPokemon: number;
  shinies: number;
  starter?: {
    id: number;
    name: string;
    isShiny: boolean;
  };
  partyPreview: Array<{
    species: string;
    speciesId: number;
    level: number;
    shiny: boolean;
  }>;
}
