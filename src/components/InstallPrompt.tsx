/**
 * Install Prompt Component
 * Shows PWA installation prompt for users
 */

import { useState, useEffect } from 'react';
import './InstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallPromptProps {
  theme?: 'light' | 'dark';
}

const InstallPrompt = ({ theme = 'dark' }: InstallPromptProps) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for manual show install prompt event
    const handleShowInstallPrompt = () => {
      if (deferredPrompt) {
        setShowPrompt(true);
      } else {
        // Show instructions if browser doesn't support install prompt
        alert(
          'To install this app:\n\n' +
          'Chrome/Edge: Click the ⊕ icon in the address bar\n' +
          'Safari (Mac): Share → Add to Dock\n' +
          'Safari (iOS): Share → Add to Home Screen\n' +
          'Firefox: Menu → Install Kalpa AI\n\n' +
          'See INSTALL_GUIDE.md for detailed instructions.'
        );
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('show-install-prompt', handleShowInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-prompt', handleShowInstallPrompt);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  if (isInstalled) {
    return (
      <div className={`install-status ${theme}`}>
        <div className="install-status-content">
          <span className="install-icon">✓</span>
          <span>App Installed</span>
        </div>
      </div>
    );
  }

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className={`install-prompt ${theme}`}>
      <div className="install-prompt-content">
        <div className="install-prompt-icon">📥</div>
        <div className="install-prompt-text">
          <h3>Install Kalpa AI</h3>
          <p>Install this app for a better experience. Works offline!</p>
        </div>
        <div className="install-prompt-actions">
          <button className="install-btn" onClick={handleInstallClick}>
            Install
          </button>
          <button className="dismiss-btn" onClick={handleDismiss}>
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
