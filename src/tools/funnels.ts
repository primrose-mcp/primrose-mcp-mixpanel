/**
 * Funnel Tools
 *
 * MCP tools for Mixpanel funnel analysis and retention queries.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all funnel and retention related tools
 */
export function registerFunnelTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // List Funnels
  // ===========================================================================
  server.tool(
    'mixpanel_list_funnels',
    `List all saved funnels in the Mixpanel project.

Returns:
  Array of funnels with their IDs and names.`,
    {},
    async () => {
      try {
        const result = await client.listFunnels();
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Funnel
  // ===========================================================================
  server.tool(
    'mixpanel_get_funnel',
    `Get conversion data for a saved funnel.

Args:
  - funnelId: ID of the saved funnel
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - interval: Time interval for grouping (day, week, month)
  - length: Conversion window length
  - lengthUnit: Conversion window unit (day, hour, minute, week)

Returns:
  Funnel conversion data with step-by-step metrics.`,
    {
      funnelId: z.number().describe('Funnel ID'),
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      interval: z.enum(['day', 'week', 'month']).optional().describe('Time interval'),
      length: z.number().optional().describe('Conversion window length'),
      lengthUnit: z.enum(['day', 'hour', 'minute', 'week']).optional().describe('Conversion window unit'),
    },
    async ({ funnelId, fromDate, toDate, interval, length, lengthUnit }) => {
      try {
        const result = await client.getFunnel(funnelId, {
          fromDate,
          toDate,
          interval,
          length,
          lengthUnit,
        });
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Retention
  // ===========================================================================
  server.tool(
    'mixpanel_get_retention',
    `Get retention cohort data.

Analyze how many users who performed a "born" event return to perform another event.

Args:
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - bornEvent: Event that defines the cohort (when users are "born")
  - event: Return event to track
  - retentionType: 'birth' (classic) or 'compounding' (rolling)
  - interval: Days between retention periods
  - intervalCount: Number of retention periods
  - unit: Time unit (day, week, month)

Returns:
  Retention data showing percent of users returning over time.`,
    {
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      bornEvent: z.string().optional().describe('Event that defines the cohort'),
      event: z.string().optional().describe('Return event to track'),
      retentionType: z.enum(['birth', 'compounding']).optional().describe('Retention type'),
      interval: z.number().optional().describe('Days between retention periods'),
      intervalCount: z.number().optional().describe('Number of retention periods'),
      unit: z.enum(['day', 'week', 'month']).optional().describe('Time unit'),
    },
    async (params) => {
      try {
        const result = await client.getRetention(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Frequency
  // ===========================================================================
  server.tool(
    'mixpanel_get_frequency',
    `Get frequency analysis for an event.

Shows how often users perform an event within the time period.

Args:
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - event: Event name to analyze
  - where: Filter expression
  - on: Property to segment by

Returns:
  Frequency distribution data.`,
    {
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      event: z.string().describe('Event name to analyze'),
      where: z.string().optional().describe('Filter expression'),
      on: z.string().optional().describe('Property to segment by'),
    },
    async (params) => {
      try {
        const result = await client.getFrequency(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
