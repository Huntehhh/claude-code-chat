/**
 * CliSchemas - Zod schemas for Claude CLI output validation
 *
 * Provides type-safe parsing of CLI JSON output to prevent
 * runtime errors from unexpected message formats.
 */

import { z } from 'zod';

// =============================================================================
// Base Schemas
// =============================================================================

export const ContentBlockSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
  name: z.string().optional(),
  input: z.record(z.unknown()).optional(),
  tool_use_id: z.string().optional(),
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// =============================================================================
// User Message Schema
// =============================================================================

export const UserMessageSchema = z.object({
  type: z.literal('user'),
  message: z.object({
    content: z.union([
      z.string(),
      z.array(z.object({
        type: z.string(),
        text: z.string().optional(),
        content: z.unknown().optional(),
      }))
    ]).optional(),
  }).optional(),
});

export type UserMessage = z.infer<typeof UserMessageSchema>;

// =============================================================================
// Assistant Message Schema
// =============================================================================

export const AssistantMessageSchema = z.object({
  type: z.literal('assistant'),
  message: z.object({
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
      name: z.string().optional(),
      input: z.record(z.unknown()).optional(),
    })).optional(),
  }).optional(),
});

export type AssistantMessage = z.infer<typeof AssistantMessageSchema>;

// =============================================================================
// Tool Use Schema
// =============================================================================

export const ToolUseSchema = z.object({
  type: z.literal('tool_use'),
  name: z.string(),
  id: z.string().optional(),
  input: z.record(z.unknown()),
});

export type ToolUse = z.infer<typeof ToolUseSchema>;

// =============================================================================
// Tool Result Schema
// =============================================================================

export const ToolResultSchema = z.object({
  type: z.literal('tool_result'),
  name: z.string().optional(),
  tool_use_id: z.string().optional(),
  is_error: z.boolean().optional(),
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;

// =============================================================================
// Control Request Schema (Permission requests from CLI)
// =============================================================================

export const ControlRequestSchema = z.object({
  type: z.literal('control_request'),
  request_id: z.string(),
  tool_name: z.string(),
  tool_use_id: z.string().optional(),
  input: z.record(z.unknown()),
  suggestions: z.array(z.unknown()).optional(),
});

export type ControlRequest = z.infer<typeof ControlRequestSchema>;

// =============================================================================
// Session Info Schema
// =============================================================================

export const SessionInfoSchema = z.object({
  type: z.literal('session'),
  session_id: z.string(),
  tools: z.array(z.string()).optional(),
});

export type SessionInfo = z.infer<typeof SessionInfoSchema>;

// =============================================================================
// Result Schema (completion info)
// =============================================================================

export const ResultSchema = z.object({
  type: z.literal('result'),
  duration_ms: z.number().optional(),
  duration_api_ms: z.number().optional(),
  is_error: z.boolean().optional(),
  num_turns: z.number().optional(),
  result: z.string().optional(),
  cost_usd: z.number().optional(),
  total_cost_usd: z.number().optional(),
  session_id: z.string().optional(),
  usage: z.object({
    input_tokens: z.number().optional(),
    output_tokens: z.number().optional(),
    cache_read_input_tokens: z.number().optional(),
    cache_creation_input_tokens: z.number().optional(),
  }).optional(),
});

export type Result = z.infer<typeof ResultSchema>;

// =============================================================================
// System Message Schema
// =============================================================================

export const SystemMessageSchema = z.object({
  type: z.literal('system'),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type SystemMessage = z.infer<typeof SystemMessageSchema>;

// =============================================================================
// Union of all CLI message types
// =============================================================================

export const CliMessageSchema = z.discriminatedUnion('type', [
  UserMessageSchema,
  AssistantMessageSchema,
  z.object({ type: z.literal('tool_use'), name: z.string(), id: z.string().optional(), input: z.record(z.unknown()) }),
  z.object({ type: z.literal('tool_result'), name: z.string().optional(), tool_use_id: z.string().optional(), is_error: z.boolean().optional(), content: z.union([z.string(), z.array(z.unknown())]).optional() }),
  ControlRequestSchema,
  SessionInfoSchema,
  ResultSchema,
  SystemMessageSchema,
]);

export type CliMessage = z.infer<typeof CliMessageSchema>;

// =============================================================================
// Parser Utilities
// =============================================================================

/**
 * Safely parse a CLI message with validation
 */
export function parseCliMessage(json: unknown): { success: true; data: CliMessage } | { success: false; error: z.ZodError } {
  const result = CliMessageSchema.safeParse(json);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Parse with fallback for unknown message types
 */
export function parseCliMessageWithFallback(json: unknown): CliMessage | { type: 'unknown'; raw: unknown } {
  const result = CliMessageSchema.safeParse(json);
  if (result.success) {
    return result.data;
  }
  // Return raw data for unknown types
  if (typeof json === 'object' && json !== null && 'type' in json) {
    return { type: 'unknown', raw: json } as unknown as CliMessage;
  }
  return { type: 'unknown', raw: json } as unknown as CliMessage;
}

/**
 * Type guard for user messages
 */
export function isUserMessage(msg: unknown): msg is UserMessage {
  return UserMessageSchema.safeParse(msg).success;
}

/**
 * Type guard for assistant messages
 */
export function isAssistantMessage(msg: unknown): msg is AssistantMessage {
  return AssistantMessageSchema.safeParse(msg).success;
}

/**
 * Type guard for control requests (permission prompts)
 */
export function isControlRequest(msg: unknown): msg is ControlRequest {
  return ControlRequestSchema.safeParse(msg).success;
}

/**
 * Type guard for results
 */
export function isResult(msg: unknown): msg is Result {
  return ResultSchema.safeParse(msg).success;
}

/**
 * Type guard for session info
 */
export function isSessionInfo(msg: unknown): msg is SessionInfo {
  return SessionInfoSchema.safeParse(msg).success;
}
