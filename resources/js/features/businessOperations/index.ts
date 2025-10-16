/**
 * Business Operations Module
 * Handles business processes, workflows, and operational management
 */

// Components
export { default as WorkflowBuilder } from './components/WorkflowBuilder';
export { default as ProcessMonitor } from './components/ProcessMonitor';
export { default as OperationalDashboard } from './components/OperationalDashboard';

// Pages
export { default as BusinessProcessesPage } from './pages/BusinessProcessesPage';
export { default as WorkflowManagementPage } from './pages/WorkflowManagementPage';
export { default as OperationsOverviewPage } from './pages/OperationsOverviewPage';

// Services
export { default as workflowService } from './services/workflowService';
export { default as processService } from './services/processService';

// Stores
export { default as businessOperationsStore } from './stores/businessOperationsStore';

// Types
export type {
  BusinessProcess,
  Workflow,
  WorkflowStep,
  ProcessInstance,
  OperationalMetrics
} from './types';

// Hooks
export { useWorkflows } from './hooks/useWorkflows';
export { useProcesses } from './hooks/useProcesses';
export { useOperationalMetrics } from './hooks/useOperationalMetrics';

