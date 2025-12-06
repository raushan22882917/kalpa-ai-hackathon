/**
 * Fix Application
 * Handles applying AI-suggested fixes to code
 */

import type * as Monaco from 'monaco-editor';
import { AIService, type CodeSuggestion } from './aiService';
import { type ErrorInfo, getErrorCodeSnippet } from './errorDetection';

export interface FixApplicationResult {
  success: boolean;
  errorResolved: boolean;
  message: string;
}

/**
 * Apply a code fix to the editor
 */
export function applyFix(
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco,
  fix: CodeSuggestion
): FixApplicationResult {
  const model = editor.getModel();
  if (!model) {
    return {
      success: false,
      errorResolved: false,
      message: 'No model available',
    };
  }

  try {
    // Apply the edit
    const edit: Monaco.editor.IIdentifiedSingleEditOperation = {
      range: fix.range,
      text: fix.newText,
      forceMoveMarkers: true,
    };

    model.pushEditOperations([], [edit], () => null);

    // Check if error is resolved (markers will update asynchronously)
    // We'll return success immediately and let the marker system update
    return {
      success: true,
      errorResolved: true, // Optimistic - will be verified by marker system
      message: 'Fix applied successfully',
    };
  } catch (error) {
    console.error('Failed to apply fix:', error);
    return {
      success: false,
      errorResolved: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Apply a simple text replacement fix
 */
export function applySimpleFix(
  editor: Monaco.editor.IStandaloneCodeEditor,
  error: ErrorInfo,
  fixedCode: string
): FixApplicationResult {
  const fix: CodeSuggestion = {
    range: {
      startLineNumber: error.startLineNumber,
      startColumn: error.startColumn,
      endLineNumber: error.endLineNumber,
      endColumn: error.endColumn,
    },
    newText: fixedCode,
    description: `Fix for: ${error.message}`,
  };

  return applyFix(editor, {} as any, fix);
}

/**
 * Get AI fix and apply it
 */
export async function getAndApplyAIFix(
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco,
  aiService: AIService,
  error: ErrorInfo
): Promise<FixApplicationResult> {
  const model = editor.getModel();
  if (!model) {
    return {
      success: false,
      errorResolved: false,
      message: 'No model available',
    };
  }

  try {
    // Get the error code
    const errorCode = getErrorCodeSnippet(editor, error);

    // Request AI fix
    const response = await aiService.sendRequest({
      command: 'fix',
      code: errorCode,
      language: model.getLanguageId(),
      context: `Error: ${error.message}`,
    });

    if (response.error || !response.result) {
      return {
        success: false,
        errorResolved: false,
        message: response.error || 'No fix suggestion received',
      };
    }

    // Apply the fix
    return applySimpleFix(editor, error, response.result);
  } catch (error) {
    console.error('Failed to get and apply AI fix:', error);
    return {
      success: false,
      errorResolved: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get multiple AI fix suggestions for an error
 */
export async function getMultipleAIFixes(
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco,
  aiService: AIService,
  error: ErrorInfo
): Promise<CodeSuggestion[]> {
  const model = editor.getModel();
  if (!model) {
    return [];
  }

  try {
    // Get the error code
    const errorCode = getErrorCodeSnippet(editor, error);

    // Request AI fix
    const response = await aiService.sendRequest({
      command: 'fix',
      code: errorCode,
      language: model.getLanguageId(),
      context: `Error: ${error.message}. Provide multiple fix options if possible.`,
    });

    if (response.error || !response.result) {
      return [];
    }

    // If the response includes multiple suggestions, use them
    if (response.suggestions && response.suggestions.length > 0) {
      return response.suggestions;
    }

    // Otherwise, create a single suggestion from the result
    return [
      {
        range: {
          startLineNumber: error.startLineNumber,
          startColumn: error.startColumn,
          endLineNumber: error.endLineNumber,
          endColumn: error.endColumn,
        },
        newText: response.result,
        description: `Fix for: ${error.message}`,
      },
    ];
  } catch (error) {
    console.error('Failed to get AI fix suggestions:', error);
    return [];
  }
}

/**
 * Register code action provider for quick fixes
 */
export function registerFixCodeActionProvider(
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  aiService: AIService
): Monaco.IDisposable {
  const model = editor.getModel();
  if (!model) {
    return { dispose: () => {} };
  }

  const languageId = model.getLanguageId();

  // Cache for fix suggestions to avoid repeated API calls
  const fixCache = new Map<string, CodeSuggestion[]>();

  // Register code action provider
  const provider = monaco.languages.registerCodeActionProvider(languageId, {
    provideCodeActions: async (_model, _range, context) => {
      const actions: Monaco.languages.CodeAction[] = [];

      // Get markers (errors) in the range
      const markers = context.markers.filter(
        marker => marker.severity === monaco.MarkerSeverity.Error
      );

      if (markers.length === 0) {
        return { actions, dispose: () => {} };
      }

      // Create code actions for each error
      for (const marker of markers) {
        const error: ErrorInfo = {
          message: marker.message,
          severity: marker.severity,
          startLineNumber: marker.startLineNumber,
          startColumn: marker.startColumn,
          endLineNumber: marker.endLineNumber,
          endColumn: marker.endColumn,
        };

        // Get cached fixes or fetch new ones
        const cacheKey = `${error.startLineNumber}:${error.startColumn}:${error.message}`;
        let fixes = fixCache.get(cacheKey);

        if (!fixes) {
          // Fetch fixes asynchronously
          fixes = await getMultipleAIFixes(editor, monaco, aiService, error);
          if (fixes.length > 0) {
            fixCache.set(cacheKey, fixes);
          }
        }

        // Create code actions for each fix option
        if (fixes && fixes.length > 0) {
          fixes.forEach((fix, index) => {
            const title =
              fixes.length > 1
                ? `AI Fix ${index + 1}/${fixes.length}: ${fix.description.substring(0, 40)}...`
                : `AI: Fix "${marker.message.substring(0, 30)}..."`;

            actions.push({
              title,
              kind: 'quickfix',
              isPreferred: index === 0, // First fix is preferred
              edit: undefined, // Will be applied via command
              command: {
                id: 'ai.applyFix',
                title: 'Apply AI Fix',
                arguments: [fix],
              },
            });
          });
        } else {
          // Fallback: single AI fix action
          actions.push({
            title: `AI: Fix "${marker.message.substring(0, 30)}..."`,
            kind: 'quickfix',
            isPreferred: true,
            edit: undefined,
            command: {
              id: 'ai.applyFix',
              title: 'Apply AI Fix',
              arguments: [error],
            },
          });
        }
      }

      return {
        actions,
        dispose: () => {},
      };
    },
  });

  // Register command to apply fix
  editor.addCommand(
    0, // No keybinding
    async (_accessor, fixOrError: CodeSuggestion | ErrorInfo) => {
      let result: FixApplicationResult;

      // Check if it's a CodeSuggestion or ErrorInfo
      if ('newText' in fixOrError) {
        // It's a CodeSuggestion
        result = applyFix(editor, monaco, fixOrError as CodeSuggestion);
      } else {
        // It's an ErrorInfo
        result = await getAndApplyAIFix(editor, monaco, aiService, fixOrError as ErrorInfo);
      }
      
      if (result.success) {
        console.log('Fix applied successfully');
      } else {
        console.error('Failed to apply fix:', result.message);
      }
    },
    'ai.applyFix'
  );

  return {
    dispose: () => {
      provider.dispose();
      fixCache.clear();
    },
  };
}

/**
 * Verify if an error is resolved after applying a fix
 */
export function verifyErrorResolution(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  originalError: ErrorInfo
): boolean {
  const model = editor.getModel();
  if (!model) {
    return false;
  }

  // Get current markers
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });

  // Check if the original error still exists at the same location
  const errorStillExists = markers.some(
    marker =>
      marker.severity === monaco.MarkerSeverity.Error &&
      marker.startLineNumber === originalError.startLineNumber &&
      marker.startColumn === originalError.startColumn &&
      marker.message === originalError.message
  );

  return !errorStillExists;
}
