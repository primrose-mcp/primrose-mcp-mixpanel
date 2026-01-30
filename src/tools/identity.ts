/**
 * Identity Tools
 *
 * MCP tools for Mixpanel identity management (linking users, aliases, merging).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all identity-related tools
 */
export function registerIdentityTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // Create Identity
  // ===========================================================================
  server.tool(
    'mixpanel_create_identity',
    `Link an anonymous user ID to an identified user ID.

Use this when a user logs in or signs up to connect their anonymous activity
to their identified profile.
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The identified user ID (e.g., user ID from your database)
  - anonId: The anonymous ID (e.g., device ID before login)

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('Identified user ID'),
      anonId: z.string().describe('Anonymous user ID to link'),
    },
    async ({ distinctId, anonId }) => {
      try {
        const result = await client.createIdentity(distinctId, anonId);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Alias
  // ===========================================================================
  server.tool(
    'mixpanel_create_alias',
    `Create an alias for a user (legacy identity management).

Note: For new projects, use mixpanel_create_identity instead.
Aliases allow you to associate multiple IDs with the same user.
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The primary distinct ID
  - alias: The alias to create

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('Primary distinct ID'),
      alias: z.string().describe('Alias to create'),
    },
    async ({ distinctId, alias }) => {
      try {
        const result = await client.createAlias(distinctId, alias);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Merge Identities
  // ===========================================================================
  server.tool(
    'mixpanel_merge_identities',
    `Merge two user identities into one.

All events and profile data from both IDs will be combined.
This is useful when you discover two IDs belong to the same person.
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId1: First distinct ID
  - distinctId2: Second distinct ID

Returns:
  Status of the operation.`,
    {
      distinctId1: z.string().describe('First distinct ID'),
      distinctId2: z.string().describe('Second distinct ID to merge'),
    },
    async ({ distinctId1, distinctId2 }) => {
      try {
        const result = await client.mergeIdentities(distinctId1, distinctId2);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
