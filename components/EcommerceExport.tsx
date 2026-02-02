import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from './UI';
import { db } from '../services/database';
import { ProductRequest, Product, RequestStatus } from '../types';
import { Download, FileDown, User, Mail, Phone, Activity, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { MOCK_STEPS } from '../services/mockDb';
import { ROLE_LABELS } from '../constants';

interface EcommerceProduct extends Product {
    vendor_contact_person?: string;
    vendor_email?: string;
    vendor_mobile?: string;
    request_number?: string;
    request_status?: RequestStatus;
    current_step?: number;
}

export const EcommerceExport: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState<EcommerceProduct[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        loadCompletedData();
    }, []);

    const loadCompletedData = async () => {
        setIsLoading(true);
        try {
            // Fetch all requests
            const allRequests = await db.fetchRequests();
            // Filter: Completed OR Approved Pending ERP OR In Review (for visibility)
            const relevantReqs = allRequests.filter(r => 
                r.status === 'completed' || 
                r.status === 'approved_pending_erp' ||
                r.status === 'in_review'
            );
            const validReqIds = relevantReqs.map(r => r.id);
            
            // Create a map for request info (vendor + status details)
            const reqMap = new Map();
            relevantReqs.forEach(r => {
                reqMap.set(r.id, {
                    request_number: r.request_number,
                    status: r.status,
                    current_step: r.current_step,
                    contact: r.vendor?.contact_person_name,
                    email: r.vendor?.email_address,
                    mobile: r.vendor?.mobile_number
                });
            });

            // Fetch products
            const allProducts = await db.fetchProducts();
            
            // Filter and Attach Request/Vendor Info
            const relevantProducts = allProducts
                .filter(p => validReqIds.includes(p.request_id))
                .map(p => {
                    const rInfo = reqMap.get(p.request_id);
                    return {
                        ...p,
                        request_number: rInfo?.request_number || 'N/A',
                        request_status: rInfo?.status,
                        current_step: rInfo?.current_step,
                        vendor_contact_person: rInfo?.contact || 'N/A',
                        vendor_email: rInfo?.email || 'N/A',
                        vendor_mobile: rInfo?.mobile || 'N/A'
                    };
                });

            setProducts(relevantProducts);
        } catch (error) {
            console.error("Failed to load e-commerce data", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Helper to determine waiting status text
    const getWaitingStatus = (p: EcommerceProduct) => {
        if (p.request_status === 'completed') return <span className="text-green-600 font-bold">Completed</span>;
        
        if (p.request_status === 'approved_pending_erp') return <span className="text-purple-600 font-bold">Waiting for ERP Code</span>;
        
        if (p.request_status === 'in_review' && p.current_step) {
            const step = MOCK_STEPS.find(s => s.step_number === p.current_step);
            const roleName = step?.role_required ? (ROLE_LABELS[step.role_required] || step.role_required) : 'Unknown';
            return (
                <span className="text-amber-600 font-bold flex items-center gap-1">
                   <Activity size={10} /> Waiting: {roleName}
                </span>
            );
        }
        
        return <span className="text-gray-400">{p.request_status}</span>;
    };

    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            (p.request_number || '').toLowerCase().includes(term) ||
            (p.erp_item_code || '').toLowerCase().includes(term) ||
            (p.product_name || '').toLowerCase().includes(term) ||
            (p.product_name_ar || '').toLowerCase().includes(term) ||
            (p.brand || '').toLowerCase().includes(term) ||
            (p.vendor_contact_person || '').toLowerCase().includes(term) ||
            (p.division || '').toLowerCase().includes(term) ||
            (p.category || '').toLowerCase().includes(term) ||
            (p.request_status || '').toLowerCase().includes(term)
        );
    });

    const completedProductsWithCode = filteredProducts.filter(p => p.erp_item_code && p.erp_item_code !== 'N/A' && p.erp_item_code.trim() !== '');

    const handleExportAll = () => {
        if (products.length === 0) {
            alert("No products found to export.");
            return;
        }

        const headers = [
            'Request #', 'Status', 'Item Code', 'Product Name (EN)', 'Product Name (AR)', 
            'Brand', 'Retail Price', 'Category', 'Sub-Category', 'Class',
            'Vendor Contact', 'Vendor Email', 'Vendor Mobile',
            'Image 1', 'Image 2', 'Image 3', 'Image 4', 'Image 5', 'Image 6'
        ];

        const rows = products.map(item => {
            const row = new Array(headers.length).fill('');
            row[0] = item.request_number;
            row[1] = item.request_status;
            row[2] = item.erp_item_code || 'PENDING';
            row[3] = item.product_name;
            row[4] = item.product_name_ar;
            row[5] = item.brand;
            row[6] = `${item.price_retail} ${item.currency}`;
            row[7] = item.category;
            row[8] = item.sub_category;
            row[9] = item.class_name;
            
            // Vendor Info
            row[10] = item.vendor_contact_person;
            row[11] = item.vendor_email;
            row[12] = item.vendor_mobile;

            // Images with Download Links
            if (item.images && item.images.length > 0) {
                item.images.forEach((img, idx) => {
                    if (idx < 6) {
                        try {
                            const extMatch = img.match(/\.([a-zA-Z0-9]+)(\?|$)/);
                            const ext = extMatch ? extMatch[1] : 'jpg';
                            const filePrefix = item.erp_item_code || item.request_number || 'product';
                            const suffix = idx === 0 ? '' : `_${idx + 1}`;
                            const fileName = `${filePrefix}${suffix}.${ext}`;
                            
                            const separator = img.includes('?') ? '&' : '?';
                            const downloadUrl = `${img}${separator}download=${encodeURIComponent(fileName)}`;

                            row[13 + idx] = { v: fileName, l: { Target: downloadUrl } };
                        } catch (e) {
                            row[13 + idx] = img;
                        }
                    }
                });
            }

            return row;
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        
        // Auto-width for columns
        const wscols = headers.map(h => ({ wch: h.length + 5 }));
        worksheet['!cols'] = wscols;

        XLSX.utils.book_append_sheet(workbook, worksheet, "All Products Tracking");
        XLSX.writeFile(workbook, `Ecommerce_All_Products_Tracking_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExport = () => {
        if (completedProductsWithCode.length === 0) {
            alert("No ready-to-sync products found (must have Item Code).");
            return;
        }

        // Logic from Reports.tsx handleEcommerceExport
        const headers = [
            'SKU UBC/GTIN', 'NAME/ DESCRIPTION_US', 'NAME/ DESCRIPTION_AR', 'BRAND Name_US', 
            'BRAND Name_AR', 'SHORT DESCRIPTION_US', 'SHORT DESCRIPTION_AR', 'STORAGE_US', 
            'STORAGE_AR', 'COMPOSITION_US', 'COMPOSITION_AR', 'INDICATION_AR', 'INDICATION_US', 
            'HOW_TO_USE_US', 'HOW_TO_USE_AR', 'POSSIBLE_SIDE_EFFECTS/WARNINGS_US', 
            'POSSIBLE_SIDE_EFFECTS/WARNINGS_AR', 'Category', 'Group', 'Subgroup', 
            'Tags/Filters  (*Tags can be chosen based on the filters from column V to AG, with comma seprated*)', 
            'Suggested Filters in BEAUTY',
            'Division', 'Department', 'Category (POP)', 'Sub-Category (POP)', 'Class',
            'Image 1', 'Image 2', 'Image 3', 'Image 4', 'Image 5', 'Image 6'
        ];

        const rows = completedProductsWithCode.map(item => {
            const row = new Array(headers.length).fill('');
            row[0] = item.erp_item_code || ''; // SKU UBC/GTIN
            row[1] = item.product_name; // NAME/ DESCRIPTION_US
            row[2] = item.product_name_ar; // NAME/ DESCRIPTION_AR
            row[3] = item.brand; // BRAND Name_US
            row[4] = ''; // BRAND Name_AR
            
            row[7] = item.storage_condition || ''; // STORAGE_US

            // Append 5-level hierarchy
            row[22] = item.division;     // Division
            row[23] = item.department;   // Department
            row[24] = item.category;     // Category (POP)
            row[25] = item.sub_category; // Sub-Category (POP)
            row[26] = item.class_name;   // Class

            // Images
            if (item.images && item.images.length > 0) {
                item.images.forEach((img, idx) => {
                    if (idx < 6) {
                        try {
                            // Extract extension or default to jpg
                            const extMatch = img.match(/\.([a-zA-Z0-9]+)(\?|$)/);
                            const ext = extMatch ? extMatch[1] : 'jpg';
                            
                            const suffix = idx === 0 ? '' : `_${idx + 1}`;
                            const fileName = `${item.erp_item_code}${suffix}.${ext}`;
                            
                            // Append ?download=FILENAME to force download behavior and rename the file
                            const separator = img.includes('?') ? '&' : '?';
                            const downloadUrl = `${img}${separator}download=${encodeURIComponent(fileName)}`;

                            // Use SheetJS cell object with hyperlink
                            row[27 + idx] = { v: fileName, l: { Target: downloadUrl } };
                        } catch (e) {
                            // Fallback to raw URL if parsing fails
                            row[27 + idx] = img;
                        }
                    }
                });
            }

            return row;
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "E-Commerce Master");
        XLSX.writeFile(workbook, `Ecommerce_Master_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 gap-4">
                <div>
                   <h2 className="text-3xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">E-Commerce Data Master</h2>
                   <p className="text-[#C5A065] text-sm font-bold tracking-wide">Sync Completed Products with Online Store</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Button onClick={handleExportAll} className="bg-white border-2 border-[#0F3D3E] text-[#0F3D3E] hover:bg-gray-50 h-12 px-6 rounded-xl shadow-lg w-full md:w-auto">
                        <FileDown size={20} className="mr-2" /> Download All (Tracking)
                    </Button>
                    <Button onClick={handleExport} className="bg-[#0F3D3E] text-white hover:bg-[#0F3D3E]/90 h-12 px-6 rounded-xl shadow-lg w-full md:w-auto">
                        <FileDown size={20} className="mr-2" /> Download Master (Ready)
                    </Button>
                </div>
             </div>

             {/* Search Filter */}
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F3D3E]/50" size={16} />
                <input 
                    type="text" 
                    placeholder="Filter by Request #, Item Code, Product, Brand..." 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]/20 text-sm font-medium text-[#0F3D3E] shadow-sm transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>

             <Card title="All In-Progress & Completed Products" className="border-t-4 border-gray-200" noPadding>
                 {isLoading ? (
                     <div className="p-10 text-center text-gray-400">Loading master data...</div>
                 ) : (
                    <>
                     {/* Mobile Card View */}
                     <div className="md:hidden flex flex-col divide-y divide-gray-100">
                        {filteredProducts.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No products found.</div>
                        ) : (
                            filteredProducts.map((p, i) => (
                                <div key={i} className="p-4 bg-white">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#0F3D3E] text-sm">{p.erp_item_code || <span className="text-amber-500 text-xs">Pending Code</span>}</span>
                                            <span className="text-[10px] text-gray-400 font-mono tracking-widest">{p.request_number}</span>
                                        </div>
                                        <div className="text-xs text-right opacity-80 scale-90 origin-top-right">
                                            {getWaitingStatus(p)}
                                        </div>
                                    </div>
                                    
                                    <h4 className="font-serif font-bold text-[#0F3D3E] mb-0.5 leading-tight">{p.product_name}</h4>
                                    <p className="text-[10px] text-gray-500 mb-3">{p.brand} &bull; {p.product_name_ar}</p>
                                    
                                    <div className="bg-[#F0F4F4] p-3 rounded-lg text-xs space-y-2 border border-blue-100/50">
                                        <div className="flex items-center gap-2">
                                            <User size={12} className="text-orange-500" /> 
                                            <span className="font-bold text-[#0F3D3E]">{p.vendor_contact_person || 'N/A'}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="flex items-center gap-1 text-emerald-600 truncate"><Mail size={10} /> {p.vendor_email}</div>
                                            <div className="flex items-center gap-1 text-blue-600 truncate"><Phone size={10} /> {p.vendor_mobile}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                     </div>

                     {/* Desktop Table View */}
                     <div className="hidden md:block overflow-x-auto p-4">
                         <table className="w-full text-left text-sm">
                             <thead className="sticky top-0 bg-gray-50 z-10">
                                 <tr className="border-b border-gray-100 text-[#0F3D3E]">
                                     <th className="p-4 font-bold">Request #</th>
                                     <th className="p-4 font-bold">Item Code</th>
                                     <th className="p-4 font-bold">Category (Division)</th>
                                     <th className="p-4 font-bold">Product Name</th>
                                     <th className="p-4 font-bold">Brand</th>
                                     <th className="p-4 font-bold">Vendor Contact</th>
                                     <th className="p-4 font-bold">Status / Waiting On</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                 {filteredProducts.length === 0 ? (
                                     <tr><td colSpan={7} className="p-8 text-center text-gray-400">No products found.</td></tr>
                                 ) : (
                                     filteredProducts.map(p => (
                                         <tr key={p.id} className="hover:bg-[#F0F4F4]/50">
                                             <td className="p-4 font-black text-xs text-[#0F3D3E]">{p.request_number}</td>
                                             <td className="p-4 font-mono font-bold text-xs">{p.erp_item_code || <span className="text-amber-500">Pending</span>}</td>
                                             <td className="p-4 text-xs font-bold text-gray-500">{p.division}</td>
                                             <td className="p-4 font-medium text-[#0F3D3E]">
                                                 {p.product_name}
                                                 <div className="text-[10px] text-gray-400">{p.product_name_ar}</div>
                                             </td>
                                             <td className="p-4 font-bold text-[#0F3D3E]">{p.brand}</td>
                                             <td className="p-4">
                                                 <div className="text-xs text-orange-600 font-bold flex items-center gap-1"><User size={10} className="text-orange-500" /> {p.vendor_contact_person}</div>
                                                 <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><Mail size={10} className="text-emerald-500" /> {p.vendor_email}</div>
                                                 <div className="text-[10px] text-blue-600 font-medium flex items-center gap-1"><Phone size={10} className="text-blue-500" /> {p.vendor_mobile}</div>
                                             </td>
                                             <td className="p-4 text-xs">
                                                 {getWaitingStatus(p)}
                                             </td>
                                         </tr>
                                     ))
                                 )}
                             </tbody>
                         </table>
                     </div>
                    </>
                 )}
             </Card>

             <Card title="Ready for E-Commerce (With Item Code)" className="border-t-4 border-t-[#0F3D3E] !mt-12" noPadding>
                 {isLoading ? (
                     <div className="p-10 text-center text-gray-400">Filtering ready products...</div>
                 ) : (
                    <>
                     {/* Mobile Card View */}
                     <div className="md:hidden flex flex-col divide-y divide-emerald-50">
                        {completedProductsWithCode.length === 0 ? (
                             <div className="p-8 text-center text-gray-400">No products with Item Codes found.</div>
                        ) : (
                             completedProductsWithCode.map(p => (
                                 <div key={p.id} className="p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-transparent to-transparent">
                                     <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2">
                                              <div className="p-1.5 bg-emerald-100 rounded text-emerald-800">
                                                  <FileDown size={14} />
                                              </div>
                                              <span className="font-mono font-black text-emerald-900 text-lg tracking-tight">{p.erp_item_code}</span>
                                          </div>
                                          <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Ready to Sync</span>
                                     </div>
                                     
                                     <h4 className="font-serif font-bold text-[#0F3D3E] leading-tight mb-1">{p.product_name}</h4>
                                     <p className="text-[10px] text-gray-400 mb-3">{p.product_name_ar} &bull; {p.brand}</p>
                                     
                                     <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white p-2 rounded border border-gray-100 shadow-sm">
                                        <User size={12} className="text-orange-400" />
                                        <span>Point of Contact: <span className="font-bold text-[#0F3D3E]">{p.vendor_contact_person}</span></span>
                                     </div>
                                 </div>
                             ))
                        )}
                     </div>

                     {/* Desktop Table View */}
                     <div className="hidden md:block overflow-x-auto p-4">
                         <table className="w-full text-left text-sm">
                             <thead>
                                 <tr className="bg-emerald-50 border-b border-emerald-100 text-[#0F3D3E]">
                                     <th className="p-4 font-bold">Item Code</th>
                                     <th className="p-4 font-bold">Product Name</th>
                                     <th className="p-4 font-bold">Brand</th>
                                     <th className="p-4 font-bold">Contact</th>
                                     <th className="p-4 font-bold text-center">Status</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-emerald-50">
                                 {completedProductsWithCode.length === 0 ? (
                                     <tr><td colSpan={5} className="p-8 text-center text-gray-400">No products with Item Codes found.</td></tr>
                                 ) : (
                                     completedProductsWithCode.map(p => (
                                         <tr key={p.id} className="hover:bg-emerald-50/30">
                                             <td className="p-4 font-mono font-bold text-emerald-900">{p.erp_item_code}</td>
                                             <td className="p-4 font-medium text-[#0F3D3E]">
                                                 {p.product_name}
                                                 <div className="text-[10px] text-gray-400">{p.product_name_ar}</div>
                                             </td>
                                             <td className="p-4 font-bold text-[#0F3D3E]">{p.brand}</td>
                                             <td className="p-4">
                                                 <div className="text-xs text-orange-600 font-bold">{p.vendor_contact_person}</div>
                                             </td>
                                             <td className="p-4 text-center">
                                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                    <FileDown size={12} /> Ready
                                                </div>
                                             </td>
                                         </tr>
                                     ))
                                 )}
                             </tbody>
                         </table>
                     </div>
                    </>
                 )}
             </Card>
        </div>
    );
};
