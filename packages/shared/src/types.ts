import { Role, Plan, AIAutonomyLevel, ConversationStatus, Priority, CRMType, LicenceStatus } from './constants';

// Tenant
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  licenceStatus: LicenceStatus;
  licenceExpiry: Date;
  resellerId: string | null;
  whiteLabelEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Licence
export interface Licence {
  id: string;
  tenantId: string;
  plan: Plan;
  status: LicenceStatus;
  seats: number;
  usedSeats: number;
  aiActionLimit: number;
  aiActionsUsed: number;
  crmSyncLimit: number;
  crmSyncsUsed: number;
  startsAt: Date;
  expiresAt: Date;
  features: Record<string, boolean>;
}

// WhatsApp Account
export interface WhatsAppAccount {
  id: string;
  tenantId: string;
  phoneNumber: string;
  displayName: string;
  mode: 'web' | 'cloud_api';
  status: 'connected' | 'disconnected' | 'pending';
  connectedAt?: Date;
}

// Contact
export interface Contact {
  id: string;
  tenantId: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  company?: string;
  tags: string[];
  notes?: string;
  crmContactId?: string;
  leadScore: number;
  lastMessageAt?: Date;
  createdAt: Date;
}

// Conversation
export interface Conversation {
  id: string;
  tenantId: string;
  contactId: string;
  assigneeId?: string;
  status: ConversationStatus;
  priority: Priority;
  tags: string[];
  source: 'whatsapp_web' | 'cloud_api';
  unreadCount: number;
  lastMessageAt?: Date;
  snoozedUntil?: Date;
  followUpAt?: Date;
  aiAutonomyLevel: AIAutonomyLevel;
  revenueOpportunity: boolean;
  supportRisk: boolean;
  sentimentScore: number;
  createdAt: Date;
  updatedAt: Date;
}

// Message
export interface Message {
  id: string;
  conversationId: string;
  tenantId: string;
  senderType: 'contact' | 'agent' | 'ai';
  senderId?: string;
  content: string;
  messageType: 'text' | 'image' | 'voice' | 'document' | 'location' | 'template';
  metadata?: Record<string, unknown>;
  aiGenerated: boolean;
  aiConfidence?: number;
  approvedBy?: string;
  createdAt: Date;
}

// Task / Reminder
export interface Task {
  id: string;
  tenantId: string;
  conversationId?: string;
  contactId?: string;
  assigneeId?: string;
  title: string;
  description?: string;
  dueAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  createdBy: string;
  createdAt: Date;
}

// CRM Connection
export interface CRMConnection {
  id: string;
  tenantId: string;
  type: CRMType;
  name: string;
  config: Record<string, unknown>;
  tokens: Record<string, string>;
  fieldMapping: Record<string, string>;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: Date;
  lastError?: string;
  createdAt: Date;
}

// AI Action
export interface AIAction {
  id: string;
  tenantId: string;
  userId: string;
  conversationId?: string;
  actionType: 'draft_reply' | 'summary' | 'extract_lead' | 'extract_support' | 'follow_up' | 'crm_note' | 'translate' | 'transcribe';
  input: string;
  output: string;
  confidence: number;
  approved: boolean;
  used: boolean;
  tokensUsed: number;
  createdAt: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

// Reseller
export interface Reseller {
  id: string;
  userId: string;
  companyName: string;
  commissionRate: number;
  branding?: Record<string, string>;
  payoutDetails?: Record<string, string>;
  totalClients: number;
  totalRevenue: number;
  createdAt: Date;
}

// Feature Flag
export interface FeatureFlag {
  id: string;
  key: string;
  description: string;
  defaultValue: boolean;
  tenantOverrides: Record<string, boolean>;
}

// WebSocket Events
export interface WSMessageEvent {
  type: 'message' | 'typing' | 'status_update' | 'assignment' | 'notification';
  tenantId: string;
  payload: unknown;
}
