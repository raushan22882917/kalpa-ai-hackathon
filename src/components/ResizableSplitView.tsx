import React, { useState, useRef, useEffect, ReactNode } from 'react';
import './ResizableSplitView.css';

interface ResizableSplitViewProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
  onResize?: (leftWidth: number) => void;
}

const ResizableSplitView: React.FC<ResizableSplitViewProps> = ({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 40,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  onResize
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedLeftWidth = useRef(defaultLeftWidth);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
        setLeftWidth(newLeftWidth);
        onResize?.(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minLeftWidth, maxLeftWidth, onResize]);

  const handleMouseDown = () => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const toggleLeftPanel = () => {
    if (isLeftCollapsed) {
      setLeftWidth(savedLeftWidth.current);
      setIsLeftCollapsed(false);
    } else {
      savedLeftWidth.current = leftWidth;
      setLeftWidth(0);
      setIsLeftCollapsed(true);
    }
  };

  const toggleRightPanel = () => {
    if (isRightCollapsed) {
      setLeftWidth(savedLeftWidth.current);
      setIsRightCollapsed(false);
    } else {
      savedLeftWidth.current = leftWidth;
      setLeftWidth(100);
      setIsRightCollapsed(true);
    }
  };

  const actualLeftWidth = isLeftCollapsed ? 0 : isRightCollapsed ? 100 : leftWidth;

  return (
    <div className="resizable-split-view" ref={containerRef}>
      {/* Left Panel */}
      <div
        className={`split-panel left-panel ${isLeftCollapsed ? 'collapsed' : ''}`}
        style={{ width: `${actualLeftWidth}%` }}
      >
        {!isLeftCollapsed && leftPanel}
      </div>

      {/* Resize Handle */}
      {!isLeftCollapsed && !isRightCollapsed && (
        <div
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        >
          <div className="resize-handle-line" />
          <div className="resize-handle-grip">
            <span className="grip-dot"></span>
            <span className="grip-dot"></span>
            <span className="grip-dot"></span>
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div
        className={`split-panel right-panel ${isRightCollapsed ? 'collapsed' : ''}`}
        style={{ width: `${100 - actualLeftWidth}%` }}
      >
        {!isRightCollapsed && rightPanel}
      </div>

      {/* Toggle Buttons */}
      <div className="split-view-controls">
        <button
          className={`toggle-button left-toggle ${isLeftCollapsed ? 'collapsed' : ''}`}
          onClick={toggleLeftPanel}
          title={isLeftCollapsed ? 'Expand chat' : 'Collapse chat'}
          aria-label={isLeftCollapsed ? 'Expand chat panel' : 'Collapse chat panel'}
        >
          {isLeftCollapsed ? '▶' : '◀'}
        </button>
        <button
          className={`toggle-button right-toggle ${isRightCollapsed ? 'collapsed' : ''}`}
          onClick={toggleRightPanel}
          title={isRightCollapsed ? 'Expand editor' : 'Collapse editor'}
          aria-label={isRightCollapsed ? 'Expand editor panel' : 'Collapse editor panel'}
        >
          {isRightCollapsed ? '◀' : '▶'}
        </button>
      </div>
    </div>
  );
};

export default ResizableSplitView;
