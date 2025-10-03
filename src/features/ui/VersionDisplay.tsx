import React, { useState, useEffect } from 'react';

interface VersionInfo {
    version: string;
    electronVersion: string;
    nodeVersion: string;
    chromeVersion: string;
    platform: string;
    arch: string;
}

interface UpdateInfo {
    version: string;
    releaseDate?: string;
    releaseName?: string;
    releaseNotes?: string;
}

interface DownloadProgress {
    bytesPerSecond: number;
    percent: number;
    transferred: number;
    total: number;
}

// Helper to safely check if we're in Electron
const isElectron = () => {
    return typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Electron');
};

// Helper to safely access electron APIs
const getElectronAPI = () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        return (window as any).electron;
    }
    return null;
}; const VersionDisplay: React.FC = () => {
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
    const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
    const [showVersionModal, setShowVersionModal] = useState(false);

    const restartAndUpdate = () => {
        const electron = getElectronAPI();
        if (electron?.ipcRenderer) {
            electron.ipcRenderer.send('restart-app');
        }
    };

    useEffect(() => {
        // Only set up listeners if we're in Electron
        if (!isElectron()) return;

        const electron = getElectronAPI();
        if (!electron?.ipcRenderer) return;

        // Listen for version info from main process
        const handleVersionInfo = (event: any, info: VersionInfo) => {
            setVersionInfo(info);
            setShowVersionModal(true);
        };

        const handleUpdateAvailable = (event: any, info: UpdateInfo) => {
            setUpdateAvailable(info);
        };

        const handleDownloadProgress = (event: any, progress: DownloadProgress) => {
            setDownloadProgress(progress);
        };

        const handleUpdateDownloaded = (event: any, info: UpdateInfo) => {
            setUpdateDownloaded(info);
            setDownloadProgress(null);
        };

        electron.ipcRenderer.on('version-info', handleVersionInfo);
        electron.ipcRenderer.on('update-available', handleUpdateAvailable);
        electron.ipcRenderer.on('download-progress', handleDownloadProgress);
        electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);

        return () => {
            electron.ipcRenderer.removeAllListeners('version-info');
            electron.ipcRenderer.removeAllListeners('update-available');
            electron.ipcRenderer.removeAllListeners('download-progress');
            electron.ipcRenderer.removeAllListeners('update-downloaded');
        };
    }, []); return (
        <>
            {/* Update Available Notification */}
            {updateAvailable && !updateDownloaded && (
                <div className="fixed top-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
                    <h3 className="font-bold mb-2">Update Available!</h3>
                    <p className="text-sm mb-2">Version {updateAvailable.version} is downloading...</p>
                    {downloadProgress && (
                        <div className="w-full bg-blue-800 rounded-full h-2">
                            <div
                                className="bg-white h-2 rounded-full transition-all duration-300"
                                style={{ width: `${downloadProgress.percent}%` }}
                            ></div>
                            <p className="text-xs mt-1">{Math.round(downloadProgress.percent)}% complete</p>
                        </div>
                    )}
                </div>
            )}

            {/* Update Downloaded Notification */}
            {updateDownloaded && (
                <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
                    <h3 className="font-bold mb-2">Update Ready!</h3>
                    <p className="text-sm mb-3">Version {updateDownloaded.version} has been downloaded.</p>
                    <div className="flex gap-2">
                        <button
                            onClick={restartAndUpdate}
                            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
                        >
                            Restart Now
                        </button>
                        <button
                            onClick={() => setUpdateDownloaded(null)}
                            className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-800"
                        >
                            Later
                        </button>
                    </div>
                </div>
            )}

            {/* Version Info Modal */}
            {showVersionModal && versionInfo && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Version Information</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">App Version:</span>
                                <span className="text-gray-900 dark:text-white">{versionInfo.version}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Electron:</span>
                                <span className="text-gray-900 dark:text-white">{versionInfo.electronVersion}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Node.js:</span>
                                <span className="text-gray-900 dark:text-white">{versionInfo.nodeVersion}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Chrome:</span>
                                <span className="text-gray-900 dark:text-white">{versionInfo.chromeVersion}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Platform:</span>
                                <span className="text-gray-900 dark:text-white">{versionInfo.platform} ({versionInfo.arch})</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Build:</span>
                                <span className="text-gray-900 dark:text-white">
                                    {process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowVersionModal(false)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VersionDisplay;