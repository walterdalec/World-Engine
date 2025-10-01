import React, { useEffect, useState } from 'react';
import { PortraitPreview } from './PortraitPreview';
import { getPortraitAssets } from './assets';
import { clearPortraitCache } from './service';

export const PortraitTestPage: React.FC = () => {
    const [assets, setAssets] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);

    useEffect(() => {
        const loadAssets = async () => {
            const portraitAssets = await getPortraitAssets();
            setAssets(portraitAssets);

            if (portraitAssets && Object.keys(portraitAssets).length > 0) {
                setSelectedSpecies(Object.keys(portraitAssets)[0]);
            }

            setLoading(false);
        };

        loadAssets();
    }, []);

    const handleClearCache = () => {
        clearPortraitCache();
        // Force refresh by setting loading true briefly
        setLoading(true);
        setTimeout(() => setLoading(false), 100);
    };

    if (loading) {
        return <div>Loading portrait assets...</div>;
    }

    if (!assets) {
        return <div>No portrait assets found!</div>;
    }

    const species = Object.keys(assets);
    const archetypes = selectedSpecies ?
        (assets[selectedSpecies]?.archetypes ? Object.keys(assets[selectedSpecies].archetypes) : []) :
        [];

    return (
        <div className="portrait-test-page">
            <h1>Portrait Test Page</h1>

            <div style={{ marginBottom: '20px' }}>
                <label>
                    Select Species:
                    <select
                        value={selectedSpecies || ''}
                        onChange={(e) => setSelectedSpecies(e.target.value)}
                    >
                        {species.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
                <button
                    onClick={handleClearCache}
                    style={{ marginLeft: '20px' }}
                >
                    Clear Portrait Cache
                </button>
            </div>

            {selectedSpecies && (
                <>
                    <h2>Base {selectedSpecies}</h2>
                    <PortraitPreview
                        character={{
                            name: "Base",
                            species: selectedSpecies,
                            archetype: "Warrior",
                            level: 1,
                            appearance: {}
                        }}
                        width={200}
                        height={200}
                    />

                    <h2>{selectedSpecies} Archetypes</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                        {archetypes.map(archetype => (
                            <div key={archetype} style={{ textAlign: 'center' }}>
                                <PortraitPreview
                                    character={{
                                        name: archetype,
                                        species: selectedSpecies,
                                        archetype,
                                        level: 1,
                                        appearance: {}
                                    }}
                                    width={150}
                                    height={150}
                                />
                                <div>{archetype}</div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PortraitTestPage;