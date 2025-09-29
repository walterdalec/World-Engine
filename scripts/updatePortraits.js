// scripts/updatePortraits.js
// Run with: node scripts/updatePortraits.js

const fs = require("fs");
const path = require("path");

const portraitsDir = path.join(__dirname, "..", "public", "assets", "portraits");
const manifestPath = path.join(portraitsDir, "manifest.json");
const presetsPath = path.join(portraitsDir, "presets.json");

// === Config: your world data ===
const species = ["Human", "Sylvanborn", "Alloy", "Draketh", "Voidkin", "Crystalborn", "Stormcaller"];
const classes = {
    Verdance: ["Greenwarden", "Thorn Knight", "Sapling Adept", "Bloomcaller"],
    Ashenreach: ["Ashblade", "Cinder Mystic", "Dust Ranger", "Bonechanter"],
    Skyvault: ["Stormcaller", "Voidwing", "Sky Knight", "Wind Sage"]
};
const pronouns = ["she/her", "he/him", "they/them", "xe/xir", "ze/hir", "fae/faer"];

// Default pronoun styles (change to taste)
const pronounStyles = {
    "she/her": { hair: "hair/long_wavy.svg", brows: "face/brows/brows_arced.svg", mouth: "face/mouth/mouth_smile.svg" },
    "he/him": { hair: "hair/short_straight.svg", brows: "face/brows/brows_thick.svg", mouth: "face/mouth/mouth_grim.svg", facial: "facial_hair/stubble.svg" },
    "they/them": { hair: "hair/undercut.svg", brows: "face/brows/brows_thin.svg", mouth: "face/mouth/mouth_neutral.svg" },
    "xe/xir": { hair: "hair/topknot.svg", brows: "face/brows/brows_arced.svg", mouth: "face/mouth/mouth_neutral.svg" },
    "ze/hir": { hair: "hair/shaved.svg", brows: "face/brows/brows_thick.svg", mouth: "face/mouth/mouth_smile.svg", facial: "facial_hair/mustache.svg" },
    "fae/faer": { hair: "hair/curly.svg", brows: "face/brows/brows_arced.svg", mouth: "face/mouth/mouth_smile.svg" }
};

// === Utility: walk dir ===
function walk(dir, rel = "") {
    let out = [];
    for (const f of fs.readdirSync(dir)) {
        const full = path.join(dir, f);
        const relPath = path.join(rel, f).replace(/\\/g, "/");
        if (fs.statSync(full).isDirectory()) out = out.concat(walk(full, relPath));
        else if (f.endsWith(".svg")) out.push(relPath);
    }
    return out;
}

// === Update manifest ===
console.log("🎨 World Engine Portrait Updater");
console.log("📁 Scanning:", portraitsDir);

let manifest = { version: "auto", lastUpdated: new Date().toISOString(), assets: [] };
if (fs.existsSync(manifestPath)) {
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        console.log("📋 Found existing manifest with", manifest.assets ? manifest.assets.length : 0, "assets");
    }
    catch {
        console.warn("⚠️ Couldn't parse manifest.json, starting fresh.");
    }
}

const existing = new Map(manifest.assets ? manifest.assets.map(a => [a.path, a]) : []);
const allSVGs = walk(portraitsDir).filter(p => !p.endsWith("manifest.json") && !p.endsWith("presets.json"));

console.log("🔍 Found", allSVGs.length, "SVG files");

let addedCount = 0;
for (const svgPath of allSVGs) {
    if (!existing.has(svgPath)) {
        const id = svgPath.replace(/\//g, "_").replace(".svg", "");
        const category = path.dirname(svgPath).replace(/\\/g, "/");

        // Create asset entry
        const asset = { id, category, path: svgPath };

        // Add species info for base assets
        if (category === "base") {
            const speciesName = path.basename(svgPath, ".svg");
            const properSpecies = species.find(s => s.toLowerCase() === speciesName.toLowerCase());
            if (properSpecies) {
                asset.species = [properSpecies];
            }
        }

        // Add world/archetype info for clothing
        if (category.startsWith("clothing/")) {
            const world = category.split("/")[1];
            const fileName = path.basename(svgPath, ".svg");

            // Try to match to an archetype
            for (const [worldName, classList] of Object.entries(classes)) {
                if (worldName.toLowerCase() === world) {
                    const matchingClass = classList.find(cls => {
                        const baseName = cls.toLowerCase().replace(/ /g, "_");
                        // Handle special cases like stormcaller_cls
                        return fileName.includes(baseName) || fileName.includes(baseName.replace("stormcaller", "stormcaller_cls"));
                    });
                    if (matchingClass) {
                        asset.archetype = [matchingClass];
                        asset.world = worldName;
                        break;
                    }
                }
            }
        }

        if (!manifest.assets) manifest.assets = [];
        manifest.assets.push(asset);
        console.log("➕ Added:", svgPath);
        addedCount++;
    }
}

manifest.lastUpdated = new Date().toISOString();
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("✅ Manifest updated with", addedCount, "new assets");

// === Generate presets ===
console.log("🎭 Generating presets...");
let presets = [];
let eyeCycle = allSVGs.filter(p => p.startsWith("face/eyes/"));
let i = 0;

for (const sp of species) {
    const base = `base/${sp.toLowerCase()}.svg`;

    // Check if base exists
    if (!allSVGs.includes(base)) {
        console.warn(`⚠️ Base asset missing: ${base}`);
        continue;
    }

    for (const [world, clsList] of Object.entries(classes)) {
        for (const cls of clsList) {
            let clothingPath = `clothing/${world.toLowerCase()}/${cls.toLowerCase().replace(/ /g, "_")}.svg`;

            // Special case for Stormcaller class (has _cls suffix)
            if (cls === "Stormcaller") {
                clothingPath = `clothing/${world.toLowerCase()}/stormcaller_cls.svg`;
            }

            // Check if clothing exists
            if (!allSVGs.includes(clothingPath)) {
                console.warn(`⚠️ Clothing asset missing: ${clothingPath}`);
                continue;
            }

            for (const pr of pronouns) {
                const pst = pronounStyles[pr];
                const layers = [
                    base,
                    eyeCycle[i % eyeCycle.length] || null,
                    pst.brows,
                    pst.mouth,
                    pst.hair,
                    clothingPath
                ].filter(Boolean);

                if (pst.facial) layers.splice(5, 0, pst.facial);

                presets.push({
                    id: `${sp.toLowerCase()}_${world.toLowerCase()}_${cls.toLowerCase().replace(/ /g, "_")}_${pr.replace("/", "-")}`,
                    label: `${sp} • ${cls} (${world}) — ${pr}`,
                    tags: [sp, world, cls, pr],
                    species: sp,
                    world: world,
                    archetype: cls,
                    pronouns: pr,
                    layers
                });
                i++;
            }
        }
    }
}

const presetDoc = {
    version: "auto",
    lastUpdated: new Date().toISOString(),
    count: presets.length,
    species,
    worlds: Object.keys(classes),
    archetypes: classes,
    pronouns,
    presets
};

fs.writeFileSync(presetsPath, JSON.stringify(presetDoc, null, 2));
console.log("✅ Presets generated:", presets.length);
console.log("🎉 Portrait system updated successfully!");