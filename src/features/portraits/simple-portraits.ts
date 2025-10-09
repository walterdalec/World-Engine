/**
 * Enhanced Portrait System - Real Images + Smart Fallbacks
 * Uses actual artwork when available, with gender-locked classes
 */

import { getPortraitImagePath, isValidGenderForClass } from '../../core/config';
import { rng } from "../../core/services/random";

export interface PortraitLayer {
    type: 'base' | 'race' | 'class' | 'deco' | 'realistic';
    src: string;
    zIndex: number;
}

export interface SimplePortraitOptions {
    gender: 'male' | 'female';
    species: string;
    archetype: string;
    decorations?: string[];
    size?: { width: number; height: number };
}

export interface PortraitResult {
    success: boolean;
    layers: PortraitLayer[];
    dataUrl?: string;
    error?: string;
    isRealisticImage?: boolean;
}

/**
 * Generate a fantasy-themed placeholder portrait
 */
function generatePlaceholderPortrait(species: string, archetype: string, gender: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 250;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Create dramatic chiaroscuro background - deep shadows with single light source
    const bgGradient = ctx.createRadialGradient(70, 60, 10, 100, 125, 180);
    bgGradient.addColorStop(0, '#1a1612'); // Warm candlelight
    bgGradient.addColorStop(0.2, '#0f0e0a');
    bgGradient.addColorStop(0.5, '#080706');
    bgGradient.addColorStop(0.8, '#040403');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 200, 250);

    // Add subtle texture to background (stone/dungeon wall effect)
    ctx.fillStyle = '#0a0908';
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 200; i += 4) {
        for (let j = 0; j < 250; j += 4) {
            if (rng.next() > 0.7) {
                ctx.fillRect(i, j, 1, 1);
            }
        }
    }
    ctx.globalAlpha = 1;

    // Realistic, weathered color palettes - inspired by oil paintings
    const speciesData: Record<string, {
        skinBase: string, skinMid: string, skinShadow: string,
        armorBase: string, armorMid: string, armorShadow: string,
        metalBase: string, metalHighlight: string, accent: string
    }> = {
        'human': {
            skinBase: '#8b7355', skinMid: '#6b5535', skinShadow: '#3d2f1f',
            armorBase: '#4a453f', armorMid: '#2f2a24', armorShadow: '#1a1612',
            metalBase: '#5a524a', metalHighlight: '#7a6e62', accent: '#3d2f1f'
        },
        'sylvanborn': {
            skinBase: '#7a8b70', skinMid: '#5a6b50', skinShadow: '#3a4b30',
            armorBase: '#3f453a', armorMid: '#242a1f', armorShadow: '#161612',
            metalBase: '#4a524a', metalHighlight: '#6a726a', accent: '#2f4f2f'
        },
        'draketh': {
            skinBase: '#8b6055', skinMid: '#6b4035', skinShadow: '#4b201f',
            armorBase: '#4a3f3f', armorMid: '#2f2424', armorShadow: '#1a1212',
            metalBase: '#5a4a4a', metalHighlight: '#7a6a6a', accent: '#6b2f1f'
        }
    };

    const data = speciesData[species.toLowerCase()] || speciesData['human'];

    // Draw hyper-realistic character with painterly techniques
    drawRealisticCharacter(ctx, data, archetype, gender);

    // Add atmospheric lighting effects
    drawAtmosphericLighting(ctx, archetype);

    // Add weathered frame
    drawWeatheredFrame(ctx);

    // Add character info
    drawRealisticCharacterInfo(ctx, species, archetype, gender);

    console.log(`Generated grimdark portrait: ${gender} ${species} ${archetype}`);
    return canvas.toDataURL('image/png');
}

/**
 * Draw hyper-realistic character with oil painting techniques and dramatic lighting
 */
function drawRealisticCharacter(ctx: CanvasRenderingContext2D, data: any, archetype: string, gender: string) {
    const centerX = 100;
    const centerY = 120;

    // Main dramatic lighting source from top-left (like in the reference image)
    const lightSourceX = 60;
    const lightSourceY = 50;

    // Draw realistic head with proper proportions and detailed features
    drawRealisticHead(ctx, centerX, centerY - 40, data, gender, lightSourceX, lightSourceY);

    // Draw detailed armor/clothing with realistic metal textures
    drawRealisticArmor(ctx, centerX, centerY, data, archetype, lightSourceX, lightSourceY);

    // Add archetype-specific realistic equipment
    drawRealisticEquipment(ctx, centerX, centerY, archetype, data, lightSourceX, lightSourceY);
}

/**
 * Draw hyper-realistic head with detailed facial features
 */
function drawRealisticHead(ctx: CanvasRenderingContext2D, x: number, y: number, data: any, gender: string, lightX: number, lightY: number) {
    // Calculate lighting based on distance from light source
    const distance = Math.sqrt((x - lightX) ** 2 + (y - lightY) ** 2);
    const _lightIntensity = Math.max(0.2, 1 - distance / 150);

    // Create realistic skin gradient with proper light fall-off
    const skinGradient = ctx.createRadialGradient(lightX, lightY, 20, x, y, 60);
    skinGradient.addColorStop(0, data.skinBase);
    skinGradient.addColorStop(0.3, data.skinMid);
    skinGradient.addColorStop(0.7, data.skinShadow);
    skinGradient.addColorStop(1, '#1a1612');

    // Draw head shape - realistic proportions
    ctx.fillStyle = skinGradient;
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 28, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Add facial structure - cheekbones, jaw definition
    ctx.fillStyle = data.skinShadow;
    ctx.globalAlpha = 0.4;

    // Cheekbone shadows
    ctx.beginPath();
    ctx.ellipse(x - 12, y + 5, 8, 12, -0.3, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 5, 8, 12, 0.3, 0, Math.PI);
    ctx.fill();

    // Jaw shadow
    ctx.beginPath();
    ctx.ellipse(x, y + 18, 18, 8, 0, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Draw incredibly detailed eyes
    drawRealisticEyes(ctx, x, y - 5, data, _lightIntensity);

    // Draw weathered nose with realistic shadows
    drawRealisticNose(ctx, x, y + 2, data, _lightIntensity);

    // Draw grim mouth with realistic lip detail
    drawRealisticMouth(ctx, x, y + 12, data, gender);

    // Add deep wrinkles and battle scars
    drawFacialDetails(ctx, x, y, data, _lightIntensity);
}

/**
 * Draw hyper-realistic eyes with depth and detail
 */
function drawRealisticEyes(ctx: CanvasRenderingContext2D, x: number, y: number, data: any, lightIntensity: number) {
    // Deep-set eye sockets
    ctx.fillStyle = '#1a1612';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(x - 10, y, 6, 4, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 10, y, 6, 4, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Eyeballs
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.ellipse(x - 10, y, 4, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 10, y, 4, 3, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Irises - intense, weathered
    ctx.fillStyle = '#3d2f1f';
    ctx.beginPath();
    ctx.arc(x - 10, y, 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y, 2, 0, 2 * Math.PI);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - 10, y, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 10, y, 1, 0, 2 * Math.PI);
    ctx.fill();

    // Realistic light reflection
    if (lightIntensity > 0.5) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = lightIntensity;
        ctx.beginPath();
        ctx.arc(x - 11, y - 1, 0.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 9, y - 1, 0.5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Heavy brows and crow's feet
    ctx.strokeStyle = data.skinShadow;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;

    // Brow ridges
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 8);
    ctx.quadraticCurveTo(x - 10, y - 12, x - 4, y - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 8);
    ctx.quadraticCurveTo(x + 10, y - 12, x + 16, y - 8);
    ctx.stroke();

    // Crow's feet (age lines)
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 16, y - 2);
    ctx.lineTo(x - 18, y - 4);
    ctx.moveTo(x - 16, y + 1);
    ctx.lineTo(x - 18, y + 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 16, y - 2);
    ctx.lineTo(x + 18, y - 4);
    ctx.moveTo(x + 16, y + 1);
    ctx.lineTo(x + 18, y + 2);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

/**
 * Draw realistic nose with proper shadowing
 */
function drawRealisticNose(ctx: CanvasRenderingContext2D, x: number, y: number, data: any, lightIntensity: number) {
    // Nose bridge shadow
    ctx.fillStyle = data.skinShadow;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(x, y, 2, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Nostril shadows
    ctx.fillStyle = '#1a1612';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(x - 3, y + 4, 1.5, 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 4, 1.5, 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Nose highlight if lit
    if (lightIntensity > 0.4) {
        ctx.fillStyle = data.skinBase;
        ctx.globalAlpha = lightIntensity * 0.5;
        ctx.beginPath();
        ctx.ellipse(x - 1, y - 2, 1, 4, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

/**
 * Draw realistic mouth with weathered features
 */
function drawRealisticMouth(ctx: CanvasRenderingContext2D, x: number, y: number, data: any, _gender: string) {
    // Lip line - grim and weathered
    ctx.strokeStyle = data.skinShadow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.quadraticCurveTo(x, y - 1, x + 8, y);
    ctx.stroke();

    // Lower lip shadow
    ctx.fillStyle = data.skinShadow;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 7, 2, 0, 0, Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/**
 * Draw detailed facial weathering, scars, and wrinkles
 */
function drawFacialDetails(ctx: CanvasRenderingContext2D, x: number, y: number, data: any, _lightIntensity: number) {
    ctx.strokeStyle = data.skinShadow;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;

    // Forehead wrinkles
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 20);
    ctx.quadraticCurveTo(x, y - 22, x + 15, y - 20);
    ctx.moveTo(x - 12, y - 16);
    ctx.quadraticCurveTo(x, y - 18, x + 12, y - 16);
    ctx.stroke();

    // Nasolabial folds (nose to mouth lines)
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 2);
    ctx.quadraticCurveTo(x - 12, y + 5, x - 10, y + 12);
    ctx.moveTo(x + 8, y - 2);
    ctx.quadraticCurveTo(x + 12, y + 5, x + 10, y + 12);
    ctx.stroke();

    // Battle scar across face
    ctx.strokeStyle = '#2a1f1a';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 8);
    ctx.lineTo(x + 8, y + 6);
    ctx.stroke();

    // Smaller facial scars
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 15);
    ctx.lineTo(x + 14, y - 12);
    ctx.moveTo(x - 6, y + 15);
    ctx.lineTo(x - 3, y + 18);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

/**
 * Draw realistic armor with detailed metallic textures
 */
function drawRealisticArmor(ctx: CanvasRenderingContext2D, x: number, y: number, data: any, archetype: string, lightX: number, lightY: number) {
    // Calculate armor lighting
    const distance = Math.sqrt((x - lightX) ** 2 + (y - lightY) ** 2);
    const _lightIntensity = Math.max(0.1, 1 - distance / 200);

    // Create metallic gradient
    const armorGradient = ctx.createRadialGradient(lightX, lightY, 30, x, y, 80);
    armorGradient.addColorStop(0, data.metalHighlight);
    armorGradient.addColorStop(0.3, data.armorBase);
    armorGradient.addColorStop(0.7, data.armorMid);
    armorGradient.addColorStop(1, data.armorShadow);

    // Draw chest plate with realistic proportions
    ctx.fillStyle = armorGradient;
    ctx.beginPath();
    ctx.moveTo(x - 25, y - 10);
    ctx.quadraticCurveTo(x - 35, y + 10, x - 30, y + 40);
    ctx.lineTo(x + 30, y + 40);
    ctx.quadraticCurveTo(x + 35, y + 10, x + 25, y - 10);
    ctx.closePath();
    ctx.fill();

    // Add armor plate details and rivets
    ctx.fillStyle = data.metalBase;
    ctx.globalAlpha = 0.8;

    // Chest plate segments
    ctx.fillRect(x - 20, y - 5, 40, 3);
    ctx.fillRect(x - 18, y + 10, 36, 2);
    ctx.fillRect(x - 16, y + 25, 32, 2);

    // Rivets and battle damage
    ctx.fillStyle = data.armorShadow;
    ctx.globalAlpha = 1;
    for (let i = -15; i <= 15; i += 10) {
        ctx.beginPath();
        ctx.arc(x + i, y + 5, 1, 0, 2 * Math.PI);
        ctx.fill();

        // Dents and scratches
        if (rng.next() > 0.6) {
            ctx.beginPath();
            ctx.arc(x + i + 2, y + 15 + rng.next() * 10, 0.5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Shoulder pauldrons
    ctx.fillStyle = armorGradient;
    ctx.beginPath();
    ctx.ellipse(x - 35, y - 5, 12, 18, -0.3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 35, y - 5, 12, 18, 0.3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.globalAlpha = 1;
}

/**
 * Draw realistic archetype-specific equipment
 */
function drawRealisticEquipment(ctx: CanvasRenderingContext2D, x: number, y: number, archetype: string, data: any, _lightX: number, _lightY: number) {
    switch (archetype.toLowerCase()) {
        case 'ashblade':
        case 'thorn knight':
            // Incredibly detailed sword
            drawRealisticSword(ctx, x - 50, y - 20, data);
            break;

        case 'greenwarden':
            // Gnarled staff with intricate details
            drawRealisticStaff(ctx, x + 45, y - 30, data);
            break;

        default:
            // Generic weathered equipment
            break;
    }
}

/**
 * Draw hyper-realistic sword with incredible detail
 */
function drawRealisticSword(ctx: CanvasRenderingContext2D, x: number, y: number, data: any) {
    // Sword blade with realistic metal reflection
    const bladeGradient = ctx.createLinearGradient(x, y, x + 8, y);
    bladeGradient.addColorStop(0, data.metalHighlight);
    bladeGradient.addColorStop(0.3, data.metalBase);
    bladeGradient.addColorStop(0.7, '#3a3530');
    bladeGradient.addColorStop(1, '#1a1612');

    ctx.fillStyle = bladeGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - 35);
    ctx.lineTo(x + 2, y - 37);
    ctx.lineTo(x + 4, y + 25);
    ctx.lineTo(x, y + 30);
    ctx.lineTo(x - 4, y + 25);
    ctx.lineTo(x - 2, y - 37);
    ctx.closePath();
    ctx.fill();

    // Blood groove
    ctx.fillStyle = '#2a1f1a';
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x - 1, y - 30, 2, 50);
    ctx.globalAlpha = 1;

    // Crossguard
    ctx.fillStyle = data.metalBase;
    ctx.fillRect(x - 12, y + 25, 24, 4);

    // Handle wrap
    ctx.fillStyle = '#3d2f1f';
    ctx.fillRect(x - 3, y + 29, 6, 20);

    // Handle details
    ctx.strokeStyle = '#2a1f1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 3, y + 31 + i * 4);
        ctx.lineTo(x + 3, y + 31 + i * 4);
        ctx.stroke();
    }

    // Pommel
    ctx.fillStyle = data.metalBase;
    ctx.beginPath();
    ctx.arc(x, y + 52, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Battle nicks on blade
    ctx.strokeStyle = '#1a1612';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 2 + rng.next() * 2, y - 25 + i * 8);
        ctx.lineTo(x + 1 + rng.next() * 2, y - 23 + i * 8);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

/**
 * Draw realistic gnarled staff
 */
function drawRealisticStaff(ctx: CanvasRenderingContext2D, x: number, y: number, data: any) {
    // Staff shaft - weathered wood
    ctx.strokeStyle = '#3d2f1f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 3, y + 30, x - 2, y + 60);
    ctx.stroke();

    // Wood grain and damage
    ctx.strokeStyle = '#2a1f1a';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 1, y + i * 10);
        ctx.lineTo(x + 1, y + 2 + i * 10);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Staff head - crystal or orb
    ctx.fillStyle = data.accent;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, y - 5, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = '#4a4a3a';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y - 5, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
}

/**
 * Draw atmospheric lighting effects
 */
function drawAtmosphericLighting(ctx: CanvasRenderingContext2D, _archetype: string) {
    // Subtle dust motes in light beam
    ctx.fillStyle = '#4a453f';
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 8; i++) {
        const x = 60 + rng.next() * 80;
        const y = 50 + rng.next() * 120;
        ctx.beginPath();
        ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

/**
 * Draw weathered frame
 */
function drawWeatheredFrame(ctx: CanvasRenderingContext2D) {
    // Simple weathered border
    ctx.strokeStyle = '#2a2520';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 196, 246);

    ctx.strokeStyle = '#1a1612';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, 188, 238);
}

/**
 * Draw realistic character information
 */
function drawRealisticCharacterInfo(ctx: CanvasRenderingContext2D, species: string, archetype: string, gender: string) {
    // Dark background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(8, 218, 184, 27);

    // Character info in muted colors
    ctx.fillStyle = '#6b5535';
    ctx.font = 'bold 10px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${species.toUpperCase()} ${archetype.toUpperCase()}`, 100, 232);

    ctx.fillStyle = '#4a453f';
    ctx.font = '8px serif';
    ctx.fillText(`${gender.charAt(0).toUpperCase() + gender.slice(1)}`, 100, 242);
}

/**
 * Draw menacing, weathered archetype-specific equipment
 */
function _drawGrimdarkArchetypeDetails(ctx: CanvasRenderingContext2D, x: number, y: number, archetype: string, data: any) {
    ctx.strokeStyle = data.special;
    ctx.fillStyle = data.special;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.9;

    switch (archetype.toLowerCase()) {
        case 'greenwarden':
            // Gnarled, thorny staff with skull
            ctx.strokeStyle = '#2a4a2a';
            ctx.beginPath();
            ctx.moveTo(x + 40, y - 50);
            ctx.quadraticCurveTo(x + 45, y - 20, x + 38, y + 30);
            ctx.stroke();

            // Skull topper
            ctx.fillStyle = '#4a4a4a';
            ctx.beginPath();
            ctx.ellipse(x + 42, y - 55, 5, 6, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Dark eye sockets
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 40, y - 57, 2, 2);
            ctx.fillRect(x + 44, y - 57, 2, 2);
            break;

        case 'ashblade':
        case 'thorn knight':
            // Jagged, battle-worn sword
            ctx.strokeStyle = '#4a2a2a';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(x - 45, y - 40);
            ctx.lineTo(x - 43, y - 20);
            ctx.lineTo(x - 47, y - 10);
            ctx.lineTo(x - 41, y + 20);
            ctx.stroke();

            // Notched crossguard
            ctx.beginPath();
            ctx.moveTo(x - 50, y - 15);
            ctx.lineTo(x - 40, y - 18);
            ctx.lineTo(x - 38, y - 12);
            ctx.stroke();

            // Blood stains
            ctx.fillStyle = '#3a1a1a';
            ctx.globalAlpha = 0.6;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(x - 44 + i * 2, y - 30 + i * 8, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
            break;

        case 'stormcaller':
        case 'cinder mystic':
            // Crackling dark orb
            ctx.fillStyle = archetype.includes('storm') ? '#1a2a4a' : '#4a2a1a';
            ctx.beginPath();
            ctx.arc(x - 35, y - 25, 10, 0, 2 * Math.PI);
            ctx.fill();

            // Dark energy tendrils
            ctx.strokeStyle = archetype.includes('storm') ? '#2a3a5a' : '#5a3a2a';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 35, y - 25);
                ctx.quadraticCurveTo(
                    x - 35 + (i * 8) - 15,
                    y - 25 + (i * 6) - 10,
                    x - 30 + (i * 5),
                    y - 15 + (i * 4)
                );
                ctx.stroke();
            }
            break;

        default:
            // Dark runic symbol
            ctx.strokeStyle = '#4a4a4a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y - 60, 8, 0, 2 * Math.PI);
            ctx.stroke();

            // Ominous cross
            ctx.beginPath();
            ctx.moveTo(x - 6, y - 66);
            ctx.lineTo(x + 6, y - 54);
            ctx.moveTo(x + 6, y - 66);
            ctx.lineTo(x - 6, y - 54);
            ctx.stroke();

            // Dark center
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(x, y - 60, 3, 0, 2 * Math.PI);
            ctx.fill();
            break;
    }
    ctx.globalAlpha = 1;
}

/**
 * Draw elegant archetype-specific equipment and symbols
 */
function _drawArchetypeDetails(ctx: CanvasRenderingContext2D, x: number, y: number, archetype: string, data: any) {
    ctx.strokeStyle = data.special;
    ctx.fillStyle = data.special;
    ctx.lineWidth = 2;

    switch (archetype.toLowerCase()) {
        case 'greenwarden':
            // Elegant staff with nature orb
            ctx.beginPath();
            ctx.moveTo(x + 35, y - 40);
            ctx.lineTo(x + 37, y + 20);
            ctx.stroke();

            // Nature orb at top
            ctx.beginPath();
            ctx.arc(x + 36, y - 45, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#4CAF50';
            ctx.fill();
            ctx.stroke();
            break;
        case 'ashblade':
        case 'thorn knight':
            // Elegant curved sword
            ctx.beginPath();
            ctx.moveTo(x - 40, y - 30);
            ctx.quadraticCurveTo(x - 42, y - 10, x - 40, y + 10);
            ctx.stroke();

            // Ornate crossguard
            ctx.beginPath();
            ctx.moveTo(x - 45, y - 15);
            ctx.lineTo(x - 35, y - 15);
            ctx.stroke();
            break;
        case 'stormcaller':
        case 'cinder mystic':
            // Mystical orb with energy
            ctx.beginPath();
            ctx.arc(x - 35, y - 20, 8, 0, 2 * Math.PI);
            ctx.fillStyle = archetype.includes('storm') ? '#2196F3' : '#FF5722';
            ctx.fill();
            ctx.stroke();

            // Energy wisps
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(x - 35 + (i * 8), y - 10 + (i * 5), 2, 0, 2 * Math.PI);
                ctx.fill();
            }
            break;
        case 'voidwing':
            // Flowing wing silhouettes
            ctx.beginPath();
            ctx.moveTo(x - 45, y - 20);
            ctx.quadraticCurveTo(x - 60, y - 10, x - 50, y + 10);
            ctx.quadraticCurveTo(x - 40, y, x - 45, y - 10);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(x + 45, y - 20);
            ctx.quadraticCurveTo(x + 60, y - 10, x + 50, y + 10);
            ctx.quadraticCurveTo(x + 40, y, x + 45, y - 10);
            ctx.fill();
            break;
        case 'sky knight':
            // Elegant crown with gems
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 65);
            ctx.lineTo(x - 15, y - 75);
            ctx.lineTo(x - 5, y - 70);
            ctx.lineTo(x, y - 80);
            ctx.lineTo(x + 5, y - 70);
            ctx.lineTo(x + 15, y - 75);
            ctx.lineTo(x + 20, y - 65);
            ctx.stroke();

            // Central gem
            ctx.beginPath();
            ctx.arc(x, y - 70, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            break;
        default:
            // Elegant mystical symbol
            ctx.beginPath();
            ctx.arc(x, y - 60, 8, 0, 2 * Math.PI);
            ctx.stroke();

            // Cross pattern
            ctx.beginPath();
            ctx.moveTo(x - 5, y - 65);
            ctx.lineTo(x + 5, y - 55);
            ctx.moveTo(x + 5, y - 65);
            ctx.lineTo(x - 5, y - 55);
            ctx.stroke();
            break;
    }
}

/**
 * Draw elegant facial features with gender differences
 */
function _drawFaceDetails(ctx: CanvasRenderingContext2D, x: number, y: number, gender: string, data: any) {
    // Subtle eyes with highlights
    ctx.fillStyle = '#2C3E50';
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 2, 3, 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 6, y - 2, 3, 2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#ECF0F1';
    ctx.beginPath();
    ctx.arc(x - 5, y - 3, 1, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 7, y - 3, 1, 0, 2 * Math.PI);
    ctx.fill();

    // Nose (subtle line)
    ctx.strokeStyle = data.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 2);
    ctx.lineTo(x + 1, y + 5);
    ctx.stroke();

    // Mouth (slight curve based on gender)
    ctx.beginPath();
    if (gender === 'female') {
        ctx.arc(x, y + 8, 4, 0.2, 2.9);
    } else {
        ctx.moveTo(x - 3, y + 8);
        ctx.lineTo(x + 3, y + 8);
    }
    ctx.stroke();

    // Gender-specific elegant features
    if (gender === 'female') {
        // Flowing hair silhouette
        ctx.fillStyle = data.accent;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - 20, y - 10);
        ctx.quadraticCurveTo(x - 35, y - 5, x - 30, y + 15);
        ctx.quadraticCurveTo(x - 15, y + 20, x - 10, y + 10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 20, y - 10);
        ctx.quadraticCurveTo(x + 35, y - 5, x + 30, y + 15);
        ctx.quadraticCurveTo(x + 15, y + 20, x + 10, y + 10);
        ctx.closePath();
        ctx.fill();

        // Elegant jewelry
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y + 15, 2, 0, 2 * Math.PI);
        ctx.fill();
    } else {
        // Subtle facial hair
        ctx.strokeStyle = data.accent;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(x - 8, y + 10);
        ctx.quadraticCurveTo(x, y + 12, x + 8, y + 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

/**
 * Draw weathered, battle-hardened facial features
 */
function _drawGrimdarkFaceDetails(ctx: CanvasRenderingContext2D, x: number, y: number, gender: string, data: any) {
    // Harsh, shadowed eyes
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 2, 4, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 6, y - 2, 4, 3, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Dim eye glow (menacing)
    ctx.fillStyle = data.special;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x - 6, y - 2, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 6, y - 2, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Scarred nose
    ctx.strokeStyle = data.shadow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 1, y + 2);
    ctx.lineTo(x + 2, y + 6);
    ctx.stroke();

    // Scar across nose
    ctx.strokeStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.moveTo(x - 3, y + 1);
    ctx.lineTo(x + 4, y + 4);
    ctx.stroke();

    // Grim mouth - no smiles in grimdark
    ctx.strokeStyle = data.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + 9);
    ctx.lineTo(x + 4, y + 9);
    ctx.stroke();

    // Gender-specific weathered features
    if (gender === 'female') {
        // War-torn hair, bound back
        ctx.fillStyle = data.shadow;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 15);
        ctx.quadraticCurveTo(x - 25, y - 20, x - 20, y - 5);
        ctx.lineTo(x - 12, y + 5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + 15, y - 15);
        ctx.quadraticCurveTo(x + 25, y - 20, x + 20, y - 5);
        ctx.lineTo(x + 12, y + 5);
        ctx.closePath();
        ctx.fill();

        // Battle jewelry (tarnished)
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#2a2a1a';
        ctx.beginPath();
        ctx.arc(x, y + 15, 1, 0, 2 * Math.PI);
        ctx.fill();
    } else {
        // Rugged beard/stubble
        ctx.fillStyle = data.shadow;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 8);
        ctx.quadraticCurveTo(x, y + 15, x + 10, y + 8);
        ctx.lineTo(x + 8, y + 12);
        ctx.quadraticCurveTo(x, y + 18, x - 8, y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Battle scars
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 8, y - 8);
        ctx.lineTo(x - 4, y - 4);
        ctx.stroke();
    }
}

/**
 * Draw ominous dark magical effects and curses
 */
function _drawDarkMagicalEffects(ctx: CanvasRenderingContext2D, color: string, archetype: string) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;

    // Cursed floating particles - sparse and ominous
    for (let i = 0; i < 6; i++) {
        const x = 40 + rng.next() * 120;
        const y = 40 + rng.next() * 160;
        const size = 0.5 + rng.next() * 1.5;

        ctx.fillStyle = '#1a1a1a';
        ctx.globalAlpha = 0.4 + rng.next() * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        // Darker anti-glow
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Archetype-specific menacing effects
    ctx.globalAlpha = 0.4;
    if (archetype.toLowerCase().includes('storm') || archetype.toLowerCase().includes('mystic')) {
        // Jagged, violent energy
        ctx.strokeStyle = '#2a2a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(30, 70);
        ctx.lineTo(45, 50);
        ctx.lineTo(40, 90);
        ctx.lineTo(55, 75);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(170, 90);
        ctx.lineTo(155, 70);
        ctx.lineTo(160, 110);
        ctx.stroke();
    }

    if (archetype.toLowerCase().includes('void') || archetype.toLowerCase().includes('shadow')) {
        // Consuming darkness tendrils
        ctx.strokeStyle = '#1a0a1a';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5;

        ctx.beginPath();
        ctx.moveTo(20, 100);
        ctx.quadraticCurveTo(60, 80, 100, 120);
        ctx.quadraticCurveTo(140, 100, 180, 130);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(180, 80);
        ctx.quadraticCurveTo(140, 60, 100, 100);
        ctx.quadraticCurveTo(60, 80, 20, 110);
        ctx.stroke();
    }

    if (archetype.toLowerCase().includes('death') || archetype.toLowerCase().includes('necro')) {
        // Spectral wisps
        ctx.strokeStyle = '#2a4a2a';
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(50 + i * 30, 60 + i * 20, 15, 0, Math.PI);
            ctx.stroke();
        }
    }

    ctx.globalAlpha = 1;
}

/**
 * Draw weathered, ancient frame with battle damage
 */
function _drawAncientFrame(ctx: CanvasRenderingContext2D) {
    // Weathered outer frame - cracked and worn
    ctx.strokeStyle = '#3a3a2a';
    ctx.lineWidth = 5;
    ctx.strokeRect(2, 2, 196, 246);

    // Inner tarnished border
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, 184, 234);

    // Battle-damaged corners
    ctx.strokeStyle = '#4a4a3a';
    ctx.lineWidth = 3;

    const corners = [
        { x: 15, y: 15 },
        { x: 170, y: 15 },
        { x: 15, y: 215 },
        { x: 170, y: 215 }
    ];

    corners.forEach(({ x, y }) => {
        // Cracked corner design
        ctx.beginPath();
        ctx.moveTo(x, y + 10);
        ctx.lineTo(x + 2, y + 2);
        ctx.lineTo(x + 10, y);
        ctx.stroke();

        // Damage marks
        ctx.beginPath();
        ctx.moveTo(x + 3, y + 7);
        ctx.lineTo(x + 7, y + 3);
        ctx.stroke();

        // Rust stains
        ctx.fillStyle = '#2a1a1a';
        ctx.globalAlpha = 0.6;
        ctx.fillRect(x + 1, y + 1, 3, 3);
        ctx.fillRect(x + 6, y + 6, 2, 2);
        ctx.globalAlpha = 1;
    });

    // Top center - cracked emblem
    ctx.strokeStyle = '#2a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(90, 8);
    ctx.lineTo(95, 3);
    ctx.lineTo(105, 3);
    ctx.lineTo(110, 8);
    ctx.lineTo(105, 12);
    ctx.lineTo(95, 12);
    ctx.closePath();
    ctx.stroke();

    // Crack through emblem
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(95, 5);
    ctx.lineTo(105, 10);
    ctx.stroke();
}

/**
 * Draw elegant ornate fantasy frame
 */
function _drawOrnateFrame(ctx: CanvasRenderingContext2D) {
    // Elegant outer frame with gradient
    const frameGradient = ctx.createLinearGradient(0, 0, 200, 250);
    frameGradient.addColorStop(0, '#D4AF37');
    frameGradient.addColorStop(0.5, '#8B7355');
    frameGradient.addColorStop(1, '#D4AF37');

    ctx.strokeStyle = frameGradient;
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, 194, 244);

    // Inner elegant border
    ctx.strokeStyle = '#F4E4BC';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 184, 234);

    // Decorative corner flourishes
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;

    const corners = [
        { x: 12, y: 12 },
        { x: 176, y: 12 },
        { x: 12, y: 220 },
        { x: 176, y: 220 }
    ];

    corners.forEach(({ x, y }) => {
        // Elegant corner design
        ctx.beginPath();
        ctx.moveTo(x, y + 12);
        ctx.quadraticCurveTo(x, y, x + 12, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + 3, y + 8);
        ctx.quadraticCurveTo(x + 3, y + 3, x + 8, y + 3);
        ctx.stroke();
    });

    // Top and bottom decorative elements
    ctx.strokeStyle = '#F4E4BC';
    ctx.lineWidth = 1;

    // Top center decoration
    ctx.beginPath();
    ctx.moveTo(90, 8);
    ctx.lineTo(100, 3);
    ctx.lineTo(110, 8);
    ctx.stroke();

    // Bottom center decoration
    ctx.beginPath();
    ctx.moveTo(90, 242);
    ctx.lineTo(100, 247);
    ctx.lineTo(110, 242);
    ctx.stroke();
}

/**
 * Draw character information with fantasy styling
 */
function _drawCharacterInfo(ctx: CanvasRenderingContext2D, species: string, archetype: string, gender: string) {
    // Background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 220, 180, 25);

    // Character name/info
    ctx.fillStyle = '#D4AF37';
    ctx.font = 'bold 12px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${species} ${archetype}`, 100, 235);

    ctx.font = '10px serif';
    ctx.fillText(`(${gender.charAt(0).toUpperCase() + gender.slice(1)})`, 100, 245);
}

/**
 * Draw character information with grimdark, weathered styling
 */
function _drawGrimdarkCharacterInfo(ctx: CanvasRenderingContext2D, species: string, archetype: string, gender: string) {
    // Dark, oppressive background for text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(8, 218, 184, 27);

    // Subtle inner shadow
    ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
    ctx.fillRect(10, 220, 180, 23);

    // Character name/info in muted, weathered colors
    ctx.fillStyle = '#4a4a3a';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${species.toUpperCase()} ${archetype.toUpperCase()}`, 100, 234);

    // Gender info in darker tone
    ctx.fillStyle = '#3a3a3a';
    ctx.font = '9px serif';
    ctx.fillText(`${gender.charAt(0).toUpperCase() + gender.slice(1)}`, 100, 244);

    // Add subtle weathering effects to text area
    ctx.fillStyle = '#2a2a2a';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(12, 222, 2, 1);
    ctx.fillRect(180, 235, 3, 1);
    ctx.fillRect(15, 240, 1, 2);
    ctx.globalAlpha = 1;
}

/**
 * Main portrait generation function - Real Images with Smart Fallbacks
 */
export async function generateSimplePortrait(options: SimplePortraitOptions): Promise<PortraitResult> {
    try {
        const { gender, species, archetype } = options;

        console.log(`Generating portrait: ${gender} ${species} ${archetype}`);

        // First, check if we have a realistic image for this combination
        const imagePath = getPortraitImagePath(species, archetype, gender);
        console.log(`Portrait lookup: species=${species}, archetype=${archetype}, gender=${gender}`);
        console.log(`Image path result: ${imagePath}`);

        if (imagePath) {
            console.log(`Using realistic image: ${imagePath}`);

            // Try to load the realistic image
            try {
                const imageUrl = await loadRealisticImage(imagePath);
                console.log(`🖼️ Image load result: ${imageUrl ? 'SUCCESS' : 'FAILED'}`);
                if (imageUrl) {
                    return {
                        success: true,
                        layers: [{
                            type: 'realistic',
                            src: imageUrl,
                            zIndex: 1
                        }],
                        dataUrl: imageUrl,
                        isRealisticImage: true
                    };
                }
            } catch (imageError) {
                console.warn(`🖼️ Failed to load realistic image ${imagePath}, falling back to placeholder`, imageError);
            }
        } else {
            console.log(`🚫 No realistic image path found for: ${gender} ${species} ${archetype}`);
        }

        // Fallback to placeholder generation
        console.log(`🎭 Generating placeholder portrait: ${gender} ${species} ${archetype}`);
        const dataUrl = generatePlaceholderPortrait(species, archetype, gender);

        return {
            success: true,
            layers: [{
                type: 'base',
                src: dataUrl,
                zIndex: 1
            }],
            dataUrl,
            isRealisticImage: false
        };

    } catch (error) {
        console.error('🎭 Portrait generation error:', error);
        return {
            success: false,
            layers: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Load a realistic portrait image and return as data URL
 */
async function loadRealisticImage(imagePath: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            try {
                // Create canvas to convert image to data URL
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 250;
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(null);
                    return;
                }

                // Draw image to fit portrait dimensions
                ctx.drawImage(img, 0, 0, 200, 250);

                // Convert to data URL
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                resolve(dataUrl);
            } catch (error) {
                console.error('Error converting image to canvas:', error);
                resolve(null);
            }
        };

        img.onerror = () => {
            console.warn(`Failed to load image: ${imagePath}`);
            resolve(null);
        };

        // Try to load the image
        img.src = imagePath;

        // Timeout after 5 seconds
        setTimeout(() => {
            resolve(null);
        }, 5000);
    });
}

/**
 * Simple caching for generated portraits
 */
const portraitCache = new Map<string, PortraitResult>();

export function getCachedPortrait(options: SimplePortraitOptions): PortraitResult | null {
    const key = JSON.stringify(options);
    return portraitCache.get(key) || null;
}

export function setCachedPortrait(options: SimplePortraitOptions, result: PortraitResult): void {
    const key = JSON.stringify(options);
    portraitCache.set(key, result);
}
