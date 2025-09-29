// Test script for the portrait system
// Run with: node scripts/testPortraits.js

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));

// Test endpoint
app.get('/test-preset/:presetId', async (req, res) => {
    try {
        const presetsPath = path.join(__dirname, '..', 'public', 'assets', 'portraits', 'presets.json');
        const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf-8'));

        const preset = presets.presets.find(p => p.id === req.params.presetId);
        if (!preset) {
            return res.status(404).json({ error: 'Preset not found' });
        }

        // Return preset info and layer status
        const layerStatus = [];
        for (const layer of preset.layers) {
            const layerPath = path.join(__dirname, '..', 'public', 'assets', 'portraits', layer);
            const exists = fs.existsSync(layerPath);
            layerStatus.push({ layer, exists, path: layerPath });
        }

        res.json({
            preset,
            layerStatus,
            allLayersExist: layerStatus.every(l => l.exists)
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List all presets
app.get('/presets', (req, res) => {
    try {
        const presetsPath = path.join(__dirname, '..', 'public', 'assets', 'portraits', 'presets.json');
        const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf-8'));
        res.json({
            count: presets.count,
            sample: presets.presets.slice(0, 10).map(p => ({
                id: p.id,
                label: p.label,
                layers: p.layers.length
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🧪 Portrait test server running at http://localhost:${port}`);
    console.log(`📋 Test endpoints:`);
    console.log(`   GET /presets - List all presets`);
    console.log(`   GET /test-preset/:presetId - Test a specific preset`);
    console.log(`\n🎭 Try: http://localhost:${port}/test-preset/human_verdance_greenwarden_she-her`);
});