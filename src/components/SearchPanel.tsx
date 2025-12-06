/**
 * Search Panel Component
 * Search and replace functionality across files
 */

import { useState } from 'react';
import './SearchPanel.css';

export interface SearchPanelProps {
  theme?: 'light' | 'dark';
}

const SearchPanel = ({ theme = 'dark' }: SearchPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showReplace, setShowReplace] = useState(false);

  return (
    <div className={`search-panel ${theme}`}>
      <div className="search-panel-header">
        <h3>Search</h3>
      </div>
      
      <div className="search-panel-content">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="search-options">
            <button
              className={`search-option-btn ${caseSensitive ? 'active' : ''}`}
              onClick={() => setCaseSensitive(!caseSensitive)}
              title="Match Case"
            >
              Aa
            </button>
            <button
              className={`search-option-btn ${wholeWord ? 'active' : ''}`}
              onClick={() => setWholeWord(!wholeWord)}
              title="Match Whole Word"
            >
              ab
            </button>
            <button
              className={`search-option-btn ${useRegex ? 'active' : ''}`}
              onClick={() => setUseRegex(!useRegex)}
              title="Use Regular Expression"
            >
              .*
            </button>
          </div>
        </div>

        <div className="replace-toggle">
          <button
            className="toggle-replace-btn"
            onClick={() => setShowReplace(!showReplace)}
            title="Toggle Replace"
          >
            {showReplace ? '▼' : '▶'} Replace
          </button>
        </div>

        {showReplace && (
          <div className="replace-input-container">
            <input
              type="text"
              className="replace-input"
              placeholder="Replace"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
            />
            <div className="replace-actions">
              <button className="replace-btn" title="Replace">
                Replace
              </button>
              <button className="replace-all-btn" title="Replace All">
                Replace All
              </button>
            </div>
          </div>
        )}

        <div className="search-results">
          <div className="search-results-header">
            <span>No results</span>
          </div>
          <div className="search-results-list">
            <div className="empty-search">
              <p>Enter search term to find matches</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPanel;
