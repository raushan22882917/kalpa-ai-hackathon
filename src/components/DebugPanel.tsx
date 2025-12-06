/**
 * Debug Panel Component
 * Run and Debug functionality for the editor
 */

import { useState } from 'react';
import { Play, Square, Bug, FileCode, Terminal } from 'lucide-react';
import './DebugPanel.css';

export interface DebugPanelProps {
  theme?: 'light' | 'dark';
}

interface DebugConfiguration {
  name: string;
  type: string;
  request: string;
  program?: string;
  args?: string[];
  env?: Record<string, string>;
}

const DebugPanel = ({ theme = 'dark' }: DebugPanelProps) => {
  const [configurations, setConfigurations] = useState<DebugConfiguration[]>([
    {
      name: 'Launch Current File',
      type: 'node',
      request: 'launch',
      program: '${file}',
    },
  ]);
  const [selectedConfig, setSelectedConfig] = useState<string>('Launch Current File');
  const [isRunning, setIsRunning] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  const handleStartDebug = () => {
    setIsRunning(true);
    setDebugOutput([...debugOutput, `Starting debug session: ${selectedConfig}...`]);
    // TODO: Implement actual debug session start
    setTimeout(() => {
      setDebugOutput(prev => [...prev, 'Debug session started successfully']);
    }, 500);
  };

  const handleStopDebug = () => {
    setIsRunning(false);
    setDebugOutput(prev => [...prev, 'Debug session stopped']);
  };

  const handleAddConfiguration = () => {
    const newConfig: DebugConfiguration = {
      name: `Configuration ${configurations.length + 1}`,
      type: 'node',
      request: 'launch',
      program: '${workspaceFolder}/index.js',
    };
    setConfigurations([...configurations, newConfig]);
    setSelectedConfig(newConfig.name);
  };

  return (
    <div className={`debug-panel ${theme}`}>
      <div className="panel-header">
        <h3>Run and Debug</h3>
      </div>
      
      <div className="debug-panel-content">
        {/* Configuration Selector */}
        <div className="debug-config-section">
          <label className="debug-label">Configuration</label>
          <div className="debug-config-selector">
            <select
              value={selectedConfig}
              onChange={(e) => setSelectedConfig(e.target.value)}
              className="debug-select"
            >
              {configurations.map((config) => (
                <option key={config.name} value={config.name}>
                  {config.name}
                </option>
              ))}
            </select>
            <button
              className="debug-add-config-btn"
              onClick={handleAddConfiguration}
              title="Add Configuration"
            >
              +
            </button>
          </div>
        </div>

        {/* Debug Actions */}
        <div className="debug-actions">
          <button
            className={`debug-btn debug-start ${isRunning ? 'disabled' : ''}`}
            onClick={handleStartDebug}
            disabled={isRunning}
          >
            <Play size={16} />
            <span>Start Debugging</span>
          </button>
          <button
            className={`debug-btn debug-stop ${!isRunning ? 'disabled' : ''}`}
            onClick={handleStopDebug}
            disabled={!isRunning}
          >
            <Square size={16} />
            <span>Stop Debugging</span>
          </button>
        </div>

        {/* Debug Output */}
        <div className="debug-output-section">
          <div className="debug-output-header">
            <Terminal size={16} />
            <span>Debug Console</span>
          </div>
          <div className="debug-output">
            {debugOutput.length === 0 ? (
              <div className="debug-empty">
                <Bug size={48} />
                <p>No debug session active</p>
                <p className="debug-hint">Select a configuration and start debugging</p>
              </div>
            ) : (
              <div className="debug-output-lines">
                {debugOutput.map((line, index) => (
                  <div key={index} className="debug-output-line">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Breakpoints Section */}
        <div className="debug-breakpoints-section">
          <div className="debug-section-header">
            <FileCode size={16} />
            <span>Breakpoints</span>
          </div>
          <div className="debug-breakpoints-list">
            <div className="debug-empty-breakpoints">
              <p>No breakpoints set</p>
              <p className="debug-hint">Click in the gutter to set breakpoints</p>
            </div>
          </div>
        </div>

        {/* Variables Section */}
        <div className="debug-variables-section">
          <div className="debug-section-header">
            <span>Variables</span>
          </div>
          <div className="debug-variables-list">
            <div className="debug-empty-variables">
              <p>No variables available</p>
              <p className="debug-hint">Variables will appear when debugging starts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;

