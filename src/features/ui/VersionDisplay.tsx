import React from 'react';

interface VersionInfo {
    version: string;
    platform: string;
    userAgent: string;
}

const VersionDisplay: React.FC = () => {
    const versionInfo: VersionInfo = {
        version: process.env.REACT_APP_VERSION || '1.0.6',
        platform: navigator.platform,
        userAgent: navigator.userAgent
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        World Engine
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Version:</span>
                            <span className="text-gray-900 dark:text-white">{versionInfo.version}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Platform:</span>
                            <span className="text-gray-900 dark:text-white">{versionInfo.platform}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Environment:</span>
                            <span className="text-gray-900 dark:text-white">Web</span>
                        </div>
                    </div>
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <p>Web-first strategic RPG</p>
                    <p>Build: {process.env.NODE_ENV || 'development'}</p>
                </div>
            </div>
        </div>
    );
};

export default VersionDisplay;