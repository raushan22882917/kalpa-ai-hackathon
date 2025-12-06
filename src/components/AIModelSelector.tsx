import React, { useState, useRef, useEffect } from 'react';
import './AIModelSelector.css';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'deepseek';
  description: string;
  bestFor: string[];
  icon: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'auto',
    name: 'Auto (Smart Selection)',
    provider: 'openai',
    description: 'Automatically selects the best model for your task',
    bestFor: ['Adaptive', 'Cost-efficient', 'Optimal performance'],
    icon: '🎯'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Most capable OpenAI model for complex tasks',
    bestFor: ['Complex reasoning', 'Code generation', 'Analysis'],
    icon: '🤖'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast and efficient for most tasks',
    bestFor: ['Quick responses', 'Simple tasks', 'Cost-effective'],
    icon: '⚡'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro (Preview)',
    provider: 'gemini',
    description: 'Next-gen Gemini with advanced reasoning and multimodal capabilities',
    bestFor: ['Complex reasoning', 'Race condition detection', 'Advanced debugging'],
    icon: '🚀'
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Vibe Coding)',
    provider: 'gemini',
    description: 'Latest Gemini model optimized for coding with multimodal support',
    bestFor: ['Vibe coding', 'Fast responses', 'Multimodal tasks'],
    icon: '✨'
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Advanced Gemini model with large context window',
    bestFor: ['Large codebases', 'Complex analysis', 'Long context'],
    icon: '🔮'
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'Fast and efficient Gemini model',
    bestFor: ['Quick responses', 'Efficient processing', 'Cost-effective'],
    icon: '⚡'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'gemini',
    description: 'Balanced Gemini model for general tasks',
    bestFor: ['General coding', 'Balanced performance', 'Reliable'],
    icon: '💎'
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    description: 'Balanced Claude model for most tasks',
    bestFor: ['Code review', 'Documentation', 'Explanations'],
    icon: '🎭'
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'Specialized in code understanding',
    bestFor: ['Code analysis', 'Debugging', 'Optimization'],
    icon: '🔍'
  }
];

interface AIModelSelectorProps {
  selectedModel: AIModel | null;
  onModelSelected: (model: AIModel) => void;
  placeholder?: string;
}

const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelSelected,
  placeholder = 'Choose AI Model'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group models by provider
  const modelsByProvider = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  const providerLabels: Record<string, string> = {
    openai: 'OpenAI',
    gemini: 'Google Gemini',
    anthropic: 'Anthropic Claude',
    deepseek: 'DeepSeek'
  };

  // Filter models based on search term
  const filteredModelsByProvider = Object.entries(modelsByProvider).reduce((acc, [provider, models]) => {
    const filtered = models.filter(model =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.bestFor.some(b => b.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filtered.length > 0) {
      acc[provider] = filtered;
    }
    return acc;
  }, {} as Record<string, AIModel[]>);

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

  const handleModelSelect = (model: AIModel) => {
    onModelSelected(model);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="ai-model-selector" ref={dropdownRef}>
      <div
        className="ai-model-selector-trigger"
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
        <span className="ai-model-selector-value">
          {selectedModel ? (
            <>
              <span className="model-icon">{selectedModel.icon}</span>
              <span className="model-name">{selectedModel.name}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className={`ai-model-selector-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </div>

      {isOpen && (
        <div className="ai-model-selector-menu">
          <div className="ai-model-selector-search">
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="ai-model-search-input"
              autoFocus
            />
          </div>

          <div className="ai-model-selector-list">
            {Object.entries(filteredModelsByProvider).map(([provider, models]) => (
              <div key={provider} className="ai-model-provider-group">
                <div className="ai-model-provider-header">
                  <span className="ai-model-provider-label">{providerLabels[provider]}</span>
                </div>
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`ai-model-option ${
                      selectedModel?.id === model.id ? 'selected' : ''
                    }`}
                    onClick={() => handleModelSelect(model)}
                    role="option"
                    aria-selected={selectedModel?.id === model.id}
                  >
                    <div className="ai-model-option-header">
                      <span className="model-icon">{model.icon}</span>
                      <span className="ai-model-option-name">{model.name}</span>
                      {selectedModel?.id === model.id && (
                        <span className="ai-model-option-check">✓</span>
                      )}
                    </div>
                    <div className="ai-model-option-description">
                      {model.description}
                    </div>
                    {model.bestFor.length > 0 && (
                      <div className="ai-model-option-tags">
                        {model.bestFor.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="ai-model-tag">
                            {tag}
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

export default AIModelSelector;
