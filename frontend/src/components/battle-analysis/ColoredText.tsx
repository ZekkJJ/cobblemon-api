'use client';

import { useMemo } from 'react';
import { getTypeColor, RESULT_COLORS } from '@/lib/pokemon-type-colors';
import { PokemonTooltip } from './PokemonTooltip';
import { MoveTooltip } from './MoveTooltip';
import { COMMON_POKEMON, COMMON_MOVES } from '@/lib/analysis-parser';

interface Stats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

interface Pokemon {
  species: string;
  level: number;
  nature: string;
  ability: string;
  moves: string[];
  ivs: Stats;
  evs?: Stats;
  heldItem?: string;
  shiny?: boolean;
  types?: string[];
}

interface ColoredTextProps {
  text: string;
  pokemonData?: Pokemon[];
  enableTooltips?: boolean;
}

// Pokemon type mapping for common species
const POKEMON_TYPES: Record<string, string[]> = {
  pikachu: ['electric'],
  charizard: ['fire', 'flying'],
  blastoise: ['water'],
  venusaur: ['grass', 'poison'],
  dragonite: ['dragon', 'flying'],
  tyranitar: ['rock', 'dark'],
  garchomp: ['dragon', 'ground'],
  lucario: ['fighting', 'steel'],
  greninja: ['water', 'dark'],
  gengar: ['ghost', 'poison'],
  alakazam: ['psychic'],
  gyarados: ['water', 'flying'],
  noivern: ['flying', 'dragon'],
  hydreigon: ['dark', 'dragon'],
  metagross: ['steel', 'psychic'],
  salamence: ['dragon', 'flying'],
  scizor: ['bug', 'steel'],
  aegislash: ['steel', 'ghost'],
  mimikyu: ['ghost', 'fairy'],
  dragapult: ['dragon', 'ghost'],
  toxapex: ['poison', 'water'],
  corviknight: ['flying', 'steel'],
  excadrill: ['ground', 'steel'],
  ferrothorn: ['grass', 'steel'],
  rotom: ['electric', 'ghost'],
  clefable: ['fairy'],
  togekiss: ['fairy', 'flying'],
  heatran: ['fire', 'steel'],
  landorus: ['ground', 'flying'],
};

function getPokemonType(species: string): string {
  const normalized = species.toLowerCase().replace(/[^a-z]/g, '');
  return POKEMON_TYPES[normalized]?.[0] || 'normal';
}

export function ColoredText({ text, pokemonData = [], enableTooltips = true }: ColoredTextProps) {
  // Build list of known Pokemon from data + common list
  const knownPokemon = useMemo(() => {
    const fromData = pokemonData.map(p => p.species);
    return Array.from(new Set([...fromData, ...COMMON_POKEMON]));
  }, [pokemonData]);

  // Build list of known moves from Pokemon data + common list
  const knownMoves = useMemo(() => {
    const fromData = pokemonData.flatMap(p => p.moves);
    return Array.from(new Set([...fromData, ...COMMON_MOVES]));
  }, [pokemonData]);

  // Parse and colorize text
  const colorizedContent = useMemo(() => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Patterns to match
    const patterns: { regex: RegExp; type: 'victory' | 'defeat' | 'pokemon' | 'move' }[] = [
      { regex: /\b(victoria|ganó|winner|won)\b/gi, type: 'victory' },
      { regex: /\b(derrota|perdió|loser|lost)\b/gi, type: 'defeat' },
    ];

    // Add Pokemon patterns
    for (const pokemon of knownPokemon) {
      patterns.push({
        regex: new RegExp(`\\b${escapeRegex(pokemon)}\\b`, 'gi'),
        type: 'pokemon',
      });
    }

    // Add move patterns
    for (const move of knownMoves) {
      patterns.push({
        regex: new RegExp(`\\b${escapeRegex(move)}\\b`, 'gi'),
        type: 'move',
      });
    }

    // Process text
    while (remaining.length > 0) {
      let earliestMatch: { index: number; length: number; text: string; type: string } | null = null;

      for (const { regex, type } of patterns) {
        regex.lastIndex = 0;
        const match = regex.exec(remaining);
        if (match && (!earliestMatch || match.index < earliestMatch.index)) {
          earliestMatch = {
            index: match.index,
            length: match[0].length,
            text: match[0],
            type,
          };
        }
      }

      if (!earliestMatch) {
        // No more matches, add remaining text
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      // Add text before match
      if (earliestMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, earliestMatch.index)}</span>);
      }

      // Add colored match
      const matchText = earliestMatch.text;
      
      if (earliestMatch.type === 'victory') {
        parts.push(
          <span key={key++} className="font-bold" style={{ color: RESULT_COLORS.victory }}>
            {matchText}
          </span>
        );
      } else if (earliestMatch.type === 'defeat') {
        parts.push(
          <span key={key++} className="font-bold" style={{ color: RESULT_COLORS.defeat }}>
            {matchText}
          </span>
        );
      } else if (earliestMatch.type === 'pokemon') {
        const pokemonInfo = pokemonData.find(
          p => p.species.toLowerCase() === matchText.toLowerCase()
        );
        const typeColor = pokemonInfo?.types?.[0] 
          ? getTypeColor(pokemonInfo.types[0])
          : getTypeColor(getPokemonType(matchText));

        if (enableTooltips && pokemonInfo) {
          parts.push(
            <PokemonTooltip key={key++} pokemon={pokemonInfo}>
              <span className="font-medium cursor-help underline decoration-dotted" style={{ color: typeColor }}>
                {matchText}
              </span>
            </PokemonTooltip>
          );
        } else {
          parts.push(
            <span key={key++} className="font-medium" style={{ color: typeColor }}>
              {matchText}
            </span>
          );
        }
      } else if (earliestMatch.type === 'move') {
        if (enableTooltips) {
          parts.push(
            <MoveTooltip key={key++} moveName={matchText}>
              <span className="font-medium cursor-help underline decoration-dotted text-purple-400">
                {matchText}
              </span>
            </MoveTooltip>
          );
        } else {
          parts.push(
            <span key={key++} className="font-medium text-purple-400">
              {matchText}
            </span>
          );
        }
      }

      remaining = remaining.slice(earliestMatch.index + earliestMatch.length);
    }

    return parts;
  }, [text, knownPokemon, knownMoves, pokemonData, enableTooltips]);

  return <>{colorizedContent}</>;
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default ColoredText;
