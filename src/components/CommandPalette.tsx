/**
 * Command Palette Component
 * VS Code-style command palette for quick actions
 */

import { useState, useEffect, useRef } from 'react';
import './CommandPalette.css';

export interface Command {
  id: string;
  label: string;
  description?: string;
  category?: string;
  action: () => void;
  keybinding?: string;
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  commands: Command[];
  theme?: 'light' | 'dark';
}

const CommandPalette = ({ visible, onClose, commands, theme = 'dark' }: CommandPaletteProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [visible]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
      onClose();
    }
  };

  const handleCommandClick = (command: Command) => {
    command.action();
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div 
        className={`command-palette ${theme}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="command-palette-input-container">
          <span className="command-palette-icon">⌘</span>
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        <div className="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              No commands found
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={command.id}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleCommandClick(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="command-palette-item-main">
                  <span className="command-palette-item-label">{command.label}</span>
                  {command.keybinding && (
                    <span className="command-palette-item-keybinding">{command.keybinding}</span>
                  )}
                </div>
                {command.description && (
                  <div className="command-palette-item-description">
                    {command.category && <span className="command-category">{command.category}</span>}
                    {command.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="command-palette-footer">
          <span>↑↓ Navigate</span>
          <span>↵ Execute</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
