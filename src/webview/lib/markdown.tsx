import React, { useState, useCallback } from 'react';
import Markdown from 'markdown-to-jsx';
import { Highlight, themes, type PrismTheme } from 'prism-react-renderer';

/**
 * Custom Prism theme matching Stitch design spec:
 * - Keywords: #FFA344 (amber)
 * - Strings: #a1a1a1
 * - Comments: #52525b (italic)
 * - Numbers: #FF7369 (coral)
 * - Functions: #fafafa
 * - Background: #0f0f0f
 */
const stitchTheme: PrismTheme = {
  plain: {
    color: '#fafafa',
    backgroundColor: '#0f0f0f',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: {
        color: '#52525b',
        fontStyle: 'italic',
      },
    },
    {
      types: ['namespace'],
      style: {
        opacity: 0.7,
      },
    },
    {
      types: ['string', 'attr-value', 'template-string'],
      style: {
        color: '#a1a1a1',
      },
    },
    {
      types: ['punctuation', 'operator'],
      style: {
        color: '#8b8b94',
      },
    },
    {
      types: ['entity', 'url', 'symbol', 'number', 'boolean', 'variable', 'constant', 'regex', 'inserted'],
      style: {
        color: '#FF7369', // coral
      },
    },
    {
      types: ['property', 'tag', 'deleted', 'keyword', 'builtin'],
      style: {
        color: '#FFA344', // amber
      },
    },
    {
      types: ['selector', 'attr-name', 'char'],
      style: {
        color: '#FFA344', // amber
      },
    },
    {
      types: ['function', 'class-name'],
      style: {
        color: '#fafafa',
        fontWeight: 'bold',
      },
    },
    {
      types: ['important', 'atrule'],
      style: {
        color: '#FFA344', // amber
      },
    },
  ],
};

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * CodeBlock component with syntax highlighting and copy button
 * Styled per Stitch spec: dark container, sharp corners, language label, copy button
 */
function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Extract language from className (e.g., "language-typescript" -> "typescript")
  const match = className?.match(/language-(\w+)/);
  const language = match?.[1] || 'text';

  // Get the raw code content
  const code = typeof children === 'string'
    ? children.trim()
    : React.Children.toArray(children).join('').trim();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  return (
    <div className="code-block-container group">
      {/* Header bar with language label and copy button */}
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button
          onClick={handleCopy}
          className="code-block-copy"
          aria-label={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* Syntax-highlighted code */}
      <Highlight theme={stitchTheme} code={code} language={language}>
        {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`code-block-pre ${hlClassName}`} style={style}>
            <code className="code-block-code">
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="code-block-line-number">{i + 1}</span>
                  <span className="code-block-line-content">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}

/**
 * InlineCode component for inline `code` spans
 * Styled per Stitch spec: #1c1c1f background, #2d2d30 border
 */
function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="inline-code">{children}</code>;
}

/**
 * Pre component - wrapper that detects if it contains a code block
 */
function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  // If children is a code element with a language class, render CodeBlock
  if (React.isValidElement(children) && children.type === 'code') {
    const codeProps = children.props as CodeBlockProps;
    if (codeProps.className?.includes('language-')) {
      return <CodeBlock {...codeProps} />;
    }
    // Plain pre>code without language - still use CodeBlock for consistency
    return <CodeBlock className="language-text" {...codeProps} />;
  }
  // Fallback to plain pre
  return <pre className="code-block-pre" {...props}>{children}</pre>;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * MarkdownRenderer component - renders markdown with custom components
 *
 * Features:
 * - Syntax-highlighted code blocks with copy button
 * - Custom inline code styling
 * - Tailwind prose classes for typography
 * - All styling aligned with Stitch design spec
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <Markdown
        options={{
          overrides: {
            pre: { component: Pre },
            code: ({ className, children }) => {
              // Inline code (no language class and not inside pre)
              if (!className) {
                return <InlineCode>{children}</InlineCode>;
              }
              // Code inside pre with language class - handled by Pre
              return <code className={className}>{children}</code>;
            },
            // Anchor links open in new tab
            a: {
              component: ({ children, ...props }) => (
                <a {...props} className="markdown-link" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            },
            // File references styled as amber pills
            strong: {
              component: ({ children, ...props }) => {
                // Check if this is a file reference pattern
                const text = typeof children === 'string' ? children : '';
                if (text.match(/^[a-zA-Z0-9_\-./]+\.[a-zA-Z]+$/)) {
                  return <span className="file-pill">{children}</span>;
                }
                return <strong {...props}>{children}</strong>;
              },
            },
          },
          forceBlock: true,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}

export default MarkdownRenderer;
export { stitchTheme, CodeBlock, InlineCode };
