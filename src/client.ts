/**
 * Mixpanel API Client
 *
 * Comprehensive client for Mixpanel's APIs including:
 * - Query API (insights, funnels, retention, segmentation)
 * - Ingestion API (track events, user profiles, groups)
 * - Data Export API (raw event export)
 * - Management API (cohorts, annotations, schemas)
 * - GDPR API (data retrieval and deletion)
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different API keys.
 */

import type { TenantCredentials } from './types/env.js';
import { ApiError, AuthenticationError, RateLimitError } from './utils/errors.js';
import { formatError } from './utils/errors.js';

// =============================================================================
// Configuration - Mixpanel API Base URLs
// =============================================================================

const DATA_API_URL = 'https://data.mixpanel.com/api/2.0';
const MIXPANEL_API_URL = 'https://mixpanel.com/api/2.0';
const EU_DATA_API_URL = 'https://data-eu.mixpanel.com/api/2.0';
const EU_MIXPANEL_API_URL = 'https://eu.mixpanel.com/api/2.0';
const INGESTION_API_URL = 'https://api.mixpanel.com';
const EU_INGESTION_API_URL = 'https://api-eu.mixpanel.com';
const APP_API_URL = 'https://mixpanel.com/api/app';
const EU_APP_API_URL = 'https://eu.mixpanel.com/api/app';

// =============================================================================
// Type Definitions
// =============================================================================

export interface InsightsResult {
  series: Record<string, Record<string, number>>;
  dates?: string[];
}

export interface ExportedEvent {
  event: string;
  properties: Record<string, unknown>;
  time: number;
  distinctId: string;
}

export interface FunnelData {
  meta: { dates: string[] };
  data: Record<
    string,
    {
      steps: Array<{
        count: number;
        step_conv_ratio: number;
        overall_conv_ratio: number;
        avg_time: number | null;
        event: string;
      }>;
    }
  >;
}

export interface FunnelListItem {
  funnel_id: number;
  name: string;
}

export interface RetentionData {
  [key: string]: unknown;
}

export interface UserProfile {
  distinctId: string;
  properties: Record<string, unknown>;
}

export interface ProfileQueryResult {
  results: UserProfile[];
  page: number;
  sessionId: string;
  total: number;
}

export interface TopEvent {
  event: string;
  amount: number;
  percentChange: number;
}

export interface Cohort {
  id: number;
  name: string;
  description?: string;
  created: string;
  count?: number;
  is_visible?: boolean;
  project_id?: number;
}

export interface Annotation {
  id: number;
  date: string;
  description: string;
  created?: string;
  updated?: string;
  user?: string;
}

export interface SegmentationResult {
  legend_size: number;
  data: {
    series: string[];
    values: Record<string, Record<string, number>>;
  };
}

export interface SchemaEntity {
  entityType: 'event' | 'profile' | 'group' | 'lookup_table';
  name: string;
  schemaJson: Record<string, unknown>;
}

export interface GDPRRequest {
  status: string;
  results?: Record<string, unknown>;
}

export interface LookupTable {
  id: string;
  name: string;
  rowCount?: number;
}

// =============================================================================
// Mixpanel Client Interface
// =============================================================================

export interface MixpanelClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // Query API - Insights
  queryInsights(params: {
    fromDate: string;
    toDate: string;
    event?: string;
    groupBy?: string[];
    where?: string;
    interval?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  }): Promise<InsightsResult>;

  // Query API - Segmentation
  querySegmentation(params: {
    event: string;
    fromDate: string;
    toDate: string;
    type?: 'general' | 'unique' | 'average';
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
    on?: string;
  }): Promise<SegmentationResult>;

  querySegmentationNumeric(params: {
    event: string;
    fromDate: string;
    toDate: string;
    on: string;
    type?: 'general' | 'unique' | 'average';
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
    buckets?: number;
  }): Promise<SegmentationResult>;

  querySegmentationSum(params: {
    event: string;
    fromDate: string;
    toDate: string;
    on: string;
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
  }): Promise<SegmentationResult>;

  querySegmentationAverage(params: {
    event: string;
    fromDate: string;
    toDate: string;
    on: string;
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
  }): Promise<SegmentationResult>;

  // Data Export API
  exportEvents(params: {
    fromDate: string;
    toDate: string;
    event?: string[];
    where?: string;
    limit?: number;
  }): Promise<ExportedEvent[]>;

  // Query API - Funnels
  getFunnel(
    funnelId: number,
    params: {
      fromDate: string;
      toDate: string;
      interval?: 'day' | 'week' | 'month';
      length?: number;
      lengthUnit?: 'day' | 'hour' | 'minute' | 'week';
    }
  ): Promise<FunnelData>;

  listFunnels(): Promise<FunnelListItem[]>;

  // Query API - Retention
  getRetention(params: {
    fromDate: string;
    toDate: string;
    bornEvent?: string;
    event?: string;
    retentionType?: 'birth' | 'compounding';
    interval?: number;
    intervalCount?: number;
    unit?: 'day' | 'week' | 'month';
  }): Promise<RetentionData>;

  getFrequency(params: {
    fromDate: string;
    toDate: string;
    event: string;
    where?: string;
    on?: string;
  }): Promise<RetentionData>;

  // Query API - User Profiles (Engage)
  queryProfiles(params?: {
    where?: string;
    sessionId?: string;
    page?: number;
    outputProperties?: string[];
  }): Promise<ProfileQueryResult>;

  getProfile(distinctId: string): Promise<UserProfile>;

  getProfileActivity(
    distinctId: string,
    params?: {
      limit?: number;
      from?: number;
      to?: number;
    }
  ): Promise<{ events: Array<{ event: string; properties: Record<string, unknown> }> }>;

  // Query API - Events
  getTopEvents(params: { type: 'general' | 'average' | 'unique'; limit?: number }): Promise<TopEvent[]>;

  getEventNames(params: { type: 'general' | 'unique'; limit?: number }): Promise<string[]>;

  getEventProperties(eventName: string): Promise<string[]>;

  getPropertyValues(event: string, property: string, params?: { limit?: number }): Promise<string[]>;

  getTopPropertyValues(
    event: string,
    property: string,
    params?: { limit?: number }
  ): Promise<Array<{ value: string; count: number }>>;

  queryEvents(params: {
    event: string[];
    fromDate: string;
    toDate: string;
    type: 'general' | 'unique' | 'average';
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    interval?: number;
    where?: string;
  }): Promise<Record<string, Record<string, number>>>;

  // Query API - Cohorts
  listCohorts(): Promise<Cohort[]>;

  // Query API - JQL
  executeJQL(script: string): Promise<unknown>;

  // Ingestion API - Events
  trackEvent(params: {
    event: string;
    distinctId: string;
    properties?: Record<string, unknown>;
    time?: number;
  }): Promise<{ status: number }>;

  trackEvents(
    events: Array<{
      event: string;
      properties: {
        distinct_id: string;
        time?: number;
        [key: string]: unknown;
      };
    }>
  ): Promise<{ status: number; num_records_imported?: number }>;

  importEvents(
    events: Array<{
      event: string;
      properties: {
        distinct_id: string;
        time: number;
        $insert_id?: string;
        [key: string]: unknown;
      };
    }>
  ): Promise<{ code: number; num_records_imported: number; status: string }>;

  // Ingestion API - User Profiles
  setProfileProperties(
    distinctId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }>;

  setProfilePropertiesOnce(
    distinctId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }>;

  incrementProfileProperties(
    distinctId: string,
    properties: Record<string, number>
  ): Promise<{ status: number }>;

  appendToProfileList(
    distinctId: string,
    property: string,
    values: unknown[]
  ): Promise<{ status: number }>;

  removeFromProfileList(
    distinctId: string,
    property: string,
    values: unknown[]
  ): Promise<{ status: number }>;

  unionToProfileList(
    distinctId: string,
    properties: Record<string, unknown[]>
  ): Promise<{ status: number }>;

  unsetProfileProperties(distinctId: string, properties: string[]): Promise<{ status: number }>;

  deleteProfile(distinctId: string): Promise<{ status: number }>;

  // Ingestion API - Group Profiles
  setGroupProperties(
    groupKey: string,
    groupId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }>;

  setGroupPropertiesOnce(
    groupKey: string,
    groupId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }>;

  unsetGroupProperties(
    groupKey: string,
    groupId: string,
    properties: string[]
  ): Promise<{ status: number }>;

  deleteGroup(groupKey: string, groupId: string): Promise<{ status: number }>;

  // Ingestion API - Identity Management
  createIdentity(
    distinctId: string,
    anonId: string
  ): Promise<{ status: number }>;

  createAlias(distinctId: string, alias: string): Promise<{ status: number }>;

  mergeIdentities(
    distinctId1: string,
    distinctId2: string
  ): Promise<{ status: number }>;

  // Management API - Annotations
  listAnnotations(params?: { fromDate?: string; toDate?: string }): Promise<Annotation[]>;

  createAnnotation(params: { date: string; description: string }): Promise<Annotation>;

  getAnnotation(annotationId: number): Promise<Annotation>;

  updateAnnotation(
    annotationId: number,
    params: { date?: string; description?: string }
  ): Promise<Annotation>;

  deleteAnnotation(annotationId: number): Promise<{ success: boolean }>;

  // Management API - Lookup Tables
  listLookupTables(): Promise<LookupTable[]>;

  createOrReplaceLookupTable(
    tableName: string,
    data: Array<Record<string, unknown>>
  ): Promise<{ status: string }>;

  // Management API - Schemas (Lexicon)
  listSchemas(entityType?: 'event' | 'profile' | 'group' | 'lookup_table'): Promise<SchemaEntity[]>;

  getSchema(
    entityType: 'event' | 'profile' | 'group' | 'lookup_table',
    name: string
  ): Promise<SchemaEntity>;

  createOrUpdateSchema(
    entityType: 'event' | 'profile' | 'group' | 'lookup_table',
    name: string,
    schemaJson: Record<string, unknown>
  ): Promise<{ success: boolean }>;

  deleteSchema(
    entityType: 'event' | 'profile' | 'group' | 'lookup_table',
    name: string
  ): Promise<{ success: boolean }>;

  // GDPR API
  createDataRetrieval(
    distinctIds: string[],
    options?: { dataType?: 'events' | 'people'; completionEmail?: string }
  ): Promise<{ status: string; request_id: string }>;

  getDataRetrievalStatus(requestId: string): Promise<GDPRRequest>;

  createDataDeletion(
    distinctIds: string[]
  ): Promise<{ status: string; request_id: string }>;

  getDataDeletionStatus(requestId: string): Promise<GDPRRequest>;

  cancelDataDeletion(requestId: string): Promise<{ success: boolean }>;
}

// =============================================================================
// Mixpanel Client Implementation
// =============================================================================

class MixpanelClientImpl implements MixpanelClient {
  private credentials: TenantCredentials;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
  }

  // ===========================================================================
  // HTTP Request Helpers
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    const credentials = btoa(`${this.credentials.username}:${this.credentials.secret}`);
    return {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private getDataApiUrl(): string {
    return this.credentials.euResident ? EU_DATA_API_URL : DATA_API_URL;
  }

  private getMixpanelApiUrl(): string {
    return this.credentials.euResident ? EU_MIXPANEL_API_URL : MIXPANEL_API_URL;
  }

  private getIngestionApiUrl(): string {
    return this.credentials.euResident ? EU_INGESTION_API_URL : INGESTION_API_URL;
  }

  private getAppApiUrl(): string {
    return this.credentials.euResident ? EU_APP_API_URL : APP_API_URL;
  }

  private async request<T>(baseUrl: string, endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`API error: ${response.status} - ${errorText}`, response.status);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }

  private async requestIngestion<T>(
    endpoint: string,
    data: unknown,
    useProjectToken = true
  ): Promise<T> {
    const url = `${this.getIngestionApiUrl()}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (!useProjectToken) {
      const credentials = btoa(`${this.credentials.username}:${this.credentials.secret}`);
      headers.Authorization = `Basic ${credentials}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (response.status === 429) {
      throw new RateLimitError('Rate limit exceeded', 60);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Ingestion API error: ${response.status} - ${errorText}`, response.status);
    }

    return response.json() as Promise<T>;
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.request(
        this.getMixpanelApiUrl(),
        `/engage?project_id=${this.credentials.projectId}`,
        {
          method: 'POST',
          body: JSON.stringify({ page: 0, limit: 1 }),
        }
      );
      return { connected: true, message: 'Connected to Mixpanel' };
    } catch (error) {
      return { connected: false, message: formatError(error) };
    }
  }

  // ===========================================================================
  // Query API - Insights
  // ===========================================================================

  async queryInsights(params: {
    fromDate: string;
    toDate: string;
    event?: string;
    groupBy?: string[];
    where?: string;
    interval?: 'minute' | 'hour' | 'day' | 'week' | 'month';
  }): Promise<InsightsResult> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      from_date: params.fromDate,
      to_date: params.toDate,
    });

    if (params.event) queryParams.set('event', JSON.stringify([params.event]));
    if (params.interval) queryParams.set('interval', params.interval);
    if (params.where) queryParams.set('where', params.where);
    if (params.groupBy) queryParams.set('on', JSON.stringify(params.groupBy));

    return this.request<InsightsResult>(
      this.getMixpanelApiUrl(),
      `/insights?${queryParams}`
    );
  }

  // ===========================================================================
  // Query API - Segmentation
  // ===========================================================================

  async querySegmentation(params: {
    event: string;
    fromDate: string;
    toDate: string;
    type?: 'general' | 'unique' | 'average';
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
    on?: string;
  }): Promise<SegmentationResult> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: params.event,
      from_date: params.fromDate,
      to_date: params.toDate,
    });

    if (params.type) queryParams.set('type', params.type);
    if (params.unit) queryParams.set('unit', params.unit);
    if (params.where) queryParams.set('where', params.where);
    if (params.on) queryParams.set('on', params.on);

    return this.request<SegmentationResult>(
      this.getMixpanelApiUrl(),
      `/segmentation?${queryParams}`
    );
  }

  async querySegmentationNumeric(params: {
    event: string;
    fromDate: string;
    toDate: string;
    on: string;
    type?: 'general' | 'unique' | 'average';
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
    buckets?: number;
  }): Promise<SegmentationResult> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: params.event,
      from_date: params.fromDate,
      to_date: params.toDate,
      on: params.on,
    });

    if (params.type) queryParams.set('type', params.type);
    if (params.unit) queryParams.set('unit', params.unit);
    if (params.where) queryParams.set('where', params.where);
    if (params.buckets) queryParams.set('buckets', String(params.buckets));

    return this.request<SegmentationResult>(
      this.getMixpanelApiUrl(),
      `/segmentation/numeric?${queryParams}`
    );
  }

  async querySegmentationSum(params: {
    event: string;
    fromDate: string;
    toDate: string;
    on: string;
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
  }): Promise<SegmentationResult> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: params.event,
      from_date: params.fromDate,
      to_date: params.toDate,
      on: params.on,
    });

    if (params.unit) queryParams.set('unit', params.unit);
    if (params.where) queryParams.set('where', params.where);

    return this.request<SegmentationResult>(
      this.getMixpanelApiUrl(),
      `/segmentation/sum?${queryParams}`
    );
  }

  async querySegmentationAverage(params: {
    event: string;
    fromDate: string;
    toDate: string;
    on: string;
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    where?: string;
  }): Promise<SegmentationResult> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: params.event,
      from_date: params.fromDate,
      to_date: params.toDate,
      on: params.on,
    });

    if (params.unit) queryParams.set('unit', params.unit);
    if (params.where) queryParams.set('where', params.where);

    return this.request<SegmentationResult>(
      this.getMixpanelApiUrl(),
      `/segmentation/average?${queryParams}`
    );
  }

  // ===========================================================================
  // Data Export API
  // ===========================================================================

  async exportEvents(params: {
    fromDate: string;
    toDate: string;
    event?: string[];
    where?: string;
    limit?: number;
  }): Promise<ExportedEvent[]> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      from_date: params.fromDate,
      to_date: params.toDate,
    });

    if (params.event) queryParams.set('event', JSON.stringify(params.event));
    if (params.where) queryParams.set('where', params.where);
    if (params.limit) queryParams.set('limit', String(params.limit));

    const response = await fetch(`${this.getDataApiUrl()}/export?${queryParams}`, {
      headers: this.getAuthHeaders(),
    });

    if (response.status === 429) {
      throw new RateLimitError('Rate limit exceeded', 60);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Export failed: ${response.status} - ${errorText}`, response.status);
    }

    const text = await response.text();
    const lines = text.trim().split('\n').filter(Boolean);

    return lines.map((line) => {
      const parsed = JSON.parse(line);
      return {
        event: parsed.event,
        properties: parsed.properties,
        time: parsed.properties.time,
        distinctId: parsed.properties.distinct_id,
      };
    });
  }

  // ===========================================================================
  // Query API - Funnels
  // ===========================================================================

  async getFunnel(
    funnelId: number,
    params: {
      fromDate: string;
      toDate: string;
      interval?: 'day' | 'week' | 'month';
      length?: number;
      lengthUnit?: 'day' | 'hour' | 'minute' | 'week';
    }
  ): Promise<FunnelData> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      funnel_id: String(funnelId),
      from_date: params.fromDate,
      to_date: params.toDate,
    });

    if (params.interval) queryParams.set('interval', params.interval);
    if (params.length) queryParams.set('length', String(params.length));
    if (params.lengthUnit) queryParams.set('length_unit', params.lengthUnit);

    return this.request<FunnelData>(this.getMixpanelApiUrl(), `/funnels?${queryParams}`);
  }

  async listFunnels(): Promise<FunnelListItem[]> {
    const queryParams = new URLSearchParams({ project_id: this.credentials.projectId });
    return this.request<FunnelListItem[]>(
      this.getMixpanelApiUrl(),
      `/funnels/list?${queryParams}`
    );
  }

  // ===========================================================================
  // Query API - Retention
  // ===========================================================================

  async getRetention(params: {
    fromDate: string;
    toDate: string;
    bornEvent?: string;
    event?: string;
    retentionType?: 'birth' | 'compounding';
    interval?: number;
    intervalCount?: number;
    unit?: 'day' | 'week' | 'month';
  }): Promise<RetentionData> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      from_date: params.fromDate,
      to_date: params.toDate,
    });

    if (params.bornEvent) queryParams.set('born_event', params.bornEvent);
    if (params.event) queryParams.set('event', params.event);
    if (params.retentionType) queryParams.set('retention_type', params.retentionType);
    if (params.interval) queryParams.set('interval', String(params.interval));
    if (params.intervalCount) queryParams.set('interval_count', String(params.intervalCount));
    if (params.unit) queryParams.set('unit', params.unit);

    return this.request<RetentionData>(this.getMixpanelApiUrl(), `/retention?${queryParams}`);
  }

  async getFrequency(params: {
    fromDate: string;
    toDate: string;
    event: string;
    where?: string;
    on?: string;
  }): Promise<RetentionData> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      from_date: params.fromDate,
      to_date: params.toDate,
      event: params.event,
    });

    if (params.where) queryParams.set('where', params.where);
    if (params.on) queryParams.set('on', params.on);

    return this.request<RetentionData>(
      this.getMixpanelApiUrl(),
      `/retention/frequency?${queryParams}`
    );
  }

  // ===========================================================================
  // Query API - User Profiles (Engage)
  // ===========================================================================

  async queryProfiles(params?: {
    where?: string;
    sessionId?: string;
    page?: number;
    outputProperties?: string[];
  }): Promise<ProfileQueryResult> {
    const body: Record<string, unknown> = {
      project_id: this.credentials.projectId,
      page: params?.page || 0,
    };

    if (params?.where) body.where = params.where;
    if (params?.sessionId) body.session_id = params.sessionId;
    if (params?.outputProperties) body.output_properties = params.outputProperties;

    const data = await this.request<{
      results: Array<{ $distinct_id: string; $properties: Record<string, unknown> }>;
      page: number;
      session_id: string;
      total: number;
    }>(this.getMixpanelApiUrl(), '/engage', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      results: data.results.map((r) => ({
        distinctId: r.$distinct_id,
        properties: r.$properties,
      })),
      page: data.page,
      sessionId: data.session_id,
      total: data.total,
    };
  }

  async getProfile(distinctId: string): Promise<UserProfile> {
    const data = await this.request<{
      results: Array<{ $distinct_id: string; $properties: Record<string, unknown> }>;
    }>(this.getMixpanelApiUrl(), '/engage', {
      method: 'POST',
      body: JSON.stringify({
        project_id: this.credentials.projectId,
        distinct_id: distinctId,
      }),
    });

    const result = data.results[0];
    return {
      distinctId: result?.$distinct_id || distinctId,
      properties: result?.$properties || {},
    };
  }

  async getProfileActivity(
    distinctId: string,
    params?: {
      limit?: number;
      from?: number;
      to?: number;
    }
  ): Promise<{ events: Array<{ event: string; properties: Record<string, unknown> }> }> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      distinct_id: distinctId,
    });

    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.from) queryParams.set('from', String(params.from));
    if (params?.to) queryParams.set('to', String(params.to));

    return this.request(this.getMixpanelApiUrl(), `/engage/activity?${queryParams}`);
  }

  // ===========================================================================
  // Query API - Events
  // ===========================================================================

  async getTopEvents(params: {
    type: 'general' | 'average' | 'unique';
    limit?: number;
  }): Promise<TopEvent[]> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      type: params.type,
      limit: String(params.limit || 10),
    });

    const data = await this.request<{
      events: Record<string, { amount: number; percent_change: number }>;
    }>(this.getMixpanelApiUrl(), `/events/top?${queryParams}`);

    return Object.entries(data.events).map(([event, stats]) => ({
      event,
      amount: stats.amount,
      percentChange: stats.percent_change,
    }));
  }

  async getEventNames(params: { type: 'general' | 'unique'; limit?: number }): Promise<string[]> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      type: params.type,
      limit: String(params.limit || 255),
    });

    return this.request<string[]>(this.getMixpanelApiUrl(), `/events/names?${queryParams}`);
  }

  async getEventProperties(eventName: string): Promise<string[]> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: eventName,
    });

    return this.request<string[]>(
      this.getMixpanelApiUrl(),
      `/events/properties/top?${queryParams}`
    );
  }

  async getPropertyValues(
    event: string,
    property: string,
    params?: { limit?: number }
  ): Promise<string[]> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: event,
      name: property,
      limit: String(params?.limit || 100),
    });

    return this.request<string[]>(
      this.getMixpanelApiUrl(),
      `/events/properties/values?${queryParams}`
    );
  }

  async getTopPropertyValues(
    event: string,
    property: string,
    params?: { limit?: number }
  ): Promise<Array<{ value: string; count: number }>> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: event,
      name: property,
      limit: String(params?.limit || 100),
    });

    const data = await this.request<Record<string, number>>(
      this.getMixpanelApiUrl(),
      `/events/properties/top?${queryParams}`
    );

    return Object.entries(data).map(([value, count]) => ({ value, count }));
  }

  async queryEvents(params: {
    event: string[];
    fromDate: string;
    toDate: string;
    type: 'general' | 'unique' | 'average';
    unit?: 'minute' | 'hour' | 'day' | 'week' | 'month';
    interval?: number;
    where?: string;
  }): Promise<Record<string, Record<string, number>>> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
      event: JSON.stringify(params.event),
      from_date: params.fromDate,
      to_date: params.toDate,
      type: params.type,
    });

    if (params.unit) queryParams.set('unit', params.unit);
    if (params.interval) queryParams.set('interval', String(params.interval));
    if (params.where) queryParams.set('where', params.where);

    const data = await this.request<{ data: { values: Record<string, Record<string, number>> } }>(
      this.getMixpanelApiUrl(),
      `/events?${queryParams}`
    );

    return data.data.values;
  }

  // ===========================================================================
  // Query API - Cohorts
  // ===========================================================================

  async listCohorts(): Promise<Cohort[]> {
    const data = await this.request<Cohort[]>(this.getMixpanelApiUrl(), '/cohorts/list', {
      method: 'POST',
      body: JSON.stringify({ project_id: this.credentials.projectId }),
    });

    return data;
  }

  // ===========================================================================
  // Query API - JQL
  // ===========================================================================

  async executeJQL(script: string): Promise<unknown> {
    return this.request(this.getMixpanelApiUrl(), '/jql', {
      method: 'POST',
      body: JSON.stringify({
        project_id: this.credentials.projectId,
        script,
      }),
    });
  }

  // ===========================================================================
  // Ingestion API - Events
  // ===========================================================================

  async trackEvent(params: {
    event: string;
    distinctId: string;
    properties?: Record<string, unknown>;
    time?: number;
  }): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for tracking events. Set X-Mixpanel-Project-Token header.');
    }

    const data = [
      {
        event: params.event,
        properties: {
          distinct_id: params.distinctId,
          token,
          time: params.time || Math.floor(Date.now() / 1000),
          ...params.properties,
        },
      },
    ];

    const response = await fetch(`${this.getIngestionApiUrl()}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return { status: response.ok ? 1 : 0 };
  }

  async trackEvents(
    events: Array<{
      event: string;
      properties: {
        distinct_id: string;
        time?: number;
        [key: string]: unknown;
      };
    }>
  ): Promise<{ status: number; num_records_imported?: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for tracking events. Set X-Mixpanel-Project-Token header.');
    }

    const data = events.map((e) => ({
      event: e.event,
      properties: {
        ...e.properties,
        token,
        time: e.properties.time || Math.floor(Date.now() / 1000),
      },
    }));

    const response = await fetch(`${this.getIngestionApiUrl()}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return { status: response.ok ? 1 : 0 };
  }

  async importEvents(
    events: Array<{
      event: string;
      properties: {
        distinct_id: string;
        time: number;
        $insert_id?: string;
        [key: string]: unknown;
      };
    }>
  ): Promise<{ code: number; num_records_imported: number; status: string }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for importing events. Set X-Mixpanel-Project-Token header.');
    }

    const data = events.map((e) => ({
      event: e.event,
      properties: {
        ...e.properties,
        token,
      },
    }));

    return this.requestIngestion('/import', data);
  }

  // ===========================================================================
  // Ingestion API - User Profiles
  // ===========================================================================

  private async engageRequest(
    operation: string,
    distinctId: string,
    data: Record<string, unknown>
  ): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for profile operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = [
      {
        $token: token,
        $distinct_id: distinctId,
        [operation]: data,
      },
    ];

    const response = await fetch(`${this.getIngestionApiUrl()}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { status: response.ok ? 1 : 0 };
  }

  async setProfileProperties(
    distinctId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }> {
    return this.engageRequest('$set', distinctId, properties);
  }

  async setProfilePropertiesOnce(
    distinctId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }> {
    return this.engageRequest('$set_once', distinctId, properties);
  }

  async incrementProfileProperties(
    distinctId: string,
    properties: Record<string, number>
  ): Promise<{ status: number }> {
    return this.engageRequest('$add', distinctId, properties);
  }

  async appendToProfileList(
    distinctId: string,
    property: string,
    values: unknown[]
  ): Promise<{ status: number }> {
    return this.engageRequest('$append', distinctId, { [property]: values });
  }

  async removeFromProfileList(
    distinctId: string,
    property: string,
    values: unknown[]
  ): Promise<{ status: number }> {
    return this.engageRequest('$remove', distinctId, { [property]: values });
  }

  async unionToProfileList(
    distinctId: string,
    properties: Record<string, unknown[]>
  ): Promise<{ status: number }> {
    return this.engageRequest('$union', distinctId, properties);
  }

  async unsetProfileProperties(
    distinctId: string,
    properties: string[]
  ): Promise<{ status: number }> {
    return this.engageRequest('$unset', distinctId, properties as unknown as Record<string, unknown>);
  }

  async deleteProfile(distinctId: string): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for profile operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = [
      {
        $token: token,
        $distinct_id: distinctId,
        $delete: '',
      },
    ];

    const response = await fetch(`${this.getIngestionApiUrl()}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { status: response.ok ? 1 : 0 };
  }

  // ===========================================================================
  // Ingestion API - Group Profiles
  // ===========================================================================

  private async groupRequest(
    operation: string,
    groupKey: string,
    groupId: string,
    data: Record<string, unknown>
  ): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for group operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = [
      {
        $token: token,
        $group_key: groupKey,
        $group_id: groupId,
        [operation]: data,
      },
    ];

    const response = await fetch(`${this.getIngestionApiUrl()}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { status: response.ok ? 1 : 0 };
  }

  async setGroupProperties(
    groupKey: string,
    groupId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }> {
    return this.groupRequest('$set', groupKey, groupId, properties);
  }

  async setGroupPropertiesOnce(
    groupKey: string,
    groupId: string,
    properties: Record<string, unknown>
  ): Promise<{ status: number }> {
    return this.groupRequest('$set_once', groupKey, groupId, properties);
  }

  async unsetGroupProperties(
    groupKey: string,
    groupId: string,
    properties: string[]
  ): Promise<{ status: number }> {
    return this.groupRequest('$unset', groupKey, groupId, properties as unknown as Record<string, unknown>);
  }

  async deleteGroup(groupKey: string, groupId: string): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for group operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = [
      {
        $token: token,
        $group_key: groupKey,
        $group_id: groupId,
        $delete: '',
      },
    ];

    const response = await fetch(`${this.getIngestionApiUrl()}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return { status: response.ok ? 1 : 0 };
  }

  // ===========================================================================
  // Ingestion API - Identity Management
  // ===========================================================================

  async createIdentity(distinctId: string, anonId: string): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for identity operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = {
      event: '$identify',
      properties: {
        $identified_id: distinctId,
        $anon_id: anonId,
        token,
      },
    };

    const response = await fetch(`${this.getIngestionApiUrl()}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([payload]),
    });

    return { status: response.ok ? 1 : 0 };
  }

  async createAlias(distinctId: string, alias: string): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for alias operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = {
      event: '$create_alias',
      properties: {
        distinct_id: distinctId,
        alias,
        token,
      },
    };

    const response = await fetch(`${this.getIngestionApiUrl()}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([payload]),
    });

    return { status: response.ok ? 1 : 0 };
  }

  async mergeIdentities(distinctId1: string, distinctId2: string): Promise<{ status: number }> {
    const token = this.credentials.projectToken;
    if (!token) {
      throw new ApiError('Project token required for merge operations. Set X-Mixpanel-Project-Token header.');
    }

    const payload = {
      event: '$merge',
      properties: {
        $distinct_ids: [distinctId1, distinctId2],
        token,
      },
    };

    const response = await fetch(`${this.getIngestionApiUrl()}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([payload]),
    });

    return { status: response.ok ? 1 : 0 };
  }

  // ===========================================================================
  // Management API - Annotations
  // ===========================================================================

  async listAnnotations(params?: { fromDate?: string; toDate?: string }): Promise<Annotation[]> {
    const queryParams = new URLSearchParams({
      project_id: this.credentials.projectId,
    });

    if (params?.fromDate) queryParams.set('from_date', params.fromDate);
    if (params?.toDate) queryParams.set('to_date', params.toDate);

    const data = await this.request<{ annotations: Annotation[] }>(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/annotations?${queryParams}`
    );

    return data.annotations || [];
  }

  async createAnnotation(params: { date: string; description: string }): Promise<Annotation> {
    return this.request<Annotation>(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/annotations`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  async getAnnotation(annotationId: number): Promise<Annotation> {
    return this.request<Annotation>(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/annotations/${annotationId}`
    );
  }

  async updateAnnotation(
    annotationId: number,
    params: { date?: string; description?: string }
  ): Promise<Annotation> {
    return this.request<Annotation>(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/annotations/${annotationId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(params),
      }
    );
  }

  async deleteAnnotation(annotationId: number): Promise<{ success: boolean }> {
    await this.request(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/annotations/${annotationId}`,
      { method: 'DELETE' }
    );
    return { success: true };
  }

  // ===========================================================================
  // Management API - Lookup Tables
  // ===========================================================================

  async listLookupTables(): Promise<LookupTable[]> {
    const data = await this.request<LookupTable[]>(
      this.getIngestionApiUrl(),
      `/lookup_tables?project_id=${this.credentials.projectId}`
    );
    return data;
  }

  async createOrReplaceLookupTable(
    tableName: string,
    data: Array<Record<string, unknown>>
  ): Promise<{ status: string }> {
    // Lookup tables require CSV format
    if (data.length === 0) {
      throw new ApiError('Lookup table data cannot be empty');
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');

    const response = await fetch(
      `${this.getIngestionApiUrl()}/lookup_tables/${tableName}?project_id=${this.credentials.projectId}`,
      {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'text/csv',
        },
        body: csvContent,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(`Failed to create lookup table: ${errorText}`, response.status);
    }

    return { status: 'ok' };
  }

  // ===========================================================================
  // Management API - Schemas (Lexicon)
  // ===========================================================================

  async listSchemas(
    entityType?: 'event' | 'profile' | 'group' | 'lookup_table'
  ): Promise<SchemaEntity[]> {
    let endpoint = `/projects/${this.credentials.projectId}/schemas`;
    if (entityType) {
      endpoint += `/${entityType}`;
    }

    const data = await this.request<Array<{ name: string; schema_json: Record<string, unknown> }>>(
      this.getAppApiUrl(),
      endpoint
    );

    return data.map((item) => ({
      entityType: entityType || ('event' as const),
      name: item.name,
      schemaJson: item.schema_json,
    }));
  }

  async getSchema(
    entityType: 'event' | 'profile' | 'group' | 'lookup_table',
    name: string
  ): Promise<SchemaEntity> {
    const data = await this.request<{ name: string; schema_json: Record<string, unknown> }>(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/schemas/${entityType}/${encodeURIComponent(name)}`
    );

    return {
      entityType,
      name: data.name,
      schemaJson: data.schema_json,
    };
  }

  async createOrUpdateSchema(
    entityType: 'event' | 'profile' | 'group' | 'lookup_table',
    name: string,
    schemaJson: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    await this.request(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/schemas/${entityType}/${encodeURIComponent(name)}`,
      {
        method: 'POST',
        body: JSON.stringify({ schema_json: schemaJson }),
      }
    );

    return { success: true };
  }

  async deleteSchema(
    entityType: 'event' | 'profile' | 'group' | 'lookup_table',
    name: string
  ): Promise<{ success: boolean }> {
    await this.request(
      this.getAppApiUrl(),
      `/projects/${this.credentials.projectId}/schemas/${entityType}/${encodeURIComponent(name)}`,
      { method: 'DELETE' }
    );

    return { success: true };
  }

  // ===========================================================================
  // GDPR API
  // ===========================================================================

  async createDataRetrieval(
    distinctIds: string[],
    options?: { dataType?: 'events' | 'people'; completionEmail?: string }
  ): Promise<{ status: string; request_id: string }> {
    const body: Record<string, unknown> = {
      distinct_ids: distinctIds,
    };

    if (options?.dataType) body.data_type = options.dataType;
    if (options?.completionEmail) body.completion_email = options.completionEmail;

    return this.request<{ status: string; request_id: string }>(
      this.getAppApiUrl(),
      `/data-retrievals/v3.0?token=${this.credentials.projectToken}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
  }

  async getDataRetrievalStatus(requestId: string): Promise<GDPRRequest> {
    return this.request<GDPRRequest>(
      this.getAppApiUrl(),
      `/data-retrievals/v3.0/${requestId}?token=${this.credentials.projectToken}`
    );
  }

  async createDataDeletion(
    distinctIds: string[]
  ): Promise<{ status: string; request_id: string }> {
    return this.request<{ status: string; request_id: string }>(
      this.getAppApiUrl(),
      `/data-deletions/v3.0?token=${this.credentials.projectToken}`,
      {
        method: 'POST',
        body: JSON.stringify({ distinct_ids: distinctIds }),
      }
    );
  }

  async getDataDeletionStatus(requestId: string): Promise<GDPRRequest> {
    return this.request<GDPRRequest>(
      this.getAppApiUrl(),
      `/data-deletions/v3.0/${requestId}?token=${this.credentials.projectToken}`
    );
  }

  async cancelDataDeletion(requestId: string): Promise<{ success: boolean }> {
    await this.request(
      this.getAppApiUrl(),
      `/data-deletions/v3.0/${requestId}?token=${this.credentials.projectToken}`,
      { method: 'DELETE' }
    );

    return { success: true };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Mixpanel client instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides its own credentials via headers,
 * allowing a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createMixpanelClient(credentials: TenantCredentials): MixpanelClient {
  return new MixpanelClientImpl(credentials);
}
