import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from 'firebase/auth';
import './UserProfile.css';

interface UserProfileProps {
  onSignInClick: () => void;
}

export default function UserProfile({ onSignInClick }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  if (!user) {
    return (
      <button className="sign-in-button" onClick={onSignInClick}>
        <span className="user-icon">👤</span>
        Sign In
      </button>
    );
  }

  return (
    <div className="user-profile">
      <button 
        className="user-profile-button"
        onClick={() => setShowMenu(!showMenu)}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="user-avatar" />
        ) : (
          <span className="user-avatar-placeholder">
            {user.displayName?.[0] || user.email?.[0] || '?'}
          </span>
        )}
        <span className="user-name">
          {user.displayName || user.email?.split('@')[0] || 'User'}
        </span>
      </button>

      {showMenu && (
        <>
          <div className="user-menu-overlay" onClick={() => setShowMenu(false)} />
          <div className="user-menu">
            <div className="user-menu-header">
              <div className="user-menu-info">
                <div className="user-menu-name">
                  {user.displayName || 'User'}
                </div>
                <div className="user-menu-email">{user.email}</div>
              </div>
            </div>
            <div className="user-menu-divider" />
            <button className="user-menu-item" onClick={handleSignOut}>
              <span>🚪</span>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
