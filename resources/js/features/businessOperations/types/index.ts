/**
 * Business Operations Types
 * Type definitions for business processes, workflows, and operations
 */

export interface BusinessProcess {
  id: string;
  name: string;
  description?: string;
  category: ProcessCategory;
  status: ProcessStatus;
  version: string;
  isActive: boolean;
  workflow?: Workflow;
  instances: ProcessInstance[];
  metrics: ProcessMetrics;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  processId: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  isActive: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  type: StepType;
  order: number;
  configuration: StepConfiguration;
  conditions?: StepCondition[];
  actions: StepAction[];
  nextSteps: string[];
  isRequired: boolean;
  estimatedDuration?: number;
}

export interface ProcessInstance {
  id: string;
  processId: string;
  workflowId: string;
  status: InstanceStatus;
  currentStepId?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  data: Record<string, any>;
  history: ProcessHistory[];
  assignedTo?: string;
  priority: Priority;
}

export interface OperationalMetrics {
  totalProcesses: number;
  activeInstances: number;
  completedToday: number;
  averageCompletionTime: number;
  successRate: number;
  bottlenecks: ProcessBottleneck[];
  performanceByProcess: ProcessPerformance[];
}

export type ProcessCategory = 
  | 'finance'
  | 'hr'
  | 'operations'
  | 'sales'
  | 'marketing'
  | 'compliance'
  | 'custom';

export type ProcessStatus = 
  | 'draft'
  | 'active'
  | 'inactive'
  | 'deprecated'
  | 'archived';

export type StepType = 
  | 'manual'
  | 'automated'
  | 'approval'
  | 'notification'
  | 'integration'
  | 'decision'
  | 'parallel'
  | 'loop';

export type InstanceStatus = 
  | 'pending'
  | 'in_progress'
  | 'waiting_approval'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface StepConfiguration {
  timeout?: number;
  retryCount?: number;
  assignmentRules?: AssignmentRule[];
  notifications?: NotificationConfig[];
  integrations?: IntegrationConfig[];
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export interface StepAction {
  type: 'update_data' | 'send_notification' | 'call_api' | 'create_task';
  configuration: Record<string, any>;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'api';
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface ProcessHistory {
  id: string;
  instanceId: string;
  stepId: string;
  action: string;
  timestamp: string;
  userId?: string;
  data?: Record<string, any>;
  duration?: number;
}

export interface ProcessMetrics {
  totalInstances: number;
  completedInstances: number;
  averageDuration: number;
  successRate: number;
  bottleneckSteps: string[];
}

export interface ProcessBottleneck {
  stepId: string;
  stepName: string;
  averageWaitTime: number;
  instanceCount: number;
}

export interface ProcessPerformance {
  processId: string;
  processName: string;
  instanceCount: number;
  averageDuration: number;
  successRate: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AssignmentRule {
  type: 'user' | 'role' | 'department' | 'round_robin' | 'load_balanced';
  value: string;
  conditions?: StepCondition[];
}

export interface NotificationConfig {
  type: 'email' | 'sms' | 'push' | 'slack';
  recipients: string[];
  template: string;
  conditions?: StepCondition[];
}

export interface IntegrationConfig {
  type: 'api' | 'webhook' | 'database' | 'file';
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
  payload?: Record<string, any>;
}

