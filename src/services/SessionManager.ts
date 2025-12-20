/**
 * SessionManager - Manages chat session lifecycle
 * Tracks session IDs, creation time, and metadata
 */

export interface Session {
  id: string;
  startTime: Date;
  chatName?: string;
}

export class SessionManager {
  private currentSession: Session | null = null;

  /**
   * Create a new session
   */
  createSession(chatName?: string): Session {
    this.currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      chatName
    };
    return this.currentSession;
  }

  /**
   * Get the current session
   */
  getSession(): Session | null {
    return this.currentSession;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | undefined {
    return this.currentSession?.id;
  }

  /**
   * Update the chat name for the current session
   */
  updateChatName(name: string): void {
    if (this.currentSession) {
      this.currentSession.chatName = name;
    }
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.currentSession = null;
  }

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration(): number | null {
    if (!this.currentSession) return null;
    return Date.now() - this.currentSession.startTime.getTime();
  }
}
