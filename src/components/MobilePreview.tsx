/**
 * Mobile Preview Component
 * Shows a mobile app preview inside a phone frame with device switching
 */

import { useState } from 'react';
import { Smartphone, Tablet, Monitor, QrCode, RefreshCw } from 'lucide-react';
import './MobilePreview.css';

interface MobilePreviewProps {
  url: string;
  title?: string;
  onClose?: () => void;
  isExpoApp?: boolean;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

const MobilePreview = ({ url, title = 'Mobile App', onClose, isExpoApp = false }: MobilePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [deviceType, setDeviceType] = useState<DeviceType>('mobile');
  const [showQR, setShowQR] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const generateQRCode = (text: string): string => {
    // Simple QR code generation using API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="mobile-preview-container">
      <div className="mobile-preview-header">
        <div className="preview-title-section">
          <h3>{title}</h3>
          <div className="preview-url">{url}</div>
        </div>
        
        <div className="preview-controls">
          {/* Device Type Selector */}
          <div className="device-selector">
            <button
              className={`device-button ${deviceType === 'mobile' ? 'active' : ''}`}
              onClick={() => setDeviceType('mobile')}
              title="Mobile View"
            >
              <Smartphone size={18} />
            </button>
            <button
              className={`device-button ${deviceType === 'tablet' ? 'active' : ''}`}
              onClick={() => setDeviceType('tablet')}
              title="Tablet View"
            >
              <Tablet size={18} />
            </button>
            <button
              className={`device-button ${deviceType === 'desktop' ? 'active' : ''}`}
              onClick={() => setDeviceType('desktop')}
              title="Desktop View"
            >
              <Monitor size={18} />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            className="refresh-button"
            onClick={handleRefresh}
            title="Refresh Preview"
          >
            <RefreshCw size={18} />
          </button>

          {/* QR Code for Expo Apps */}
          {isExpoApp && (
            <button
              className="qr-button"
              onClick={() => setShowQR(!showQR)}
              title="Show QR Code for Expo Go"
            >
              <QrCode size={18} />
            </button>
          )}
        </div>

        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQR && isExpoApp && (
        <div className="qr-modal">
          <div className="qr-content">
            <h4>Scan with Expo Go</h4>
            <img src={generateQRCode(url)} alt="QR Code" />
            <p className="qr-url">{url}</p>
            <button className="qr-close" onClick={() => setShowQR(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mobile-preview-content">
        {deviceType === 'mobile' ? (
          <svg 
            className="mobile-frame" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            height="100%" 
            width="100%" 
            viewBox="0 0 475 998"
          >
          <g style={{ clipPath: 'url(#clip0_11662_1408)' }}>
            <foreignObject 
              x="13.6691" 
              y="13.6691" 
              width="447.662" 
              height="970.504" 
              fill="white" 
              rx="66.0671"
            >
              <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', margin: 'auto' }}>
                  {isLoading && (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                      <p>Loading preview...</p>
                    </div>
                  )}
                  <iframe 
                    key={refreshKey}
                    src={url}
                    title={title}
                    allow="accelerometer *; autoplay *; camera *; clipboard-read *; clipboard-write *; display-capture *; encrypted-media *; fullscreen *; gamepad *; geolocation *; gyroscope *; hid *; idle-detection *; magnetometer *; microphone *; midi *; payment *; picture-in-picture *; publickey-credentials-get *; screen-wake-lock *; serial *; storage-access *; usb *; web-share *; xr-spatial-tracking *"
                    className="mobile-iframe"
                    onLoad={() => setIsLoading(false)}
                    style={{
                      transform: 'scale(1)',
                      transformOrigin: 'left top',
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      position: 'absolute'
                    }}
                  />
                </div>
              </div>
            </foreignObject>
          </g>
          
          {/* Status bar */}
          <text x="78" y="53" fontFamily="SF Pro Text;Inter;sans-serif" fontSize="18" fill="#000000" fontWeight="550">
            11:48
          </text>
          
          {/* Home indicator */}
          <rect x="151.098" y="970.132" width="173.141" height="5.69544" rx="2.84772" fill="black" />
          
          {/* Battery */}
          <rect opacity="0.35" x="394.121" y="39.2265" width="27.3381" height="13.6691" rx="4.32854" stroke="#000000" strokeWidth="1.13909" />
          <path opacity="0.4" d="M423.054 43.9728V48.5291C423.971 48.1432 424.567 47.2455 424.567 46.251C424.567 45.2564 423.971 44.3587 423.054 43.9728" fill="#000000" />
          <rect x="395.83" y="40.9352" width="23.9209" height="10.2518" rx="2.84772" fill="#000000" />
          
          {/* WiFi */}
          <path fillRule="evenodd" clipRule="evenodd" d="M375.342 42.8532C378.177 42.8534 380.904 43.8842 382.959 45.7328C383.114 45.8755 383.361 45.8737 383.513 45.7288L384.992 44.3162C385.07 44.2427 385.113 44.1431 385.112 44.0395C385.111 43.9359 385.067 43.8368 384.989 43.7641C379.596 38.8732 371.088 38.8732 365.694 43.7641C365.616 43.8367 365.572 43.9358 365.571 44.0394C365.571 44.143 365.614 44.2427 365.691 44.3162L367.17 45.7288C367.322 45.874 367.57 45.8758 367.725 45.7328C369.78 43.8841 372.507 42.8532 375.342 42.8532ZM375.34 47.5715C376.887 47.5714 378.379 48.1435 379.526 49.1767C379.681 49.3233 379.926 49.3201 380.077 49.1695L381.544 47.6945C381.622 47.6172 381.665 47.5122 381.664 47.4031C381.662 47.2941 381.617 47.19 381.539 47.1142C378.046 43.8823 372.637 43.8823 369.145 47.1142C369.066 47.19 369.021 47.2941 369.02 47.4032C369.019 47.5123 369.062 47.6173 369.139 47.6945L370.606 49.1695C370.757 49.3201 371.002 49.3233 371.157 49.1767C372.303 48.1442 373.794 47.5721 375.34 47.5715ZM378.215 50.6946C378.217 50.8124 378.175 50.926 378.098 51.0085L375.617 53.7529C375.544 53.8335 375.445 53.8789 375.342 53.8789C375.238 53.8789 375.139 53.8335 375.066 53.7529L372.585 51.0085C372.508 50.9259 372.466 50.8123 372.468 50.6945C372.47 50.5768 372.517 50.4652 372.597 50.3863C374.181 48.9173 376.502 48.9173 378.087 50.3863C378.166 50.4653 378.213 50.5769 378.215 50.6946Z" fill="#000000" />
          
          {/* Signal */}
          <path fillRule="evenodd" clipRule="evenodd" d="M357.022 41.2635C357.022 40.5558 356.477 39.9821 355.806 39.9821H354.59C353.918 39.9821 353.374 40.5558 353.374 41.2635V52.3696C353.374 53.0774 353.918 53.6511 354.59 53.6511H355.806C356.477 53.6511 357.022 53.0774 357.022 52.3696V41.2635ZM348.548 42.7159H349.764C350.436 42.7159 350.98 43.3034 350.98 44.0281V52.3389C350.98 53.0636 350.436 53.6512 349.764 53.6512H348.548C347.877 53.6512 347.332 53.0636 347.332 52.3389V44.0281C347.332 43.3034 347.877 42.7159 348.548 42.7159ZM343.608 45.6775H342.392C341.721 45.6775 341.177 46.2725 341.177 47.0064V52.3222C341.177 53.0561 341.721 53.6511 342.392 53.6511H343.608C344.28 53.6511 344.824 53.0561 344.824 52.3222V47.0064C344.824 46.2725 344.28 45.6775 343.608 45.6775ZM337.567 48.4113H336.351C335.679 48.4113 335.135 48.9978 335.135 49.7213V52.3412C335.135 53.0647 335.679 53.6511 336.351 53.6511H337.567C338.238 53.6511 338.783 53.0647 338.783 52.3412V49.7213C338.783 48.9978 338.238 48.4113 337.567 48.4113Z" fill="#000000" />
          
          {/* Dynamic Island */}
          <rect x="164.598" y="26.575" width="142.386" height="41.7704" rx="20.8852" fill="black" />
          
          {/* Phone frame */}
          <rect x="9.68226" y="9.68226" width="455.635" height="978.477" rx="70.054" stroke="black" strokeWidth="9.97362" />
          <rect x="2.84771" y="2.84771" width="469.305" height="992.146" rx="76.8885" stroke="black" strokeWidth="5.69544" />
          
          <defs>
            <clipPath id="clip0_11662_1408">
              <rect x="13.6691" y="13.6691" width="447.662" height="970.504" rx="66.0671" fill="white" />
            </clipPath>
          </defs>
        </svg>
        ) : deviceType === 'tablet' ? (
          <div className="tablet-frame">
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading preview...</p>
              </div>
            )}
            <iframe
              key={refreshKey}
              src={url}
              title={title}
              className="tablet-iframe"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        ) : (
          <div className="desktop-frame">
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading preview...</p>
              </div>
            )}
            <iframe
              key={refreshKey}
              src={url}
              title={title}
              className="desktop-iframe"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePreview;
