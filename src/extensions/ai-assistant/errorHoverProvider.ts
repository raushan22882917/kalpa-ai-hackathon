/**
 * Error Hover Provider
 * Provides AI-powered fix suggestions when hovering over errors
 */

import type * as Monaco from 'monaco-editor';
import { AIService } from './aiService';
import { getErrorAtPosition, getErrorCodeSnippet, type ErrorInfo } from './errorDetection';

export interface AIFixSuggestion {
  description: string;
  fixedCode: string;
  explanation: string;
}

/**
 * Register hover provider for AI fix suggestions
 */
export function registerErrorHoverProvider(
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  aiService: AIService
): Monaco.IDisposable {
  const model = editor.getModel();
  if (!model) {
    return { dispose: () => {} };
  }

  const languageId = model.getLanguageId();

  // Register hover provider
  const hoverProvider = monaco.languages.registerHoverProvider(languageId, {
    provideHover: async (model, position) => {
      // Check if there's an error at this position
      const error = getErrorAtPosition(editor, monaco, position.lineNumber, position.column);
      
      if (!error) {
        return null;
      }

      // Get the error code snippet
      const errorCode = getErrorCodeSnippet(editor, error);

      // Create hover content with diagnostic info
      const diagnosticContent = `**Error:** ${error.message}`;
      
      // Try to get AI fix suggestion
      let aiContent = '\n\n*Loading AI fix suggestion...*';
      
      // Return initial hover immediately
      const hoverResult: Monaco.languages.Hover = {
        contents: [
          { value: diagnosticContent },
          { value: aiContent },
        ],
        range: {
          startLineNumber: error.startLineNumber,
          startColumn: error.startColumn,
          endLineNumber: error.endLineNumber,
          endColumn: error.endColumn,
        },
      };

      // Fetch AI suggestion asynchronously (non-blocking)
      fetchAIFixSuggestion(aiService, errorCode, error, model.getLanguageId())
        .then(suggestion => {
          if (suggestion) {
            // Update hover content with AI suggestion
            // Note: Monaco doesn't support dynamic hover updates,
            // so this will only show on next hover
            console.log('AI fix suggestion received:', suggestion);
          }
        })
        .catch(err => {
          console.error('Failed to fetch AI fix suggestion:', err);
        });

      return hoverResult;
    },
  });

  return hoverProvider;
}

/**
 * Fetch AI fix suggestion for an error
 */
async function fetchAIFixSuggestion(
  aiService: AIService,
  errorCode: string,
  error: ErrorInfo,
  language: string
): Promise<AIFixSuggestion | null> {
  try {
    const response = await aiService.sendRequest({
      command: 'fix',
      code: errorCode,
      language,
      context: `Error: ${error.message}`,
    });

    if (response.error || !response.result) {
      return null;
    }

    return {
      description: 'AI-suggested fix',
      fixedCode: response.result,
      explanation: `Fix for: ${error.message}`,
    };
  } catch (error) {
    console.error('Error fetching AI fix suggestion:', error);
    return null;
  }
}

/**
 * Get AI fix suggestion for an error (synchronous cache lookup)
 */
const fixSuggestionCache = new Map<string, AIFixSuggestion>();

export function getCachedFixSuggestion(errorCode: string, errorMessage: string): AIFixSuggestion | null {
  const cacheKey = `${errorCode}:${errorMessage}`;
  return fixSuggestionCache.get(cacheKey) || null;
}

export function cacheFixSuggestion(errorCode: string, errorMessage: string, suggestion: AIFixSuggestion): void {
  const cacheKey = `${errorCode}:${errorMessage}`;
  fixSuggestionCache.set(cacheKey, suggestion);
}

/**
 * Register enhanced hover provider with cached AI suggestions
 */
export function registerEnhancedErrorHoverProvider(
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  aiService: AIService
): Monaco.IDisposable {
  const model = editor.getModel();
  if (!model) {
    return { dispose: () => {} };
  }

  const languageId = model.getLanguageId();

  // Pre-fetch AI suggestions for all errors
  const prefetchSuggestions = async () => {
    const markers = monaco.editor.getModelMarkers({ resource: model.uri });
    const errors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);

    for (const error of errors) {
      const errorCode = model.getValueInRange({
        startLineNumber: error.startLineNumber,
        startColumn: error.startColumn,
        endLineNumber: error.endLineNumber,
        endColumn: error.endColumn,
      });

      const cacheKey = `${errorCode}:${error.message}`;
      if (!fixSuggestionCache.has(cacheKey)) {
        try {
          const suggestion = await fetchAIFixSuggestion(
            aiService,
            errorCode,
            {
              message: error.message,
              severity: error.severity,
              startLineNumber: error.startLineNumber,
              startColumn: error.startColumn,
              endLineNumber: error.endLineNumber,
              endColumn: error.endColumn,
            },
            languageId
          );

          if (suggestion) {
            cacheFixSuggestion(errorCode, error.message, suggestion);
          }
        } catch (err) {
          console.error('Failed to prefetch AI suggestion:', err);
        }
      }
    }
  };

  // Prefetch suggestions when markers change
  const markerDisposable = monaco.editor.onDidChangeMarkers((uris) => {
    if (uris.some(uri => uri.toString() === model.uri.toString())) {
      prefetchSuggestions();
    }
  });

  // Initial prefetch
  prefetchSuggestions();

  // Register hover provider
  const hoverProvider = monaco.languages.registerHoverProvider(languageId, {
    provideHover: (model, position) => {
      // Check if there's an error at this position
      const error = getErrorAtPosition(editor, monaco, position.lineNumber, position.column);
      
      if (!error) {
        return null;
      }

      // Get the error code snippet
      const errorCode = getErrorCodeSnippet(editor, error);

      // Create hover content with diagnostic info
      const contents: Monaco.IMarkdownString[] = [
        { value: `**Error:** ${error.message}` },
      ];

      // Check for cached AI suggestion
      const cachedSuggestion = getCachedFixSuggestion(errorCode, error.message);
      if (cachedSuggestion) {
        contents.push({
          value: `\n**AI Suggestion:**\n\`\`\`${model.getLanguageId()}\n${cachedSuggestion.fixedCode}\n\`\`\`\n\n${cachedSuggestion.explanation}`,
        });
      } else {
        contents.push({
          value: '\n*AI fix suggestion loading...*',
        });
      }

      return {
        contents,
        range: {
          startLineNumber: error.startLineNumber,
          startColumn: error.startColumn,
          endLineNumber: error.endLineNumber,
          endColumn: error.endColumn,
        },
      };
    },
  });

  return {
    dispose: () => {
      hoverProvider.dispose();
      markerDisposable.dispose();
    },
  };
}
