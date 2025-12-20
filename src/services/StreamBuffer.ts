/**
 * StreamBuffer - Robust JSON stream parser with brace counting
 *
 * Replaces simple split('\n') parsing with a proper parser that handles:
 * - Multi-line JSON objects
 * - Incomplete chunks at buffer boundaries
 * - Nested braces in strings
 * - Escaped characters in strings
 */

/**
 * Parsed JSON result with metadata
 */
export interface ParsedJSON {
  /** The parsed JSON object */
  data: unknown;
  /** Raw string that was parsed */
  raw: string;
}

/**
 * StreamBuffer for parsing JSON-lines streams
 *
 * @example
 * ```typescript
 * const buffer = new StreamBuffer();
 *
 * process.stdout.on('data', (chunk) => {
 *   const objects = buffer.parse(chunk.toString());
 *   for (const obj of objects) {
 *     handleMessage(obj.data);
 *   }
 * });
 *
 * process.on('close', () => {
 *   const remaining = buffer.flush();
 *   if (remaining) {
 *     console.warn('Incomplete JSON at end of stream:', remaining);
 *   }
 * });
 * ```
 */
export class StreamBuffer {
  private _buffer: string = '';
  private _braceCount: number = 0;
  private _inString: boolean = false;
  private _escapeNext: boolean = false;
  private _objectStart: number = -1;

  /**
   * Parse incoming chunk and return complete JSON objects
   * @param chunk - New data chunk to process
   * @returns Array of parsed JSON objects
   */
  parse(chunk: string): ParsedJSON[] {
    this._buffer += chunk;
    const results: ParsedJSON[] = [];

    let i = 0;
    while (i < this._buffer.length) {
      const char = this._buffer[i];

      // Handle escape sequences in strings
      if (this._escapeNext) {
        this._escapeNext = false;
        i++;
        continue;
      }

      // Check for escape character
      if (this._inString && char === '\\') {
        this._escapeNext = true;
        i++;
        continue;
      }

      // Toggle string mode on quote
      if (char === '"') {
        this._inString = !this._inString;
        i++;
        continue;
      }

      // Only count braces outside of strings
      if (!this._inString) {
        if (char === '{') {
          if (this._braceCount === 0) {
            // Start of new object
            this._objectStart = i;
          }
          this._braceCount++;
        } else if (char === '}') {
          this._braceCount--;

          if (this._braceCount === 0 && this._objectStart !== -1) {
            // Complete object found
            const jsonString = this._buffer.slice(this._objectStart, i + 1);

            try {
              const parsed = JSON.parse(jsonString);
              results.push({ data: parsed, raw: jsonString });
            } catch (error) {
              // Log but don't throw - malformed JSON in stream
              console.warn('StreamBuffer: Failed to parse JSON:', jsonString.slice(0, 100));
            }

            // Remove processed content from buffer
            this._buffer = this._buffer.slice(i + 1);
            i = -1; // Reset index (will be 0 after i++)
            this._objectStart = -1;
          }
        }
      }

      i++;
    }

    // If we have a partial object, keep it in buffer
    // Otherwise, trim any leading whitespace/newlines
    if (this._objectStart === -1 && this._braceCount === 0) {
      this._buffer = this._buffer.trimStart();
    }

    return results;
  }

  /**
   * Get any remaining unparsed content (call on stream end)
   * @returns Remaining buffer content, or undefined if empty
   */
  flush(): string | undefined {
    const remaining = this._buffer.trim();
    this.reset();
    return remaining || undefined;
  }

  /**
   * Reset the buffer state
   */
  reset(): void {
    this._buffer = '';
    this._braceCount = 0;
    this._inString = false;
    this._escapeNext = false;
    this._objectStart = -1;
  }

  /**
   * Check if there's a partial object in the buffer
   */
  hasPartialObject(): boolean {
    return this._braceCount > 0 || this._objectStart !== -1;
  }

  /**
   * Get current buffer length (for monitoring)
   */
  getBufferLength(): number {
    return this._buffer.length;
  }

  /**
   * Get current brace depth (for debugging)
   */
  getBraceDepth(): number {
    return this._braceCount;
  }
}

/**
 * Simple line-based JSON parser (fallback/alternative)
 * Use this when you know JSON objects are always on single lines
 */
export class LineBuffer {
  private _buffer: string = '';

  /**
   * Parse incoming chunk and return complete JSON lines
   */
  parse(chunk: string): ParsedJSON[] {
    this._buffer += chunk;
    const results: ParsedJSON[] = [];

    const lines = this._buffer.split('\n');
    // Keep the last (possibly incomplete) line in buffer
    this._buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        results.push({ data: parsed, raw: trimmed });
      } catch {
        // Skip malformed lines
        console.warn('LineBuffer: Failed to parse JSON line:', trimmed.slice(0, 100));
      }
    }

    return results;
  }

  /**
   * Get remaining buffer content
   */
  flush(): string | undefined {
    const remaining = this._buffer.trim();
    this._buffer = '';
    return remaining || undefined;
  }

  /**
   * Reset the buffer
   */
  reset(): void {
    this._buffer = '';
  }
}

/**
 * Create a StreamBuffer with optional configuration
 */
export function createStreamBuffer(): StreamBuffer {
  return new StreamBuffer();
}

/**
 * Create a LineBuffer (simpler, for known single-line JSON)
 */
export function createLineBuffer(): LineBuffer {
  return new LineBuffer();
}
