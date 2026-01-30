/**
 * Group Tools
 *
 * MCP tools for Mixpanel group analytics (B2B/account-level tracking).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all group-related tools
 */
export function registerGroupTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // Set Group Properties
  // ===========================================================================
  server.tool(
    'mixpanel_set_group_properties',
    `Set properties on a group profile.

Groups are used for B2B/account-level analytics (e.g., companies, workspaces).
Requires X-Mixpanel-Project-Token header.

Args:
  - groupKey: The group key (e.g., "company", "workspace")
  - groupId: The group ID (e.g., "acme-corp")
  - properties: Object of properties to set

Returns:
  Status of the operation.`,
    {
      groupKey: z.string().describe('Group key (e.g., "company")'),
      groupId: z.string().describe('Group ID'),
      properties: z.record(z.string(), z.unknown()).describe('Properties to set'),
    },
    async ({ groupKey, groupId, properties }) => {
      try {
        const result = await client.setGroupProperties(groupKey, groupId, properties);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Set Group Properties Once
  // ===========================================================================
  server.tool(
    'mixpanel_set_group_properties_once',
    `Set properties on a group profile only if they don't already exist.

Requires X-Mixpanel-Project-Token header.

Args:
  - groupKey: The group key (e.g., "company")
  - groupId: The group ID
  - properties: Object of properties to set if not existing

Returns:
  Status of the operation.`,
    {
      groupKey: z.string().describe('Group key'),
      groupId: z.string().describe('Group ID'),
      properties: z.record(z.string(), z.unknown()).describe('Properties to set if not existing'),
    },
    async ({ groupKey, groupId, properties }) => {
      try {
        const result = await client.setGroupPropertiesOnce(groupKey, groupId, properties);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Unset Group Properties
  // ===========================================================================
  server.tool(
    'mixpanel_unset_group_properties',
    `Remove properties from a group profile.

Requires X-Mixpanel-Project-Token header.

Args:
  - groupKey: The group key
  - groupId: The group ID
  - properties: Array of property names to remove

Returns:
  Status of the operation.`,
    {
      groupKey: z.string().describe('Group key'),
      groupId: z.string().describe('Group ID'),
      properties: z.array(z.string()).describe('Property names to remove'),
    },
    async ({ groupKey, groupId, properties }) => {
      try {
        const result = await client.unsetGroupProperties(groupKey, groupId, properties);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Group
  // ===========================================================================
  server.tool(
    'mixpanel_delete_group',
    `Delete a group profile entirely.

Requires X-Mixpanel-Project-Token header.

Args:
  - groupKey: The group key
  - groupId: The group ID

Returns:
  Status of the operation.`,
    {
      groupKey: z.string().describe('Group key'),
      groupId: z.string().describe('Group ID to delete'),
    },
    async ({ groupKey, groupId }) => {
      try {
        const result = await client.deleteGroup(groupKey, groupId);
        return formatResponse({ success: result.status === 1, message: 'Group deleted', ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
