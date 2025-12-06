import React, { useState, useEffect } from 'react';
import { Permission, PermissionRequestResult } from '../types/device';
import { deviceBridgeService } from '../services/deviceBridgeService';
import './PermissionManager.css';

interface PermissionManagerProps {
  deviceId: string;
  appId?: string;
  platform: 'android' | 'ios';
}

/**
 * PermissionManager component for managing device permissions
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
export const PermissionManager: React.FC<PermissionManagerProps> = ({
  deviceId,
  appId,
  platform
}) => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, [deviceId, appId]);

  /**
   * Load permissions from the device
   * Requirement 4.1: Display permission list with status
   */
  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const permissionList = await deviceBridgeService.listPermissions(deviceId, appId);
      setPermissions(permissionList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
      console.error('Error loading permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request a single permission
   * Requirement 4.2: Implement permission request UI
   */
  const handleRequestPermission = async (permission: string) => {
    if (!appId) {
      setError('App ID is required to request permissions');
      return;
    }

    try {
      setRequesting(prev => new Set(prev).add(permission));
      setError(null);

      const result: PermissionRequestResult = await deviceBridgeService.requestPermission(
        deviceId,
        appId,
        permission
      );

      // Update permission status
      setPermissions(prev =>
        prev.map(p =>
          p.name === permission
            ? { ...p, status: result.granted ? 'granted' : 'denied' }
            : p
        )
      );

      // Show error if permission was denied
      if (!result.granted && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      console.error('Error requesting permission:', err);
    } finally {
      setRequesting(prev => {
        const next = new Set(prev);
        next.delete(permission);
        return next;
      });
    }
  };

  /**
   * Request multiple permissions at once
   * Requirement 4.5: Create bulk permission request interface
   */
  const handleRequestMultiple = async () => {
    if (!appId) {
      setError('App ID is required to request permissions');
      return;
    }

    if (selectedPermissions.size === 0) {
      return;
    }

    try {
      const permissionsArray = Array.from(selectedPermissions);
      permissionsArray.forEach(p => setRequesting(prev => new Set(prev).add(p)));
      setError(null);

      const results: PermissionRequestResult[] = await deviceBridgeService.requestMultiplePermissions(
        deviceId,
        appId,
        permissionsArray
      );

      // Update permission statuses
      setPermissions(prev =>
        prev.map(p => {
          const result = results.find(r => r.permission === p.name);
          if (result) {
            return { ...p, status: result.granted ? 'granted' : 'denied' };
          }
          return p;
        })
      );

      // Clear selection
      setSelectedPermissions(new Set());

      // Show errors if any
      const errors = results.filter(r => !r.granted && r.error);
      if (errors.length > 0) {
        setError(`Some permissions failed: ${errors.map(e => e.error).join(', ')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permissions');
      console.error('Error requesting multiple permissions:', err);
    } finally {
      Array.from(selectedPermissions).forEach(p =>
        setRequesting(prev => {
          const next = new Set(prev);
          next.delete(p);
          return next;
        })
      );
    }
  };

  /**
   * Revoke a permission
   */
  const handleRevokePermission = async (permission: string) => {
    if (!appId) {
      setError('App ID is required to revoke permissions');
      return;
    }

    try {
      setRequesting(prev => new Set(prev).add(permission));
      setError(null);

      const revoked = await deviceBridgeService.revokePermission(deviceId, appId, permission);

      if (revoked) {
        // Update permission status
        setPermissions(prev =>
          prev.map(p =>
            p.name === permission ? { ...p, status: 'denied' } : p
          )
        );
      } else {
        setError('Failed to revoke permission');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke permission');
      console.error('Error revoking permission:', err);
    } finally {
      setRequesting(prev => {
        const next = new Set(prev);
        next.delete(permission);
        return next;
      });
    }
  };

  /**
   * Toggle permission selection for bulk operations
   */
  const togglePermissionSelection = (permission: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permission)) {
        next.delete(permission);
      } else {
        next.add(permission);
      }
      return next;
    });
  };

  /**
   * Select all not-requested permissions
   */
  const selectAllNotRequested = () => {
    const notRequested = permissions
      .filter(p => p.status === 'not_requested')
      .map(p => p.name);
    setSelectedPermissions(new Set(notRequested));
  };

  /**
   * Render permission status badge
   * Requirement 4.3: Add permission status updates
   */
  const renderStatus = (status: string) => {
    const statusClass = `permission-status permission-status-${status.replace('_', '-')}`;
    return <span className={statusClass}>{status.replace('_', ' ')}</span>;
  };

  /**
   * Render denial instructions for iOS
   * Requirement 4.4: Display denial instructions
   */
  const renderDenialInstructions = () => {
    if (platform !== 'ios') {
      return null;
    }

    const hasDenied = permissions.some(p => p.status === 'denied');
    if (!hasDenied) {
      return null;
    }

    return (
      <div className="permission-denial-instructions">
        <div className="permission-denial-title">Manual Permission Grant Required</div>
        <div className="permission-denial-text">
          iOS requires permissions to be granted manually through the Settings app.
          To grant permissions:
          <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Open the Settings app on your device</li>
            <li>Find and tap on your app</li>
            <li>Enable the required permissions</li>
            <li>Return to the app and refresh</li>
          </ol>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="permission-manager">
        <div className="permission-manager-header">
          <div className="permission-manager-title">
            <span className="permission-manager-icon">🔒</span>
            <span>Permissions</span>
          </div>
        </div>
        <div className="permission-manager-loading">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="permission-manager">
      <div className="permission-manager-header">
        <div className="permission-manager-title">
          <span className="permission-manager-icon">🔒</span>
          <span>Permissions</span>
          {appId && <span style={{ color: '#858585', fontSize: '11px' }}>({appId})</span>}
        </div>
        <div className="permission-manager-actions">
          <button
            className="permission-manager-button"
            onClick={loadPermissions}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="permission-manager-content">
        {error && (
          <div className="permission-manager-error">
            {error}
          </div>
        )}

        {permissions.length === 0 ? (
          <div className="permission-manager-empty">
            <span>No permissions available</span>
            <span style={{ fontSize: '11px' }}>
              {appId ? 'No permissions found for this app' : 'Specify an app ID to view permissions'}
            </span>
          </div>
        ) : (
          <>
            {/* Bulk actions */}
            {appId && platform === 'android' && (
              <div className="permission-bulk-actions">
                <span className="permission-bulk-label">Bulk Actions:</span>
                <button
                  className="permission-manager-button"
                  onClick={selectAllNotRequested}
                  disabled={permissions.filter(p => p.status === 'not_requested').length === 0}
                >
                  Select All Not Requested
                </button>
                <button
                  className="permission-manager-button permission-manager-button-primary"
                  onClick={handleRequestMultiple}
                  disabled={selectedPermissions.size === 0}
                >
                  Request Selected ({selectedPermissions.size})
                </button>
              </div>
            )}

            {/* Permission list */}
            <div className="permission-list">
              {permissions.map(permission => (
                <div key={permission.name} className="permission-item">
                  {appId && platform === 'android' && permission.status === 'not_requested' && (
                    <input
                      type="checkbox"
                      checked={selectedPermissions.has(permission.name)}
                      onChange={() => togglePermissionSelection(permission.name)}
                      style={{ marginRight: '12px' }}
                    />
                  )}
                  
                  <div className="permission-item-info">
                    <div className="permission-item-name">{permission.name}</div>
                    <div className="permission-item-description">{permission.description}</div>
                  </div>

                  <div className="permission-item-actions">
                    {renderStatus(permission.status)}
                    
                    {appId && (
                      <>
                        {permission.status === 'not_requested' && (
                          <button
                            className="permission-item-button"
                            onClick={() => handleRequestPermission(permission.name)}
                            disabled={requesting.has(permission.name)}
                          >
                            {requesting.has(permission.name) ? 'Requesting...' : 'Request'}
                          </button>
                        )}
                        
                        {permission.status === 'granted' && platform === 'android' && (
                          <button
                            className="permission-item-button permission-item-button-revoke"
                            onClick={() => handleRevokePermission(permission.name)}
                            disabled={requesting.has(permission.name)}
                          >
                            {requesting.has(permission.name) ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {renderDenialInstructions()}
          </>
        )}
      </div>
    </div>
  );
};

export default PermissionManager;
