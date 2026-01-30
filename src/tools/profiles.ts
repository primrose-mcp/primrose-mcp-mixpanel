/**
 * Profile Tools
 *
 * MCP tools for Mixpanel user profile management (query and update).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { MixpanelClient } from '../client.js';
import { formatResponse, formatErrorResponse } from '../utils/formatters.js';

/**
 * Register all profile-related tools
 */
export function registerProfileTools(server: McpServer, client: MixpanelClient): void {
  // ===========================================================================
  // Query Profiles
  // ===========================================================================
  server.tool(
    'mixpanel_query_profiles',
    `Query user profiles from Mixpanel.

Args:
  - where: Filter expression (e.g., properties["$country_code"] == "US")
  - sessionId: Session ID for pagination (from previous response)
  - page: Page number for pagination
  - outputProperties: List of properties to include in response

Returns:
  Paginated list of user profiles with their properties.`,
    {
      where: z.string().optional().describe('Filter expression'),
      sessionId: z.string().optional().describe('Session ID for pagination'),
      page: z.number().optional().describe('Page number'),
      outputProperties: z.array(z.string()).optional().describe('Properties to include'),
    },
    async (params) => {
      try {
        const result = await client.queryProfiles(params);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Profile
  // ===========================================================================
  server.tool(
    'mixpanel_get_profile',
    `Get a single user profile by distinct_id.

Args:
  - distinctId: The user's distinct ID

Returns:
  User profile with all properties.`,
    {
      distinctId: z.string().describe('User distinct ID'),
    },
    async ({ distinctId }) => {
      try {
        const result = await client.getProfile(distinctId);
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Get Profile Activity
  // ===========================================================================
  server.tool(
    'mixpanel_get_profile_activity',
    `Get recent event activity for a user profile.

Args:
  - distinctId: The user's distinct ID
  - limit: Maximum number of events to return
  - from: Unix timestamp for start of range
  - to: Unix timestamp for end of range

Returns:
  List of recent events for the user.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      limit: z.number().optional().describe('Maximum events to return'),
      from: z.number().optional().describe('Start timestamp (Unix)'),
      to: z.number().optional().describe('End timestamp (Unix)'),
    },
    async ({ distinctId, limit, from, to }) => {
      try {
        const result = await client.getProfileActivity(distinctId, { limit, from, to });
        return formatResponse(result);
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Set Profile Properties
  // ===========================================================================
  server.tool(
    'mixpanel_set_profile_properties',
    `Set properties on a user profile. Overwrites existing values.

Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - properties: Object of properties to set

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      properties: z.record(z.string(), z.unknown()).describe('Properties to set'),
    },
    async ({ distinctId, properties }) => {
      try {
        const result = await client.setProfileProperties(distinctId, properties as Record<string, unknown>);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Set Profile Properties Once
  // ===========================================================================
  server.tool(
    'mixpanel_set_profile_properties_once',
    `Set properties on a user profile only if they don't already exist.

Useful for setting properties like "First Seen" or "Sign Up Date".
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - properties: Object of properties to set (only if not already set)

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      properties: z.record(z.string(), z.unknown()).describe('Properties to set if not existing'),
    },
    async ({ distinctId, properties }) => {
      try {
        const result = await client.setProfilePropertiesOnce(distinctId, properties as Record<string, unknown>);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Increment Profile Properties
  // ===========================================================================
  server.tool(
    'mixpanel_increment_profile_properties',
    `Increment numeric properties on a user profile.

Useful for counters like "Login Count" or "Purchase Count".
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - properties: Object of numeric properties to increment

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      properties: z.record(z.string(), z.number()).describe('Properties to increment (property: amount)'),
    },
    async ({ distinctId, properties }) => {
      try {
        const result = await client.incrementProfileProperties(distinctId, properties as Record<string, number>);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Append to Profile List
  // ===========================================================================
  server.tool(
    'mixpanel_append_to_profile_list',
    `Append values to a list property on a user profile.

Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - property: Name of the list property
  - values: Array of values to append

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      property: z.string().describe('List property name'),
      values: z.array(z.unknown()).describe('Values to append'),
    },
    async ({ distinctId, property, values }) => {
      try {
        const result = await client.appendToProfileList(distinctId, property, values);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Remove from Profile List
  // ===========================================================================
  server.tool(
    'mixpanel_remove_from_profile_list',
    `Remove values from a list property on a user profile.

Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - property: Name of the list property
  - values: Array of values to remove

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      property: z.string().describe('List property name'),
      values: z.array(z.unknown()).describe('Values to remove'),
    },
    async ({ distinctId, property, values }) => {
      try {
        const result = await client.removeFromProfileList(distinctId, property, values);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Union to Profile List
  // ===========================================================================
  server.tool(
    'mixpanel_union_to_profile_list',
    `Add values to list properties only if they don't already exist (set union).

Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - properties: Object mapping list property names to arrays of values

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      properties: z.record(z.string(), z.array(z.unknown())).describe('Properties with values to union'),
    },
    async ({ distinctId, properties }) => {
      try {
        const result = await client.unionToProfileList(distinctId, properties as Record<string, unknown[]>);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Unset Profile Properties
  // ===========================================================================
  server.tool(
    'mixpanel_unset_profile_properties',
    `Remove properties from a user profile.

Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID
  - properties: Array of property names to remove

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID'),
      properties: z.array(z.string()).describe('Property names to remove'),
    },
    async ({ distinctId, properties }) => {
      try {
        const result = await client.unsetProfileProperties(distinctId, properties);
        return formatResponse({ success: result.status === 1, ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );

  // ===========================================================================
  // Delete Profile
  // ===========================================================================
  server.tool(
    'mixpanel_delete_profile',
    `Delete a user profile entirely.

This permanently removes the profile and all its properties.
Requires X-Mixpanel-Project-Token header.

Args:
  - distinctId: The user's distinct ID

Returns:
  Status of the operation.`,
    {
      distinctId: z.string().describe('User distinct ID to delete'),
    },
    async ({ distinctId }) => {
      try {
        const result = await client.deleteProfile(distinctId);
        return formatResponse({ success: result.status === 1, message: 'Profile deleted', ...result });
      } catch (error) {
        return formatErrorResponse(error);
      }
    }
  );
}
