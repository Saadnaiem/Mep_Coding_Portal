
import { ProductRequest, Product, Vendor, StepAction, RequestStep, Profile, Employee, HierarchyNode } from '../types';
import { PRODUCT_HIERARCHY } from './hierarchyData';
import { APPROVAL_WORKFLOW_ROLES } from './workflowConfig';
export { PRODUCT_HIERARCHY };

export const MOCK_STEPS: RequestStep[] = [
  { step_number: 1, step_name: 'Category Manager Approval', role_required: 'category_manager', sla_hours: 24 },
  { step_number: 2, step_name: 'Purchasing Manager Approval', role_required: 'purchasing_manager', sla_hours: 24 },
  { step_number: 3, step_name: 'Assistant Purchasing Director Approval', role_required: 'assistant_purchasing_director', sla_hours: 48 },
  { step_number: 4, step_name: 'Planning Director Approval', role_required: 'planning_director', sla_hours: 24 },
  { step_number: 5, step_name: 'Commercial and BD Exec Director', role_required: 'commercial_business_development_executive_director', sla_hours: 48 },
  { step_number: 6, step_name: 'General Director Approval', role_required: 'general_director', sla_hours: 48 },
  { step_number: 7, step_name: 'ERP Code Issuance', role_required: 'planning_erp_creation', sla_hours: 24 }
];

// Re-export empty arrays for legacy support if needed, but ideally unused
export const MOCK_PROFILES: Profile[] = [];
export const MOCK_EMPLOYEES: Employee[] = [];
export const MOCK_VENDORS: Vendor[] = [];
export const MOCK_REQUESTS: ProductRequest[] = [];
export const MOCK_PRODUCTS: Product[] = [];
export const MOCK_ACTIONS: StepAction[] = [];
