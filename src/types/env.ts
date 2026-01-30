/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (service account
 * credentials, project IDs, etc.) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Request Headers:
 * - X-Mixpanel-Service-Account-Username: Service account username
 * - X-Mixpanel-Service-Account-Secret: Service account secret
 * - X-Mixpanel-Project-Id: Mixpanel project ID
 * - X-Mixpanel-Project-Token: (Optional) Project token for ingestion API
 * - X-Mixpanel-EU-Resident: (Optional) "true" for EU data residency
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Service account username (from X-Mixpanel-Service-Account-Username header) */
  username: string;

  /** Service account secret (from X-Mixpanel-Service-Account-Secret header) */
  secret: string;

  /** Project ID (from X-Mixpanel-Project-Id header) */
  projectId: string;

  /** Project token for ingestion API (from X-Mixpanel-Project-Token header) */
  projectToken?: string;

  /** Whether the project uses EU data residency (from X-Mixpanel-EU-Resident header) */
  euResident?: boolean;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    username: headers.get('X-Mixpanel-Service-Account-Username') || '',
    secret: headers.get('X-Mixpanel-Service-Account-Secret') || '',
    projectId: headers.get('X-Mixpanel-Project-Id') || '',
    projectToken: headers.get('X-Mixpanel-Project-Token') || undefined,
    euResident: headers.get('X-Mixpanel-EU-Resident')?.toLowerCase() === 'true',
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  if (!credentials.username || !credentials.secret) {
    throw new Error(
      'Missing credentials. Provide X-Mixpanel-Service-Account-Username and X-Mixpanel-Service-Account-Secret headers.'
    );
  }
  if (!credentials.projectId) {
    throw new Error('Missing project ID. Provide X-Mixpanel-Project-Id header.');
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for caching */
  CACHE_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
