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
    const [portraitData, setPortraitData] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [systemReady, setSystemReady] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initialize visual system
    useEffect(() => {
        const initSystem = async () => {
            try {
                await initializeVisualSystem();
                setSystemReady(true);
            } catch (err) {
                console.error('Failed to initialize visual system:', err);
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
        if (!systemReady || !character.name) return;

        const generatePortrait = async () => {
            setIsLoading(true);
            setError(null);
            setPortraitData(null);

            try {
                const options: PortraitOptions = { size, format };
                const result = await generateCharacterPortrait(character, options);

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
        return (
            <div
                className={`portrait-preview portrait-loading ${className}`}
                style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    border: '1px solid #ccc',
                    ...style
                }}
            >
                <div style={{
                    fontSize: size === 'small' ? '10px' : '12px',
                    color: '#666',
                    textAlign: 'center'
                }}>
                    {!systemReady ? 'Initializing...' : 'Generating...'}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
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
                    border: '1px solid #f44336',
                    color: '#d32f2f',
                    ...style
                }}
            >
                <div style={{
                    fontSize: size === 'small' ? '10px' : '12px',
                    textAlign: 'center',
                    padding: '4px'
                }}>
                    Portrait Error
                </div>
            </div>
        );
    }

    // Success state - render the portrait
    if (portraitData) {
        if (format === 'svg' && portraitData.startsWith('<svg')) {
            return (
                <div
                    className={`portrait-preview portrait-svg ${className}`}
                    style={{
                        width: dimensions.width,
                        height: dimensions.height,
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
                        ...style
                    }}
                />
            );
        }
    }

    // Fallback empty state
    return (
        <div
            className={`portrait-preview portrait-empty ${className}`}
            style={{
                width: dimensions.width,
                height: dimensions.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
                border: '1px solid #eee',
                ...style
            }}
        >
            <div style={{
                fontSize: size === 'small' ? '10px' : '12px',
                color: '#999'
            }}>
                No Portrait
            </div>
        </div>
    );
};

export default PortraitPreview;