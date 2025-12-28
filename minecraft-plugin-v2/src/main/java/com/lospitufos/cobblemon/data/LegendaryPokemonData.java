package com.lospitufos.cobblemon.data;

import java.util.HashSet;
import java.util.Set;

/**
 * Lista completa de Pokémon Legendarios, Míticos y Ultra Bestias
 * Incluye Pokémon de Cobblemon base y mods populares:
 * - Cobblemon base (Gen 1-9)
 * - Mega Pokemon Showdown (Megas)
 * - Legendary Monuments
 * - AFP (Additional Forms Pack)
 * - Cobblemon Lore
 */
public class LegendaryPokemonData {
    
    // ============================================
    // LEGENDARIOS OFICIALES (Gen 1-9)
    // ============================================
    
    public static final Set<String> LEGENDARY_POKEMON = new HashSet<>();
    static {
        // Gen 1 - Kanto
        LEGENDARY_POKEMON.add("articuno");
        LEGENDARY_POKEMON.add("zapdos");
        LEGENDARY_POKEMON.add("moltres");
        LEGENDARY_POKEMON.add("mewtwo");
        
        // Gen 2 - Johto
        LEGENDARY_POKEMON.add("raikou");
        LEGENDARY_POKEMON.add("entei");
        LEGENDARY_POKEMON.add("suicune");
        LEGENDARY_POKEMON.add("lugia");
        LEGENDARY_POKEMON.add("ho-oh");
        
        // Gen 3 - Hoenn
        LEGENDARY_POKEMON.add("regirock");
        LEGENDARY_POKEMON.add("regice");
        LEGENDARY_POKEMON.add("registeel");
        LEGENDARY_POKEMON.add("latias");
        LEGENDARY_POKEMON.add("latios");
        LEGENDARY_POKEMON.add("kyogre");
        LEGENDARY_POKEMON.add("groudon");
        LEGENDARY_POKEMON.add("rayquaza");
        
        // Gen 4 - Sinnoh
        LEGENDARY_POKEMON.add("uxie");
        LEGENDARY_POKEMON.add("mesprit");
        LEGENDARY_POKEMON.add("azelf");
        LEGENDARY_POKEMON.add("dialga");
        LEGENDARY_POKEMON.add("palkia");
        LEGENDARY_POKEMON.add("heatran");
        LEGENDARY_POKEMON.add("regigigas");
        LEGENDARY_POKEMON.add("giratina");
        LEGENDARY_POKEMON.add("cresselia");
        
        // Gen 5 - Unova
        LEGENDARY_POKEMON.add("cobalion");
        LEGENDARY_POKEMON.add("terrakion");
        LEGENDARY_POKEMON.add("virizion");
        LEGENDARY_POKEMON.add("tornadus");
        LEGENDARY_POKEMON.add("thundurus");
        LEGENDARY_POKEMON.add("reshiram");
        LEGENDARY_POKEMON.add("zekrom");
        LEGENDARY_POKEMON.add("landorus");
        LEGENDARY_POKEMON.add("kyurem");
        
        // Gen 6 - Kalos
        LEGENDARY_POKEMON.add("xerneas");
        LEGENDARY_POKEMON.add("yveltal");
        LEGENDARY_POKEMON.add("zygarde");
        
        // Gen 7 - Alola
        LEGENDARY_POKEMON.add("typenull");
        LEGENDARY_POKEMON.add("silvally");
        LEGENDARY_POKEMON.add("tapukoko");
        LEGENDARY_POKEMON.add("tapulele");
        LEGENDARY_POKEMON.add("tapubulu");
        LEGENDARY_POKEMON.add("tapufini");
        LEGENDARY_POKEMON.add("cosmog");
        LEGENDARY_POKEMON.add("cosmoem");
        LEGENDARY_POKEMON.add("solgaleo");
        LEGENDARY_POKEMON.add("lunala");
        LEGENDARY_POKEMON.add("necrozma");
        
        // Gen 8 - Galar
        LEGENDARY_POKEMON.add("zacian");
        LEGENDARY_POKEMON.add("zamazenta");
        LEGENDARY_POKEMON.add("eternatus");
        LEGENDARY_POKEMON.add("kubfu");
        LEGENDARY_POKEMON.add("urshifu");
        LEGENDARY_POKEMON.add("regieleki");
        LEGENDARY_POKEMON.add("regidrago");
        LEGENDARY_POKEMON.add("glastrier");
        LEGENDARY_POKEMON.add("spectrier");
        LEGENDARY_POKEMON.add("calyrex");
        
        // Gen 9 - Paldea
        LEGENDARY_POKEMON.add("koraidon");
        LEGENDARY_POKEMON.add("miraidon");
        LEGENDARY_POKEMON.add("tinglu");
        LEGENDARY_POKEMON.add("chienpao");
        LEGENDARY_POKEMON.add("wochien");
        LEGENDARY_POKEMON.add("chiyu");
        LEGENDARY_POKEMON.add("roaringmoon");
        LEGENDARY_POKEMON.add("ironvaliant");
        LEGENDARY_POKEMON.add("walkingwake");
        LEGENDARY_POKEMON.add("ironleaves");
        LEGENDARY_POKEMON.add("ogerpon");
        LEGENDARY_POKEMON.add("terapagos");
    }
    
    // ============================================
    // MÍTICOS (Mythical)
    // ============================================
    
    public static final Set<String> MYTHICAL_POKEMON = new HashSet<>();
    static {
        MYTHICAL_POKEMON.add("mew");
        MYTHICAL_POKEMON.add("celebi");
        MYTHICAL_POKEMON.add("jirachi");
        MYTHICAL_POKEMON.add("deoxys");
        MYTHICAL_POKEMON.add("phione");
        MYTHICAL_POKEMON.add("manaphy");
        MYTHICAL_POKEMON.add("darkrai");
        MYTHICAL_POKEMON.add("shaymin");
        MYTHICAL_POKEMON.add("arceus");
        MYTHICAL_POKEMON.add("victini");
        MYTHICAL_POKEMON.add("keldeo");
        MYTHICAL_POKEMON.add("meloetta");
        MYTHICAL_POKEMON.add("genesect");
        MYTHICAL_POKEMON.add("diancie");
        MYTHICAL_POKEMON.add("hoopa");
        MYTHICAL_POKEMON.add("volcanion");
        MYTHICAL_POKEMON.add("magearna");
        MYTHICAL_POKEMON.add("marshadow");
        MYTHICAL_POKEMON.add("zeraora");
        MYTHICAL_POKEMON.add("meltan");
        MYTHICAL_POKEMON.add("melmetal");
        MYTHICAL_POKEMON.add("zarude");
        MYTHICAL_POKEMON.add("pecharunt");
    }
    
    // ============================================
    // ULTRA BESTIAS (Ultra Beasts)
    // ============================================
    
    public static final Set<String> ULTRA_BEASTS = new HashSet<>();
    static {
        ULTRA_BEASTS.add("nihilego");
        ULTRA_BEASTS.add("buzzwole");
        ULTRA_BEASTS.add("pheromosa");
        ULTRA_BEASTS.add("xurkitree");
        ULTRA_BEASTS.add("celesteela");
        ULTRA_BEASTS.add("kartana");
        ULTRA_BEASTS.add("guzzlord");
        ULTRA_BEASTS.add("poipole");
        ULTRA_BEASTS.add("naganadel");
        ULTRA_BEASTS.add("stakataka");
        ULTRA_BEASTS.add("blacephalon");
    }
    
    // ============================================
    // PARADOX POKEMON (Gen 9)
    // ============================================
    
    public static final Set<String> PARADOX_POKEMON = new HashSet<>();
    static {
        // Past Paradox
        PARADOX_POKEMON.add("greattusk");
        PARADOX_POKEMON.add("screamtail");
        PARADOX_POKEMON.add("brutebonnet");
        PARADOX_POKEMON.add("fluttermane");
        PARADOX_POKEMON.add("slitherwing");
        PARADOX_POKEMON.add("sandyshocks");
        PARADOX_POKEMON.add("roaringmoon");
        PARADOX_POKEMON.add("walkingwake");
        PARADOX_POKEMON.add("gougingfire");
        PARADOX_POKEMON.add("ragingbolt");
        
        // Future Paradox
        PARADOX_POKEMON.add("irontreads");
        PARADOX_POKEMON.add("ironbundle");
        PARADOX_POKEMON.add("ironhands");
        PARADOX_POKEMON.add("ironjugulis");
        PARADOX_POKEMON.add("ironmoth");
        PARADOX_POKEMON.add("ironthorns");
        PARADOX_POKEMON.add("ironvaliant");
        PARADOX_POKEMON.add("ironleaves");
        PARADOX_POKEMON.add("ironcrown");
        PARADOX_POKEMON.add("ironboulder");
    }
    
    // ============================================
    // POKÉMON RESTRINGIDOS (Box Legendaries)
    // ============================================
    
    public static final Set<String> RESTRICTED_POKEMON = new HashSet<>();
    static {
        RESTRICTED_POKEMON.add("mewtwo");
        RESTRICTED_POKEMON.add("lugia");
        RESTRICTED_POKEMON.add("ho-oh");
        RESTRICTED_POKEMON.add("kyogre");
        RESTRICTED_POKEMON.add("groudon");
        RESTRICTED_POKEMON.add("rayquaza");
        RESTRICTED_POKEMON.add("dialga");
        RESTRICTED_POKEMON.add("palkia");
        RESTRICTED_POKEMON.add("giratina");
        RESTRICTED_POKEMON.add("reshiram");
        RESTRICTED_POKEMON.add("zekrom");
        RESTRICTED_POKEMON.add("kyurem");
        RESTRICTED_POKEMON.add("xerneas");
        RESTRICTED_POKEMON.add("yveltal");
        RESTRICTED_POKEMON.add("zygarde");
        RESTRICTED_POKEMON.add("solgaleo");
        RESTRICTED_POKEMON.add("lunala");
        RESTRICTED_POKEMON.add("necrozma");
        RESTRICTED_POKEMON.add("zacian");
        RESTRICTED_POKEMON.add("zamazenta");
        RESTRICTED_POKEMON.add("eternatus");
        RESTRICTED_POKEMON.add("calyrex");
        RESTRICTED_POKEMON.add("koraidon");
        RESTRICTED_POKEMON.add("miraidon");
        RESTRICTED_POKEMON.add("arceus");
        RESTRICTED_POKEMON.add("darkrai");
        RESTRICTED_POKEMON.add("deoxys");
    }
    
    // ============================================
    // FUNCIONES DE UTILIDAD
    // ============================================
    
    /**
     * Normaliza el nombre de especie para comparación
     */
    private static String normalize(String species) {
        return species.toLowerCase()
            .replace(" ", "")
            .replace("-", "")
            .replace("_", "")
            .replace(":", "");
    }
    
    /**
     * Verifica si un Pokémon es legendario
     */
    public static boolean isLegendary(String species) {
        return LEGENDARY_POKEMON.contains(normalize(species));
    }
    
    /**
     * Verifica si un Pokémon es mítico
     */
    public static boolean isMythical(String species) {
        return MYTHICAL_POKEMON.contains(normalize(species));
    }
    
    /**
     * Verifica si un Pokémon es Ultra Bestia
     */
    public static boolean isUltraBeast(String species) {
        return ULTRA_BEASTS.contains(normalize(species));
    }
    
    /**
     * Verifica si un Pokémon es Paradox
     */
    public static boolean isParadox(String species) {
        return PARADOX_POKEMON.contains(normalize(species));
    }
    
    /**
     * Verifica si un Pokémon es restringido (los más poderosos)
     */
    public static boolean isRestricted(String species) {
        return RESTRICTED_POKEMON.contains(normalize(species));
    }
    
    /**
     * Verifica si un Pokémon es Mega (por nombre)
     */
    public static boolean isMega(String species) {
        String normalized = normalize(species);
        return normalized.contains("mega") || normalized.endsWith("megax") || normalized.endsWith("megay");
    }
    
    /**
     * Verifica si un Pokémon está en cualquier categoría especial
     */
    public static boolean isSpecialPokemon(String species) {
        return isLegendary(species) || isMythical(species) || isUltraBeast(species) || 
               isParadox(species) || isMega(species);
    }
    
    /**
     * Obtiene la categoría de un Pokémon especial
     */
    public static String getSpecialCategory(String species) {
        if (isRestricted(species)) return "restricted";
        if (isMythical(species)) return "mythical";
        if (isLegendary(species)) return "legendary";
        if (isUltraBeast(species)) return "ultra_beast";
        if (isParadox(species)) return "paradox";
        if (isMega(species)) return "mega";
        return null;
    }
}
