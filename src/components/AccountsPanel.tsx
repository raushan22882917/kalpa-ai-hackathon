/**
 * Accounts Panel Component
 * Manage user accounts and authentication
 */

import { useState, useEffect } from 'react';
import { User, LogOut, Key, Mail, Github, Globe } from 'lucide-react';
import './AccountsPanel.css';

export interface AccountsPanelProps {
  theme?: 'light' | 'dark';
}

interface Account {
  id: string;
  provider: 'github' | 'google' | 'email';
  email: string;
  name: string;
  avatar?: string;
  isActive: boolean;
}

const AccountsPanel = ({ theme = 'dark' }: AccountsPanelProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      // Check if we're in Electron and get auth data
      if (window.electronAPI) {
        const authData = await window.electronAPI.getAuthData();
        if (authData) {
          setAccounts([{
            id: authData.uid || '1',
            provider: authData.providerId || 'email',
            email: authData.email || 'user@example.com',
            name: authData.displayName || 'User',
            avatar: authData.photoURL,
            isActive: true,
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = (_provider: 'github' | 'google' | 'email') => {
    // Trigger auth modal
    window.dispatchEvent(new Event('open-auth-modal'));
  };

  const handleSignOut = async (accountId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.syncAuth(null);
        setAccounts(accounts.filter(acc => acc.id !== accountId));
      }
      // Also clear local storage
      localStorage.removeItem('authData');
      window.dispatchEvent(new Event('auth-changed'));
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <Github size={20} />;
      case 'google':
        return <Globe size={20} />;
      default:
        return <Mail size={20} />;
    }
  };

  return (
    <div className={`accounts-panel ${theme}`}>
      <div className="accounts-header">
        <User size={24} />
        <h2>Accounts</h2>
      </div>

      <div className="accounts-content">
        {loading ? (
          <div className="accounts-loading">
            <p>Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="accounts-empty">
            <User size={64} />
            <h3>No accounts signed in</h3>
            <p>Sign in to sync your settings and extensions across devices</p>
            
            <div className="sign-in-options">
              <button
                className="sign-in-btn github"
                onClick={() => handleSignIn('github')}
              >
                <Github size={20} />
                <span>Sign in with GitHub</span>
              </button>
              <button
                className="sign-in-btn google"
                onClick={() => handleSignIn('google')}
              >
                <Globe size={20} />
                <span>Sign in with Google</span>
              </button>
              <button
                className="sign-in-btn email"
                onClick={() => handleSignIn('email')}
              >
                <Mail size={20} />
                <span>Sign in with Email</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="accounts-list">
            {accounts.map((account) => (
              <div key={account.id} className={`account-item ${account.isActive ? 'active' : ''}`}>
                <div className="account-avatar">
                  {account.avatar ? (
                    <img src={account.avatar} alt={account.name} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className="account-info">
                  <div className="account-name">{account.name}</div>
                  <div className="account-email">{account.email}</div>
                  <div className="account-provider">
                    {getProviderIcon(account.provider)}
                    <span>{account.provider}</span>
                  </div>
                </div>
                <div className="account-actions">
                  {account.isActive && (
                    <div className="active-badge">
                      <Key size={12} />
                      <span>Active</span>
                    </div>
                  )}
                  <button
                    className="sign-out-btn"
                    onClick={() => handleSignOut(account.id)}
                    title="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="accounts-footer">
          <div className="accounts-info">
            <h4>About Accounts</h4>
            <ul>
              <li>Sync your settings across devices</li>
              <li>Access your extensions from anywhere</li>
              <li>Backup your workspace configurations</li>
              <li>Collaborate with team members</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsPanel;

