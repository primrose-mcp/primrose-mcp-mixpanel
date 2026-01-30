# Mixpanel MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/mixpanel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for the Mixpanel API. This server enables AI assistants to interact with Mixpanel analytics data, managing events, profiles, funnels, and more.

## Features

- **Analytics** - Query and analyze event data
- **Funnels** - Create and analyze conversion funnels
- **Profiles** - Manage user profiles and properties
- **Events** - Track and query event data
- **Groups** - Manage group analytics
- **Identity** - Handle user identity merging
- **Cohorts** - Create and manage user cohorts
- **Management** - Project and workspace management
- **GDPR** - Handle data deletion and privacy requests

## Quick Start

The easiest way to get started is using the [Primrose SDK](https://github.com/primrose-ai/primrose-mcp):

```bash
npm install primrose-mcp
```

```typescript
import { createMCPClient } from 'primrose-mcp';

const client = createMCPClient('mixpanel', {
  headers: {
    'X-Mixpanel-Service-Account-Username': 'your-service-account-username',
    'X-Mixpanel-Service-Account-Secret': 'your-service-account-secret',
    'X-Mixpanel-Project-Id': 'your-project-id'
  }
});
```

## Manual Installation

Clone and install dependencies:

```bash
git clone https://github.com/primrose-ai/primrose-mcp-mixpanel.git
cd primrose-mcp-mixpanel
npm install
```

## Configuration

### Required Headers

| Header | Description |
|--------|-------------|
| `X-Mixpanel-Service-Account-Username` | Service account username |
| `X-Mixpanel-Service-Account-Secret` | Service account secret |
| `X-Mixpanel-Project-Id` | Mixpanel project ID |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-Mixpanel-Project-Token` | Project token (for ingestion API) |
| `X-Mixpanel-EU-Resident` | Set to "true" for EU data residency |

### Getting Your Credentials

1. Log into [Mixpanel](https://mixpanel.com)
2. Go to Project Settings > Service Accounts
3. Create a new service account
4. Copy the username and secret

## Available Tools

### Analytics Tools
- `mixpanel_query_events` - Query event data with filters
- `mixpanel_query_insights` - Generate insights reports
- `mixpanel_query_retention` - Analyze user retention
- `mixpanel_query_segmentation` - Segment event data

### Funnel Tools
- `mixpanel_list_funnels` - List all saved funnels
- `mixpanel_get_funnel` - Get funnel details
- `mixpanel_create_funnel` - Create a new funnel
- `mixpanel_query_funnel` - Query funnel conversion data

### Profile Tools
- `mixpanel_get_profile` - Get a user profile
- `mixpanel_set_profile` - Set profile properties
- `mixpanel_delete_profile` - Delete a user profile
- `mixpanel_query_profiles` - Query profiles with filters

### Event Tools
- `mixpanel_track_event` - Track a new event
- `mixpanel_import_events` - Import historical events
- `mixpanel_export_events` - Export event data

### Group Tools
- `mixpanel_get_group` - Get group profile
- `mixpanel_set_group` - Set group properties
- `mixpanel_delete_group` - Delete a group profile

### Identity Tools
- `mixpanel_identify` - Link anonymous to identified user
- `mixpanel_alias` - Create identity alias
- `mixpanel_merge_identities` - Merge user identities

### Cohort Tools
- `mixpanel_list_cohorts` - List all cohorts
- `mixpanel_get_cohort` - Get cohort details
- `mixpanel_create_cohort` - Create a new cohort

### Management Tools
- `mixpanel_get_project` - Get project settings
- `mixpanel_list_workspaces` - List workspaces

### GDPR Tools
- `mixpanel_gdpr_delete` - Request data deletion
- `mixpanel_gdpr_export` - Request data export

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Related Resources

- [Primrose SDK](https://github.com/primrose-ai/primrose-mcp) - Unified SDK for all Primrose MCP servers
- [Mixpanel API Documentation](https://developer.mixpanel.com/reference/overview)
- [Mixpanel Service Accounts](https://developer.mixpanel.com/docs/service-accounts)
- [Model Context Protocol](https://modelcontextprotocol.io/)
