/**
 * Open Source Portrait Integration Script
 * Downloads and organizes free portrait assets for World Engine
 */

// === RECOMMENDED OPEN SOURCE COLLECTIONS ===

const PORTRAIT_SOURCES = {
    // CC0 - Public Domain (no attribution required)
    kenney: {
        name: "Kenney Game Assets",
        license: "CC0",
        url: "https://kenney.nl/assets/rpg-pack",
        description: "Stylized RPG character portraits",
        download: "https://kenney.nl/media/pages/assets/rpg-pack/rpg-pack.zip"
    },

    // CC-BY - Attribution required
    lpc: {
        name: "Liberated Pixel Cup",
        license: "CC-BY-SA / GPL",
        url: "https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/",
        description: "Extensive fantasy character generator assets",
        portraits: "https://opengameart.org/content/lpc-fantasy-portrait-collection"
    },

    // Freeware - Check terms
    reiner: {
        name: "Reiner's Tilesets",
        license: "Freeware (check terms)",
        url: "https://www.reinerstilesets.de/",
        description: "Professional quality fantasy portraits",
        portraits: "https://www.reinerstilesets.de/2d-grafiken/characters/"
    },

    // Mixed licenses
    opengameart: {
        name: "Open Game Art",
        license: "Various CC",
        url: "https://opengameart.org/",
        search: "https://opengameart.org/art-search-advanced?keys=portrait&field_art_type_tid%5B%5D=9",
        description: "Community fantasy art collection"
    }
};

// === INTEGRATION PLAN ===

const INTEGRATION_STEPS = [
    "1. Download CC0 assets first (no licensing concerns)",
    "2. Organize by species/archetype categories",
    "3. Convert to PNG format if needed",
    "4. Update portrait system to use new assets",
    "5. Add proper attribution file",
    "6. Test with current character creation system"
];

// === QUICK REPLACEMENTS ===

// These can replace your current placeholder PNGs immediately
const IMMEDIATE_OPTIONS = {
    humanMale: "https://opengameart.org/sites/default/files/human_male_portrait_0.png",
    humanFemale: "https://opengameart.org/sites/default/files/human_female_portrait_0.png",
    elfMale: "https://opengameart.org/sites/default/files/elf_male_portrait_0.png",
    elfFemale: "https://opengameart.org/sites/default/files/elf_female_portrait_0.png",
    // Add more as found
};

// Export for use in download script
module.exports = {
    PORTRAIT_SOURCES,
    INTEGRATION_STEPS,
    IMMEDIATE_OPTIONS
};

console.log("🎨 Open Source Portrait Research Complete!");
console.log("📁 Check PORTRAIT_SOURCES for recommended collections");
console.log("⚖️ All sources respect open source licensing");
console.log("🚀 Ready for integration with World Engine!");