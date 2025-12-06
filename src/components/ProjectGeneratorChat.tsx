import React, { useState, useRef, useEffect } from 'react';
import { TechStack, ColorTheme } from '../types/projectGenerator';
import { PREDEFINED_STACKS } from '../data/predefinedStacks';
import { PREDEFINED_THEMES } from '../data/predefinedThemes';
import TechStackDropdown from './TechStackDropdown';
import AIModelSelector, { AIModel, AI_MODELS } from './AIModelSelector';
import './ProjectGeneratorChat.css';

interface ProjectGeneratorChatProps {
  onClose?: () => void;
}

const ProjectGeneratorChat: React.FC<ProjectGeneratorChatProps> = ({ onClose }) => {
  const [selectedStack, setSelectedStack] = useState<TechStack | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(PREDEFINED_THEMES[0]);
  const [projectDescription, setProjectDescription] = useState('');
  const [showAllStacks, setShowAllStacks] = useState(false);
  const [showCompactModelSelector, setShowCompactModelSelector] = useState(false);
  const [showCompactStackSelector, setShowCompactStackSelector] = useState(false);
  const [showCompactThemeSelector, setShowCompactThemeSelector] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    AI_MODELS.find(m => m.id === 'gemini-2.0-flash-exp') || AI_MODELS[0]
  );
  const compactModelRef = useRef<HTMLDivElement>(null);
  const compactStackRef = useRef<HTMLDivElement>(null);
  const compactThemeRef = useRef<HTMLDivElement>(null);

  const handleStackSelected = (stack: TechStack) => {
    setSelectedStack(stack);
    setShowAllStacks(false);
    setShowCompactStackSelector(false);
  };

  const handleThemeSelected = (theme: ColorTheme) => {
    setSelectedTheme(theme);
    setShowCompactThemeSelector(false);
  };

  const handleModelSelected = (model: AIModel) => {
    setSelectedModel(model);
    setShowCompactModelSelector(false);
  };

  // Close compact selectors when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (compactModelRef.current && !compactModelRef.current.contains(event.target as Node)) {
        setShowCompactModelSelector(false);
      }
      if (compactStackRef.current && !compactStackRef.current.contains(event.target as Node)) {
        setShowCompactStackSelector(false);
      }
      if (compactThemeRef.current && !compactThemeRef.current.contains(event.target as Node)) {
        setShowCompactThemeSelector(false);
      }
    };

    if (showCompactModelSelector || showCompactStackSelector || showCompactThemeSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCompactModelSelector, showCompactStackSelector, showCompactThemeSelector]);

  const getUsername = async (): Promise<string> => {
    // Try to get username from environment
    return 'user';
  };

  const handleStartBuilding = async () => {
    if (!selectedStack || !projectDescription.trim()) {
      return;
    }
    
    try {
      // For now, create a simple project directly using terminal
      const { terminalCommandService } = await import('../services/terminalCommandService');
      
      // Generate project name from description
      const projectName = projectDescription
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 3)
        .join('-') || 'my-project';
      
      console.log('Creating project:', projectName);
      console.log('Stack:', selectedStack.name);
      console.log('Theme:', selectedTheme.name);
      
      // Get Downloads directory path
      const userAgent = navigator.userAgent.toLowerCase();
      let downloadsPath;
      
      if (userAgent.includes('mac')) {
        downloadsPath = `/Users/${await getUsername()}/Downloads`;
      } else if (userAgent.includes('win')) {
        downloadsPath = `C:\\Users\\${await getUsername()}\\Downloads`;
      } else {
        downloadsPath = `/home/${await getUsername()}/Downloads`;
      }
      
      // Connect to terminal
      await terminalCommandService.connect(downloadsPath);
      
      // Create project directory and files
      const commands = [
        `mkdir ${projectName}`,
        `cd ${projectName}`,
        `echo "# ${projectName}" > README.md`,
        `echo "${projectDescription}" >> README.md`,
        `echo '{"name": "${projectName}", "version": "1.0.0", "description": "${projectDescription}"}' > package.json`,
        `echo 'console.log("Hello from ${projectName}!");' > index.js`,
        `mkdir src`,
        `echo 'export default function App() { return <div>Hello World</div>; }' > src/App.jsx`,
        `ls -la`
      ];
      
      console.log('Executing commands...');
      for (const command of commands) {
        const result = await terminalCommandService.executeCommand(command);
        console.log('Command result:', result);
      }
      
      alert(`Project created successfully!\n\nLocation: ${downloadsPath}/${projectName}\n\nCheck your Downloads folder.`);
      
    } catch (error) {
      console.error('Failed to start project generation:', error);
      alert(`Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Group stacks by level for display
  const stacksByLevel = PREDEFINED_STACKS.reduce((acc, stack) => {
    if (!acc[stack.levelNumber]) {
      acc[stack.levelNumber] = [];
    }
    acc[stack.levelNumber].push(stack);
    return acc;
  }, {} as Record<number, TechStack[]>);

  const levelLabels: Record<number, string> = {
    1: 'Beginner Friendly',
    2: 'Add JavaScript Backend',
    3: 'Upgrade to Next.js',
    4: 'Mobile App Integration',
    5: 'Ultimate Modern Stack'
  };

  return (
    <div className="project-generator-chat">
      <div className="chat-header">
        <div className="header-left">
          <h2>AI Project Generator</h2>
        </div>
        <div className="header-actions">
          {onClose && (
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close project generator"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="chat-content">
        <div className="initial-step-container">
          <div className="initial-step-content">
            <h3>Design Your Project</h3>

            <div className="model-selection-section">
              <label htmlFor="ai-model-selector">Choose AI Model for Vibe Coding</label>
              <AIModelSelector
                selectedModel={selectedModel}
                onModelSelected={handleModelSelected}
                placeholder="Choose AI model"
              />
              <div className="model-info">
                <span className="info-icon">💡</span>
                <span className="info-text">
                  Gemini 2.0 Flash is recommended for vibe coding with fast, intelligent responses
                </span>
              </div>
            </div>

            <div className="stack-selection-section">
              <label htmlFor="tech-stack-dropdown">Choose Tech Stack</label>
              <TechStackDropdown
                selectedStack={selectedStack}
                onStackSelected={handleStackSelected}
                placeholder="Choose tech stack for design project"
              />
              
              <button
                className="browse-stacks-btn"
                onClick={() => setShowAllStacks(!showAllStacks)}
                aria-label="Browse all available stacks"
              >
                {showAllStacks ? '▲ Hide All Stacks' : '▼ Browse All Available Stacks'}
              </button>
            </div>

            {showAllStacks && (
              <div className="all-stacks-display">
                <h4>Available Tech Stacks</h4>
                {Object.entries(stacksByLevel)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([level, stacks]) => (
                    <div key={level} className="stack-level-section">
                      <div className="stack-level-title">
                        <span className="level-badge">Level {level}</span>
                        <span className="level-name">{levelLabels[parseInt(level)]}</span>
                      </div>
                      <div className="stacks-grid">
                        {stacks.map((stack) => (
                          <div
                            key={stack.id}
                            className={`stack-card ${selectedStack?.id === stack.id ? 'selected' : ''}`}
                            onClick={() => handleStackSelected(stack)}
                          >
                            <div className="stack-card-header">
                              <h5>{stack.name}</h5>
                              {selectedStack?.id === stack.id && (
                                <span className="selected-check">✓</span>
                              )}
                            </div>
                            <div className="stack-card-tech">
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
                              {stack.mobile && (
                                <div className="tech-item">
                                  <span className="tech-label">Mobile:</span>
                                  <span className="tech-value">{stack.mobile}</span>
                                </div>
                              )}
                              <div className="tech-item">
                                <span className="tech-label">Database:</span>
                                <span className="tech-value">{stack.database}</span>
                              </div>
                            </div>
                            <div className="stack-card-benefits">
                              {stack.benefits.slice(0, 3).map((benefit, idx) => (
                                <span key={idx} className="benefit-badge">
                                  {benefit}
                                </span>
                              ))}
                            </div>
                            <div className="stack-card-usecases">
                              <strong>Best for:</strong> {stack.useCases.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {selectedStack && (
              <div className="selected-stack-display">
                <div className="selected-stack-card">
                  <div>
                    <strong>{selectedStack.name}</strong>
                    <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      Frontend: {selectedStack.frontend}
                      {selectedStack.backend && ` • Backend: ${selectedStack.backend}`}
                      {selectedStack.mobile && ` • Mobile: ${selectedStack.mobile}`}
                      {' • Database: '}
                      {selectedStack.database}
                    </div>
                  </div>
                  <button
                    className="change-stack-btn"
                    onClick={() => setSelectedStack(null)}
                    aria-label="Change selected stack"
                  >
                    Change
                  </button>
                </div>
              </div>
            )}

            <div className="prompt-input-section">
              <div className="prompt-header">
                <label htmlFor="project-description">Describe Your Project</label>
                <div className="compact-selectors-group">
                  {/* Theme Selector */}
                  <div className="compact-selector-wrapper" ref={compactThemeRef}>
                    <button
                      className="compact-selector-btn theme-btn"
                      onClick={() => setShowCompactThemeSelector(!showCompactThemeSelector)}
                      title={`Theme: ${selectedTheme.name}`}
                      aria-label="Change theme"
                    >
                      <span className="theme-color-preview" style={{ backgroundColor: selectedTheme.primary }}></span>
                      <span className="selector-label">{selectedTheme.name}</span>
                    </button>
                    
                    {showCompactThemeSelector && (
                      <div className="compact-dropdown theme-dropdown">
                        <div className="compact-dropdown-header">
                          <span>Choose Theme</span>
                          <button
                            className="close-compact-dropdown"
                            onClick={() => setShowCompactThemeSelector(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="compact-list">
                          {PREDEFINED_THEMES.map((theme) => (
                            <div
                              key={theme.id}
                              className={`compact-item ${selectedTheme.id === theme.id ? 'selected' : ''}`}
                              onClick={() => handleThemeSelected(theme)}
                            >
                              <span className="theme-color-preview" style={{ backgroundColor: theme.primary }}></span>
                              <div className="compact-item-info">
                                <div className="compact-item-name">{theme.name}</div>
                                <div className="compact-item-desc">{theme.description}</div>
                              </div>
                              {selectedTheme.id === theme.id && <span className="selected-check">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stack Selector */}
                  <div className="compact-selector-wrapper" ref={compactStackRef}>
                    <button
                      className="compact-selector-btn stack-btn"
                      onClick={() => setShowCompactStackSelector(!showCompactStackSelector)}
                      title={selectedStack ? `Stack: ${selectedStack.name}` : 'Choose tech stack'}
                      aria-label="Change tech stack"
                    >
                      <span className="selector-icon">🔧</span>
                      <span className="selector-label">{selectedStack?.name || 'Choose Stack'}</span>
                    </button>
                    
                    {showCompactStackSelector && (
                      <div className="compact-dropdown stack-dropdown">
                        <div className="compact-dropdown-header">
                          <span>Choose Tech Stack</span>
                          <button
                            className="close-compact-dropdown"
                            onClick={() => setShowCompactStackSelector(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="compact-list">
                          {PREDEFINED_STACKS.map((stack) => (
                            <div
                              key={stack.id}
                              className={`compact-item ${selectedStack?.id === stack.id ? 'selected' : ''}`}
                              onClick={() => handleStackSelected(stack)}
                            >
                              <div className="compact-item-info">
                                <div className="compact-item-name">{stack.name}</div>
                                <div className="compact-item-desc">
                                  {stack.frontend} • {stack.database}
                                </div>
                              </div>
                              {selectedStack?.id === stack.id && <span className="selected-check">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Model Selector */}
                  <div className="compact-selector-wrapper" ref={compactModelRef}>
                    <button
                      className="compact-selector-btn model-btn"
                      onClick={() => setShowCompactModelSelector(!showCompactModelSelector)}
                      title={`AI Model: ${selectedModel.name}`}
                      aria-label="Change AI model"
                    >
                      <span className="selector-icon">{selectedModel.icon}</span>
                      <span className="selector-label">{selectedModel.name}</span>
                    </button>
                    
                    {showCompactModelSelector && (
                      <div className="compact-dropdown model-dropdown">
                        <div className="compact-dropdown-header">
                          <span>Choose AI Model</span>
                          <button
                            className="close-compact-dropdown"
                            onClick={() => setShowCompactModelSelector(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="compact-list">
                          {AI_MODELS.map((model) => (
                            <div
                              key={model.id}
                              className={`compact-item ${selectedModel.id === model.id ? 'selected' : ''}`}
                              onClick={() => handleModelSelected(model)}
                            >
                              <span className="selector-icon">{model.icon}</span>
                              <div className="compact-item-info">
                                <div className="compact-item-name">{model.name}</div>
                                <div className="compact-item-desc">{model.provider}</div>
                              </div>
                              {selectedModel.id === model.id && <span className="selected-check">✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <textarea
                id="project-description"
                className="project-prompt-input"
                placeholder="Describe what you want to build... (e.g., A todo app with user authentication and dark mode)"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={4}
              />
            </div>

            <button
              className="start-building-btn"
              onClick={handleStartBuilding}
              disabled={!selectedStack || !projectDescription.trim()}
              aria-label="Start building project"
            >
              Start Building
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectGeneratorChat;

