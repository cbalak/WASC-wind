export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  RESELLER: 'reseller',
  MANAGER: 'manager',
  AGENT: 'agent',
  VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  admin: 80,
  reseller: 70,
  manager: 60,
  agent: 40,
  viewer: 20,
};

export const PLANS = {
  STARTER: 'starter',
  TEAM: 'team',
  GROWTH: 'growth',
  AGENCY: 'agency',
  ENTERPRISE: 'enterprise',
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export const AI_AUTONOMY_LEVELS = {
  OBSERVE: 0,
  SUGGEST: 1,
  DRAFT: 2,
  AUTO_SAFE: 3,
  AUTO_WORKFLOW: 4,
  FULL: 5,
} as const;

export type AIAutonomyLevel = (typeof AI_AUTONOMY_LEVELS)[keyof typeof AI_AUTONOMY_LEVELS];

export const CONVERSATION_STATUS = {
  NEW: 'new',
  ACTIVE: 'active',
  WAITING: 'waiting',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  ESCALATED: 'escalated',
  SNOOZED: 'snoozed',
} as const;

export type ConversationStatus = (typeof CONVERSATION_STATUS)[keyof typeof CONVERSATION_STATUS];

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

export const CRM_TYPES = {
  HUBSPOT: 'hubspot',
  SALESFORCE: 'salesforce',
  ZOHO: 'zoho',
  PIPEDRIVE: 'pipedrive',
  DYNAMICS: 'dynamics',
  FRESHSALES: 'freshsales',
  ZENDESK: 'zendesk',
  MONDAY: 'monday',
  BITRIX24: 'bitrix24',
  GHL: 'ghl',
  GOOGLE_SHEETS: 'google_sheets',
  AIRTABLE: 'airtable',
  WEBHOOK: 'webhook',
  ZAPIER: 'zapier',
  MAKE: 'make',
  N8N: 'n8n',
} as const;

export type CRMType = (typeof CRM_TYPES)[keyof typeof CRM_TYPES];

export const LICENCE_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
} as const;

export type LicenceStatus = (typeof LICENCE_STATUS)[keyof typeof LICENCE_STATUS];
