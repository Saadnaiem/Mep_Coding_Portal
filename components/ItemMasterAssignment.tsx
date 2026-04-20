import React, { useState, useEffect } from 'react';
import { supabase, sendEmailNotification } from '../services/supabase';
import { Button, Card, Input, Select, Badge, Modal } from './UI';
import { Search, Plus, Upload, Filter, Save, CheckCircle2, UserCheck, X, Download } from 'lucide-react';
import { db } from '../services/database';

export const ItemMasterAssignment = ({ user, onClose }: { user: any, onClose: () => void }) => {
    // State
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    
    // Filters
    const [divisions, setDivisions] = useState<string[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [totalItemsCount, setTotalItemsCount] = useState<number>(0);
    const [newItemsCount, setNewItemsCount] = useState<number>(0);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 100;
    
    // Vendor Assignment Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [vendorEmail, setVendorEmail] = useState('');
    const [assigningLoading, setAssigningLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchFilters();
        fetchItems(1);
    }, []);

    const fetchFilters = async () => {
        // Get unique divisions and brands from item_master
        const { data: dData } = await supabase.from('item_master').select('division');
        const { data: bData } = await supabase.from('item_master').select('brand');
        
        if (dData) {
            const uniqueDivs = Array.from(new Set(dData.map(i => i.division))).filter(Boolean).sort();
            setDivisions(uniqueDivs as string[]);
        }
        if (bData) {
            const uniqueBrands = Array.from(new Set(bData.map(i => i.brand))).filter(Boolean).sort();
            setBrands(uniqueBrands as string[]);
        }
    };

    const fetchItems = async (page = currentPage, overrides?: { dateFrom?: string, dateTo?: string }) => {
        const effDateFrom = overrides && overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom;
        const effDateTo = overrides && overrides.dateTo !== undefined ? overrides.dateTo : dateTo;
        setLoading(true);
        // Request count alongside the data
        let query = supabase.from('item_master').select('*', { count: 'exact' })
            .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

        if (searchTerm) {
            // Flexible search on Code or Description
            query = query.or(`erp_item_code.ilike.%${searchTerm}%,item_description.ilike.%${searchTerm}%`);
        }
        if (selectedDivision) {
            query = query.eq('division', selectedDivision);
        }
        if (selectedBrand) {
            query = query.ilike('brand', `%${selectedBrand}%`);
        }
        if (effDateFrom) {
            query = query.gte('created_at', new Date(effDateFrom).toISOString());
        }
        if (effDateTo) {
            // Include the whole day by setting time to 23:59:59
            const toDate = new Date(effDateTo);
            toDate.setHours(23, 59, 59, 999);
            query = query.lte('created_at', toDate.toISOString());
        }

        const { data, error, count } = await query;
        if (error) {
            console.error(error);
        } else {
            setItems(data || []);
            if (count !== null) setTotalItemsCount(count);
            
            // New items are explicitly those added from March 22, 2026 onwards
            let newCountQuery = supabase.from('item_master').select('*', { count: 'exact', head: true })
                .gte('created_at', '2026-03-21T00:00:00Z');
                
            if (selectedDivision) newCountQuery = newCountQuery.eq('division', selectedDivision);
            if (selectedBrand) newCountQuery = newCountQuery.ilike('brand', `%${selectedBrand}%`);
            // The "Date Added" visual filter also limits new items visibility if requested
            if (effDateFrom) newCountQuery = newCountQuery.gte('created_at', new Date(effDateFrom) > new Date('2026-03-21T00:00:00Z') ? new Date(effDateFrom).toISOString() : '2026-03-21T00:00:00Z');
            if (effDateTo) {
                const toD = new Date(effDateTo);
                toD.setHours(23, 59, 59, 999);
                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());
            }

            const { count: newCount } = await newCountQuery;
            setNewItemsCount(newCount || 0);
        }
        setLoading(false);
    };
    
    // Handlers
    const handleFilter = () => {
        setCurrentPage(1);
        fetchItems(1);
    };

    const handleShowNewItems = () => {
        setDateFrom('2026-03-21');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '2026-03-21', dateTo: '' });
    };

    const handleShowAllItems = () => {
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
        fetchItems(1, { dateFrom: '', dateTo: '' });
    };

    const toggleSelection = (code: string) => {
        if (selectedItems.includes(code)) {
            setSelectedItems(prev => prev.filter(i => i !== code));
        } else {
            setSelectedItems(prev => [...prev, code]);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === items.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(items.map(i => i.erp_item_code));
        }
    };

    const handleAssign = async () => {
        const cleanEmail = vendorEmail.trim().toLowerCase();
        if (!cleanEmail) {
            alert("Please enter a vendor email.");
            return;
        }
        
        setAssigningLoading(true);
        try {
            console.log("Starting Assignment for Email:", cleanEmail);
            // 1. Find Vendor by Email
            // We look in 'profiles' first to find user ID, then check if they are a vendor?
            // Actually, simpler to look in 'vendors' table via join or contact_person_id?
            // The constraint is: Vendor Registration Email.
            // Let's search `profiles` table for email + role='vendor', then find linked Vendor record if needed.
            
            // Check Profile
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('id, email, full_name')
                .ilike('email', cleanEmail)
                .eq('role', 'vendor')
                .maybeSingle();

            console.log("Profile Results:", profiles, "Error:", pError);
                
            if (pError || !profiles) {
                alert(`Vendor not found for email '${cleanEmail}'. Found: ${JSON.stringify(profiles)} | Error: ${pError?.message || 'No profile row returned (possibly RLS block)'}`);
                setAssigningLoading(false);
                return;
            }
            
            // Find Vendor Record ID linked to this profile
            const { data: vendorRec, error: vError } = await supabase
                .from('vendors')
                .select('id')
                .eq('contact_person_id', profiles.id)
                .maybeSingle();

            console.log("Vendor Record Results:", vendorRec, "Error:", vError);
                
            if (vError || !vendorRec) {
                 alert(`Vendor profile found but no Company record linked to Profile ID ${profiles.id}.`);
                 setAssigningLoading(false);
                 return;
            }

            // 2. Create Assignment Records in 'existing_product_modifications'
            const selectedItemDetails = items.filter(i => selectedItems.includes(i.erp_item_code));
            
            console.log("Creating payloads for:", selectedItemDetails.length, "items.");
            const payloads = selectedItemDetails.map(item => ({
                vendor_id: vendorRec.id,
                type: 'admin_assigned', // Important Distinct Type
                status: 'pending_vendor',
                
                // Copy Identifiers
                sku_gtin: item.erp_item_code, // Linking ERP Code to SKU
                name_en: item.item_description,
                brand_en: item.brand,
                
                // Copy Snapshot Hierarchy
                division: item.division,
                department: item.department,
                category: item.category,
                sub_category: item.sub_category,
                class_name: item.class_name,
                brand: item.brand,
                
                created_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('existing_product_modifications')
                .insert(payloads);

            if (insertError) {
                alert("Database Insert Failed: " + insertError.message);
                throw insertError;
            }

            console.log("Successfully inserted into Database. Triggering email...");
            // Trigger Edge Function Email
            const emailResult = await sendEmailNotification({
                trigger_type: 'CONTENT_ASSIGNED',
                recipient_email: cleanEmail,
                recipient_name: profiles.full_name || 'Vendor',
                dynamic_data: {
                    assigned_count: payloads.length
                }
            });

            console.log("Edge Function Response Status:", emailResult);

            if (emailResult.success) {
                alert(`Successfully assigned ${payloads.length} items to ${cleanEmail}.\n\nAn email notification has been sent to the vendor containing their new assignment details.`);
            } else {
                const errMsg = emailResult.error?.message || emailResult.error || 'Unknown Error';
                alert(`Successfully assigned ${payloads.length} items to ${cleanEmail}, BUT email failed to send in Edge Function.\n\nError: ${errMsg}\n\nPlease check browser console or Supabase logs.`);
            }
            
            setIsAssignModalOpen(false);
            setSelectedItems([]);
            setVendorEmail('');
            
        } catch (e: any) {
            console.error("Assignment Failed", e);
            alert("Assignment Failed: " + e.message);
        } finally {
            setAssigningLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setLoading(true);
        try {
            // Fetch in chunks to confidently bypass any hard limits on the server
            // and retrieve all rows across the massive Item Master table
            let allData: any[] = [];
            let keepFetching = true;
            let currentFrom = 0;
            const pageSize = 1000;

            while (keepFetching) {
                let query = supabase.from('item_master').select('*').range(currentFrom, currentFrom + pageSize - 1);

                if (searchTerm) {
                    query = query.or(`erp_item_code.ilike.%${searchTerm}%,item_description.ilike.%${searchTerm}%`);
                }
                if (selectedDivision) {
                    query = query.eq('division', selectedDivision);
                }
                if (selectedBrand) {
                    query = query.ilike('brand', `%${selectedBrand}%`);
                }
                if (dateFrom) {
                    query = query.gte('created_at', new Date(dateFrom).toISOString());
                }
                if (dateTo) {
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    query = query.lte('created_at', toDate.toISOString());
                }

                const { data, error } = await query;
                if (error) throw error;

                if (data && data.length > 0) {
                    allData.push(...data);
                    currentFrom += pageSize;
                    // If we got fewer records than a full page, it sits at the end of the query bounds
                    if (data.length < pageSize) {
                        keepFetching = false;
                    }
                } else {
                    // No records pulled at all on this run
                    keepFetching = false;
                }
            }

            if (allData.length > 0) {
                const headers = ['SN', 'Item Code', 'Description', 'Brand', 'Division', 'Department', 'Category', 'Sub Category', 'Class', 'Date Added'];
                const csvRows = [headers.join(',')];
                
                allData.forEach((row, index) => {
                    const values = [
                        index + 1,
                        `"${row.erp_item_code || ''}"`,
                        `"${(row.item_description || '').replace(/"/g, '""')}"`,
                        `"${(row.brand || '').replace(/"/g, '""')}"`,
                        `"${(row.division || '').replace(/"/g, '""')}"`,
                        `"${(row.department || '').replace(/"/g, '""')}"`,
                        `"${(row.category || '').replace(/"/g, '""')}"`,
                        `"${(row.sub_category || '').replace(/"/g, '""')}"`,
                        `"${(row.class_name || '').replace(/"/g, '""')}"`,
                        `"${row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}"`
                    ];
                    csvRows.push(values.join(','));
                });

                const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `Item_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("No items found to export based on current filters.");
            }
        } catch (e: any) {
            console.error("Export Failed", e);
            alert("Export failed: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white overflow-hidden flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-[#0F3D3E] text-white p-6 shadow-md flex justify-between items-center shrink-0">
                 <div>
                    <h1 className="text-2xl font-serif font-bold tracking-wide text-[#C5A065]">Item Master</h1>
                    <p className="text-white/70 text-sm mt-1">Assign existing items to vendors for content enrichment</p>
                 </div>
                 <Button variant="secondary" onClick={onClose} icon={X}>Close</Button>
            </div>

            {/* Toolbar */}
            <div className="p-6 bg-gray-50 border-b flex flex-wrap gap-4 items-end shrink-0">
                 <div className="w-64">
                    <label className="text-xs font-bold text-gray-500 uppercase">Search</label>
                    <div className="relative">
                        <Input 
                           placeholder="Search Item Code or Description..." 
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-10"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>
                 </div>

                 <div className="w-48">
                    <label className="text-xs font-bold text-gray-500 uppercase">Filter Division</label>
                    <Select 
                       options={['All Divisions', ...divisions]} 
                       value={selectedDivision} 
                       onChange={(e) => setSelectedDivision(e.target.value === 'All Divisions' ? '' : e.target.value)} 
                    />
                 </div>

                 <div className="w-48 relative">
                     <label className="text-xs font-bold text-gray-500 uppercase">Search Brand</label>
                     <Input 
                        placeholder="Type to search..." 
                        value={selectedBrand} 
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        list="brands-list"
                        className="pl-10"
                     />
                     <Search className="absolute left-3 top-8 text-gray-400" size={18} />
                     <datalist id="brands-list">
                         {brands.filter(b => b.toLowerCase().includes(selectedBrand.toLowerCase())).map((brand, idx) => (
                             <option key={idx} value={brand} />
                         ))}
                     </datalist>
                 </div>

                 <div className="w-36">
                     <label className="text-xs font-bold text-gray-500 uppercase">Date From</label>
                     <Input 
                        type="date"
                        value={dateFrom} 
                        onChange={(e) => setDateFrom(e.target.value)} 
                     />
                 </div>
                 
                 <div className="w-36">
                     <label className="text-xs font-bold text-gray-500 uppercase">Date To</label>
                     <Input 
                        type="date"
                        value={dateTo} 
                        onChange={(e) => setDateTo(e.target.value)} 
                     />
                 </div>

                 <Button onClick={handleFilter} disabled={loading} icon={Filter} className="mb-[2px] !bg-[#C5A065] !bg-none !border-[#C5A065] hover:!bg-[#b08d55] !text-white">Filter</Button>
                 <Button onClick={handleExportExcel} disabled={loading} icon={Download} variant="primary" className="mb-[2px] !bg-[#0F3D3E] !bg-none !border-[#0F3D3E] hover:!bg-[#0a2a2b] !text-white">Export IMF Excel</Button>
                 
                 <div className="ml-auto flex flex-col items-end justify-center gap-1">
                     <div className="flex gap-4 items-center mb-[2px]">
                         <div 
                            onClick={handleShowNewItems}
                            className="bg-emerald-50 hover:bg-emerald-100 cursor-pointer px-4 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-sm transition-colors animate-in fade-in">
                             <span className="text-emerald-800 font-bold text-sm tracking-wide">New Items Added</span>
                             <span className="bg-emerald-500 text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[2.5rem] text-center">{newItemsCount.toLocaleString()}</span>
                         </div>
                         <div 
                            onClick={handleShowAllItems}
                            className="bg-[#0F3D3E]/5 hover:bg-[#0F3D3E]/10 cursor-pointer transition-colors px-4 py-2.5 rounded-xl border border-[#0F3D3E]/20 flex items-center gap-2 shadow-sm">
                               <span className="text-[#0F3D3E] font-bold text-sm tracking-wide">Total Products</span>
                             <span className="bg-[#C5A065] text-white font-black px-3 py-1 rounded-full text-sm shadow-inner min-w-[3rem] text-center">{totalItemsCount.toLocaleString()}</span>
                         </div>
                     </div>
                     
                     {selectedItems.length > 0 && (
                         <div className="flex items-center gap-4 bg-[#C5A065]/10 px-4 py-2 rounded-lg border border-[#C5A065]/30 animate-in slide-in-from-right-10 mt-2">
                              <span className="font-bold text-[#0F3D3E]">{selectedItems.length} Items Selected</span>
                              <Button 
                                variant="primary" 
                                icon={UserCheck} 
                                onClick={() => setIsAssignModalOpen(true)}
                              >
                                  Assign to Vendor
                              </Button>
                         </div>
                     )}
                 </div>
            </div>

            {/* Data Grid */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex justify-center items-center h-64 text-gray-400">Loading Master Data...</div>
                ) : (
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-[#0F3D3E] text-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 font-bold border-r border-white/10 w-12 text-center text-white/70">SN</th>
                                <th className="p-4 w-12 text-center border-r border-white/10">
                                    <input 
                                       type="checkbox" 
                                       className="rounded accent-[#C5A065] w-4 h-4 cursor-pointer"
                                       checked={items.length > 0 && selectedItems.length === items.length}
                                       onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 font-bold border-r border-white/10">Item Code</th>
                                <th className="p-4 font-bold border-r border-white/10 w-1/3">Description</th>
                                <th className="p-4 font-bold border-r border-white/10">Brand</th>
                                <th className="p-4 font-bold border-r border-white/10">Division</th>
                                <th className="p-4 font-bold border-r border-white/10">Category</th>
                                <th className="p-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                             {items.map((item, index) => (
                                 <tr key={item.erp_item_code} className={`hover:bg-[#C5A065]/5 transition-colors ${selectedItems.includes(item.erp_item_code) ? 'bg-[#C5A065]/10' : ''}`}>
                                     <td className="p-4 text-center font-mono text-xs text-gray-400 border-r border-gray-50">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                     <td className="p-4 text-center border-r border-gray-50">
                                        <input 
                                           type="checkbox" 
                                           className="rounded accent-[#C5A065] w-4 h-4 cursor-pointer"
                                           checked={selectedItems.includes(item.erp_item_code)}
                                           onChange={() => toggleSelection(item.erp_item_code)}
                                        />
                                     </td>
                                     <td className="p-4 font-mono font-bold text-[#0F3D3E]">{item.erp_item_code}</td>
                                     <td className="p-4 font-medium">{item.item_description}</td>
                                     <td className="p-4">{item.brand}</td>
                                     <td className="p-4 text-gray-500">{item.division}</td>
                                     <td className="p-4 text-gray-500">{item.category}</td>
                                     <td className="p-4">
                                         <Badge status={item.status === 'active' ? 'in_stock' : 'rejected'} labelOverride={item.status.toUpperCase()} />
                                     </td>
                                 </tr>
                             ))}
                             {items.length === 0 && (
                                 <tr><td colSpan={8} className="p-12 text-center text-gray-400">No items found matching criteria.</td></tr>
                             )}
                        </tbody>
                    </table>
                )}
                
                {/* Pagination Controls */}
                {!loading && totalItemsCount > itemsPerPage && (
                    <div className="flex justify-between items-center bg-[#0F3D3E]/5 p-4 border border-[#0F3D3E]/10 shadow-sm mt-6 rounded-xl animate-in fade-in">
                        <div className="text-sm text-[#0F3D3E] flex items-center gap-2">
                            <span className="font-medium">Showing</span> 
                            <span className="bg-white px-2 py-1 rounded-md border shadow-sm font-bold text-gray-700">{(currentPage - 1) * itemsPerPage + 1}</span> 
                            <span className="font-medium">to</span> 
                            <span className="bg-white px-2 py-1 rounded-md border shadow-sm font-bold text-gray-700">{Math.min(currentPage * itemsPerPage, totalItemsCount)}</span> 
                            <span className="font-medium text-gray-500">of</span> 
                            <span className="bg-[#C5A065] text-white px-2 py-1 rounded-md shadow-sm font-bold">{totalItemsCount}</span> 
                            <span className="font-medium">items</span>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="secondary" 
                                disabled={currentPage === 1}
                                className={`transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : '!bg-white hover:!bg-gray-50 !border-[#0F3D3E]/20 !text-[#0F3D3E] shadow-sm'}`}
                                onClick={() => {
                                    setCurrentPage(prev => prev - 1);
                                    fetchItems(currentPage - 1);
                                }}
                            >
                                ← Previous
                            </Button>
                            <Button 
                                variant="secondary"
                                disabled={currentPage * itemsPerPage >= totalItemsCount}
                                className={`transition-all ${currentPage * itemsPerPage >= totalItemsCount ? 'opacity-50 cursor-not-allowed' : '!bg-[#0F3D3E] hover:!bg-[#0a2a2b] !text-white !border-transparent shadow-md'}`}
                                onClick={() => {
                                    setCurrentPage(prev => prev + 1);
                                    fetchItems(currentPage + 1);
                                }}
                            >
                                Next →
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Assignment Modal */}
            <Modal
                isOpen={isAssignModalOpen} 
                onClose={() => setIsAssignModalOpen(false)}
                title={`Assign ${selectedItems.length} Products`}
            >
                <div className="space-y-6">
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-200">
                        You are about to assign <strong>{selectedItems.length}</strong> items to a vendor for content modification. 
                        They will receive these in their "Existing Products" dashboard.
                    </div>
                    
                    <div>
                        <Input 
                            label="Vendor Registered Email" 
                            placeholder="e.g. contact@vendor.com" 
                            type="email"
                            value={vendorEmail}
                            onChange={(e) => setVendorEmail(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1">Must match the email they use to login to this portal.</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
                        <Button 
                            variant="primary" 
                            onClick={handleAssign} 
                            disabled={assigningLoading}
                            icon={CheckCircle2}
                        >
                            {assigningLoading ? 'Assigning...' : 'Confirm Assignment'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};


