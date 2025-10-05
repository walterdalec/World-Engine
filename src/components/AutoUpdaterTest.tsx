import React, { useState, useEffect } from 'react';

// Declare the electron types for IPC
declare global {
    interface Window {
        electronAPI?: {
            checkForUpdates: () => void;
            restartApp: () => void;
            onUpdateAvailable: (callback: (info: any) => void) => void;
            onDownloadProgress: (callback: (progress: any) => void) => void;
            onUpdateDownloaded: (callback: (info: any) => void) => void;
        };
    }
}

interface UpdateInfo {
    version: string;
    files?: any[];
}

interface ProgressInfo {
    percent: number;
    transferred: number;
    total: number;
}

const AutoUpdaterTest: React.FC = () => {
    const [updateStatus, setUpdateStatus] = useState<string>('Ready to check for updates');
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<ProgressInfo | null>(null);
    const [isUpdateDownloaded, setIsUpdateDownloaded] = useState(false);

    useEffect(() => {
        // Check if we're running in Electron
        const isElectron = window.electronAPI || window.navigator.userAgent.toLowerCase().indexOf('electron') > -1;
        if (!isElectron) {
            setUpdateStatus('Not running in Electron - auto-updater unavailable');
            return;
        }

        // Listen for update events via IPC if available
        if (window.electronAPI) {
            window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
                setUpdateStatus(`Update available: ${info.version}`);
                setUpdateInfo(info);
            });

            window.electronAPI.onDownloadProgress((progress: ProgressInfo) => {
                setDownloadProgress(progress);
                setUpdateStatus(`Downloading: ${Math.round(progress.percent)}%`);
            });

            window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
                setUpdateStatus(`Update downloaded: ${info.version} - Ready to install`);
                setIsUpdateDownloaded(true);
                setDownloadProgress(null);
            });
        }

        // Also listen for direct events if electron is available
        if ((window as any).electron) {
            const { ipcRenderer } = (window as any).electron;

            ipcRenderer.on('update-available', (event: any, info: UpdateInfo) => {
                setUpdateStatus(`Update available: ${info.version}`);
                setUpdateInfo(info);
            });

            ipcRenderer.on('download-progress', (event: any, progress: ProgressInfo) => {
                setDownloadProgress(progress);
                setUpdateStatus(`Downloading: ${Math.round(progress.percent)}%`);
            });

            ipcRenderer.on('update-downloaded', (event: any, info: UpdateInfo) => {
                setUpdateStatus(`Update downloaded: ${info.version} - Ready to install`);
                setIsUpdateDownloaded(true);
                setDownloadProgress(null);
            });
        }
    }, []);

    const handleCheckForUpdates = () => {
        setUpdateStatus('Checking for updates...');
        setUpdateInfo(null);
        setDownloadProgress(null);
        setIsUpdateDownloaded(false);

        // Try to trigger update check via different methods
        if (window.electronAPI?.checkForUpdates) {
            window.electronAPI.checkForUpdates();
        } else if ((window as any).electron?.ipcRenderer) {
            (window as any).electron.ipcRenderer.send('check-for-updates');
        } else {
            // Fallback: try to call the menu action
            setUpdateStatus('Triggering update check...');
            console.log('Attempting to trigger auto-updater...');
        }
    };

    const handleRestartAndInstall = () => {
        if (window.electronAPI?.restartApp) {
            window.electronAPI.restartApp();
        } else if ((window as any).electron?.ipcRenderer) {
            (window as any).electron.ipcRenderer.send('restart-app');
        }
    };

    const handleManualUpdate = () => {
        // Open file dialog for manual update testing
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.exe,.dmg,.AppImage';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setUpdateStatus(`Selected file: ${file.name}`);
                console.log('Selected update file:', file);
                // In a real implementation, you'd handle the file here
            }
        };
        input.click();
    };

    return (
        <div style={{
            padding: '20px',
            border: '2px solid #007acc',
            borderRadius: '8px',
            margin: '20px',
            backgroundColor: '#f5f5f5'
        }}>
            <h2>🔄 Auto-Updater Test Panel</h2>

            <div style={{ marginBottom: '15px' }}>
                <strong>Status:</strong> {updateStatus}
            </div>

            {updateInfo && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                    <strong>Update Available:</strong>
                    <br />Version: {updateInfo.version}
                    {updateInfo.files && updateInfo.files.length > 0 && (
                        <>
                            <br />Files: {updateInfo.files.length}
                        </>
                    )}
                </div>
            )}

            {downloadProgress && (
                <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                    <strong>Download Progress:</strong>
                    <br />Progress: {Math.round(downloadProgress.percent)}%
                    <br />Downloaded: {Math.round(downloadProgress.transferred / 1024 / 1024)} MB
                    <br />Total: {Math.round(downloadProgress.total / 1024 / 1024)} MB
                    <div style={{
                        width: '100%',
                        height: '20px',
                        backgroundColor: '#ddd',
                        borderRadius: '10px',
                        marginTop: '5px'
                    }}>
                        <div style={{
                            width: `${downloadProgress.percent}%`,
                            height: '100%',
                            backgroundColor: '#4caf50',
                            borderRadius: '10px',
                            transition: 'width 0.3s'
                        }} />
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleCheckForUpdates}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007acc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Check for Updates
                </button>

                <button
                    onClick={handleManualUpdate}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Manual Update File
                </button>

                {isUpdateDownloaded && (
                    <button
                        onClick={handleRestartAndInstall}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Restart & Install
                    </button>
                )}
            </div>

            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
                <strong>Debug Info:</strong>
                <br />• Current version: 1.0.6
                <br />• Test server: http://localhost:8080
                <br />• Update files: WorldEngine Setup 1.0.6.exe
                <br />• Running in: {window.navigator.userAgent.toLowerCase().indexOf('electron') > -1 ? 'Electron' : 'Browser'}
                <br />• ElectronAPI available: {window.electronAPI ? 'Yes' : 'No'}
            </div>
        </div>
    );
};

export default AutoUpdaterTest;