import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const server = new McpServer({
  name: "Claude Code Permissions MCP Server",
  version: "0.0.1",
});

// Get permissions directory from environment
const PERMISSIONS_PATH = process.env.CLAUDE_PERMISSIONS_PATH;
if (!PERMISSIONS_PATH) {
  console.error("CLAUDE_PERMISSIONS_PATH environment variable not set");
  process.exit(1);
}


interface WorkspacePermissions {
  alwaysAllow: {
    [toolName: string]: boolean | string[]; // true for all, or array of allowed commands/patterns
  };
}

function getWorkspacePermissionsPath(): string | null {
  if (!PERMISSIONS_PATH) return null;
  return path.join(PERMISSIONS_PATH, 'permissions.json');
}

function loadWorkspacePermissions(): WorkspacePermissions {
  const permissionsPath = getWorkspacePermissionsPath();
  if (!permissionsPath || !fs.existsSync(permissionsPath)) {
    return { alwaysAllow: {} };
  }

  try {
    const content = fs.readFileSync(permissionsPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading workspace permissions: ${error}`);
    return { alwaysAllow: {} };
  }
}


/**
 * Escapes special regex characters in a string except for *.
 * Used to safely convert glob-like patterns to regex.
 */
function escapeRegexExceptStar(str: string): string {
  // Escape all regex special chars except *
  return str.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function isAlwaysAllowed(toolName: string, input: any): boolean {
  const permissions = loadWorkspacePermissions();
  const toolPermission = permissions.alwaysAllow[toolName];

  if (!toolPermission) return false;

  // If it's true, always allow
  if (toolPermission === true) return true;

  // If it's an array, check for specific commands (mainly for Bash)
  if (Array.isArray(toolPermission)) {
    if (toolName === 'Bash' && input.command) {
      const command = input.command.trim();
      return toolPermission.some(allowedCmd => {
        // Support exact match or pattern matching
        if (allowedCmd.includes('*')) {
          // Handle patterns like "npm i *" to match both "npm i" and "npm i something"
          const baseCommand = allowedCmd.replace(' *', '');
          if (command === baseCommand) {
            return true; // Exact match for base command
          }
          // Pattern match for command with arguments
          // Fix: Escape regex special characters before converting * to .* to prevent ReDoS
          const escapedPattern = escapeRegexExceptStar(allowedCmd);
          const pattern = escapedPattern.replace(/\*/g, '.*');
          return new RegExp(`^${pattern}$`).test(command);
        }
        return command.startsWith(allowedCmd);
      });
    }
  }

  return false;
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates that a request ID is safe and doesn't contain path traversal characters.
 * Returns true if the ID is valid, false otherwise.
 */
function isValidRequestId(requestId: string): boolean {
  // Only allow alphanumeric, underscore, and hyphen - prevents path traversal
  return /^[a-zA-Z0-9_-]{10,50}$/.test(requestId);
}

async function requestPermission(tool_name: string, input: any): Promise<{approved: boolean, reason?: string}> {
  if (!PERMISSIONS_PATH) {
    console.error("Permissions path not available");
    return { approved: false, reason: "Permissions path not configured" };
  }

  // Check if this tool/command is always allowed for this workspace
  if (isAlwaysAllowed(tool_name, input)) {
    console.error(`Tool ${tool_name} is always allowed for this workspace`);
    return { approved: true };
  }

  const requestId = generateRequestId();

  // Validate requestId to prevent path traversal (defense in depth)
  if (!isValidRequestId(requestId)) {
    console.error(`Invalid request ID generated: ${requestId}`);
    return { approved: false, reason: "Invalid request ID" };
  }

  // Use path.basename for additional safety against path traversal
  const safeId = path.basename(requestId);
  const requestFile = path.join(PERMISSIONS_PATH, `${safeId}.request`);
  const responseFile = path.join(PERMISSIONS_PATH, `${safeId}.response`);

  // Write request file
  const request = {
    id: requestId,
    tool: tool_name,
    input: input,
    timestamp: new Date().toISOString()
  };

  try {
    fs.writeFileSync(requestFile, JSON.stringify(request, null, 2));

    // Use fs.watch to wait for response file
    return new Promise<{approved: boolean, reason?: string}>((resolve) => {
      let watcher: fs.FSWatcher | null = null;
      let readErrorCount = 0;
      const MAX_READ_ERRORS = 3; // Max retries before giving up

      // Helper to clean up resources
      const cleanup = () => {
        if (watcher) {
          watcher.close();
          watcher = null;
        }
      };

      const timeout = setTimeout(() => {
        cleanup();
        // Clean up request file on timeout
        if (fs.existsSync(requestFile)) {
          fs.unlinkSync(requestFile);
        }
        console.error(`Permission request ${requestId} timed out`);
        resolve({ approved: false, reason: "Permission request timed out" });
      }, 3600000); // 1 hour timeout

      watcher = fs.watch(PERMISSIONS_PATH, (eventType, filename) => {
        if (eventType === 'rename' && filename === path.basename(responseFile)) {
          // Check if file exists (rename event can be for creation or deletion)
          if (fs.existsSync(responseFile)) {
            try {
              const responseContent = fs.readFileSync(responseFile, 'utf8');
              const response = JSON.parse(responseContent);

              // Clean up response file
              fs.unlinkSync(responseFile);

              // Clear timeout and close watcher
              clearTimeout(timeout);
              cleanup();

              resolve({
                approved: response.approved,
                reason: response.approved ? undefined : "User rejected the request"
              });
            } catch (error) {
              console.error(`Error reading response file: ${error}`);
              readErrorCount++;
              // Clean up after max retries to prevent resource leak
              if (readErrorCount >= MAX_READ_ERRORS) {
                console.error(`Max read errors reached, cleaning up watcher`);
                clearTimeout(timeout);
                cleanup();
                resolve({ approved: false, reason: "Error reading response file" });
              }
              // Otherwise continue watching in case of transient read error
            }
          }
        }
      });

      // Handle watcher errors
      watcher.on('error', (error) => {
        console.error(`File watcher error: ${error}`);
        clearTimeout(timeout);
        cleanup();
        resolve({ approved: false, reason: "File watcher error" });
      });
    });

  } catch (error) {
    console.error(`Error requesting permission: ${error}`);
    return { approved: false, reason: `Error processing permission request: ${error}` };
  }
}

server.tool(
  "approval_prompt",
  'Request user permission to execute a tool via VS Code dialog',
  {
    tool_name: z.string().describe("The name of the tool requesting permission"),
    input: z.object({}).passthrough().describe("The input for the tool"),
    tool_use_id: z.string().optional().describe("The unique tool use request ID"),
  },
  async ({ tool_name, input }) => {
    console.error(`Requesting permission for tool: ${tool_name}`);

    const permissionResult = await requestPermission(tool_name, input);

    const behavior = permissionResult.approved ? "allow" : "deny";
    console.error(`Permission ${behavior}ed for tool: ${tool_name}`);

    return {
      content: [
        {
          type: "text",
          text: behavior === "allow" ?
            JSON.stringify({
              behavior: behavior,
              updatedInput: input,
            })
            :
            JSON.stringify({
              behavior: behavior,
              message: permissionResult.reason || "Permission denied",
            })
          ,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Permissions MCP Server running on stdio`);
  console.error(`Using permissions directory: ${PERMISSIONS_PATH}`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});