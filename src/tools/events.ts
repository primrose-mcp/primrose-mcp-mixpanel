/**
 * Event Tools
 *
 * MCP tools for Mixpanel event tracking and export.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all event-related tools
 */
export function registerEventTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // Export Events
  // ===========================================================================
  server.tool(
    'mixpanel_export_events',
    `Export raw event data from Mixpanel.

Returns individual events with all properties. Useful for detailed analysis.

Args:
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - event: Array of event names to filter (optional)
  - where: Filter expression (optional)
  - limit: Maximum number of events to return

Returns:
  Array of raw events with their properties.`,
    {
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      event: z.array(z.string()).optional().describe('Event names to filter'),
      where: z.string().optional().describe('Filter expression'),
      limit: z.number().optional().describe('Maximum events to return'),
    },
    async (params) => {
      try {
        const result = await client.exportEvents(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Track Event
  // ===========================================================================
  server.tool(
    'mixpanel_track_event',
    `Track a single event to Mixpanel.

Requires X-Mixpanel-Project-Token header.

Args:
  - event: Event name
  - distinctId: User distinct ID
  - properties: Additional event properties (optional)
  - time: Unix timestamp (optional, defaults to now)

Returns:
  Status of the tracking operation.`,
    {
      event: z.string().describe('Event name'),
      distinctId: z.string().describe('User distinct ID'),
      properties: z.record(z.string(), z.unknown()).optional().describe('Additional event properties'),
      time: z.number().optional().describe('Unix timestamp'),
    },
    async (params) => {
      try {
        const result = await client.trackEvent(params);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Track Multiple Events
  // ===========================================================================
  server.tool(
    'mixpanel_track_events',
    `Track multiple events to Mixpanel in a single request.

Requires X-Mixpanel-Project-Token header.

Args:
  - events: Array of events, each with:
    - event: Event name
    - properties: Object with distinct_id and optional properties/time

Returns:
  Status of the tracking operation.`,
    {
      events: z
        .array(
          z.object({
            event: z.string().describe('Event name'),
            properties: z
              .object({
                distinct_id: z.string().describe('User distinct ID'),
                time: z.number().optional().describe('Unix timestamp'),
              })
              .passthrough()
              .describe('Event properties'),
          })
        )
        .describe('Array of events to track'),
    },
    async ({ events }) => {
      try {
        const result = await client.trackEvents(events);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Import Events (Historical)
  // ===========================================================================
  server.tool(
    'mixpanel_import_events',
    `Import historical events to Mixpanel.

Use this for backfilling historical data. Events must have a time property.
Requires X-Mixpanel-Project-Token header.

Args:
  - events: Array of events, each with:
    - event: Event name
    - properties: Object with distinct_id, time, and optional $insert_id

Returns:
  Import status with count of records imported.`,
    {
      events: z
        .array(
          z.object({
            event: z.string().describe('Event name'),
            properties: z
              .object({
                distinct_id: z.string().describe('User distinct ID'),
                time: z.number().describe('Unix timestamp (required for imports)'),
                $insert_id: z.string().optional().describe('Unique ID for deduplication'),
              })
              .passthrough()
              .describe('Event properties'),
          })
        )
        .describe('Array of events to import'),
    },
    async ({ events }) => {
      try {
        const result = await client.importEvents(events);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
