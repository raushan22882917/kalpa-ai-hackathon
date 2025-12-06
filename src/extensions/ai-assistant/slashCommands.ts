/**
 * Slash Commands Handler
 * Detects and processes slash commands in the editor
 */

import type * as Monaco from 'monaco-editor';

export type SlashCommand = 'explain' | 'fix' | 'document';

export interface SlashCommandMatch {
  command: SlashCommand;
  range: Monaco.IRange;
  fullText: string;
}

/**
 * Detect slash commands in the editor
 */
export function detectSlashCommand(
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco
): SlashCommandMatch | null {
  const model = editor.getModel();
  if (!model) {
    return null;
  }

  const position = editor.getPosition();
  if (!position) {
    return null;
  }

  // Get the current line
  const lineContent = model.getLineContent(position.lineNumber);
  const textBeforeCursor = lineContent.substring(0, position.column - 1);

  // Check for slash commands
  const commandRegex = /\/(explain|fix|document)$/i;
  const match = textBeforeCursor.match(commandRegex);

  if (match) {
    const command = match[1].toLowerCase() as SlashCommand;
    const startColumn = position.column - match[0].length;

    return {
      command,
      range: {
        startLineNumber: position.lineNumber,
        startColumn,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      },
      fullText: match[0],
    };
  }

  return null;
}

/**
 * Register slash command completion provider
 */
export function registerSlashCommandProvider(
  monaco: typeof Monaco,
  _editor: Monaco.editor.IStandaloneCodeEditor
): Monaco.IDisposable {
  return monaco.languages.registerCompletionItemProvider('*', {
    triggerCharacters: ['/'],
    provideCompletionItems: (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Check if we should show slash commands
      const lastChar = textUntilPosition[textUntilPosition.length - 1];
      if (lastChar !== '/') {
        return { suggestions: [] };
      }

      // Check if this is at the start of a word (not in the middle of code)
      const beforeSlash = textUntilPosition.slice(0, -1).trim();
      const isValidContext = beforeSlash === '' || beforeSlash.endsWith('\n') || beforeSlash.endsWith(' ');

      if (!isValidContext) {
        return { suggestions: [] };
      }

      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: Monaco.languages.CompletionItem[] = [
        {
          label: '/explain',
          kind: monaco.languages.CompletionItemKind.Keyword,
          documentation: 'Get an AI explanation of the selected code',
          insertText: 'explain',
          range,
        },
        {
          label: '/fix',
          kind: monaco.languages.CompletionItemKind.Keyword,
          documentation: 'Get AI suggestions to fix the selected code',
          insertText: 'fix',
          range,
        },
        {
          label: '/document',
          kind: monaco.languages.CompletionItemKind.Keyword,
          documentation: 'Generate documentation for the selected code',
          insertText: 'document',
          range,
        },
      ];

      return { suggestions };
    },
  });
}

/**
 * Execute a slash command
 */
export async function executeSlashCommand(
  command: SlashCommand,
  editor: Monaco.editor.IStandaloneCodeEditor,
  _monaco: typeof Monaco,
  handler: (command: SlashCommand, context: string) => Promise<void>
): Promise<void> {
  const model = editor.getModel();
  if (!model) {
    return;
  }

  // Get the selection or current context
  const selection = editor.getSelection();
  let context = '';

  if (selection && !selection.isEmpty()) {
    // Use selected code
    context = model.getValueInRange(selection);
  } else {
    // Use surrounding context (current line and nearby lines)
    const position = editor.getPosition();
    if (position) {
      const startLine = Math.max(1, position.lineNumber - 5);
      const endLine = Math.min(model.getLineCount(), position.lineNumber + 5);
      context = model.getValueInRange({
        startLineNumber: startLine,
        startColumn: 1,
        endLineNumber: endLine,
        endColumn: model.getLineMaxColumn(endLine),
      });
    }
  }

  // Execute the command handler
  await handler(command, context);
}

/**
 * Remove slash command text from editor
 */
export function removeSlashCommandText(
  editor: Monaco.editor.IStandaloneCodeEditor,
  commandMatch: SlashCommandMatch
): void {
  const model = editor.getModel();
  if (!model) {
    return;
  }

  // Remove the slash command text
  editor.executeEdits('slash-command', [
    {
      range: commandMatch.range,
      text: '',
    },
  ]);
}
