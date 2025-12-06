/**
 * Code Selection Handler
 * Extracts and manages code selections for AI requests
 */

import type * as Monaco from 'monaco-editor';

export interface CodeContext {
  selectedCode: string;
  fileName: string;
  language: string;
  lineNumber: number;
  surroundingCode?: {
    before: string;
    after: string;
  };
}

/**
 * Extract code selection from the editor
 */
export function getCodeSelection(
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco
): CodeContext | null {
  const model = editor.getModel();
  if (!model) {
    return null;
  }

  const selection = editor.getSelection();
  if (!selection) {
    return null;
  }

  const selectedCode = model.getValueInRange(selection);
  const language = model.getLanguageId();
  const lineNumber = selection.startLineNumber;

  // Get surrounding code for context (5 lines before and after)
  const surroundingBefore = getSurroundingLines(model, selection.startLineNumber, -5, 0);
  const surroundingAfter = getSurroundingLines(model, selection.endLineNumber, 1, 5);

  return {
    selectedCode,
    fileName: model.uri.path.split('/').pop() || 'untitled',
    language,
    lineNumber,
    surroundingCode: {
      before: surroundingBefore,
      after: surroundingAfter,
    },
  };
}

/**
 * Get surrounding lines from the model
 */
function getSurroundingLines(
  model: Monaco.editor.ITextModel,
  fromLine: number,
  offsetStart: number,
  offsetEnd: number
): string {
  const startLine = Math.max(1, fromLine + offsetStart);
  const endLine = Math.min(model.getLineCount(), fromLine + offsetEnd);

  if (startLine > endLine) {
    return '';
  }

  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(model.getLineContent(i));
  }

  return lines.join('\n');
}

/**
 * Get the current cursor position context
 */
export function getCursorContext(
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco
): CodeContext | null {
  const model = editor.getModel();
  if (!model) {
    return null;
  }

  const position = editor.getPosition();
  if (!position) {
    return null;
  }

  const language = model.getLanguageId();
  const lineNumber = position.lineNumber;

  // Get current line
  const currentLine = model.getLineContent(lineNumber);

  // Get surrounding code
  const surroundingBefore = getSurroundingLines(model, lineNumber, -5, -1);
  const surroundingAfter = getSurroundingLines(model, lineNumber, 1, 5);

  return {
    selectedCode: currentLine,
    fileName: model.uri.path.split('/').pop() || 'untitled',
    language,
    lineNumber,
    surroundingCode: {
      before: surroundingBefore,
      after: surroundingAfter,
    },
  };
}

/**
 * Check if there is a selection in the editor
 */
export function hasSelection(editor: Monaco.editor.IStandaloneCodeEditor): boolean {
  const selection = editor.getSelection();
  return selection !== null && !selection.isEmpty();
}
