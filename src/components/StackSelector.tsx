import React, { useState } from 'react';
import { TechStack } from '../types/projectGenerator';
import { PREDEFINED_STACKS } from '../data/predefinedStacks';
import './StackSelector.css';

interface StackSelectorProps {
  onStackSelected: (stack: TechStack) => void;
}

const StackSelector: React.FC<StackSelectorProps> = ({ onStackSelected }) => {
  const [selectedStackId, setSelectedStackId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const stackRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  // Group stacks by level
  const stacksByLevel = PREDEFINED_STACKS.reduce((acc, stack) => {
    if (!acc[stack.levelNumber]) {
      acc[stack.levelNumber] = [];
    }
    acc[stack.levelNumber].push(stack);
    return acc;
  }, {} as Record<number, TechStack[]>);

  // Flatten stacks for keyboard navigation
  const flatStacks = React.useMemo(() => PREDEFINED_STACKS, []);

  const levelLabels: Record<number, string> = {
    1: 'Beginner',
    2: 'Intermediate',
    3: 'Advanced',
    4: 'Mobile',
    5: 'Ultimate'
  };

  const handleStackClick = (stack: TechStack) => {
    setSelectedStackId(stack.id);
  };

  const handleConfirm = () => {
    const selectedStack = PREDEFINED_STACKS.find(s => s.id === selectedStackId);
    if (selectedStack) {
      onStackSelected(selectedStack);
    }
  };

  const handleCustomStack = () => {
    setShowCustom(true);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCustom) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, flatStacks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedStackId) {
          handleConfirm();
        } else {
          handleStackClick(flatStacks[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedStackId(null);
        break;
    }
  };

  // Focus management
  React.useEffect(() => {
    const focusedStack = flatStacks[focusedIndex];
    if (focusedStack) {
      const element = stackRefs.current.get(focusedStack.id);
      if (element) {
        element.focus();
      }
    }
  }, [focusedIndex, flatStacks]);

  return (
    <div 
      className="stack-selector"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Technology stack selection"
    >
      <div className="stack-selector-header">
        <h2>Choose Your Technology Stack</h2>
        <p>Select a stack that matches your skill level and project needs</p>
      </div>

      {!showCustom ? (
        <>
          <div className="stack-levels">
            {Object.entries(stacksByLevel).map(([level, stacks]) => (
              <div key={level} className="stack-level-group">
                <div className="level-header">
                  <span className="level-badge">Level {level}</span>
                  <h3>{levelLabels[parseInt(level)]}</h3>
                </div>
                
                <div className="stack-cards">
                  {stacks.map((stack) => (
                    <div
                      key={stack.id}
                      ref={(el) => {
                        if (el) stackRefs.current.set(stack.id, el);
                      }}
                      className={`stack-card ${selectedStackId === stack.id ? 'selected' : ''}`}
                      onClick={() => handleStackClick(stack)}
                      role="radio"
                      aria-checked={selectedStackId === stack.id}
                      tabIndex={flatStacks.indexOf(stack) === focusedIndex ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStackClick(stack);
                        }
                      }}
                      aria-label={`${stack.name} stack, Level ${stack.levelNumber}: ${stack.level}. Frontend: ${stack.frontend}, Backend: ${stack.backend || 'None'}, Database: ${stack.database}${stack.mobile ? `, Mobile: ${stack.mobile}` : ''}`}
                      aria-describedby={`stack-${stack.id}-benefits`}
                    >
                      <div className="stack-card-header">
                        <h4>{stack.name}</h4>
                        {selectedStackId === stack.id && (
                          <span className="selected-indicator">✓</span>
                        )}
                      </div>

                      <div className="stack-technologies">
                        <div className="tech-item">
                          <span className="tech-label">Frontend:</span>
                          <span className="tech-value">{stack.frontend}</span>
                        </div>
                        {stack.backend && (
                          <div className="tech-item">
                            <span className="tech-label">Backend:</span>
                            <span className="tech-value">{stack.backend}</span>
                          </div>
                        )}
                        <div className="tech-item">
                          <span className="tech-label">Database:</span>
                          <span className="tech-value">{stack.database}</span>
                        </div>
                        {stack.mobile && (
                          <div className="tech-item">
                            <span className="tech-label">Mobile:</span>
                            <span className="tech-value">{stack.mobile}</span>
                          </div>
                        )}
                      </div>

                      <div className="stack-benefits" id={`stack-${stack.id}-benefits`}>
                        <h5>Benefits:</h5>
                        <ul>
                          {stack.benefits.map((benefit, idx) => (
                            <li key={idx}>{benefit}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="stack-use-cases">
                        <h5>Best for:</h5>
                        <div className="use-case-tags">
                          {stack.useCases.map((useCase, idx) => (
                            <span key={idx} className="use-case-tag">{useCase}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="stack-selector-actions">
            <button
              className="custom-stack-button"
              onClick={handleCustomStack}
              aria-label="Configure custom stack (advanced option)"
              title="Configure custom stack"
            >
              Advanced: Custom Stack
            </button>
            <button
              className="confirm-button"
              onClick={handleConfirm}
              disabled={!selectedStackId}
              aria-label={selectedStackId ? `Confirm selection of ${flatStacks.find(s => s.id === selectedStackId)?.name} stack` : "Select a stack to continue"}
              title={selectedStackId ? "Continue with selected stack (Enter)" : "Select a stack first"}
            >
              Continue with Selected Stack
            </button>
          </div>
        </>
      ) : (
        <div className="custom-stack-form">
          <h3>Custom Stack Configuration</h3>
          <p className="custom-stack-note">
            Custom stack configuration coming soon. For now, please select from the predefined options.
          </p>
          <button
            className="back-button"
            onClick={() => setShowCustom(false)}
            aria-label="Back to predefined stacks"
          >
            Back to Predefined Stacks
          </button>
        </div>
      )}
    </div>
  );
};

export default StackSelector;
