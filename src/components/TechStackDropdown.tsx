import React, { useState, useRef, useEffect } from 'react';
import { TechStack } from '../types/projectGenerator';
import { PREDEFINED_STACKS } from '../data/predefinedStacks';
import './TechStackDropdown.css';

interface TechStackDropdownProps {
  selectedStack: TechStack | null;
  onStackSelected: (stack: TechStack) => void;
  placeholder?: string;
}

const TechStackDropdown: React.FC<TechStackDropdownProps> = ({
  selectedStack,
  onStackSelected,
  placeholder = 'Choose tech stack for design project'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group stacks by level
  const stacksByLevel = PREDEFINED_STACKS.reduce((acc, stack) => {
    if (!acc[stack.levelNumber]) {
      acc[stack.levelNumber] = [];
    }
    acc[stack.levelNumber].push(stack);
    return acc;
  }, {} as Record<number, TechStack[]>);

  const levelLabels: Record<number, string> = {
    1: 'LEVEL 1 — Beginner Friendly',
    2: 'LEVEL 2 — Add JavaScript Backend',
    3: 'LEVEL 3 — Upgrade to Next.js',
    4: 'LEVEL 4 — Mobile App Integration',
    5: 'LEVEL 5 — Ultimate Modern Stack (Recommended)'
  };

  // Filter stacks based on search term
  const filteredStacksByLevel = Object.entries(stacksByLevel).reduce((acc, [level, stacks]) => {
    const filtered = stacks.filter(stack =>
      stack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stack.frontend.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stack.backend && stack.backend.toLowerCase().includes(searchTerm.toLowerCase())) ||
      stack.benefits.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filtered.length > 0) {
      acc[parseInt(level)] = filtered;
    }
    return acc;
  }, {} as Record<number, TechStack[]>);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStackSelect = (stack: TechStack) => {
    onStackSelected(stack);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getStackDisplayName = (stack: TechStack): string => {
    return stack.name;
  };

  const getStackDescription = (stack: TechStack): string => {
    const parts: string[] = [];
    parts.push(`Frontend: ${stack.frontend}`);
    if (stack.backend) {
      parts.push(`Backend: ${stack.backend}`);
    }
    parts.push(`Database: ${stack.database}`);
    if (stack.mobile) {
      parts.push(`Mobile: ${stack.mobile}`);
    }
    return parts.join(', ');
  };

  return (
    <div className="tech-stack-dropdown" ref={dropdownRef}>
      <div
        className="tech-stack-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className="tech-stack-dropdown-value">
          {selectedStack ? getStackDisplayName(selectedStack) : placeholder}
        </span>
        <span className={`tech-stack-dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div className="tech-stack-dropdown-menu">
          <div className="tech-stack-dropdown-search">
            <input
              type="text"
              placeholder="Search stacks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="tech-stack-search-input"
              autoFocus
            />
          </div>

          <div className="tech-stack-dropdown-list">
            {Object.entries(filteredStacksByLevel)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, stacks]) => (
                <div key={level} className="tech-stack-level-group">
                  <div className="tech-stack-level-header">
                    <span className="tech-stack-level-badge">Level {level}</span>
                    <span className="tech-stack-level-label">{levelLabels[parseInt(level)]}</span>
                  </div>
                  {stacks.map((stack) => (
                    <div
                      key={stack.id}
                      className={`tech-stack-option ${
                        selectedStack?.id === stack.id ? 'selected' : ''
                      }`}
                      onClick={() => handleStackSelect(stack)}
                      role="option"
                      aria-selected={selectedStack?.id === stack.id}
                    >
                      <div className="tech-stack-option-header">
                        <span className="tech-stack-option-name">{stack.name}</span>
                        {selectedStack?.id === stack.id && (
                          <span className="tech-stack-option-check">✓</span>
                        )}
                      </div>
                      <div className="tech-stack-option-description">
                        {getStackDescription(stack)}
                      </div>
                      {stack.benefits.length > 0 && (
                        <div className="tech-stack-option-benefits">
                          {stack.benefits.slice(0, 2).map((benefit, idx) => (
                            <span key={idx} className="tech-stack-benefit-tag">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechStackDropdown;

