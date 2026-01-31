import { supabase } from './supabase';
import { EmployeeRole } from '../types';

// 1. Invite Staff Member (Triggers email with password setup link)
export const inviteStaffMember = async (email: string, role: EmployeeRole, fullName: string, division?: string) => {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { 
      full_name: fullName,
      role: role,
      department: division // Optional: store division in metadata
    }
  });
  
  if (error) throw error;
  return data;
};

// 2. Get Category Manager for Division
export const getCategoryManagerForDivision = async (divisionName: string) => {
  const { data, error } = await supabase
    .from('category_assignments')
    .select('category_manager_id, profiles(*)')
    .ilike('division_name', divisionName)
    .maybeSingle();
    
  if (error || !data) return null;
  return data.profiles;
};

// 4. Get Divisions for Manager (Reverse Lookup)
// Updated to be Async
export const getDivisionsForManager = async (email: string): Promise<string[]> => {
  // First get profile id by email
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', email).single();
  if (!profile) return [];

  const { data, error } = await supabase
      .from('category_assignments')
      .select('division_name')
      .eq('category_manager_id', profile.id);

  if (error || !data) return [];
  return data.map(d => d.division_name);
};

// 3. Reset Password (User triggered)
export const sendPasswordReset = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });
  if (error) throw error;
  return { success: true };
};
