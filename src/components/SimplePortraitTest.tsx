import React from 'react';
import { SimplePortraitPreview, SimpleUtils, DevTools } from '../visuals';

export const SimplePortraitTest: React.FC = () => {
    const species = SimpleUtils.getAvailableSpecies();
    const archetypes = SimpleUtils.getAvailableArchetypes();
    const genders: ('male' | 'female')[] = ['male', 'female'];

    const testPortrait = async () => {
        console.log('🎭 Testing simple portrait system...');
        const result = await DevTools.testSimplePortrait();
        console.log('Test result:', result);
    };

    const testAllCombinations = async () => {
        console.log('🎭 Testing multiple combinations...');
        const results = await DevTools.testAllCombinations();
        console.log('All results:', results);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Simple Portrait System Test</h1>

            <div className="mb-8">
                <button
                    onClick={testPortrait}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-4 hover:bg-blue-600"
                >
                    Test Single Portrait
                </button>
                <button
                    onClick={testAllCombinations}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Test Multiple Combinations
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Test a variety of combinations */}
                {[
                    { gender: 'male', species: 'human', archetype: 'greenwarden' },
                    { gender: 'female', species: 'sylvanborn', archetype: 'thornknight' },
                    { gender: 'male', species: 'draketh', archetype: 'ashblade' },
                    { gender: 'female', species: 'voidkin', archetype: 'voidwing' },
                    { gender: 'male', species: 'crystalborn', archetype: 'skyknight' },
                    { gender: 'female', species: 'alloy', archetype: 'cindermystic' }
                ].map((combo, index) => (
                    <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-2 capitalize">
                            {combo.gender} {combo.species} {combo.archetype}
                        </h3>
                        <SimplePortraitPreview
                            gender={combo.gender as 'male' | 'female'}
                            species={combo.species}
                            archetype={combo.archetype}
                            size="medium"
                            showDebug={true}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Available Species</h2>
                    <ul className="list-disc list-inside space-y-1">
                        {species.map(s => <li key={s} className="capitalize">{s}</li>)}
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">Available Archetypes</h2>
                    <ul className="list-disc list-inside space-y-1">
                        {archetypes.map(a => <li key={a} className="capitalize">{a}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};