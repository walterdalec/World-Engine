// Portrait Preview Component
// React component for displaying generated character portraits

import React, { useEffect, useState } from 'react';
import { visualService } from './service';
import { CharacterVisualData, PortraitOptions } from './types';

interface PortraitPreviewProps {
    character: CharacterVisualData;
    width?: number;
    height?: number;
    options?: PortraitOptions;
}

export const PortraitPreview: React.FC<PortraitPreviewProps> = ({
    character,
    width = 200,
    height = 200,
    options = { size: 'medium', format: 'svg' }
}) => {
    console.log('🎭 PortraitPreview: Component mounted/re-rendered with character:', character);
    console.log('🚨🚨🚨 BUILD TEST - If you see this, the latest code is running! 🚨🚨🚨');

    const [isInitialized, setIsInitialized] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [portraitData, setPortraitData] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showDebug, setShowDebug] = useState(false);

    // Initialize visual system
    useEffect(() => {
        const initSystem = async () => {
            try {
                console.log('🚀 PortraitPreview: Initializing visual system...');
                await visualService.initialize();
                console.log('✅ PortraitPreview: Visual system initialized successfully');
                setIsInitialized(true);
            } catch (err) {
                console.error('❌ PortraitPreview: Failed to initialize visual system:', err);
                setErrorMessage('Failed to initialize portrait system');
            }
        };

        if (!visualService.isReady()) {
            initSystem();
        } else {
            setIsInitialized(true);
        }
    }, []);

    // Generate portrait when character or options change
    useEffect(() => {
        console.log('🔄 PortraitPreview: useEffect triggered - isInitialized:', isInitialized, 'character:', character.name, character.species, character.archetype);
        if (!isInitialized || !character.name) {
            console.log('⏸️ PortraitPreview: Skipping generation - isInitialized:', isInitialized, 'hasName:', !!character.name);
            return;
        }

        const generateCharacterPortrait = async () => {
            if (!character) {
                setErrorMessage('No character data provided');
                return;
            }

            setIsGenerating(true);
            try {
                const result = await visualService.generatePortrait(character, options);
                if (result.success && result.data) {
                    setPortraitData(result.data as string);
                    setErrorMessage(null);
                } else {
                    setErrorMessage(result.error || 'Portrait generation failed');
                }
                setIsGenerating(false);
            } catch (err) {
                setErrorMessage((err as Error).message || 'Portrait generation failed');
                setIsGenerating(false);
            }
        };

        generateCharacterPortrait();
    }, [character, options, isInitialized]);

    const toggleDebug = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDebug(!showDebug);
    };

    const containerStyle = {
        width,
        height,
        position: 'relative' as 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '3px solid #4caf50',
        backgroundColor: '#f0f8ff',
        overflow: 'hidden' as 'hidden'
    } as React.CSSProperties;

    // Loading or error state
    if (!isInitialized || isGenerating || errorMessage) {
        console.log('🎭 PortraitPreview: Showing loading/error state - isInitialized:', isInitialized, 'isGenerating:', isGenerating, 'errorMessage:', errorMessage);
        return (
            <div className="portrait-preview" style={containerStyle}>
                {errorMessage ? (
                    <>
                        <div>❌ {errorMessage}</div>
                        <button onClick={toggleDebug} style={{ position: 'absolute', right: '5px', bottom: '5px' }}>🐞</button>
                    </>
                ) : !isInitialized ? (
                    <div style={{ textAlign: 'center', color: '#1976d2', fontWeight: 'bold' }}>
                        🔧 Initializing...
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: '#f57c00', fontWeight: 'bold' }}>
                        🎨 Generating...
                    </div>
                )}
            </div>
        );
    }

    // Success state - render the portrait
    if (portraitData) {
        console.log('🎭 PortraitPreview: Showing success state - data type:', typeof portraitData, 'data length:', portraitData.length);
        return (
            <div className="portrait-preview" style={containerStyle}>
                <div dangerouslySetInnerHTML={{ __html: portraitData }} />
                <button
                    onClick={toggleDebug}
                    style={{
                        position: 'absolute',
                        right: '5px',
                        bottom: '5px',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '2px 5px',
                        fontSize: '10px'
                    }}
                >
                    🐞
                </button>
            </div>
        );
    }

    // Fallback empty state
    console.log('🎭 PortraitPreview: Showing fallback empty state - no portrait data available');
    return (
        <div className="portrait-preview" style={containerStyle}>
            <div style={{ textAlign: 'center', color: '#f57c00', fontWeight: 'bold' }}>
                ⚠️ No Portrait
                <br />
                <small>Check console for details</small>
            </div>

            {showDebug && (
                <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    fontSize: '12px',
                    zIndex: 10,
                    overflow: 'auto',
                    maxHeight: '100%'
                }}>
                    <h4>Portrait Debug</h4>
                    <div>Character: {character.name || 'Unnamed'}</div>
                    <div>Species: {character.species || 'Not set'}</div>
                    <div>Archetype: {character.archetype || 'Not set'}</div>
                    <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
                        {JSON.stringify(options, null, 2)}
                    </pre>
                    <button onClick={toggleDebug}>Close</button>
                </div>
            )}
        </div>
    );
};

export default PortraitPreview;