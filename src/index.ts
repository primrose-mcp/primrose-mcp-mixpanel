/**
 * Mixpanel MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 * It provides comprehensive access to Mixpanel's APIs including:
 * - Query API (insights, funnels, retention, segmentation)
 * - Ingestion API (track events, user profiles, groups)
 * - Data Export API (raw event export)
 * - Management API (cohorts, annotations, schemas, lookup tables)
 * - GDPR API (data retrieval and deletion)
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials are parsed from request headers, allowing a single
 * server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-Mixpanel-Service-Account-Username: Service account username
 * - X-Mixpanel-Service-Account-Secret: Service account secret
 * - X-Mixpanel-Project-Id: Mixpanel project ID
 *
 * Optional Headers:
 * - X-Mixpanel-Project-Token: Project token (for ingestion API)
 * - X-Mixpanel-EU-Resident: Set to "true" for EU data residency
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createMixpanelClient } from './client.js';
import {
  registerAnalyticsTools,
  registerFunnelTools,
  registerProfileTools,
  registerEventTools,
  registerGroupTools,
  registerIdentityTools,
  registerCohortTools,
  registerManagementTools,
  registerGDPRTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-mixpanel';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode instead.
 * The stateful McpAgent is better suited for single-tenant deployments where
 * credentials can be stored as wrangler secrets.
 */
export class MixpanelMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with credential headers instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides credentials via headers, allowing
 * a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createMixpanelClient(credentials);

  // Register all tool categories
  registerAnalyticsTools(server, client);
  registerFunnelTools(server, client);
  registerProfileTools(server, client);
  registerEventTools(server, client);
  registerGroupTools(server, client);
  registerIdentityTools(server, client);
  registerCohortTools(server, client);
  registerManagementTools(server, client);
  registerGDPRTools(server, client);

  // Test connection tool
  server.tool(
    'mixpanel_test_connection',
    'Test the connection to the Mixpanel API',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Stateless MCP with Streamable HTTP (Recommended for multi-tenant)
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: [
              'X-Mixpanel-Service-Account-Username',
              'X-Mixpanel-Service-Account-Secret',
              'X-Mixpanel-Project-Id',
            ],
            optional_headers: [
              'X-Mixpanel-Project-Token (for ingestion API)',
              'X-Mixpanel-EU-Resident (set to "true" for EU)',
            ],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Mixpanel MCP Server - Multi-tenant analytics API',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          required_headers: {
            'X-Mixpanel-Service-Account-Username': 'Service account username',
            'X-Mixpanel-Service-Account-Secret': 'Service account secret',
            'X-Mixpanel-Project-Id': 'Mixpanel project ID',
          },
          optional_headers: {
            'X-Mixpanel-Project-Token': 'Project token (required for ingestion/tracking)',
            'X-Mixpanel-EU-Resident': 'Set to "true" for EU data residency',
          },
        },
        tools: {
          analytics: [
            'mixpanel_query_insights',
            'mixpanel_query_segmentation',
            'mixpanel_query_segmentation_numeric',
            'mixpanel_query_segmentation_sum',
            'mixpanel_query_segmentation_average',
            'mixpanel_get_top_events',
            'mixpanel_get_event_names',
            'mixpanel_query_events',
            'mixpanel_get_event_properties',
            'mixpanel_get_property_values',
            'mixpanel_get_top_property_values',
            'mixpanel_execute_jql',
          ],
          funnels: [
            'mixpanel_list_funnels',
            'mixpanel_get_funnel',
            'mixpanel_get_retention',
            'mixpanel_get_frequency',
          ],
          profiles: [
            'mixpanel_query_profiles',
            'mixpanel_get_profile',
            'mixpanel_get_profile_activity',
            'mixpanel_set_profile_properties',
            'mixpanel_set_profile_properties_once',
            'mixpanel_increment_profile_properties',
            'mixpanel_append_to_profile_list',
            'mixpanel_remove_from_profile_list',
            'mixpanel_union_to_profile_list',
            'mixpanel_unset_profile_properties',
            'mixpanel_delete_profile',
          ],
          events: [
            'mixpanel_export_events',
            'mixpanel_track_event',
            'mixpanel_track_events',
            'mixpanel_import_events',
          ],
          groups: [
            'mixpanel_set_group_properties',
            'mixpanel_set_group_properties_once',
            'mixpanel_unset_group_properties',
            'mixpanel_delete_group',
          ],
          identity: [
            'mixpanel_create_identity',
            'mixpanel_create_alias',
            'mixpanel_merge_identities',
          ],
          cohorts: ['mixpanel_list_cohorts'],
          management: [
            'mixpanel_list_annotations',
            'mixpanel_create_annotation',
            'mixpanel_get_annotation',
            'mixpanel_update_annotation',
            'mixpanel_delete_annotation',
            'mixpanel_list_lookup_tables',
            'mixpanel_create_lookup_table',
            'mixpanel_list_schemas',
            'mixpanel_get_schema',
            'mixpanel_create_schema',
            'mixpanel_delete_schema',
          ],
          gdpr: [
            'mixpanel_create_data_retrieval',
            'mixpanel_get_data_retrieval_status',
            'mixpanel_create_data_deletion',
            'mixpanel_get_data_deletion_status',
            'mixpanel_cancel_data_deletion',
          ],
          connection: ['mixpanel_test_connection'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
