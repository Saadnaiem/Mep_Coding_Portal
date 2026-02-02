
import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  AlertCircle, 
  Truck, 
  Package, 
  Settings, 
  User, 
  ShieldCheck,
  Activity
} from 'lucide-react';
import { RequestStatus, EmployeeRole } from './types';

export const COLORS = {
  primary: '#1b5e20',
  secondary: '#2e7d32',
  accent: '#a5d6a7',
  danger: '#c62828',
  warning: '#f9a825',
  info: '#0277bd',
};

export const STATUS_MAP: Record<RequestStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600 border border-gray-200', icon: <FileText size={14} /> },
  submitted: { label: 'Submitted', color: 'bg-slate-100 text-slate-700 border border-slate-200', icon: <Clock size={14} /> },
  in_review: { label: 'Under Review', color: 'bg-[#ffedc2] text-[#8a6d3b] border border-[#C5A065]/30', icon: <Activity size={14} /> },
  vendor_revision_required: { label: 'Correction Required', color: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <AlertCircle size={14} /> },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border border-red-100', icon: <AlertCircle size={14} /> },
  approved_pending_erp: { label: 'Approved', color: 'bg-[#E0F2F1] text-[#0F3D3E] border border-[#0F3D3E]/20', icon: <ShieldCheck size={14} /> },
  completed: { label: 'Completed', color: 'bg-[#0F3D3E] text-white shadow-sm border border-[#0F3D3E]', icon: <CheckCircle size={14} /> },
};

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  category_manager: 'Category Manager',
  purchasing_manager: 'Purchasing Manager',
  assistant_purchasing_director: 'Assistant Purchasing Director',
  planning_director: 'Planning Director',
  commercial_business_development_executive_director: 'Commercial and Business Development Executive Director',
  exec_director: 'Executive Director',
  general_director: 'General Director',
  planning_erp_creation: 'Planning - ERP Creation',
  super_admin: 'Super Admin',
  e_commerce_admin: 'E-commerce Admin',
};
