/**
 * Cohort Tools
 *
 * MCP tools for Mixpanel cohort management.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all cohort-related tools
 */
export function registerCohortTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // List Cohorts
  // ===========================================================================
  server.tool(
    'mixpanel_list_cohorts',
    `List all saved cohorts in the Mixpanel project.

Cohorts are saved groups of users based on their behavior or properties.

Returns:
  Array of cohorts with their IDs, names, and metadata.`,
    {},
    async () => {
      try {
        const result = await client.listCohorts();
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
