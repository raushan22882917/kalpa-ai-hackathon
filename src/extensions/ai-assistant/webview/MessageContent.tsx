/**
 * Message Content Component
 * Renders message content with syntax highlighting for code blocks
 */

import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

interface MessageContentProps {
  content: string;
  theme: 'light' | 'dark';
}

interface CodeBlock {
  language: string;
  code: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Parse message content to extract code blocks
 */
function parseCodeBlocks(content: string): { text: string; codeBlocks: CodeBlock[] } {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks: CodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return { text: content, codeBlocks };
}

/**
 * Render content with syntax-highlighted code blocks
 */
const MessageContent: React.FC<MessageContentProps> = ({ content, theme }) => {
  const { text, codeBlocks } = parseCodeBlocks(content);
  const codeRefs = useRef<(HTMLPreElement | null)[]>([]);

  useEffect(() => {
    // Apply syntax highlighting to code blocks
    codeBlocks.forEach((_block, index) => {
      const element = codeRefs.current[index];
      if (element) {
        monaco.editor.colorizeElement(element, {
          theme: theme === 'dark' ? 'vs-dark' : 'vs',
        });
      }
    });
  }, [codeBlocks, theme]);

  if (codeBlocks.length === 0) {
    // No code blocks, render as plain text
    return <div className="message-content">{content}</div>;
  }

  // Render content with code blocks
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  codeBlocks.forEach((block, index) => {
    // Add text before code block
    if (block.startIndex > lastIndex) {
      const textBefore = text.substring(lastIndex, block.startIndex);
      parts.push(
        <span key={`text-${index}`} className="message-text">
          {textBefore}
        </span>
      );
    }

    // Add code block with syntax highlighting
    parts.push(
      <div key={`code-${index}`} className="code-block-container">
        <div className="code-block-header">
          <span className="code-language">{block.language}</span>
        </div>
        <pre
          ref={(el) => (codeRefs.current[index] = el)}
          className="code-block"
          data-lang={block.language}
        >
          <code>{block.code}</code>
        </pre>
      </div>
    );

    lastIndex = block.endIndex;
  });

  // Add remaining text after last code block
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    parts.push(
      <span key="text-end" className="message-text">
        {textAfter}
      </span>
    );
  }

  return <div className="message-content">{parts}</div>;
};

export default MessageContent;
