import * as fs from 'fs/promises';

const API_KEY = 'fc-8308539190304094acfa62c9eba35595';
const BASE_URL = 'https://wiki.cobblemon.com';

/**
 * Genera automáticamente todas las URLs de Pokémon desde la wiki de Cobblemon
 */
async function generatePokemonUrls() {
  console.log('🔍 Generando lista de URLs de Pokémon desde Cobblemon Wiki...\n');

  try {
    // Scrapear la página principal de Pokémon para obtener todos los links
    console.log('📡 Scrapeando lista de Pokémon...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        url: 'https://wiki.cobblemon.com/wiki/List_of_Pok%C3%A9mon',
        formats: ['links', 'markdown']
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to scrape: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.data) {
      throw new Error('No data returned from Firecrawl');
    }

    // Extraer links de Pokémon
    const links = data.data.links || [];
    
    // Filtrar solo links de Pokémon (que apuntan a /wiki/NombrePokemon)
    const pokemonUrls = links
      .filter((link: string) => {
        // Debe ser un link de la wiki
        if (!link.startsWith('/wiki/') && !link.startsWith('https://wiki.cobblemon.com/wiki/')) {
          return false;
        }
        
        // Extraer el nombre
        const urlPath = link.replace('https://wiki.cobblemon.com', '').replace('/wiki/', '');
        
        // Excluir páginas especiales
        const excludePatterns = [
          'List_of',
          'Category:',
          'Special:',
          'File:',
          'Template:',
          'Help:',
          'Main_Page',
          'Pok%C3%A9mon', // Pokémon (página general)
          'Generation_',
          'Type',
          'Ability',
          'Move',
          'Item',
          'Biome'
        ];
        
        return !excludePatterns.some(pattern => urlPath.includes(pattern));
      })
      .map((link: string) => {
        // Normalizar a URL completa
        if (link.startsWith('/wiki/')) {
          return `${BASE_URL}${link}`;
        }
        return link;
      })
      // Eliminar duplicados
      .filter((url: string, index: number, self: string[]) => self.indexOf(url) === index)
      // Ordenar alfabéticamente
      .sort();

    console.log(`\n✅ Encontrados ${pokemonUrls.length} Pokémon`);

    // Guardar en archivo
    await fs.writeFile(
      './pokemon_urls.json',
      JSON.stringify(pokemonUrls, null, 2)
    );

    console.log('💾 URLs guardadas en: pokemon_urls.json');
    
    // Mostrar algunos ejemplos
    console.log('\n📋 Primeros 10 Pokémon:');
    pokemonUrls.slice(0, 10).forEach((url: string, i: number) => {
      const name = url.split('/wiki/')[1];
      console.log(`   ${i + 1}. ${decodeURIComponent(name)}`);
    });

    if (pokemonUrls.length > 10) {
      console.log(`   ... y ${pokemonUrls.length - 10} más`);
    }

    console.log('\n🎉 ¡Listo! Ahora puedes ejecutar:');
    console.log('   npx tsx scrapeAllPokemonSimple.ts');

  } catch (error) {
    console.error('❌ Error:', error);
    
    // Fallback: generar URLs manualmente para Gen 1-9
    console.log('\n⚠️  Usando método alternativo: generando URLs por generación...');
    
    const fallbackUrls = generateFallbackUrls();
    
    await fs.writeFile(
      './pokemon_urls.json',
      JSON.stringify(fallbackUrls, null, 2)
    );
    
    console.log(`✅ Generadas ${fallbackUrls.length} URLs (método alternativo)`);
    console.log('💾 URLs guardadas en: pokemon_urls.json');
  }
}

/**
 * Genera URLs manualmente basándose en nombres conocidos de Pokémon
 */
function generateFallbackUrls(): string[] {
  // Lista de Pokémon más comunes en Cobblemon (Gen 1-9)
  const pokemonNames = [
    // Gen 1 Starters
    'Bulbasaur', 'Ivysaur', 'Venusaur',
    'Charmander', 'Charmeleon', 'Charizard',
    'Squirtle', 'Wartortle', 'Blastoise',
    
    // Gen 2 Starters
    'Chikorita', 'Bayleef', 'Meganium',
    'Cyndaquil', 'Quilava', 'Typhlosion',
    'Totodile', 'Croconaw', 'Feraligatr',
    
    // Gen 3 Starters
    'Treecko', 'Grovyle', 'Sceptile',
    'Torchic', 'Combusken', 'Blaziken',
    'Mudkip', 'Marshtomp', 'Swampert',
    
    // Gen 4 Starters
    'Turtwig', 'Grotle', 'Torterra',
    'Chimchar', 'Monferno', 'Infernape',
    'Piplup', 'Prinplup', 'Empoleon',
    
    // Gen 5 Starters
    'Snivy', 'Servine', 'Serperior',
    'Tepig', 'Pignite', 'Emboar',
    'Oshawott', 'Dewott', 'Samurott',
    
    // Gen 6 Starters
    'Chespin', 'Quilladin', 'Chesnaught',
    'Fennekin', 'Braixen', 'Delphox',
    'Froakie', 'Frogadier', 'Greninja',
    
    // Gen 7 Starters
    'Rowlet', 'Dartrix', 'Decidueye',
    'Litten', 'Torracat', 'Incineroar',
    'Popplio', 'Brionne', 'Primarina',
    
    // Gen 8 Starters
    'Grookey', 'Thwackey', 'Rillaboom',
    'Scorbunny', 'Raboot', 'Cinderace',
    'Sobble', 'Drizzile', 'Inteleon',
    
    // Gen 9 Starters
    'Sprigatito', 'Floragato', 'Meowscarada',
    'Fuecoco', 'Crocalor', 'Skeledirge',
    'Quaxly', 'Quaxwell', 'Quaquaval',
    
    // Pokémon populares adicionales
    'Pikachu', 'Raichu', 'Eevee', 'Vaporeon', 'Jolteon', 'Flareon',
    'Espeon', 'Umbreon', 'Leafeon', 'Glaceon', 'Sylveon',
    'Mewtwo', 'Mew', 'Lugia', 'Ho-Oh', 'Rayquaza', 'Arceus',
    'Lucario', 'Garchomp', 'Dragonite', 'Tyranitar', 'Salamence',
    'Gengar', 'Alakazam', 'Machamp', 'Gyarados', 'Lapras',
    'Snorlax', 'Metagross', 'Gardevoir', 'Blaziken', 'Swampert'
  ];

  return pokemonNames.map(name => `${BASE_URL}/wiki/${name}`);
}

// Ejecutar
generatePokemonUrls().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
