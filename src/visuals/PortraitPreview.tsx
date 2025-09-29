// Portrait Preview Component
// React component for displaying generated character portraits

import React, { useState, useEffect, useRef } from 'react';
import { CharacterVisualData, PortraitOptions } from './types';
import { generateCharacterPortrait, initializeVisualSystem, isVisualSystemReady } from './service';

interface PortraitPreviewProps {
    character: CharacterVisualData;
    size?: 'small' | 'medium' | 'large';
    format?: 'svg' | 'png' | 'jpg';
    className?: string;
    style?: React.CSSProperties;
    onError?: (error: string) => void;
    onLoad?: () => void;
}

export const PortraitPreview: React.FC<PortraitPreviewProps> = ({
    character,
    size = 'medium',
    format = 'svg',
    className = '',
    style = {},
    onError,
    onLoad
}) => {
    console.log('🎭 PortraitPreview: Component mounted/re-rendered with character:', character);

    const [portraitData, setPortraitData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [systemReady, setSystemReady] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize visual system
    useEffect(() => {
        const initSystem = async () => {
            try {
                console.log('🚀 PortraitPreview: Initializing visual system...');
                await initializeVisualSystem();
                console.log('✅ PortraitPreview: Visual system initialized successfully');
                setSystemReady(true);
            } catch (err) {
                console.error('❌ PortraitPreview: Failed to initialize visual system:', err);
                setError('Failed to initialize portrait system');
                onError?.('System initialization failed');
            }
        };

        if (!isVisualSystemReady()) {
            initSystem();
        } else {
            setSystemReady(true);
        }
    }, [onError]);

    // Generate portrait when character or options change
    useEffect(() => {
        console.log('🔄 PortraitPreview: useEffect triggered - systemReady:', systemReady, 'character:', character.name, character.species, character.archetype);
        if (!systemReady || !character.name) {
            console.log('⏸️ PortraitPreview: Skipping generation - systemReady:', systemReady, 'hasName:', !!character.name);
            return;
        }

        const generatePortrait = async () => {
            console.log('🎨 PortraitPreview: Starting portrait generation for:', character.name, character.species, character.archetype);
            setIsLoading(true);
            setError(null);
            setPortraitData(null);

            try {
                const options: PortraitOptions = { size, format };
                console.log('🔧 PortraitPreview: Using options:', options);
                const result = await generateCharacterPortrait(character, options);
                console.log('🖼️ PortraitPreview: Generation result:', result.success ? 'SUCCESS' : 'FAILED', result.error || '');

                if (result.success && result.data) {
                    if (typeof result.data === 'string') {
                        setPortraitData(result.data);
                    } else {
                        // Handle HTMLElement case (for canvas)
                        if (result.data instanceof HTMLCanvasElement) {
                            setPortraitData(result.data.toDataURL());
                        } else {
                            setPortraitData(result.data.outerHTML);
                        }
                    }
                    onLoad?.();
                } else {
                    const errorMsg = result.error || 'Failed to generate portrait';
                    setError(errorMsg);
                    onError?.(errorMsg);
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                setError(errorMsg);
                onError?.(errorMsg);
            } finally {
                setIsLoading(false);
            }
        };

        generatePortrait();
    }, [character, size, format, systemReady, onLoad, onError]);

    // Get dimensions for display
    const getDimensions = (): { width: number; height: number } => {
        const sizes = {
            small: { width: 64, height: 64 },
            medium: { width: 128, height: 128 },
            large: { width: 256, height: 256 }
        };
        return sizes[size];
    };

    const dimensions = getDimensions();

    // Loading state
    if (!systemReady || isLoading) {
        console.log('🎭 PortraitPreview: Showing loading state - systemReady:', systemReady, 'isLoading:', isLoading);
        return (
            <div
                className={`portrait-preview portrait-loading ${className}`}
                style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#e3f2fd',
                    border: '3px solid #2196f3',
                    ...style
                }}
            >
                <div style={{
                    fontSize: size === 'small' ? '10px' : '12px',
                    color: '#1976d2',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {!systemReady ? '🔧 Initializing...' : '🎨 Generating...'}
                    <br />
                    <small>System: {systemReady ? '✅' : '❌'}</small>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        console.log('🎭 PortraitPreview: Showing error state:', error);
        return (
            <div
                className={`portrait-preview portrait-error ${className}`}
                style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffebee',
                    border: '3px solid #f44336',
                    color: '#d32f2f',
                    ...style
                }}
            >
                <div style={{
                    fontSize: size === 'small' ? '10px' : '12px',
                    textAlign: 'center',
                    padding: '4px',
                    fontWeight: 'bold'
                }}>
                    ❌ Portrait Error
                    <br />
                    <small>{error.substring(0, 50)}...</small>
                </div>
            </div>
        );
    }

    // Success state - render the portrait
    if (portraitData) {
        console.log('🎭 PortraitPreview: Showing success state - format:', format, 'data type:', typeof portraitData, 'data length:', portraitData.length);
        if (format === 'svg' && portraitData.startsWith('<svg')) {
            return (
                <div
                    className={`portrait-preview portrait-svg ${className}`}
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        border: '2px solid #4caf50',
                        ...style
                    }}
                    dangerouslySetInnerHTML={{ __html: portraitData }}
                />
            );
        } else {
            // Image format (PNG/JPG) or data URL
            return (
                <img
                    src={portraitData}
                    alt={`${character.name} portrait`}
                    className={`portrait-preview portrait-img ${className}`}
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
                        objectFit: 'cover',
                        border: '2px solid #4caf50',
                        ...style
                    }}
                />
            );
        }
    }

    // Fallback empty state
    console.log('🎭 PortraitPreview: Showing fallback empty state - no portrait data available');
    return (
        <div
            className={`portrait-preview portrait-empty ${className}`}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff3e0',
                border: '3px solid #ff9800',
                ...style
            }}
        >
            <div style={{
                fontSize: size === 'small' ? '10px' : '12px',
                color: '#f57c00',
                textAlign: 'center',
                fontWeight: 'bold'
            }}>
                ⚠️ No Portrait
                <br />
                <small>Check console for details</small>
            </div>
        </div>
    );
};

export default PortraitPreview;