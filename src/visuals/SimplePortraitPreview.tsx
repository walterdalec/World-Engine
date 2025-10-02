import React, { useEffect, useState, useCallback } from 'react';
import {
    generateSimplePortrait,
    getCachedPortrait,
    setCachedPortrait,
    SimplePortraitOptions,
    PortraitResult
} from './simple-portraits';

interface SimplePortraitPreviewProps {
    gender: 'male' | 'female';
    species: string;
    archetype: string;
    decorations?: string[];
    size?: 'small' | 'medium' | 'large';
    className?: string;
    showDebug?: boolean;
}

const SIZE_MAP = {
    small: { width: 120, height: 152 },
    medium: { width: 200, height: 253 },
    large: { width: 300, height: 380 }
};

export const SimplePortraitPreview: React.FC<SimplePortraitPreviewProps> = ({
    gender,
    species,
    archetype,
    decorations = [],
    size = 'medium',
    className = '',
    showDebug = false
}) => {
    const [portrait, setPortrait] = useState<PortraitResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [debugVisible, setDebugVisible] = useState(false);

    const dimensions = SIZE_MAP[size];

    const generatePortrait = useCallback(async () => {
        setIsLoading(true);

        const options: SimplePortraitOptions = {
            gender,
            species,
            archetype,
            decorations,
            size: dimensions
        };

        // Check cache first
        const cached = getCachedPortrait(options);
        if (cached) {
            console.log('🎭 Using cached portrait with', cached.layers?.length || 0, 'layers');
            setPortrait(cached);
            setIsLoading(false);
            return;
        }

        try {
            const result = await generateSimplePortrait(options);

            if (result.success && result.dataUrl) {
                setCachedPortrait(options, result);
            }

            setPortrait(result);
        } catch (error) {
            console.error('🎭 Portrait generation error:', error);
            setPortrait({
                success: false,
                layers: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [gender, species, archetype, decorations, dimensions]);

    useEffect(() => {
        generatePortrait();
    }, [generatePortrait]);

    const handleDebugToggle = () => {
        setDebugVisible(!debugVisible);
    };

    const renderDebugInfo = () => {
        if (!debugVisible || !portrait) return null;

        return (
            <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-75 text-white text-xs p-2 overflow-auto">
                <div className="font-bold mb-2">🐞 Portrait Debug</div>
                <div><strong>Status:</strong> {portrait.success ? '✅ Success' : '❌ Failed'}</div>
                <div><strong>Gender:</strong> {gender}</div>
                <div><strong>Species:</strong> {species}</div>
                <div><strong>Archetype:</strong> {archetype}</div>
                {decorations.length > 0 && (
                    <div><strong>Decorations:</strong> {decorations.join(', ')}</div>
                )}
                <div><strong>Size:</strong> {dimensions.width}×{dimensions.height}</div>

                {portrait.success && portrait.layers && (
                    <div className="mt-2">
                        <strong>Layers ({portrait.layers.length}):</strong>
                        {portrait.layers.map((layer, i) => (
                            <div key={i} className="ml-2 text-xs">
                                • {layer.type} (z:{layer.zIndex})
                            </div>
                        ))}
                    </div>
                )}

                {portrait.error && (
                    <div className="mt-2 text-red-300">
                        <strong>Error:</strong> {portrait.error}
                    </div>
                )}
            </div>
        );
    };

    const renderPortrait = () => {
        if (isLoading) {
            return (
                <div
                    className="flex items-center justify-center bg-gray-200 rounded"
                    style={{ width: dimensions.width, height: dimensions.height }}
                >
                    <div className="text-gray-500">Loading...</div>
                </div>
            );
        }

        if (!portrait || !portrait.success || !portrait.dataUrl) {
            return (
                <div
                    className="flex items-center justify-center bg-gray-200 rounded border-2 border-dashed border-gray-400"
                    style={{ width: dimensions.width, height: dimensions.height }}
                >
                    <div className="text-gray-500 text-center p-2">
                        <div>Portrait Failed</div>
                        {portrait?.error && (
                            <div className="text-xs mt-1">{portrait.error}</div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <img
                src={portrait.dataUrl}
                alt={`${species} ${archetype} portrait`}
                className="rounded border border-gray-300"
                style={{ width: dimensions.width, height: dimensions.height }}
                onError={(e) => {
                    console.error('🎭 Portrait image failed to display');
                }}
            />
        );
    };

    return (
        <div className={`relative inline-block ${className}`}>
            {renderPortrait()}

            {showDebug && (
                <button
                    onClick={handleDebugToggle}
                    className="absolute top-1 right-1 w-6 h-6 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition-colors"
                    title="Toggle debug info"
                >
                    🐞
                </button>
            )}

            {renderDebugInfo()}
        </div>
    );
};