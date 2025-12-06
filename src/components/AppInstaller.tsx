import React, { useState, useRef } from 'react';
import './AppInstaller.css';

interface AppInstallerProps {
  deviceId: string;
  platform: 'android' | 'ios';
  onInstallComplete?: (packageName: string) => void;
  onLaunch?: (packageName: string) => void;
}

interface InstallProgress {
  status: 'idle' | 'uploading' | 'installing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}

interface InstalledApp {
  packageName: string;
  installedAt: Date;
}

export const AppInstaller: React.FC<AppInstallerProps> = ({
  deviceId,
  platform,
  onInstallComplete,
  onLaunch
}) => {
  const [installProgress, setInstallProgress] = useState<InstallProgress>({
    status: 'idle',
    progress: 0
  });
  const [installedApp, setInstalledApp] = useState<InstalledApp | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file extension
      const validExtensions = platform === 'android' ? ['.apk'] : ['.ipa'];
      const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setInstallProgress({
          status: 'failed',
          progress: 0,
          error: `Invalid file type. Expected ${validExtensions.join(' or ')} for ${platform}`
        });
        return;
      }

      setSelectedFile(file);
      setInstallProgress({
        status: 'idle',
        progress: 0
      });
    }
  };

  const handleInstall = async () => {
    if (!selectedFile) return;

    try {
      setInstallProgress({
        status: 'uploading',
        progress: 0,
        message: 'Preparing to upload...'
      });

      const formData = new FormData();
      formData.append('appPackage', selectedFile);
      formData.append('deviceId', deviceId);
      formData.append('platform', platform);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setInstallProgress(prev => {
          if (prev.status === 'uploading' && prev.progress < 50) {
            return {
              ...prev,
              progress: prev.progress + 10,
              message: 'Uploading app package...'
            };
          } else if (prev.status === 'uploading' && prev.progress >= 50) {
            return {
              status: 'installing',
              progress: 75,
              message: 'Installing app on device...'
            };
          }
          return prev;
        });
      }, 500);

      const response = await fetch('http://localhost:3001/api/app-installation/upload', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (response.ok && result.success) {
        setInstallProgress({
          status: 'completed',
          progress: 100,
          message: 'App installed successfully!'
        });

        const app: InstalledApp = {
          packageName: result.packageName,
          installedAt: new Date()
        };
        setInstalledApp(app);

        if (onInstallComplete) {
          onInstallComplete(result.packageName);
        }
      } else {
        throw new Error(result.error || 'Installation failed');
      }
    } catch (error) {
      setInstallProgress({
        status: 'failed',
        progress: 0,
        message: 'Installation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const handleLaunch = async () => {
    if (!installedApp) return;

    try {
      const response = await fetch('http://localhost:3001/api/app-installation/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId,
          platform,
          packageName: installedApp.packageName
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        if (onLaunch) {
          onLaunch(installedApp.packageName);
        }
      } else {
        throw new Error(result.error || 'Launch failed');
      }
    } catch (error) {
      console.error('Error launching app:', error);
      alert(`Failed to launch app: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setInstalledApp(null);
    setInstallProgress({
      status: 'idle',
      progress: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (installProgress.status) {
      case 'uploading':
      case 'installing':
        return '⏳';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📦';
    }
  };

  return (
    <div className="app-installer">
      <div className="app-installer-header">
        <h3>App Installation</h3>
        <span className="platform-badge">{platform.toUpperCase()}</span>
      </div>

      <div className="app-installer-content">
        {!installedApp ? (
          <>
            <div className="file-selector">
              <input
                ref={fileInputRef}
                type="file"
                accept={platform === 'android' ? '.apk' : '.ipa'}
                onChange={handleFileSelect}
                disabled={installProgress.status === 'uploading' || installProgress.status === 'installing'}
                id="app-file-input"
              />
              <label htmlFor="app-file-input" className="file-input-label">
                {selectedFile ? selectedFile.name : `Choose ${platform === 'android' ? 'APK' : 'IPA'} file`}
              </label>
            </div>

            {selectedFile && installProgress.status === 'idle' && (
              <button
                className="install-button"
                onClick={handleInstall}
              >
                Install App
              </button>
            )}

            {(installProgress.status === 'uploading' || installProgress.status === 'installing') && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${installProgress.progress}%` }}
                  />
                </div>
                <div className="progress-message">
                  {getStatusIcon()} {installProgress.message}
                </div>
              </div>
            )}

            {installProgress.status === 'failed' && (
              <div className="error-message">
                <div className="error-icon">❌</div>
                <div className="error-text">
                  <strong>{installProgress.message}</strong>
                  {installProgress.error && <p>{installProgress.error}</p>}
                </div>
                <button className="retry-button" onClick={handleReset}>
                  Try Again
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="installed-app-info">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <div className="success-text">
                <strong>App Installed Successfully!</strong>
                <p className="package-name">{installedApp.packageName}</p>
                <p className="install-time">
                  Installed at {installedApp.installedAt.toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="app-actions">
              <button className="launch-button" onClick={handleLaunch}>
                🚀 Launch App
              </button>
              <button className="install-another-button" onClick={handleReset}>
                Install Another App
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
