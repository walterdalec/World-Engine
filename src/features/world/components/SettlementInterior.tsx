/**
 * Settlement Interior View
 * Generates and displays interior layout of settlements with roads and buildings
 * Based on settlement type: Hamlet → Village → Town → City
 */

import React, { useMemo, useCallback, useRef } from 'react';
import HexStage from '../../battle/components/HexStage';

interface SettlementInteriorProps {
    settlementType: 'city' | 'town' | 'village' | 'hut' | 'shrine' | 'outpost' | 'trading_post';
    settlementName: string;
    seed: number;
    onExit: () => void;
}

interface Road {
    type: 'RADIAL' | 'RING';
    angle?: number;
    length?: number;
    radius?: number;
}

interface Building {
    type: string;
    x: number;
    y: number;
}

interface SettlementLayout {
    roads: Road[];
    buildings: Building[];
    radius: number;
}

// Settlement type definitions
const SETTLEMENT_TYPES = {
    city: { radius: 15, buildings: [80, 120], name: 'City' },
    town: { radius: 10, buildings: [30, 60], name: 'Town' },
    village: { radius: 6, buildings: [10, 20], name: 'Village' },
    hut: { radius: 4, buildings: [1, 3], name: 'Hamlet' },
    shrine: { radius: 4, buildings: [1, 2], name: 'Shrine' },
    outpost: { radius: 5, buildings: [5, 10], name: 'Outpost' },
    trading_post: { radius: 6, buildings: [8, 15], name: 'Trading Post' }
};

// Seeded random number generator
function mulberry32(seed: number) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul((t ^ (t >>> 15)), (t | 1));
        t ^= t + Math.imul((t ^ (t >>> 7)), (t | 61));
        return (((t ^ (t >>> 14)) >>> 0)) / 4294967296;
    };
}

// Pick building type based on settlement
const pickBuildingType = (type: string, rng: () => number): string => {
    const pools: Record<string, string[]> = {
        hut: ['Hut', 'Farmhouse', 'Well'],
        village: ['House', 'Inn', 'Blacksmith', 'Shrine'],
        town: ['House', 'Tavern', 'Guardpost', 'Market', 'Temple'],
        city: ['House', 'Guildhall', 'Castle', 'Temple', 'Market', 'Barracks'],
        shrine: ['Shrine', 'Garden', 'Altar'],
        outpost: ['Barracks', 'Watchtower', 'Armory'],
        trading_post: ['Shop', 'Warehouse', 'Inn', 'Market']
    };
    const arr = pools[type] || pools.hut;
    return arr[Math.floor(rng() * arr.length)];
};

export function SettlementInterior({ settlementType, settlementName, seed, onExit }: SettlementInteriorProps) {
    const cameraRef = useRef({ x: 0, y: 0, scale: 1 });

    // Generate settlement layout
    const layout = useMemo((): SettlementLayout => {
        const rng = mulberry32(seed);
        const def = SETTLEMENT_TYPES[settlementType] || SETTLEMENT_TYPES.hut;

        const roads: Road[] = [];
        const buildings: Building[] = [];

        // Generate radial roads (spokes from center)
        const roadCount = 4 + Math.floor(rng() * 3); // 4-6 roads
        for (let i = 0; i < roadCount; i++) {
            const angle = (Math.PI * 2 * i) / roadCount;
            roads.push({ type: 'RADIAL', angle, length: def.radius });
        }

        // Add ring road for larger settlements
        if (settlementType === 'town' || settlementType === 'city') {
            roads.push({ type: 'RING', radius: Math.floor(def.radius * 0.7) });
        }

        // Generate buildings along roads
        const buildingCount = def.buildings[0] + Math.floor(rng() * (def.buildings[1] - def.buildings[0]));
        for (let i = 0; i < buildingCount; i++) {
            const road = roads[Math.floor(rng() * roads.length)];
            const dist = 2 + Math.floor(rng() * (def.radius - 2)); // Stay inside radius

            let angle: number;
            if (road.type === 'RADIAL' && road.angle !== undefined) {
                angle = road.angle + (rng() - 0.5) * 0.3; // Near the road
            } else {
                angle = Math.PI * 2 * rng(); // Around the ring
            }

            buildings.push({
                type: pickBuildingType(settlementType, rng),
                x: Math.floor(Math.cos(angle) * dist),
                y: Math.floor(Math.sin(angle) * dist)
            });
        }

        console.log(`🏘️ Generated ${def.name} with ${roads.length} roads and ${buildings.length} buildings`);
        return { roads, buildings, radius: def.radius };
    }, [settlementType, seed]);

    // Render settlement
    const handleRender = useCallback((ctx: CanvasRenderingContext2D, _t: number) => {
        const canvas = ctx.canvas;
        const camera = cameraRef.current;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // Camera transform
        const centerX = canvas.width / (2 * window.devicePixelRatio);
        const centerY = canvas.height / (2 * window.devicePixelRatio);
        ctx.translate(centerX + camera.x, centerY + camera.y);
        ctx.scale(camera.scale, camera.scale);

        // Draw ground (settlement boundary)
        ctx.fillStyle = '#8b7355'; // Brown ground
        ctx.beginPath();
        ctx.arc(0, 0, layout.radius * 30, 0, Math.PI * 2);
        ctx.fill();

        // Draw grass beyond
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(0, 0, (layout.radius + 5) * 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, layout.radius * 30, 0, Math.PI * 2);
        ctx.fill();

        // Draw roads
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 8 / camera.scale;

        for (const road of layout.roads) {
            if (road.type === 'RADIAL' && road.angle !== undefined && road.length !== undefined) {
                const endX = Math.cos(road.angle) * road.length * 30;
                const endY = Math.sin(road.angle) * road.length * 30;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            } else if (road.type === 'RING' && road.radius !== undefined) {
                ctx.beginPath();
                ctx.arc(0, 0, road.radius * 30, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Draw center plaza
        ctx.fillStyle = '#c19a6b';
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 2 / camera.scale;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Center fountain/statue
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw buildings
        for (const building of layout.buildings) {
            const bx = building.x * 30;
            const by = building.y * 30;

            // Building base
            const size = building.type === 'Castle' || building.type === 'Temple' ? 20 :
                building.type === 'Guildhall' || building.type === 'Market' ? 16 :
                    12;

            const color = building.type === 'Castle' ? '#64748b' :
                building.type === 'Temple' || building.type === 'Shrine' ? '#fbbf24' :
                    building.type === 'Market' || building.type === 'Shop' ? '#f97316' :
                        building.type === 'Inn' || building.type === 'Tavern' ? '#ef4444' :
                            building.type === 'Barracks' || building.type === 'Guardpost' ? '#475569' :
                                '#94a3b8'; // Default house

            ctx.fillStyle = color;
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2 / camera.scale;
            ctx.fillRect(bx - size / 2, by - size / 2, size, size);
            ctx.strokeRect(bx - size / 2, by - size / 2, size, size);

            // Roof
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(bx, by - size / 2 - 6);
            ctx.lineTo(bx - size / 2 - 3, by - size / 2);
            ctx.lineTo(bx + size / 2 + 3, by - size / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Label
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3 / camera.scale;
            ctx.font = `${10 / camera.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.strokeText(building.type, bx, by + size / 2 + 2);
            ctx.fillText(building.type, bx, by + size / 2 + 2);
        }

        ctx.restore();
    }, [layout]);

    const handlePan = useCallback((dx: number, dy: number) => {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
    }, []);

    const handleZoom = useCallback((delta: number, _cx: number, _cy: number) => {
        const camera = cameraRef.current;
        const zoomFactor = 1 - delta * 0.001;
        camera.scale = Math.max(0.3, Math.min(2, camera.scale * zoomFactor));
    }, []);

    return (
        <div className="relative w-screen h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gray-800 bg-opacity-90 p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">{settlementName}</h1>
                        <p className="text-sm text-gray-400">
                            {SETTLEMENT_TYPES[settlementType]?.name} • {layout.buildings.length} Buildings
                        </p>
                    </div>
                    <button
                        onClick={onExit}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                        ← Exit to World Map
                    </button>
                </div>
            </div>

            {/* Settlement canvas */}
            <div className="absolute inset-0 pt-20">
                <HexStage
                    onRender={handleRender}
                    pan={handlePan}
                    zoom={handleZoom}
                />
            </div>

            {/* Building legend */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 p-3 rounded text-xs max-h-96 overflow-y-auto">
                <div className="font-bold mb-2">Buildings:</div>
                <div className="space-y-1">
                    {Array.from(new Set(layout.buildings.map(b => b.type))).sort().map(type => (
                        <div key={type} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${type === 'Castle' ? 'bg-gray-500' :
                                    type.includes('Temple') || type.includes('Shrine') ? 'bg-yellow-500' :
                                        type.includes('Market') || type.includes('Shop') ? 'bg-orange-500' :
                                            type.includes('Inn') || type.includes('Tavern') ? 'bg-red-500' :
                                                type.includes('Barracks') || type.includes('Guard') ? 'bg-gray-600' :
                                                    'bg-gray-400'
                                }`}></div>
                            <span>{type} ({layout.buildings.filter(b => b.type === type).length})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 p-3 rounded text-xs">
                <div className="font-bold mb-1">Controls:</div>
                <div>🖱️ Drag to pan</div>
                <div>🔍 Scroll to zoom</div>
            </div>
        </div>
    );
}
