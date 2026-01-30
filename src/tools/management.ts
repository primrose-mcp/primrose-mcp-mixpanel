/**
 * Management Tools
 *
 * MCP tools for Mixpanel project management (annotations, lookup tables, schemas).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all management-related tools
 */
export function registerManagementTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // List Annotations
  // ===========================================================================
  server.tool(
    'mixpanel_list_annotations',
    `List annotations in the Mixpanel project.

Annotations mark significant events like releases, campaigns, etc.

Args:
  - fromDate: Start date filter (YYYY-MM-DD)
  - toDate: End date filter (YYYY-MM-DD)

Returns:
  Array of annotations.`,
    {
      fromDate: z.string().optional().describe('Start date filter (YYYY-MM-DD)'),
      toDate: z.string().optional().describe('End date filter (YYYY-MM-DD)'),
    },
    async (params) => {
      try {
        const result = await client.listAnnotations(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create Annotation
  // ===========================================================================
  server.tool(
    'mixpanel_create_annotation',
    `Create an annotation to mark a significant event.

Annotations appear on charts to help explain data changes.

Args:
  - date: Date for the annotation (YYYY-MM-DD)
  - description: Description of the event

Returns:
  The created annotation.`,
    {
      date: z.string().describe('Date (YYYY-MM-DD)'),
      description: z.string().describe('Annotation description'),
    },
    async (params) => {
      try {
        const result = await client.createAnnotation(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Annotation
  // ===========================================================================
  server.tool(
    'mixpanel_get_annotation',
    `Get a specific annotation by ID.

Args:
  - annotationId: The annotation ID

Returns:
  The annotation details.`,
    {
      annotationId: z.number().describe('Annotation ID'),
    },
    async ({ annotationId }) => {
      try {
        const result = await client.getAnnotation(annotationId);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Update Annotation
  // ===========================================================================
  server.tool(
    'mixpanel_update_annotation',
    `Update an existing annotation.

Args:
  - annotationId: The annotation ID
  - date: New date (YYYY-MM-DD, optional)
  - description: New description (optional)

Returns:
  The updated annotation.`,
    {
      annotationId: z.number().describe('Annotation ID'),
      date: z.string().optional().describe('New date (YYYY-MM-DD)'),
      description: z.string().optional().describe('New description'),
    },
    async ({ annotationId, date, description }) => {
      try {
        const result = await client.updateAnnotation(annotationId, { date, description });
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Annotation
  // ===========================================================================
  server.tool(
    'mixpanel_delete_annotation',
    `Delete an annotation.

Args:
  - annotationId: The annotation ID to delete

Returns:
  Success status.`,
    {
      annotationId: z.number().describe('Annotation ID to delete'),
    },
    async ({ annotationId }) => {
      try {
        const result = await client.deleteAnnotation(annotationId);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Lookup Tables
  // ===========================================================================
  server.tool(
    'mixpanel_list_lookup_tables',
    `List all lookup tables in the project.

Lookup tables allow you to enrich event data with additional context.

Returns:
  Array of lookup tables with their names and metadata.`,
    {},
    async () => {
      try {
        const result = await client.listLookupTables();
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create/Replace Lookup Table
  // ===========================================================================
  server.tool(
    'mixpanel_create_lookup_table',
    `Create or replace a lookup table.

Lookup tables enrich event data with additional context.
The first column is used as the join key.

Args:
  - tableName: Name of the lookup table
  - data: Array of objects representing table rows

Returns:
  Status of the operation.`,
    {
      tableName: z.string().describe('Lookup table name'),
      data: z.array(z.record(z.string(), z.unknown())).describe('Array of row objects'),
    },
    async ({ tableName, data }) => {
      try {
        const result = await client.createOrReplaceLookupTable(tableName, data);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // List Schemas
  // ===========================================================================
  server.tool(
    'mixpanel_list_schemas',
    `List data schemas (Lexicon) in the project.

Schemas define the structure and metadata for events, profiles, and groups.

Args:
  - entityType: Type of schema (event, profile, group, lookup_table)

Returns:
  Array of schemas.`,
    {
      entityType: z
        .enum(['event', 'profile', 'group', 'lookup_table'])
        .optional()
        .describe('Schema type to list'),
    },
    async ({ entityType }) => {
      try {
        const result = await client.listSchemas(entityType);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Schema
  // ===========================================================================
  server.tool(
    'mixpanel_get_schema',
    `Get a specific schema definition.

Args:
  - entityType: Type of schema (event, profile, group, lookup_table)
  - name: Name of the schema

Returns:
  The schema definition.`,
    {
      entityType: z.enum(['event', 'profile', 'group', 'lookup_table']).describe('Schema type'),
      name: z.string().describe('Schema name'),
    },
    async ({ entityType, name }) => {
      try {
        const result = await client.getSchema(entityType, name);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Create/Update Schema
  // ===========================================================================
  server.tool(
    'mixpanel_create_schema',
    `Create or update a schema definition.

Schemas help document and validate your tracking plan.

Args:
  - entityType: Type of schema (event, profile, group, lookup_table)
  - name: Name of the schema
  - schemaJson: Schema definition object

Returns:
  Success status.`,
    {
      entityType: z.enum(['event', 'profile', 'group', 'lookup_table']).describe('Schema type'),
      name: z.string().describe('Schema name'),
      schemaJson: z.record(z.string(), z.unknown()).describe('Schema definition'),
    },
    async ({ entityType, name, schemaJson }) => {
      try {
        const result = await client.createOrUpdateSchema(entityType, name, schemaJson);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Schema
  // ===========================================================================
  server.tool(
    'mixpanel_delete_schema',
    `Delete a schema definition.

Args:
  - entityType: Type of schema (event, profile, group, lookup_table)
  - name: Name of the schema to delete

Returns:
  Success status.`,
    {
      entityType: z.enum(['event', 'profile', 'group', 'lookup_table']).describe('Schema type'),
      name: z.string().describe('Schema name to delete'),
    },
    async ({ entityType, name }) => {
      try {
        const result = await client.deleteSchema(entityType, name);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
