/**
 * Application-wide constants
 *
 * Centralizes magic numbers and configuration values for easier maintenance.
 */

// =============================================================================
// Timeouts
// =============================================================================

/** 1 hour timeout in milliseconds (for permission requests, etc.) */
export const TIMEOUT_1HR_MS = 3600000;

/** Small delay for UI operations in milliseconds */
export const UI_DELAY_MS = 50;

/** Timeout before conversation history load in milliseconds */
export const CONVERSATION_LOAD_DELAY_MS = 100;

// =============================================================================
// String Truncation Limits
// =============================================================================

/** Maximum length for message truncation (commit messages, filenames) */
export const MAX_MESSAGE_TRUNCATE_LENGTH = 50;

/** Maximum length for tool input value truncation in display */
export const MAX_VALUE_TRUNCATE_LENGTH = 97;

/** Maximum length for content display before "Read more" truncation */
export const MAX_CONTENT_DISPLAY_LENGTH = 400;

/** Maximum length for first user message in conversation index */
export const MAX_INDEX_MESSAGE_LENGTH = 100;

// =============================================================================
// Storage Limits
// =============================================================================

/** Maximum number of conversations to keep in index */
export const MAX_CONVERSATIONS_STORED = 50;

/** Maximum number of backup commits to keep in memory */
export const MAX_COMMITS_STORED = 50;

/** Maximum workspace files to return in search */
export const MAX_WORKSPACE_FILES = 500;

/** Maximum workspace files to display after filtering */
export const MAX_WORKSPACE_FILES_DISPLAY = 50;

// =============================================================================
// Diff Algorithm Limits
// =============================================================================

/** Maximum lines for diff computation before showing "too large" message */
export const MAX_DIFF_LINES = 1000;

/** Maximum lines to show in collapsed diff view */
export const MAX_DIFF_DISPLAY_LINES = 6;

// =============================================================================
// Permission/Retry Limits
// =============================================================================

/** Maximum read errors before giving up on permission response file */
export const MAX_PERMISSION_READ_ERRORS = 3;

// =============================================================================
// Request ID Validation
// =============================================================================

/** Minimum length for valid request IDs */
export const MIN_REQUEST_ID_LENGTH = 10;

/** Maximum length for valid request IDs */
export const MAX_REQUEST_ID_LENGTH = 50;
