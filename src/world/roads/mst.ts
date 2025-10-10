/**
 * Minimum Spanning Tree Builder
 * Canvas 06 - Creates high-level capital connection backbone
 */

import type { Vec2, CostAtlas } from './types';
import { sampleLineCost, octileDistance } from './cost';

interface MSTEdge {
    from: number;  // Capital index
    to: number;    // Capital index
    cost: number;
}

/**
 * Build MST over capitals using Prim's algorithm
 * Returns list of edges connecting all capitals with minimum total cost
 */
export function buildCapitalMST(capitals: Vec2[], atlas: CostAtlas): MSTEdge[] {
    if (capitals.length === 0) return [];
    if (capitals.length === 1) return [];
    
    console.log(`🌐 Building MST for ${capitals.length} capitals...`);
    
    const n = capitals.length;
    const inMST = new Array(n).fill(false);
    const edges: MSTEdge[] = [];
    
    // Start with first capital
    inMST[0] = true;
    let edgesAdded = 0;
    
    // Add n-1 edges to connect all capitals
    while (edgesAdded < n - 1) {
        let minCost = Infinity;
        let minFrom = -1;
        let minTo = -1;
        
        // Find minimum cost edge between MST and non-MST nodes
        for (let i = 0; i < n; i++) {
            if (!inMST[i]) continue;
            
            for (let j = 0; j < n; j++) {
                if (inMST[j]) continue;
                
                const cost = estimateRouteCost(capitals[i], capitals[j], atlas);
                if (cost < minCost) {
                    minCost = cost;
                    minFrom = i;
                    minTo = j;
                }
            }
        }
        
        if (minFrom === -1) break; // Shouldn't happen with connected graph
        
        edges.push({ from: minFrom, to: minTo, cost: minCost });
        inMST[minTo] = true;
        edgesAdded++;
    }
    
    console.log(`✅ MST built with ${edges.length} edges`);
    return edges;
}

/**
 * Estimate route cost between two points
 * Uses great-circle distance × median sampled cost
 */
function estimateRouteCost(a: Vec2, b: Vec2, atlas: CostAtlas): number {
    const distance = octileDistance(a.x, a.y, b.x, b.y);
    const avgCost = sampleLineCost(atlas, a.x, a.y, b.x, b.y, 20);
    return distance * avgCost;
}
