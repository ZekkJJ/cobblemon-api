/**
 * Analysis Parser Utility - V2
 * Parses AI battle analysis text into structured sections with better detection
 */

export interface AnalysisSection {
  type: 'header' | 'paragraph' | 'list' | 'score' | 'tip' | 'error' | 'keyMoment' | 'summary';
  content: string;
  items?: string[];
  score?: number;
  icon?: string;
}

/**
 * Clean markdown formatting from text
 */
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')       // Remove *italic*
    .replace(/__([^_]+)__/g, '$1')       // Remove __underline__
    .replace(/_([^_]+)_/g, '$1')         // Remove _italic_
    .replace(/^#+\s*/gm, '')             // Remove # headers
    .replace(/^▸\s*/gm, '')              // Remove ▸ bullets
    .replace(/^[-•]\s*/gm, '')           // Remove - or • bullets
    .replace(/^\d+\.\s*/gm, '')          // Remove numbered lists
    .replace(/:\s*$/, '')                // Remove trailing colons
    .replace(/⚠️/g, '')                  // Remove warning emoji
    .replace(/ÁREA DE MEJORA/gi, '')     // Remove repeated "ÁREA DE MEJORA" labels
    .trim();
}

/**
 * Check if line is just a label/marker without content
 */
function isEmptyLabel(line: string): boolean {
  const cleaned = cleanMarkdown(line);
  // Skip lines that are just labels like "ÁREA DE MEJORA" without actual content
  if (cleaned.length < 3) return true;
  if (/^(área de mejora|mejora|error|tip|consejo)$/i.test(cleaned)) return true;
  return false;
}

/**
 * Detect section type from content
 */
function detectSectionType(line: string): AnalysisSection['type'] | null {
  const lower = line.toLowerCase();
  
  // Score detection
  if (lower.match(/puntuaci[oó]n|score|calificaci[oó]n|nota/i) && lower.match(/\d+/)) {
    return 'score';
  }
  
  // Summary/Resumen
  if (lower.includes('resumen') || lower.includes('summary') || lower.includes('overview')) {
    return 'summary';
  }
  
  // Key moments
  if (lower.includes('momento') || lower.includes('clave') || lower.includes('key') || lower.includes('crítico')) {
    return 'keyMoment';
  }
  
  // Errors/Mistakes - but not if it's just a label
  if ((lower.includes('error') || lower.includes('fallo') || lower.includes('mistake') || 
      lower.includes('problema') || lower.includes('perdedor')) && lower.length > 20) {
    return 'error';
  }
  
  // Tips/Recommendations - but not if it's just a label
  if ((lower.includes('consejo') || lower.includes('tip') || lower.includes('recomend') ||
      lower.includes('sugerencia') || lower.includes('advice') || lower.includes('mejora')) && lower.length > 20) {
    return 'tip';
  }
  
  return null;
}

/**
 * Parse analysis text into sections - V2 with better detection
 */
export function parseAnalysisSections(text: string): AnalysisSection[] {
  const sections: AnalysisSection[] = [];
  const lines = text.split('\n');
  
  let currentSection: AnalysisSection | null = null;
  let currentListItems: string[] = [];
  
  const flushList = () => {
    if (currentListItems.length > 0) {
      sections.push({ 
        type: currentSection?.type === 'tip' ? 'tip' : 
              currentSection?.type === 'error' ? 'error' : 'list', 
        content: '', 
        items: [...currentListItems] 
      });
      currentListItems = [];
    }
  };
  
  const flushSection = () => {
    flushList();
    currentSection = null;
  };
  
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    
    if (!line) {
      flushList();
      continue;
    }
    
    // Skip empty labels like "ÁREA DE MEJORA" without content
    if (isEmptyLabel(line)) {
      continue;
    }
    
    // Check if it's a header line (starts with ## or ** or ▸)
    const isHeader = line.startsWith('##') || line.startsWith('▸') || 
                     (line.startsWith('**') && line.endsWith('**')) ||
                     (line.startsWith('**') && line.includes(':**'));
    
    if (isHeader) {
      flushSection();
      const cleanedContent = cleanMarkdown(line);
      
      // Skip if cleaned content is empty or just a label
      if (!cleanedContent || isEmptyLabel(cleanedContent)) {
        continue;
      }
      
      const detectedType = detectSectionType(cleanedContent);
      
      // Check for score in header
      const scoreMatch = cleanedContent.match(/(\d+)\s*(?:\/\s*10|de\s*10)?/);
      if (detectedType === 'score' && scoreMatch) {
        const score = parseInt(scoreMatch[1], 10);
        sections.push({ 
          type: 'score', 
          content: cleanedContent, 
          score: Math.min(10, Math.max(1, score)) 
        });
        continue;
      }
      
      currentSection = { type: detectedType || 'header', content: cleanedContent };
      
      // Don't add header if it's just a category marker
      if (!detectedType) {
        sections.push({ type: 'header', content: cleanedContent });
      }
      continue;
    }
    
    // Check for list items
    const isListItem = line.startsWith('-') || line.startsWith('•') || 
                       line.startsWith('*') || line.match(/^\d+\./);
    
    if (isListItem) {
      const itemContent = cleanMarkdown(line);
      if (itemContent && !isEmptyLabel(itemContent)) {
        currentListItems.push(itemContent);
      }
      continue;
    }
    
    // Check for inline score
    const scoreMatch = line.match(/(?:puntuaci[oó]n|score)[:\s]*(\d+)(?:\s*\/\s*10)?/i);
    if (scoreMatch) {
      flushSection();
      const score = parseInt(scoreMatch[1], 10);
      sections.push({ 
        type: 'score', 
        content: cleanMarkdown(line), 
        score: Math.min(10, Math.max(1, score)) 
      });
      continue;
    }
    
    // Regular paragraph
    flushList();
    const cleanedLine = cleanMarkdown(line);
    
    // Skip empty or label-only lines
    if (!cleanedLine || isEmptyLabel(cleanedLine)) {
      continue;
    }
    
    const lineType = detectSectionType(cleanedLine);
    
    if (lineType === 'tip') {
      sections.push({ type: 'tip', content: cleanedLine, icon: '💡' });
    } else if (lineType === 'error') {
      sections.push({ type: 'error', content: cleanedLine, icon: '⚠️' });
    } else if (lineType === 'keyMoment') {
      sections.push({ type: 'keyMoment', content: cleanedLine, icon: '⚡' });
    } else if (lineType === 'summary') {
      sections.push({ type: 'summary', content: cleanedLine, icon: '📋' });
    } else if (currentSection?.type) {
      // Inherit type from current section context
      sections.push({ type: currentSection.type as any, content: cleanedLine });
    } else {
      sections.push({ type: 'paragraph', content: cleanedLine });
    }
  }
  
  flushSection();
  
  // Filter out any remaining empty sections
  return sections.filter(s => s.content || (s.items && s.items.length > 0));
}

/**
 * Extract score (1-10) from analysis text
 */
export function extractScore(text: string): number | null {
  const patterns = [
    /(?:puntuaci[oó]n\s*(?:general)?|score|calificaci[oó]n|nota)[:\s]*(\d+)(?:\s*\/\s*10)?/gi,
    /(\d+)\s*\/\s*10/g,
    /(\d+)\s*(?:de\s*)?10\s*(?:puntos|estrellas)?/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const score = parseInt(match[1], 10);
      if (score >= 1 && score <= 10) return score;
    }
  }
  
  // Count stars
  const stars = (text.match(/⭐/g) || []).length;
  if (stars > 0 && stars <= 10) return stars;
  
  return null;
}

/**
 * Extract battle statistics from text
 */
export function extractBattleStats(text: string): { turns?: number; duration?: string } {
  const stats: { turns?: number; duration?: string } = {};
  
  // Extract turns
  const turnMatch = text.match(/(\d+)\s*(?:turno|turn)/i);
  if (turnMatch) {
    stats.turns = parseInt(turnMatch[1], 10);
  }
  
  // Extract duration
  const durationMatch = text.match(/(\d+)\s*(?:minuto|minute|segundo|second|min|sec)/i);
  if (durationMatch) {
    stats.duration = durationMatch[0];
  }
  
  return stats;
}

/**
 * Detect Pokemon names in text
 */
export function detectPokemonNames(text: string, knownPokemon: string[]): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const pokemon of knownPokemon) {
    const lowerPokemon = pokemon.toLowerCase();
    if (lowerText.includes(lowerPokemon)) {
      found.push(pokemon);
    }
  }
  
  return Array.from(new Set(found));
}

/**
 * Detect move names in text
 */
export function detectMoveNames(text: string, knownMoves: string[]): string[] {
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const move of knownMoves) {
    const lowerMove = move.toLowerCase();
    if (lowerText.includes(lowerMove)) {
      found.push(move);
    }
  }
  
  return Array.from(new Set(found));
}

/**
 * Common Pokemon species for detection
 */
export const COMMON_POKEMON = [
  'Pikachu', 'Charizard', 'Blastoise', 'Venusaur', 'Mewtwo', 'Mew',
  'Dragonite', 'Tyranitar', 'Salamence', 'Metagross', 'Garchomp',
  'Lucario', 'Greninja', 'Aegislash', 'Mimikyu', 'Dragapult',
  'Cinderace', 'Rillaboom', 'Inteleon', 'Corviknight', 'Toxtricity',
  'Noivern', 'Hydreigon', 'Goodra', 'Kommo-o', 'Haxorus',
  'Gengar', 'Alakazam', 'Machamp', 'Golem', 'Gyarados',
  'Lapras', 'Snorlax', 'Articuno', 'Zapdos', 'Moltres',
  'Espeon', 'Umbreon', 'Scizor', 'Heracross', 'Kingdra',
  'Blaziken', 'Swampert', 'Sceptile', 'Gardevoir', 'Aggron',
  'Infernape', 'Empoleon', 'Torterra', 'Luxray', 'Roserade',
  'Serperior', 'Emboar', 'Samurott', 'Excadrill', 'Chandelure',
  'Delphox', 'Chesnaught', 'Talonflame', 'Sylveon',
  'Decidueye', 'Incineroar', 'Primarina', 'Lycanroc', 'Toxapex',
];

/**
 * Common moves for detection
 */
export const COMMON_MOVES = [
  'Earthquake', 'Thunderbolt', 'Ice Beam', 'Flamethrower', 'Surf',
  'Psychic', 'Shadow Ball', 'Dragon Claw', 'Close Combat', 'Stone Edge',
  'Protect', 'Swords Dance', 'Dragon Dance', 'Calm Mind', 'Nasty Plot',
  'Stealth Rock', 'Spikes', 'Toxic Spikes', 'Defog', 'Rapid Spin',
  'U-turn', 'Volt Switch', 'Flip Turn', 'Teleport', 'Parting Shot',
  'Knock Off', 'Toxic', 'Will-O-Wisp', 'Thunder Wave', 'Glare',
  'Roost', 'Recover', 'Soft-Boiled', 'Slack Off', 'Synthesis',
  'Hydro Pump', 'Fire Blast', 'Thunder', 'Blizzard', 'Focus Blast',
  'Draco Meteor', 'Leaf Storm', 'Overheat', 'Psycho Boost', 'Superpower',
  'Outrage', 'Brave Bird', 'Flare Blitz', 'Wild Charge', 'Head Smash',
  'Boomburst', 'Hyper Voice', 'Moonblast', 'Dazzling Gleam', 'Play Rough',
];
