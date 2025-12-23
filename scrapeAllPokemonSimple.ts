import * as fs from 'fs/promises';
import * as path from 'path';

const BATCH_SIZE = 2; // Reduced to avoid rate limits
const DELAY = 3000; // Increased delay
const API_KEY = 'fc-8308539190304094acfa62c9eba35595';

// Global variable to be populated in main
let pokemonUrls: string[] = [];

// Enhanced schema for better extraction
const schema = {
  type: "object",
  properties: {
    name: { 
      type: "string",
      description: "The Pokemon's name"
    },
    pokedex_number: { 
      type: "string",
      description: "The Pokedex number (e.g., #001)"
    },
    sprite_url: { 
      type: "string", 
      description: "The main Pokemon sprite image URL. Look for the primary image showing the Pokemon."
    },
    shiny_sprite_url: {
      type: "string",
      description: "The shiny version sprite URL if available"
    },
    types: { 
      type: "array", 
      items: { type: "string" },
      description: "Pokemon types (e.g., Fire, Water, Grass)"
    },
    abilities: { 
      type: "array", 
      items: { type: "string" },
      description: "List of abilities the Pokemon can have"
    },
    hidden_ability: {
      type: "string",
      description: "The hidden ability if it exists"
    },
    ev_yield: { 
      type: "string",
      description: "EV yield information"
    },
    catch_rate: {
      type: "string",
      description: "The catch rate value"
    },
    base_friendship: {
      type: "string",
      description: "Base friendship value"
    },
    growth_rate: {
      type: "string",
      description: "Experience growth rate (e.g., Medium Slow, Fast)"
    },
    egg_groups: {
      type: "array",
      items: { type: "string" },
      description: "Egg groups the Pokemon belongs to"
    },
    gender_ratio: {
      type: "string",
      description: "Male to female ratio"
    },
    dropped_items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          sprite_url: { type: "string" },
          chance: { type: "string" },
          quantity: { type: "string" }
        },
        required: ["name", "chance"]
      },
      description: "Items that can be dropped by this Pokemon"
    },
    base_stats: {
      type: "object",
      properties: {
        hp: { type: "number" },
        attack: { type: "number" },
        defence: { type: "number" },
        sp_atk: { type: "number" },
        sp_def: { type: "number" },
        speed: { type: "number" },
        total: { type: "number" }
      },
      required: ["hp", "attack", "defence", "sp_atk", "sp_def", "speed"],
      description: "Base stats of the Pokemon"
    },
    spawn_locations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bucket: { 
            type: "string",
            description: "Spawn bucket (e.g., common, uncommon, rare)"
          },
          level: { 
            type: "string",
            description: "Level range for spawning"
          },
          preset: { 
            type: "string",
            description: "Spawn preset name"
          },
          requirements: {
            type: "object",
            properties: {
              biomes_yes: { 
                type: "array", 
                items: { type: "string" },
                description: "Required biomes"
              },
              biomes_no: { 
                type: "array", 
                items: { type: "string" },
                description: "Excluded biomes"
              },
              time_range: {
                type: "string",
                description: "Time requirements (e.g., day, night)"
              },
              weather: {
                type: "string",
                description: "Weather requirements"
              },
              other: { 
                type: "object", 
                additionalProperties: { type: "string" },
                description: "Other spawn requirements"
              }
            }
          }
        }
      },
      description: "Where and how this Pokemon spawns"
    },
    evolution: {
      type: "object",
      properties: {
        evolves_from: { type: "string" },
        evolves_to: { 
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              method: { type: "string" },
              level: { type: "string" }
            }
          }
        }
      },
      description: "Evolution information"
    }
  },
  required: ["name", "types", "base_stats"]
};

// Interface matching the schema
interface PokemonData {
  name: string;
  pokedex_number?: string;
  sprite_url?: string;
  shiny_sprite_url?: string;
  types: string[];
  abilities?: string[];
  hidden_ability?: string;
  ev_yield?: string;
  catch_rate?: string;
  base_friendship?: string;
  growth_rate?: string;
  egg_groups?: string[];
  gender_ratio?: string;
  dropped_items?: Array<{
    name: string;
    sprite_url?: string;
    chance: string;
    quantity?: string;
  }>;
  base_stats: {
    hp: number;
    attack: number;
    defence: number;
    sp_atk: number;
    sp_def: number;
    speed: number;
    total?: number;
  };
  spawn_locations?: Array<{
    bucket: string;
    level: string;
    preset?: string;
    requirements?: {
      biomes_yes?: string[];
      biomes_no?: string[];
      time_range?: string;
      weather?: string;
      other?: Record<string, string>;
    };
  }>;
  evolution?: {
    evolves_from?: string;
    evolves_to?: Array<{
      name: string;
      method: string;
      level?: string;
    }>;
  };
}

async function scrapePokemon(url: string, retries = 2): Promise<PokemonData | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`  Scraping ${url}${attempt > 0 ? ` (retry ${attempt})` : ''}...`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          url,
          formats: ['extract'],
          extract: {
            schema: schema,
            prompt: `Extract comprehensive information about this Cobblemon Pokemon. 
            Focus on:
            - Main sprite image URL (the primary Pokemon image)
            - Shiny sprite if available
            - All base stats (HP, Attack, Defence, Sp. Atk, Sp. Def, Speed)
            - Types and abilities
            - Spawn locations with biomes and requirements
            - Dropped items with chances
            - Evolution information
            Be thorough and accurate.`
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`  ❌ Failed (${response.status}): ${errorText.substring(0, 200)}`);
        
        if (response.status === 429) {
          // Rate limited, wait longer
          console.log(`  ⏳ Rate limited, waiting 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        
        if (attempt === retries) return null;
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      const data = await response.json();
      
      if (data.success && data.data?.extract) {
        const extracted = data.data.extract as PokemonData;
        
        // Validate we got essential data
        if (!extracted.name || !extracted.base_stats) {
          console.warn(`  ⚠️  Incomplete data for ${url}`);
          if (attempt === retries) return null;
          continue;
        }
        
        // Calculate total stats if not present
        if (!extracted.base_stats.total) {
          extracted.base_stats.total = 
            extracted.base_stats.hp +
            extracted.base_stats.attack +
            extracted.base_stats.defence +
            extracted.base_stats.sp_atk +
            extracted.base_stats.sp_def +
            extracted.base_stats.speed;
        }
        
        console.log(`  ✓ ${extracted.name} extracted successfully`);
        return extracted;
      }

      console.warn(`  ⚠️  No extract data in response for ${url}`);
      if (attempt === retries) return null;
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`  ❌ Error (attempt ${attempt + 1}):`, error instanceof Error ? error.message : error);
      if (attempt === retries) return null;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return null;
}

async function main() {
  console.log('🔥 Cobblemon Pokemon Scraper with Firecrawl\n');
  
  // Load URLs
  try {
    const content = await fs.readFile('./pokemon_urls.json', 'utf8');
    pokemonUrls = JSON.parse(content);
    console.log(`📋 Loaded ${pokemonUrls.length} Pokemon URLs\n`);
  } catch (e) {
    console.error("❌ Error reading pokemon_urls.json:", e);
    console.log("\n💡 Make sure pokemon_urls.json exists in the current directory");
    return;
  }

  // Create output directory
  await fs.mkdir('./pokemon_data', { recursive: true });

  // Load completed tracking
  const completedFile = './pokemon_data/_completed.json';
  const failedFile = './pokemon_data/_failed.json';
  
  let completed: string[] = [];
  let failed: string[] = [];
  
  try {
    completed = JSON.parse(await fs.readFile(completedFile, 'utf8'));
  } catch (e) {
    // File doesn't exist yet
  }
  
  try {
    failed = JSON.parse(await fs.readFile(failedFile, 'utf8'));
  } catch (e) {
    // File doesn't exist yet
  }

  // Filter remaining URLs
  const remainingUrls = pokemonUrls.filter(url => {
    const name = url.split('/').pop()?.toLowerCase() || 'unknown';
    return !completed.includes(name) && !failed.includes(name);
  });

  console.log(`✅ Already completed: ${completed.length}`);
  console.log(`❌ Previously failed: ${failed.length}`);
  console.log(`⏳ Remaining: ${remainingUrls.length}\n`);

  if (remainingUrls.length === 0) {
    console.log('🎉 All Pokemon have been processed!');
    return;
  }

  // Process in batches
  for (let i = 0; i < remainingUrls.length; i += BATCH_SIZE) {
    const batch = remainingUrls.slice(i, Math.min(i + BATCH_SIZE, remainingUrls.length));
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remainingUrls.length / BATCH_SIZE);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} Pokemon)`);
    console.log('='.repeat(60));

    const promises = batch.map(url => scrapePokemon(url));
    const results = await Promise.all(promises);

    for (let j = 0; j < results.length; j++) {
      const pokemon = results[j];
      const url = batch[j];
      const urlName = url.split('/').pop()?.toLowerCase() || 'unknown';
      
      if (pokemon) {
        const fileName = `./pokemon_data/${pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
        await fs.writeFile(fileName, JSON.stringify(pokemon, null, 2));
        completed.push(urlName);
        console.log(`  💾 Saved: ${pokemon.name}`);
      } else {
        failed.push(urlName);
        console.log(`  ❌ Failed: ${urlName}`);
      }
    }

    // Save progress
    await fs.writeFile(completedFile, JSON.stringify(completed, null, 2));
    await fs.writeFile(failedFile, JSON.stringify(failed, null, 2));

    // Progress summary
    const totalProcessed = completed.length + failed.length;
    const percentComplete = ((totalProcessed / pokemonUrls.length) * 100).toFixed(1);
    console.log(`\n📊 Progress: ${totalProcessed}/${pokemonUrls.length} (${percentComplete}%)`);
    console.log(`   ✅ Successful: ${completed.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);

    // Wait between batches
    if (i + BATCH_SIZE < remainingUrls.length) {
      console.log(`\n⏳ Waiting ${DELAY}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, DELAY));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Scraping Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successfully scraped: ${completed.length} Pokemon`);
  console.log(`❌ Failed to scrape: ${failed.length} Pokemon`);
  console.log(`📁 Data saved in: ./pokemon_data/`);
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed Pokemon saved in: ${failedFile}`);
    console.log('   You can retry these later by removing them from _failed.json');
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
