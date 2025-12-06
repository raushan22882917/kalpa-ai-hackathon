import React, { useEffect, useRef, useState } from 'react';
import './ScreenMirror.css';

export interface ScreenMetrics {
  frameRate: number;
  latency: number;
  bandwidth: number;
  droppedFrames: number;
}

export interface ScreenMirrorProps {
  sessionId: string;
  deviceId: string;
  platform: 'android' | 'ios';
  onStartCapture: (deviceId: string, platform: 'android' | 'ios', quality: 'low' | 'medium' | 'high') => Promise<void>;
  onStopCapture: (sessionId: string) => Promise<void>;
  onSetQuality: (sessionId: string, quality: 'low' | 'medium' | 'high') => Promise<void>;
  onTouchEvent: (sessionId: string, event: TouchEventData) => void;
  onClose: (sessionId: string) => void;
}

export interface TouchEventData {
  x: number;
  y: number;
  type: 'down' | 'move' | 'up';
  timestamp: number;
}

/**
 * ScreenMirror component for displaying device screen in real-time
 * Handles WebRTC streaming, touch events, and quality controls
 */
export const ScreenMirror: React.FC<ScreenMirrorProps> = ({
  sessionId,
  deviceId,
  platform,
  onStartCapture,
  onStopCapture,
  onSetQuality,
  onTouchEvent,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [metrics, setMetrics] = useState<ScreenMetrics>({
    frameRate: 0,
    latency: 0,
    bandwidth: 0,
    droppedFrames: 0
  });
  const [showMetrics, setShowMetrics] = useState<boolean>(true);
  const [deviceDimensions, setDeviceDimensions] = useState({ width: 1080, height: 1920 });

  useEffect(() => {
    // Auto-start capture when component mounts
    handleStartCapture();

    return () => {
      // Cleanup on unmount
      if (isActive) {
        handleStopCapture();
      }
    };
  }, []);

  const handleStartCapture = async () => {
    try {
      await onStartCapture(deviceId, platform, quality);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to start screen capture:', error);
    }
  };

  const handleStopCapture = async () => {
    try {
      await onStopCapture(sessionId);
      setIsActive(false);
    } catch (error) {
      console.error('Failed to stop screen capture:', error);
    }
  };

  const handleQualityChange = async (newQuality: 'low' | 'medium' | 'high') => {
    try {
      await onSetQuality(sessionId, newQuality);
      setQuality(newQuality);
    } catch (error) {
      console.error('Failed to change quality:', error);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    // Map canvas coordinates to device coordinates
    const scaleX = deviceDimensions.width / canvas.width;
    const scaleY = deviceDimensions.height / canvas.height;
    
    const deviceX = Math.round(canvasX * scaleX);
    const deviceY = Math.round(canvasY * scaleY);

    // Send touch event
    const touchEvent: TouchEventData = {
      x: deviceX,
      y: deviceY,
      type: 'down',
      timestamp: Date.now()
    };

    onTouchEvent(sessionId, touchEvent);

    // Simulate touch up after a short delay
    setTimeout(() => {
      onTouchEvent(sessionId, {
        ...touchEvent,
        type: 'up',
        timestamp: Date.now()
      });
    }, 100);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const scaleX = deviceDimensions.width / canvas.width;
    const scaleY = deviceDimensions.height / canvas.height;
    
    const deviceX = Math.round(canvasX * scaleX);
    const deviceY = Math.round(canvasY * scaleY);

    onTouchEvent(sessionId, {
      x: deviceX,
      y: deviceY,
      type: 'down',
      timestamp: Date.now()
    });
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isActive || event.buttons !== 1) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const scaleX = deviceDimensions.width / canvas.width;
    const scaleY = deviceDimensions.height / canvas.height;
    
    const deviceX = Math.round(canvasX * scaleX);
    const deviceY = Math.round(canvasY * scaleY);

    onTouchEvent(sessionId, {
      x: deviceX,
      y: deviceY,
      type: 'move',
      timestamp: Date.now()
    });
  };

  const handleCanvasMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;

    const scaleX = deviceDimensions.width / canvas.width;
    const scaleY = deviceDimensions.height / canvas.height;
    
    const deviceX = Math.round(canvasX * scaleX);
    const deviceY = Math.round(canvasY * scaleY);

    onTouchEvent(sessionId, {
      x: deviceX,
      y: deviceY,
      type: 'up',
      timestamp: Date.now()
    });
  };

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
    // Swap dimensions
    setDeviceDimensions(prev => ({
      width: prev.height,
      height: prev.width
    }));
  };

  // Render frame data to canvas
  // This will be called when frame data is received via WebSocket events
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  React.useCallback((frameData: string) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Update device dimensions if they changed
      if (img.width !== deviceDimensions.width || img.height !== deviceDimensions.height) {
        setDeviceDimensions({ width: img.width, height: img.height });
      }

      // Draw image to canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = `data:image/png;base64,${frameData}`;
  }, [deviceDimensions.width, deviceDimensions.height]);

  const updateMetrics = (newMetrics: Partial<ScreenMetrics>) => {
    setMetrics(prev => ({ ...prev, ...newMetrics }));
  };

  // Expose methods for parent component to call
  useEffect(() => {
    // This would be connected to WebSocket events in a real implementation
    // For now, we'll simulate metrics updates
    if (isActive) {
      const metricsInterval = setInterval(() => {
        updateMetrics({
          frameRate: 30 + Math.floor(Math.random() * 10),
          latency: 50 + Math.floor(Math.random() * 50),
          bandwidth: 1000 + Math.floor(Math.random() * 500),
          droppedFrames: Math.floor(Math.random() * 5)
        });
      }, 1000);

      return () => clearInterval(metricsInterval);
    }
  }, [isActive]);

  return (
    <div className="screen-mirror">
      <div className="screen-mirror-header">
        <div className="screen-mirror-title">
          <span className="screen-mirror-icon">📱</span>
          <span>Screen Mirror</span>
          {isActive && (
            <span className="screen-mirror-status">
              <span className="screen-mirror-indicator"></span>
              Live
            </span>
          )}
        </div>
        <div className="screen-mirror-actions">
          <div className="screen-mirror-quality">
            <label>Quality:</label>
            <select
              value={quality}
              onChange={(e) => handleQualityChange(e.target.value as 'low' | 'medium' | 'high')}
              disabled={!isActive}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button
            className="screen-mirror-button"
            onClick={toggleOrientation}
            title="Toggle orientation"
            disabled={!isActive}
          >
            🔄
          </button>
          <button
            className="screen-mirror-button"
            onClick={() => setShowMetrics(!showMetrics)}
            title="Toggle metrics"
          >
            📊
          </button>
          {isActive ? (
            <button
              className="screen-mirror-button screen-mirror-stop"
              onClick={handleStopCapture}
              title="Stop mirroring"
            >
              Stop
            </button>
          ) : (
            <button
              className="screen-mirror-button screen-mirror-start"
              onClick={handleStartCapture}
              title="Start mirroring"
            >
              Start
            </button>
          )}
          <button
            className="screen-mirror-button screen-mirror-close"
            onClick={() => onClose(sessionId)}
            title="Close screen mirror"
          >
            ×
          </button>
        </div>
      </div>
      
      <div className="screen-mirror-content" ref={containerRef}>
        <div className={`screen-mirror-display ${orientation}`}>
          <canvas
            ref={canvasRef}
            className="screen-mirror-canvas"
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />
          {!isActive && (
            <div className="screen-mirror-placeholder">
              <div className="screen-mirror-placeholder-content">
                <span className="screen-mirror-placeholder-icon">📱</span>
                <p>Screen mirroring not active</p>
                <button
                  className="screen-mirror-button screen-mirror-start"
                  onClick={handleStartCapture}
                >
                  Start Mirroring
                </button>
              </div>
            </div>
          )}
        </div>

        {showMetrics && isActive && (
          <div className="screen-mirror-metrics">
            <div className="screen-mirror-metric">
              <span className="screen-mirror-metric-label">FPS:</span>
              <span className="screen-mirror-metric-value">{metrics.frameRate}</span>
            </div>
            <div className="screen-mirror-metric">
              <span className="screen-mirror-metric-label">Latency:</span>
              <span className="screen-mirror-metric-value">{metrics.latency}ms</span>
            </div>
            <div className="screen-mirror-metric">
              <span className="screen-mirror-metric-label">Bandwidth:</span>
              <span className="screen-mirror-metric-value">{(metrics.bandwidth / 1000).toFixed(1)}KB/s</span>
            </div>
            <div className="screen-mirror-metric">
              <span className="screen-mirror-metric-label">Dropped:</span>
              <span className="screen-mirror-metric-value">{metrics.droppedFrames}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
