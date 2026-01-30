/**
 * Analytics Tools
 *
 * MCP tools for Mixpanel analytics queries (insights, segmentation, events).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all analytics-related tools
 */
export function registerAnalyticsTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // Query Insights
  // ===========================================================================
  server.tool(
    'mixpanel_query_insights',
    `Query event analytics from Mixpanel (counts, trends, breakdowns).

Args:
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - event: Event name to query (optional, queries all if not specified)
  - groupBy: Properties to group by (optional)
  - where: Filter expression (optional)
  - interval: Time interval (minute, hour, day, week, month)

Returns:
  Time series data with event counts grouped by the specified dimensions.`,
    {
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      event: z.string().optional().describe('Event name to query'),
      groupBy: z.array(z.string()).optional().describe('Properties to group by'),
      where: z.string().optional().describe('Filter expression (e.g., properties["country"] == "US")'),
      interval: z
        .enum(['minute', 'hour', 'day', 'week', 'month'])
        .optional()
        .describe('Time interval for grouping'),
    },
    async (params) => {
      try {
        const result = await client.queryInsights(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Query Segmentation
  // ===========================================================================
  server.tool(
    'mixpanel_query_segmentation',
    `Query segmentation data for an event, optionally broken down by a property.

Args:
  - event: Event name to segment
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - type: Query type (general, unique, average)
  - unit: Time unit (minute, hour, day, week, month)
  - where: Filter expression
  - on: Property to segment by

Returns:
  Segmented event data over time.`,
    {
      event: z.string().describe('Event name to segment'),
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      type: z.enum(['general', 'unique', 'average']).optional().describe('Query type'),
      unit: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().describe('Time unit'),
      where: z.string().optional().describe('Filter expression'),
      on: z.string().optional().describe('Property to segment by (e.g., properties["browser"])'),
    },
    async (params) => {
      try {
        const result = await client.querySegmentation(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Query Segmentation Numeric
  // ===========================================================================
  server.tool(
    'mixpanel_query_segmentation_numeric',
    `Query segmentation data with numeric bucketing for a property.

Args:
  - event: Event name
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - on: Numeric property to bucket
  - buckets: Number of buckets (optional)
  - type: Query type (general, unique, average)
  - where: Filter expression

Returns:
  Segmented data with numeric buckets.`,
    {
      event: z.string().describe('Event name'),
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      on: z.string().describe('Numeric property to bucket'),
      buckets: z.number().optional().describe('Number of buckets'),
      type: z.enum(['general', 'unique', 'average']).optional().describe('Query type'),
      unit: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().describe('Time unit'),
      where: z.string().optional().describe('Filter expression'),
    },
    async (params) => {
      try {
        const result = await client.querySegmentationNumeric(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Query Segmentation Sum
  // ===========================================================================
  server.tool(
    'mixpanel_query_segmentation_sum',
    `Query the sum of a numeric property for an event over time.

Args:
  - event: Event name
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - on: Numeric property to sum
  - where: Filter expression

Returns:
  Sum of the property value over time.`,
    {
      event: z.string().describe('Event name'),
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      on: z.string().describe('Numeric property to sum'),
      unit: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().describe('Time unit'),
      where: z.string().optional().describe('Filter expression'),
    },
    async (params) => {
      try {
        const result = await client.querySegmentationSum(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Query Segmentation Average
  // ===========================================================================
  server.tool(
    'mixpanel_query_segmentation_average',
    `Query the average of a numeric property for an event over time.

Args:
  - event: Event name
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - on: Numeric property to average
  - where: Filter expression

Returns:
  Average of the property value over time.`,
    {
      event: z.string().describe('Event name'),
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      on: z.string().describe('Numeric property to average'),
      unit: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().describe('Time unit'),
      where: z.string().optional().describe('Filter expression'),
    },
    async (params) => {
      try {
        const result = await client.querySegmentationAverage(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Top Events
  // ===========================================================================
  server.tool(
    'mixpanel_get_top_events',
    `Get the top events by volume for the current day.

Args:
  - type: Query type (general = total, unique = unique users, average = per user)
  - limit: Maximum number of events to return

Returns:
  List of top events with counts and percent change.`,
    {
      type: z.enum(['general', 'average', 'unique']).describe('Query type'),
      limit: z.number().optional().describe('Maximum number of events to return (default: 10)'),
    },
    async (params) => {
      try {
        const result = await client.getTopEvents(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Event Names
  // ===========================================================================
  server.tool(
    'mixpanel_get_event_names',
    `Get a list of event names in the project.

Args:
  - type: Query type (general or unique)
  - limit: Maximum number of events to return

Returns:
  List of event names.`,
    {
      type: z.enum(['general', 'unique']).describe('Query type'),
      limit: z.number().optional().describe('Maximum number of events (default: 255)'),
    },
    async (params) => {
      try {
        const result = await client.getEventNames(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Query Events
  // ===========================================================================
  server.tool(
    'mixpanel_query_events',
    `Query aggregate event counts over a time range.

Args:
  - event: Array of event names to query
  - fromDate: Start date (YYYY-MM-DD)
  - toDate: End date (YYYY-MM-DD)
  - type: Query type (general, unique, average)
  - unit: Time unit
  - where: Filter expression

Returns:
  Event counts grouped by time.`,
    {
      event: z.array(z.string()).describe('Event names to query'),
      fromDate: z.string().describe('Start date (YYYY-MM-DD)'),
      toDate: z.string().describe('End date (YYYY-MM-DD)'),
      type: z.enum(['general', 'unique', 'average']).describe('Query type'),
      unit: z.enum(['minute', 'hour', 'day', 'week', 'month']).optional().describe('Time unit'),
      interval: z.number().optional().describe('Interval count'),
      where: z.string().optional().describe('Filter expression'),
    },
    async (params) => {
      try {
        const result = await client.queryEvents(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Event Properties
  // ===========================================================================
  server.tool(
    'mixpanel_get_event_properties',
    `Get the top properties for an event.

Args:
  - eventName: Name of the event

Returns:
  List of property names for the event.`,
    {
      eventName: z.string().describe('Event name'),
    },
    async ({ eventName }) => {
      try {
        const result = await client.getEventProperties(eventName);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Property Values
  // ===========================================================================
  server.tool(
    'mixpanel_get_property_values',
    `Get distinct values for an event property.

Args:
  - event: Event name
  - property: Property name
  - limit: Maximum number of values to return

Returns:
  List of distinct property values.`,
    {
      event: z.string().describe('Event name'),
      property: z.string().describe('Property name'),
      limit: z.number().optional().describe('Maximum number of values (default: 100)'),
    },
    async ({ event, property, limit }) => {
      try {
        const result = await client.getPropertyValues(event, property, { limit });
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Top Property Values
  // ===========================================================================
  server.tool(
    'mixpanel_get_top_property_values',
    `Get the top values for an event property with counts.

Args:
  - event: Event name
  - property: Property name
  - limit: Maximum number of values to return

Returns:
  List of property values with their counts.`,
    {
      event: z.string().describe('Event name'),
      property: z.string().describe('Property name'),
      limit: z.number().optional().describe('Maximum number of values (default: 100)'),
    },
    async ({ event, property, limit }) => {
      try {
        const result = await client.getTopPropertyValues(event, property, { limit });
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Execute JQL
  // ===========================================================================
  server.tool(
    'mixpanel_execute_jql',
    `Execute a JQL (JavaScript Query Language) query against Mixpanel data.

JQL allows complex, custom queries using JavaScript-like syntax.
See Mixpanel JQL documentation for query syntax.

Args:
  - script: JQL script to execute

Returns:
  Query results.`,
    {
      script: z.string().describe('JQL script to execute'),
    },
    async ({ script }) => {
      try {
        const result = await client.executeJQL(script);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
