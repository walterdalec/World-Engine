/**
 * Extract Individual Character Portraits from Spritesheets
 * Converts DENZI's tileset into individual character PNGs for World Engine
 */

const fs = require('fs');
const path = require('path');

// We'll use HTML5 Canvas API in Node.js environment
const { createCanvas, loadImage } = require('canvas');

// Target directories
const sourceDir = path.join(__dirname, '..', 'public', 'assets', 'portraits-new');
const outputDir = path.join(sourceDir, 'extracted');

// Ensure output directories exist
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Extract individual sprites from a spritesheet
async function extractSprites(imageUrl, spriteWidth, spriteHeight, outputPrefix) {
    try {
        console.log(`🎨 Processing: ${path.basename(imageUrl)}`);

        const image = await loadImage(imageUrl);
        const cols = Math.floor(image.width / spriteWidth);
        const rows = Math.floor(image.height / spriteHeight);

        console.log(`📏 Image: ${image.width}x${image.height}, Grid: ${cols}x${rows}`);

        let extractedCount = 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Create canvas for individual sprite
                const canvas = createCanvas(spriteWidth, spriteHeight);
                const ctx = canvas.getContext('2d');

                // Extract sprite from source
                const sx = col * spriteWidth;
                const sy = row * spriteHeight;

                ctx.drawImage(image, sx, sy, spriteWidth, spriteHeight, 0, 0, spriteWidth, spriteHeight);

                // Check if sprite is not empty (simple pixel check)
                const imageData = ctx.getImageData(0, 0, spriteWidth, spriteHeight);
                const hasPixels = imageData.data.some((value, index) => index % 4 === 3 && value > 0); // Check alpha channel

                if (hasPixels) {
                    const filename = `${outputPrefix}_${row}_${col}.png`;
                    const outputPath = path.join(outputDir, filename);

                    // Save sprite
                    const buffer = canvas.toBuffer('image/png');
                    fs.writeFileSync(outputPath, buffer);

                    extractedCount++;
                    console.log(`✅ Extracted: ${filename}`);
                }
            }
        }

        console.log(`🎯 Total extracted from ${path.basename(imageUrl)}: ${extractedCount} sprites`);
        return extractedCount;

    } catch (error) {
        console.error(`❌ Error processing ${imageUrl}:`, error.message);
        return 0;
    }
}

// Map DENZI sprites to World Engine character types
async function categorizeCharacters() {
    console.log('🏷️ Categorizing characters for World Engine...');

    const extractedDir = path.join(outputDir);
    const categorizedDir = path.join(sourceDir, 'categorized');

    // Create category directories
    const categories = {
        'base/male': [],
        'base/female': [],
        'race/human': [],
        'race/sylvanborn': [],
        'race/alloy': [],
        'race/draketh': [],
        'race/voidkin': [],
        'race/crystalborn': [],
        'race/stormcaller_species': [],
        'class/greenwarden': [],
        'class/thornknight': [],
        'class/saplingadept': [],
        'class/bloomcaller': [],
        'class/ashblade': [],
        'class/cindermystic': [],
        'class/dustranger': [],
        'class/bonechanter': [],
        'class/stormcaller_class': [],
        'class/voidwing': [],
        'class/skyknight': [],
        'class/windsage': []
    };

    Object.keys(categories).forEach(category => {
        ensureDir(path.join(categorizedDir, category));
    });

    // Read extracted sprites
    if (fs.existsSync(extractedDir)) {
        const files = fs.readdirSync(extractedDir).filter(f => f.endsWith('.png'));

        files.forEach((file, index) => {
            // Simple categorization based on sprite sheet position
            // This is basic - you'd want more sophisticated character recognition
            const sourceFile = path.join(extractedDir, file);

            // Determine category based on index (rough categorization)
            const categoryKeys = Object.keys(categories);
            const categoryIndex = index % categoryKeys.length;
            const targetCategory = categoryKeys[categoryIndex];

            const targetFile = path.join(categorizedDir, targetCategory, `portrait_${index}.png`);

            // Copy to categorized location
            fs.copyFileSync(sourceFile, targetFile);
            console.log(`📂 Categorized: ${file} → ${targetCategory}/portrait_${index}.png`);
        });
    }

    console.log('✅ Character categorization complete!');
}

// Main execution
async function main() {
    console.log('🎭 World Engine Portrait Extractor');
    console.log('Converting DENZI CC0 spritesheets to individual portraits...\n');

    // Ensure output directory
    ensureDir(outputDir);

    try {
        // Extract from DENZI's 32x32 tileset (characters)
        const tilesetPath = path.join(sourceDir, 'denzi-tileset.png');
        if (fs.existsSync(tilesetPath)) {
            await extractSprites(tilesetPath, 32, 32, 'character');
        }

        // Extract from DENZI's 32x48 monsters (larger characters)
        const monstersPath = path.join(sourceDir, 'denzi-monsters.png');
        if (fs.existsSync(monstersPath)) {
            await extractSprites(monstersPath, 32, 48, 'monster');
        }

        // Categorize for World Engine
        await categorizeCharacters();

        // Create catalog
        createCatalog();

        console.log('\n🎉 Portrait extraction complete!');
        console.log(`📂 Check: ${outputDir}`);
        console.log(`📂 Check: ${path.join(sourceDir, 'categorized')}`);

    } catch (error) {
        console.error('❌ Extraction failed:', error);
    }
}

function createCatalog() {
    const catalog = {
        source: "DENZI CC0 Public Domain Art",
        license: "CC0 - Public Domain",
        attribution: "DENZI (http://www3.wind.ne.jp/DENZI/diary/)",
        usage: "Free for any use, no attribution required",
        extracted: new Date().toISOString(),
        categories: {
            "32x32_characters": "General fantasy characters from DENZI tileset",
            "32x48_monsters": "Larger character sprites and monsters"
        }
    };

    const catalogPath = path.join(sourceDir, 'extraction-catalog.json');
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    console.log('📋 Created extraction catalog');
}

// Install canvas if needed (user should run: npm install canvas)
if (require.main === module) {
    try {
        require('canvas');
        main();
    } catch (error) {
        console.log('❌ Missing dependency: canvas');
        console.log('📦 Install with: npm install canvas');
        console.log('⚠️  Note: canvas requires native dependencies');
        console.log('🔧 Alternative: Use the simple placeholder system we already have');

        // Fallback: just create a basic catalog from existing files
        console.log('\n📋 Creating basic catalog from existing files...');
        createCatalog();
    }
}

module.exports = { extractSprites, categorizeCharacters, createCatalog };