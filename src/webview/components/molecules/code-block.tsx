'use client';

import * as React from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
}

const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
  ({ className, code, language = 'typescript', filename, showLineNumbers = false, showCopyButton = true, ...props }, ref) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'border border-[#222225] bg-[#0f0f0f] overflow-hidden w-full shadow-sm',
          className
        )}
        {...props}
      >
        {/* Header - matches Interface 5 code block header */}
        <div className="flex items-center justify-between px-3 py-2 h-9 bg-[#0f0f0f] border-b border-[#222225]">
          <div className="flex items-center gap-2">
            {filename && (
              <>
                <Icon name="description" size="xs" className="text-[#52525b]" />
                <span className="text-xs text-[#8b8b94] font-medium hover:text-[#FFA344] transition-colors cursor-pointer">
                  {filename}
                </span>
              </>
            )}
            {!filename && (
              <span className="text-xs text-[#8b8b94] font-medium">{language}</span>
            )}
          </div>
          {showCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[#52525b] hover:text-[#fafafa]"
              onClick={handleCopy}
            >
              <Icon name={copied ? 'check' : 'content_copy'} size="xs" />
              <span className="text-[10px] font-medium uppercase ml-1">
                {copied ? 'Copied' : 'Copy'}
              </span>
            </Button>
          )}
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto">
          <Highlight
            theme={themes.vsDark}
            code={code.trim()}
            language={language}
          >
            {({ className: highlightClassName, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={cn(
                  'font-mono text-xs leading-relaxed',
                  highlightClassName
                )}
                style={{ ...style, background: 'transparent', margin: 0 }}
              >
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {showLineNumbers && (
                      <span className="inline-block w-8 text-right pr-4 text-[#52525b] select-none">
                        {i + 1}
                      </span>
                    )}
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    );
  }
);
CodeBlock.displayName = 'CodeBlock';

export { CodeBlock };
