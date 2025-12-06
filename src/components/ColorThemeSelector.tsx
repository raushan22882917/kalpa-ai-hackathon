import React, { useState } from 'react';
import { ColorTheme } from '../types/projectGenerator';
import { PREDEFINED_THEMES } from '../data/predefinedThemes';
import './ColorThemeSelector.css';

interface ColorThemeSelectorProps {
  onThemeSelected: (theme: ColorTheme) => void;
}

const ColorThemeSelector: React.FC<ColorThemeSelectorProps> = ({ onThemeSelected }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const themeRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());
  const [customTheme, setCustomTheme] = useState<ColorTheme>({
    id: 'custom',
    name: 'Custom Theme',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    background: '#FFFFFF',
    text: '#1E293B',
    description: 'Your custom color theme'
  });

  const handleThemeClick = (theme: ColorTheme) => {
    setSelectedThemeId(theme.id);
  };

  const handleConfirm = () => {
    const selectedTheme = showCustom 
      ? customTheme 
      : PREDEFINED_THEMES.find(t => t.id === selectedThemeId);
    
    if (selectedTheme) {
      onThemeSelected(selectedTheme);
    }
  };

  const handleCustomTheme = () => {
    setShowCustom(true);
    setSelectedThemeId('custom');
  };

  const handleColorChange = (colorKey: keyof ColorTheme, value: string) => {
    setCustomTheme(prev => ({
      ...prev,
      [colorKey]: value
    }));
  };

  // Calculate contrast ratio for accessibility validation
  const getContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      
      const [rs, gs, bs] = [r, g, b].map(c => {
        const sRGB = c / 255;
        return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  const validateAccessibility = (theme: ColorTheme): { valid: boolean; message: string } => {
    const textBgContrast = getContrastRatio(theme.text, theme.background);
    const primaryBgContrast = getContrastRatio(theme.primary, theme.background);
    
    if (textBgContrast < 4.5) {
      return { 
        valid: false, 
        message: `Text/Background contrast ratio (${textBgContrast.toFixed(2)}) is below 4.5:1. Improve for better readability.` 
      };
    }
    
    if (primaryBgContrast < 3) {
      return { 
        valid: false, 
        message: `Primary/Background contrast ratio (${primaryBgContrast.toFixed(2)}) is below 3:1. Consider adjusting.` 
      };
    }
    
    return { valid: true, message: 'Color combination meets accessibility standards!' };
  };

  const accessibilityCheck = showCustom ? validateAccessibility(customTheme) : { valid: true, message: '' };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCustom) return;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, PREDEFINED_THEMES.length - 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedThemeId) {
          handleConfirm();
        } else {
          handleThemeClick(PREDEFINED_THEMES[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedThemeId(null);
        break;
    }
  };

  // Focus management
  React.useEffect(() => {
    const focusedTheme = PREDEFINED_THEMES[focusedIndex];
    if (focusedTheme) {
      const element = themeRefs.current.get(focusedTheme.id);
      if (element) {
        element.focus();
      }
    }
  }, [focusedIndex]);

  return (
    <div 
      className="theme-selector"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Color theme selection"
    >
      <div className="theme-selector-header">
        <h2>Choose Your Color Theme</h2>
        <p>Select colors that match your project's brand and style</p>
      </div>

      {!showCustom ? (
        <>
          <div className="theme-cards" role="radiogroup" aria-label="Available color themes">
            {PREDEFINED_THEMES.map((theme, idx) => (
              <div
                key={theme.id}
                ref={(el) => {
                  if (el) themeRefs.current.set(theme.id, el);
                }}
                className={`theme-card ${selectedThemeId === theme.id ? 'selected' : ''}`}
                onClick={() => handleThemeClick(theme)}
                role="radio"
                aria-checked={selectedThemeId === theme.id}
                tabIndex={idx === focusedIndex ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleThemeClick(theme);
                  }
                }}
                aria-label={`${theme.name} theme: ${theme.description}. Primary: ${theme.primary}, Secondary: ${theme.secondary}, Accent: ${theme.accent}`}
                aria-describedby={`theme-${theme.id}-preview`}
              >
                <div className="theme-card-header">
                  <h4>{theme.name}</h4>
                  {selectedThemeId === theme.id && (
                    <span className="selected-indicator">✓</span>
                  )}
                </div>

                <p className="theme-description">{theme.description}</p>

                <div className="color-palette">
                  <div className="color-swatch-row">
                    <div className="color-swatch-item">
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: theme.primary }}
                        aria-label={`Primary color: ${theme.primary}`}
                      />
                      <span className="color-label">Primary</span>
                      <span className="color-value">{theme.primary}</span>
                    </div>
                    <div className="color-swatch-item">
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: theme.secondary }}
                        aria-label={`Secondary color: ${theme.secondary}`}
                      />
                      <span className="color-label">Secondary</span>
                      <span className="color-value">{theme.secondary}</span>
                    </div>
                    <div className="color-swatch-item">
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: theme.accent }}
                        aria-label={`Accent color: ${theme.accent}`}
                      />
                      <span className="color-label">Accent</span>
                      <span className="color-value">{theme.accent}</span>
                    </div>
                  </div>
                  <div className="color-swatch-row">
                    <div className="color-swatch-item">
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: theme.background }}
                        aria-label={`Background color: ${theme.background}`}
                      />
                      <span className="color-label">Background</span>
                      <span className="color-value">{theme.background}</span>
                    </div>
                    <div className="color-swatch-item">
                      <div 
                        className="color-swatch" 
                        style={{ backgroundColor: theme.text }}
                        aria-label={`Text color: ${theme.text}`}
                      />
                      <span className="color-label">Text</span>
                      <span className="color-value">{theme.text}</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="theme-preview"
                  id={`theme-${theme.id}-preview`}
                  style={{
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.primary
                  }}
                  aria-label="Theme preview"
                >
                  <div 
                    className="preview-button"
                    style={{ backgroundColor: theme.primary, color: theme.background }}
                  >
                    Button
                  </div>
                  <div 
                    className="preview-text"
                    style={{ color: theme.text }}
                  >
                    Sample text
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="theme-selector-actions">
            <button
              className="custom-theme-button"
              onClick={handleCustomTheme}
              aria-label="Create custom theme (advanced option)"
              title="Create custom theme"
            >
              Advanced: Custom Theme
            </button>
            <button
              className="confirm-button"
              onClick={handleConfirm}
              disabled={!selectedThemeId}
              aria-label={selectedThemeId ? `Confirm selection of ${PREDEFINED_THEMES.find(t => t.id === selectedThemeId)?.name} theme` : "Select a theme to continue"}
              title={selectedThemeId ? "Continue with selected theme (Enter)" : "Select a theme first"}
            >
              Continue with Selected Theme
            </button>
          </div>
        </>
      ) : (
        <div className="custom-theme-form">
          <h3>Custom Theme Configuration</h3>
          <p className="custom-theme-note">
            Create your own color theme with custom colors
          </p>

          <div className="color-pickers">
            <div className="color-picker-item">
              <label htmlFor="primary-color">Primary Color</label>
              <div className="color-input-group">
                <input
                  id="primary-color"
                  type="color"
                  value={customTheme.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  aria-label="Primary color picker"
                />
                <input
                  type="text"
                  value={customTheme.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Primary color hex value"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="secondary-color">Secondary Color</label>
              <div className="color-input-group">
                <input
                  id="secondary-color"
                  type="color"
                  value={customTheme.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  aria-label="Secondary color picker"
                />
                <input
                  type="text"
                  value={customTheme.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Secondary color hex value"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="accent-color">Accent Color</label>
              <div className="color-input-group">
                <input
                  id="accent-color"
                  type="color"
                  value={customTheme.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  aria-label="Accent color picker"
                />
                <input
                  type="text"
                  value={customTheme.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Accent color hex value"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="background-color">Background Color</label>
              <div className="color-input-group">
                <input
                  id="background-color"
                  type="color"
                  value={customTheme.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  aria-label="Background color picker"
                />
                <input
                  type="text"
                  value={customTheme.background}
                  onChange={(e) => handleColorChange('background', e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Background color hex value"
                />
              </div>
            </div>

            <div className="color-picker-item">
              <label htmlFor="text-color">Text Color</label>
              <div className="color-input-group">
                <input
                  id="text-color"
                  type="color"
                  value={customTheme.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  aria-label="Text color picker"
                />
                <input
                  type="text"
                  value={customTheme.text}
                  onChange={(e) => handleColorChange('text', e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  aria-label="Text color hex value"
                />
              </div>
            </div>
          </div>

          <div className={`accessibility-check ${accessibilityCheck.valid ? 'valid' : 'invalid'}`}>
            <span className="accessibility-icon">{accessibilityCheck.valid ? '✓' : '⚠'}</span>
            <span className="accessibility-message">{accessibilityCheck.message}</span>
          </div>

          <div 
            className="custom-theme-preview"
            style={{
              backgroundColor: customTheme.background,
              color: customTheme.text,
              borderColor: customTheme.primary
            }}
          >
            <h4 style={{ color: customTheme.primary }}>Preview</h4>
            <p style={{ color: customTheme.text }}>This is how your theme will look</p>
            <button 
              style={{ 
                backgroundColor: customTheme.primary, 
                color: customTheme.background,
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px'
              }}
            >
              Primary Button
            </button>
            <button 
              style={{ 
                backgroundColor: customTheme.accent, 
                color: customTheme.background,
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                marginLeft: '0.5rem'
              }}
            >
              Accent Button
            </button>
          </div>

          <div className="custom-theme-actions">
            <button
              className="back-button"
              onClick={() => {
                setShowCustom(false);
                setSelectedThemeId(null);
              }}
              aria-label="Back to predefined themes"
            >
              Back to Predefined Themes
            </button>
            <button
              className="confirm-button"
              onClick={handleConfirm}
              disabled={!accessibilityCheck.valid}
              aria-label="Confirm custom theme"
            >
              Use Custom Theme
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorThemeSelector;
