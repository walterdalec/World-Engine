import React, { useState } from 'react';

const SimpleAutoUpdaterTest: React.FC = () => {
    const [status, setStatus] = useState('Ready to test auto-updater');

    const handleCheckUpdates = () => {
        setStatus('Checking for updates...');

        // Check if we're in Electron
        const isElectron = window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;

        if (!isElectron) {
            setStatus('Not running in Electron - auto-updater unavailable');
            return;
        }

        // Try different methods to trigger update check
        if ((window as any).electronAPI?.checkForUpdates) {
            (window as any).electronAPI.checkForUpdates();
            setStatus('Update check triggered via electronAPI');
        } else {
            setStatus('electronAPI not available - try Help menu instead');
        }
    };

    return (
        <div style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h1>🔄 Auto-Updater Test</h1>

            <div style={{
                backgroundColor: '#f0f0f0',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h3>Status:</h3>
                <p>{status}</p>
            </div>

            <div style={{
                backgroundColor: '#e7f3ff',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <h3>Debug Information:</h3>
                <p><strong>Current Version:</strong> 1.0.6</p>
                <p><strong>Running in:</strong> {window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ? 'Electron' : 'Browser'}</p>
                <p><strong>ElectronAPI Available:</strong> {(window as any).electronAPI ? 'Yes' : 'No'}</p>
                <p><strong>User Agent:</strong> {window.navigator.userAgent.substring(0, 100)}...</p>
            </div>

            <button
                onClick={handleCheckUpdates}
                style={{
                    backgroundColor: '#007acc',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginRight: '10px'
                }}
            >
                Check for Updates
            </button>

            <div style={{
                marginTop: '30px',
                backgroundColor: '#fff3cd',
                padding: '15px',
                borderRadius: '8px'
            }}>
                <h4>Alternative Methods:</h4>
                <p>1. Use the <strong>Help → Check for Updates</strong> menu in the desktop app</p>
                <p>2. The auto-updater should check automatically on startup</p>
                <p>3. Current test server: http://localhost:8080</p>
            </div>
        </div>
    );
};

export default SimpleAutoUpdaterTest;