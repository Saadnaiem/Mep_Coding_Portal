import React, { useState, useEffect } from 'react';
import { RotateCw, Mail, Check, Trash2, Calendar, UserPlus } from 'lucide-react';
import { EmployeeRole, Profile, Delegation } from '../types';
import { ROLE_LABELS } from '../constants';
import { db } from '../services/database';
import { supabase } from '../services/supabase'; 
import { Card, Button, Badge, Input, Select } from './UI';

export const StaffManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [newDelegation, setNewDelegation] = useState({
      delegatorId: '',
      delegateeId: '',
      startDate: '',
      endDate: ''
  });

  // Load data on mount
  useEffect(() => {
    loadEmployees();
    loadDelegations();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    const data = await db.fetchEmployees();
    setProfiles(data);
    setLoading(false);
  };
  
  const loadDelegations = async () => {
      setDelegationLoading(true);
      const data = await db.fetchDelegations();
      setDelegations(data);
      setDelegationLoading(false);
  };

  const handleCreateDelegation = async () => {
      if (!newDelegation.delegatorId || !newDelegation.delegateeId || !newDelegation.startDate || !newDelegation.endDate) {
          alert('Please select delegator, delegatee and dates.');
          return;
      }
      if (newDelegation.delegatorId === newDelegation.delegateeId) {
          alert('Delegator and Delegatee cannot be the same person.');
          return;
      }

      await db.createDelegation({
          delegator_id: newDelegation.delegatorId,
          delegatee_id: newDelegation.delegateeId,
          start_date: new Date(newDelegation.startDate + 'T00:00:00').toISOString(),
          end_date: new Date(newDelegation.endDate + 'T23:59:59').toISOString(), // Ensure full end day coverage
          active: true
      });
      
      alert('Authority delegation created successfully.');
      setNewDelegation({ delegatorId: '', delegateeId: '', startDate: '', endDate: '' });
      loadDelegations();
  };

  const handleDeleteDelegation = async (id: string) => {
      if(!confirm("Revoke this delegation of authority?")) return;
      await db.deleteDelegation(id);
      loadDelegations();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">Access Management</h2>
          <p className="text-[#C5A065] text-sm font-bold tracking-wide">Manage internal users, roles, and vacation delegations</p>
        </div>
        <Button variant="outline" onClick={() => { loadEmployees(); loadDelegations(); }} className="w-full md:w-auto !py-2 !px-4">
             <RotateCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Data
        </Button>
      </div>
      
      {/* DELEGATION SYSTEM */}
      <Card title="Authority Delegation (Vacation Setup)" className="h-fit border-t-4 border-t-[#C5A065]">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Form */}
             <div className="bg-[#F0F4F4]/50 p-6 rounded-xl border border-gray-100 space-y-4">
                 <h4 className="font-bold text-[#0F3D3E] flex items-center gap-2 mb-4"><UserPlus size={18} /> Add New Delegation</h4>
                 <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Delegator (Leaving)</label>
                     <select 
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        value={newDelegation.delegatorId}
                        onChange={e => setNewDelegation({...newDelegation, delegatorId: e.target.value})}
                     >
                         <option value="">Select Employee...</option>
                         {profiles.sort((a,b) => a.full_name.localeCompare(b.full_name)).map(p => (
                             <option key={p.id} value={p.id}>{p.full_name} ({ROLE_LABELS[p.role as EmployeeRole] || p.role})</option>
                         ))}
                     </select>
                 </div>
                 <div className="bg-[#C5A065]/10 p-2 rounded flex justify-center"><div className="w-[1px] h-4 bg-[#C5A065]"></div></div>
                 <div>
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Delegatee (Acting As)</label>
                     <select 
                        className="w-full p-2 border border-gray-200 rounded-lg text-xs"
                        value={newDelegation.delegateeId}
                        onChange={e => setNewDelegation({...newDelegation, delegateeId: e.target.value})}
                     >
                         <option value="">Select Employee...</option>
                         {profiles.sort((a,b) => a.full_name.localeCompare(b.full_name)).map(p => (
                             <option key={p.id} value={p.id}>{p.full_name} ({ROLE_LABELS[p.role as EmployeeRole] || p.role})</option>
                         ))}
                     </select>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Start Date</label>
                        <input type="date" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={newDelegation.startDate} onChange={e => setNewDelegation({...newDelegation, startDate: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">End Date</label>
                        <input type="date" className="w-full p-2 border border-gray-200 rounded-lg text-xs" value={newDelegation.endDate} onChange={e => setNewDelegation({...newDelegation, endDate: e.target.value})} />
                     </div>
                 </div>
                 <Button className="w-full bg-[#0F3D3E] text-white mt-2" onClick={handleCreateDelegation}>Create Delegation Rule</Button>
             </div>

             {/* List */}
             <div className="lg:col-span-2">
                 <h4 className="font-bold text-[#0F3D3E] flex items-center gap-2 mb-4"><Calendar size={18} /> Active & Scheduled Delegations</h4>
                 {delegationLoading ? <p className="text-gray-400 text-sm">Loading...</p> : delegations.length === 0 ? <p className="text-gray-400 text-sm italic">No active delegations found.</p> : (
                     <div className="space-y-3">
                         {delegations.map(d => {
                            const isActive = new Date() >= new Date(d.start_date) && new Date() <= new Date(d.end_date);
                            return (
                                <div key={d.id} className={`p-4 rounded-xl border flex justify-between items-center ${isActive ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center min-w-[120px]">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3D3E] mb-1">Delegator</span>
                                            <span className="font-bold text-[#0F3D3E] text-sm text-center">{d.delegator?.full_name}</span>
                                            <span className="text-[9px] text-gray-400">{ROLE_LABELS[d.delegator?.role as EmployeeRole] || d.delegator?.role}</span>
                                        </div>
                                        <div className="text-[#C5A065]">→</div>
                                        <div className="flex flex-col items-center min-w-[120px]">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#0F3D3E] mb-1">Delegatee</span>
                                            <span className="font-bold text-[#0F3D3E] text-sm text-center">{d.delegatee?.full_name}</span>
                                            <span className="text-[9px] text-gray-400">{ROLE_LABELS[d.delegatee?.role as EmployeeRole] || d.delegatee?.role}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="bg-white px-3 py-1 rounded border border-gray-200 text-[10px] font-mono text-gray-600 mb-2">
                                            {new Date(d.start_date).toLocaleDateString()} — {new Date(d.end_date).toLocaleDateString()}
                                        </div>
                                        <button onClick={() => handleDeleteDelegation(d.id)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 justify-end ml-auto">
                                            <Trash2 size={12} /> Revoke
                                        </button>
                                    </div>
                                </div>
                            );
                         })}
                     </div>
                 )}
             </div>
         </div>
      </Card>
      
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
