/**
 * Engine-Powered App
 * Canvas 01 - Bootstrap engine with core module
 */

import React, { useEffect, useMemo } from 'react';
import { Engine } from '../engine/Engine';
import { CoreModule } from '../modules/core';
import { PerfOverlay } from '../engine/debug/PerfOverlay';

export function EngineApp() {
    const engine = useMemo(() => new Engine(), []);

    useEffect(() => {
        console.log('🚀 Initializing World Engine...');

        engine.register(CoreModule);

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

            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">World Engine</h1>
                    <p className="text-gray-400">Canvas 01: Engine Skeleton Running</p>
                    <p className="text-sm text-gray-500 mt-4">Check top-left for FPS/Tick counters</p>
                </div>
            </div>
        </div>
    );
}
