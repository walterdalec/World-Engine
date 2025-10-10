/**
 * Engine-Powered App
 * Canvas 01-03 - Bootstrap engine with state management and content packs
 */

import React, { useEffect, useMemo } from 'react';
import { Engine } from '../engine/Engine';
import { CoreModule } from '../modules/core';
import { PacksModule } from '../modules/packs';
import { PerfOverlay } from '../engine/debug/PerfOverlay';
import { DevBar } from '../ui/DevBar';

export function EngineApp() {
    const engine = useMemo(() => new Engine(), []);

    useEffect(() => {
        console.log('🚀 Initializing World Engine...');

        engine.register(CoreModule);
        engine.register(new PacksModule());

        (async () => {
            await engine.init();
            engine.start();
            console.log('✅ Engine started successfully');
        })();

        return () => {
            console.log('🛑 Stopping engine...');
            engine.stop();
        };
    }, [engine]);

    return (
        <div className="w-screen h-screen bg-neutral-900 text-white">
            <PerfOverlay events={engine.events} />
            <DevBar events={engine.events} />

            <div className="flex items-center justify-center h-full pb-16">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">World Engine</h1>
                    <p className="text-gray-400">Canvas 03: Content Packs & Schemas</p>
                    <div className="mt-6 text-sm text-gray-500 space-y-2">
                        <p>✅ Engine skeleton (30fps fixed-step)</p>
                        <p>✅ State management (deterministic)</p>
                        <p>✅ Save/Load system (Ctrl+S / Ctrl+L)</p>
                        <p>✅ Content pack validation (Zod schemas)</p>
                    </div>
                    <div className="mt-6 text-xs text-gray-600">
                        <p>Check bottom bar for DevTools</p>
                        <p>Day counter advances every 30 seconds</p>
                        <p>📦 Packs button shows loaded content stats</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
