
export type UserType = 'vendor' | 'employee' | 'admin';
export type RequestType = 'new_vendor' | 'new_products';
export type RequestStatus = 'draft' | 'submitted' | 'in_review' | 'vendor_revision_required' | 'rejected' | 'approved_pending_erp' | 'completed';
export type RequestPriority = 'normal' | 'urgent';
export type EmployeeRole = 
  | 'category_manager' 
  | 'purchasing_manager' 
  | 'assistant_purchasing_director' 
  | 'planning_director' 
  | 'commercial_business_development_executive_director' 
  | 'exec_director' 
  | 'general_director' 
  | 'planning_erp_creation' 
  | 'super_admin';
export type ActionType = 'submit' | 'approve' | 'reject' | 'return' | 'comment' | 'upload';

export interface Profile {
  id: string;
  user_type: UserType;
  full_name: string;
  email: string;
  phone?: string;
  role?: EmployeeRole | string;
  company_name?: string;
  department?: string;
  job_title?: string;
  force_password_change?: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_id: string;
  job_title: string;
  department: string;
  role: EmployeeRole;
  authority_level: number;
  active: boolean;
}

export interface Vendor {
  id: string;
  vendor_code?: string;
  company_name: string;
  cr_number: string;
  vat_number: string;
  status: string;
  vendor_type?: 'new' | 'existing';
  
  // Extended Registration Fields
  cr_expiry_date?: string;
  country?: string;
  city?: string;
  address?: string;
  contact_person_name?: string;
  mobile_number?: string;
  phone_number?: string;
  fax?: string;
  email_address?: string; // Contact email might differ from auth email
  
  invoice_currency?: string;
  payment_currency?: string;
  payment_terms?: string;
  payment_method?: string;
  
  ship_to?: string;
  bill_to?: string;
  
  bank_name?: string;
  bank_branch?: string;
  branch_address?: string;
  swift_code?: string;
  bank_account_number?: string;
  iban_number?: string;
  supplier_name_in_bank?: string;

  // Documents
  cr_document_url?: string;
  vat_certificate_url?: string;
  bank_certificate_url?: string;
  catalog_url?: string;
  other_documents_url?: string;
  guarantee_letter_url?: string;
  listing_fees_document_url?: string;
}

export interface ProductRequest {
  id: string;
  request_number: string;
  request_type: RequestType;
  vendor_id: string;
  created_by: string;
  current_step: number;
  status: RequestStatus;
  priority: RequestPriority;
  category: string;
  notes?: string;
  submitted_at?: string;
  last_action_at: string;
  created_at: string;
  vendor?: Vendor;
}

export interface Product {
  id: string;
  request_id: string;
  brand: string;
  product_name: string;
  product_name_ar?: string;
  item_description: string;
  barcode: string;
  manufacturer: string;
  country_of_origin: string;
  storage_condition: string;
  pack_size: string;
  
  // Hierarchy
  division: string;
  department: string;
  category: string;
  sub_category: string;
  class_name: string;
  
  uom: string;
  price_cost: number;
  price_retail: number;
  erp_item_code?: string;
  
  // MEP Additional Fields
  purchasing_status?: string;
  moh_discount_percentage?: number;
  invoice_extra_discount?: number;
  site_no?: string;
  site_name?: string;
  vendor_no?: string;
  vendor_name?: string;
  case_count?: number;
  inner_pack_size?: string;
  lot_indicator?: boolean;
  primary_warehouse?: string;
  vendor_system_code?: string;
  lead_time?: string;
  min_order_qty?: number;
  rtv_allowed?: boolean;
  category_manager?: string;
  buyer?: string;
  currency?: string;
  item_group?: string;
  item_sub_group?: string;
  taxable?: boolean;
  margin?: number;
  images?: string[];
}

export interface StepAction {
  id: string;
  request_id: string;
  step_number: number;
  actor_id: string;
  action: ActionType;
  comment: string;
  action_at: string;
  actor_name?: string;
  actor_role?: string;
}

export interface RequestStep {
  step_number: number;
  step_name: string;
  role_required: EmployeeRole;
  sla_hours: number;
}

// Hierarchy data structure
export interface HierarchyNode {
  name: string;
  children?: HierarchyNode[];
}
