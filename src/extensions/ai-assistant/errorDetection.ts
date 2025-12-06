/**
 * Error Detection and Indicator System
 * Integrates with Monaco diagnostics API to detect and display errors
 */

import type * as Monaco from 'monaco-editor';

export interface ErrorInfo {
  message: string;
  severity: Monaco.MarkerSeverity;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  code?: string;
  source?: string;
}

/**
 * Get all errors from Monaco diagnostics
 */
export function getEditorErrors(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
): ErrorInfo[] {
  const model = editor.getModel();
  if (!model) {
    return [];
  }

  // Get markers (diagnostics) for the current model
  const markers = monaco.editor.getModelMarkers({ resource: model.uri });

  // Filter for errors and warnings, convert to ErrorInfo
  return markers
    .filter(marker => 
      marker.severity === monaco.MarkerSeverity.Error ||
      marker.severity === monaco.MarkerSeverity.Warning
    )
    .map(marker => ({
      message: marker.message,
      severity: marker.severity,
      startLineNumber: marker.startLineNumber,
      startColumn: marker.startColumn,
      endLineNumber: marker.endLineNumber,
      endColumn: marker.endColumn,
      code: marker.code?.toString(),
      source: marker.source,
    }));
}

/**
 * Get error at a specific position
 */
export function getErrorAtPosition(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco,
  lineNumber: number,
  column: number
): ErrorInfo | null {
  const errors = getEditorErrors(editor, monaco);

  // Find error that contains the position
  const error = errors.find(err => {
    const inLineRange = lineNumber >= err.startLineNumber && lineNumber <= err.endLineNumber;
    if (!inLineRange) return false;

    // If single line, check column range
    if (err.startLineNumber === err.endLineNumber) {
      return column >= err.startColumn && column <= err.endColumn;
    }

    // Multi-line error
    if (lineNumber === err.startLineNumber) {
      return column >= err.startColumn;
    }
    if (lineNumber === err.endLineNumber) {
      return column <= err.endColumn;
    }
    return true;
  });

  return error || null;
}

/**
 * Check if there are any errors in the editor
 */
export function hasErrors(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
): boolean {
  return getEditorErrors(editor, monaco).length > 0;
}

/**
 * Get the code snippet for an error
 */
export function getErrorCodeSnippet(
  editor: Monaco.editor.IStandaloneCodeEditor,
  error: ErrorInfo
): string {
  const model = editor.getModel();
  if (!model) {
    return '';
  }

  return model.getValueInRange({
    startLineNumber: error.startLineNumber,
    startColumn: error.startColumn,
    endLineNumber: error.endLineNumber,
    endColumn: error.endColumn,
  });
}

/**
 * Setup error indicator decorations
 * Monaco already shows error squiggles, but we can add custom decorations if needed
 */
export function setupErrorIndicators(
  editor: Monaco.editor.IStandaloneCodeEditor,
  monaco: typeof Monaco
): Monaco.IDisposable {
  // Listen for marker changes to update decorations
  const disposable = monaco.editor.onDidChangeMarkers((uris) => {
    const model = editor.getModel();
    if (!model) return;

    // Check if the change affects our model
    if (uris.some(uri => uri.toString() === model.uri.toString())) {
      // Monaco already displays error indicators (squiggles)
      // We could add additional decorations here if needed
      const errors = getEditorErrors(editor, monaco);
      console.log(`Editor has ${errors.length} errors/warnings`);
    }
  });

  return disposable;
}
