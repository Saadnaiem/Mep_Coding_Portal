import React, { useState, useEffect } from 'react';
import { RotateCw, Mail, Check } from 'lucide-react';
import { EmployeeRole, Profile } from '../types';
import { ROLE_LABELS } from '../constants';
import { db } from '../services/database';
import { supabase } from '../services/supabase'; 
import { Card, Button, Badge } from './UI';

export const StaffManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const data = await db.fetchEmployees();
    setProfiles(data);
    setLoading(false);
  };

  const handleRoleUpdate = async (userId: string, newRole: EmployeeRole) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state
      setProfiles(prev => 
        prev.map(p => p.id === userId ? { ...p, role: newRole } : p)
      );
    } catch (err: any) {
      console.error('Error updating role:', err);
      alert('Failed to update role. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNameChange = (userId: string, newName: string) => {
    setProfiles(prev => 
      prev.map(p => p.id === userId ? { ...p, full_name: newName } : p)
    );
  };

  const handleNameBlur = async (userId: string, newName: string) => {
    // Don't save if empty, or restore previous? For now just allow it but maybe don't push empty strings if strict. 
    // Supabase RLS/Constraints might allow it.
    
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', userId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating name:', err);
      // alert('Failed to save name.'); 
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-center border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">Access Management</h2>
          <p className="text-[#C5A065] text-sm font-bold tracking-wide">Manage internal users and role assignments</p>
        </div>
        <Button variant="outline" onClick={loadEmployees} className="!py-2 !px-4">
             <RotateCw size={14} className={loading ? "animate-spin" : ""} /> Refresh List
        </Button>
      </div>
      
      <Card title="Active Personnel Directory" className="h-full">
          {loading ? (
             <div className="p-8 text-center text-gray-400 text-sm">Loading staff directory...</div>
          ) : profiles.length === 0 ? (
             <div className="p-8 text-center text-gray-400 text-sm">No staff members found in database.</div>
          ) : (
          <div className="overflow-visible min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[#0F3D3E] text-[#0F3D3E]">
                  <th className="pb-4 font-serif font-bold uppercase text-[10px] tracking-widest pl-4 w-1/3">Employee</th>
                  <th className="pb-4 font-serif font-bold uppercase text-[10px] tracking-widest w-1/3">Role / Permission Level</th>
                  <th className="pb-4 font-serif font-bold uppercase text-[10px] tracking-widest text-center w-1/6">Status</th>
                  <th className="pb-4 font-serif font-bold uppercase text-[10px] tracking-widest text-right pr-4 w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="group hover:bg-[#F0F4F4] transition-colors">
                    <td className="py-4 pl-4">
                      <input 
                        type="text"
                        className="font-bold text-[#0F3D3E] text-sm bg-transparent border border-transparent hover:border-gray-300 focus:border-[#C5A065] focus:ring-0 rounded px-1 transition-all w-full max-w-[200px]"
                        value={profile.full_name || ''}
                        onChange={(e) => handleNameChange(profile.id, e.target.value)}
                        onBlur={(e) => handleNameBlur(profile.id, e.target.value)}
                        placeholder="Unnamed Staff"
                      />
                      <div className="text-xs text-gray-400 px-1">{profile.email}</div>
                    </td>
                    <td className="py-4">
                      <div className="relative">
                        <select 
                          className="w-full p-2 text-xs border-gray-200 rounded-md focus:border-[#C5A065] focus:ring-[#C5A065] bg-transparent font-medium text-gray-700 cursor-pointer hover:bg-white transition-colors border border-transparent hover:border-gray-200"
                          value={profile.role as string}
                          onChange={(e) => handleRoleUpdate(profile.id, e.target.value as EmployeeRole)}
                          disabled={updatingId === profile.id}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {updatingId === profile.id && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <RotateCw size={12} className="animate-spin text-[#C5A065]" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-center">
                       <Badge status={'approved_pending_erp'} labelSuffix="ACTIVE" /> 
                    </td>
                    <td className="py-4 text-right pr-4">
                      <button className="text-gray-300 hover:text-[#0F3D3E] transition-colors p-2" title="Send Reminder">
                        <Mail size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </Card>
    </div>
  );
};
