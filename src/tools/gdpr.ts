/**
 * GDPR Tools
 *
 * MCP tools for Mixpanel GDPR compliance (data retrieval and deletion).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all GDPR-related tools
 */
export function registerGDPRTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // Create Data Retrieval Request
  // ===========================================================================
  server.tool(
    'mixpanel_create_data_retrieval',
    `Create a GDPR data retrieval request.

Request an export of all data for specific users.
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctIds: Array of user distinct IDs to retrieve data for
  - dataType: Type of data to retrieve (events or people)
  - completionEmail: Email to notify when retrieval is complete

Returns:
  Request ID and status.`,
    {
      distinctIds: z.array(z.string()).describe('User distinct IDs'),
      dataType: z.enum(['events', 'people']).optional().describe('Data type to retrieve'),
      completionEmail: z.string().email().optional().describe('Notification email'),
    },
    async ({ distinctIds, dataType, completionEmail }) => {
      try {
        const result = await client.createDataRetrieval(distinctIds, { dataType, completionEmail });
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Data Retrieval Status
  // ===========================================================================
  server.tool(
    'mixpanel_get_data_retrieval_status',
    `Check the status of a GDPR data retrieval request.

Requires X-Mixpanel-Project-Token header.

Args:
  - requestId: The retrieval request ID

Returns:
  Status and results (if complete).`,
    {
      requestId: z.string().describe('Retrieval request ID'),
    },
    async ({ requestId }) => {
      try {
        const result = await client.getDataRetrievalStatus(requestId);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Data Deletion Request
  // ===========================================================================
  server.tool(
    'mixpanel_create_data_deletion',
    `Create a GDPR data deletion request.

Request permanent deletion of all data for specific users.
This action is irreversible once processing begins.
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctIds: Array of user distinct IDs to delete data for

Returns:
  Request ID and status.`,
    {
      distinctIds: z.array(z.string()).describe('User distinct IDs to delete'),
    },
    async ({ distinctIds }) => {
      try {
        const result = await client.createDataDeletion(distinctIds);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Data Deletion Status
  // ===========================================================================
  server.tool(
    'mixpanel_get_data_deletion_status',
    `Check the status of a GDPR data deletion request.

Requires X-Mixpanel-Project-Token header.

Args:
  - requestId: The deletion request ID

Returns:
  Status of the deletion request.`,
    {
      requestId: z.string().describe('Deletion request ID'),
    },
    async ({ requestId }) => {
      try {
        const result = await client.getDataDeletionStatus(requestId);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Cancel Data Deletion Request
  // ===========================================================================
  server.tool(
    'mixpanel_cancel_data_deletion',
    `Cancel a pending GDPR data deletion request.

Can only cancel requests that haven't started processing yet.
Requires X-Mixpanel-Project-Token header.

Args:
  - requestId: The deletion request ID to cancel

Returns:
  Success status.`,
    {
      requestId: z.string().describe('Deletion request ID to cancel'),
    },
    async ({ requestId }) => {
      try {
        const result = await client.cancelDataDeletion(requestId);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
