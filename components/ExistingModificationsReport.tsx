import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../services/database';
import { sendEmailNotification } from '../services/supabase';
import { ExistingProductModification } from '../types';
import { Button, Card, Input, Modal } from './UI';
import { CheckCircle2, Download, Eye, Image as ImageIcon, RefreshCw, RotateCcw, Search, User, Mail, Phone } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const ExistingModificationsReport: React.FC = () => {
    const [data, setData] = useState<ExistingProductModification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<ExistingProductModification | null>(null);
    const [decisionComment, setDecisionComment] = useState('');
    const [isSavingDecision, setIsSavingDecision] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const mods = await db.fetchExistingModifications();
        setData(mods);
        setIsLoading(false);
    };

    const filteredData = useMemo(() => data.filter(item => {
        if (!searchQuery) return true;
        
        const term = searchQuery.toLowerCase();
        
        // Search through all properties
        return Object.values(item).some(val => {
            if (val === null || val === undefined) return false;
            // Handle primitives
            if (typeof val === 'string') return val.toLowerCase().includes(term);
            if (typeof val === 'number') return val.toString().includes(term);
            // Handle arrays (images, or custom logic if needed) - skipped for simplicity
            // Handle objects (like vendor joined data)
            if (typeof val === 'object') {
                 const v = item.vendor;
                 if (v) {
                    if (v.company_name?.toLowerCase().includes(term)) return true;
                    if (v.contact_person_name?.toLowerCase().includes(term)) return true;
                    if (v.email_address?.toLowerCase().includes(term)) return true;
                    if (v.mobile_number?.includes(term)) return true;
                 }
                 return false;
            }
            return false;
        });
    }), [data, searchQuery]);

    const getStatusMeta = (status?: string) => {
        switch (status) {
            case 'approved':
                return {
                    label: 'Approved',
                    chipClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                };
            case 'revision_required':
                return {
                    label: 'Revision Request',
                    chipClass: 'bg-amber-100 text-amber-800 border border-amber-200',
                };
            case 'pending_vendor':
                return {
                    label: 'Pending Vendor',
                    chipClass: 'bg-rose-100 text-rose-800 border border-rose-200',
                };
            case 'submitted':
                return {
                    label: 'Submitted',
                    chipClass: 'bg-sky-100 text-sky-800 border border-sky-200',
                };
            default:
                return {
                    label: status || 'Pending',
                    chipClass: 'bg-gray-100 text-gray-700 border border-gray-200',
                };
        }
    };

    const openDetails = (item: ExistingProductModification) => {
        setSelectedItem(item);
        setDecisionComment(item.rejection_reason || '');
    };

    const handleDecision = async (status: 'approved' | 'revision_required') => {
        if (!selectedItem) return;

        if (!decisionComment.trim()) {
            alert('Please provide an admin comment before making a decision.');
            return;
        }

        setIsSavingDecision(true);
        const nextReason = decisionComment.trim();
        const success = await db.updateExistingModification(selectedItem.id, {
            status,
            rejection_reason: nextReason,
        });

        setIsSavingDecision(false);

        if (!success) return;

        const vendorEmail = selectedItem.vendor?.email_address;
        const vendorName = selectedItem.vendor?.company_name || 'Vendor';

                if (vendorEmail) {
            await sendEmailNotification({
                 trigger_type: 'MODIFICATION_DECISION',
                 recipient_email: vendorEmail,
                 recipient_name: vendorName,
                 dynamic_data: {
                      status_label: status === 'approved' ? 'Approved' : 'Revision Required',
                      total_products: '1',
                      product_names: selectedItem.name_en,
                      total_brands: '1',
                      brands: selectedItem.brand_en || 'N/A',
                      sku_gtin: selectedItem.sku_gtin,
                      rejection_reason: nextReason || ''
                 }
            });
        }

        setData(prev => prev.map(item => item.id === selectedItem.id ? {
            ...item,
            status,
            rejection_reason: nextReason,
        } : item));
        setSelectedItem(prev => prev ? {
            ...prev,
            status,
            rejection_reason: nextReason,
        } : prev);
        
        alert(status === 'approved' 
            ? 'Modification approved successfully. Email notification sent to vendor.' 
            : 'Revision request and email notification sent to vendor successfully.');
    };

    const handleExport = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Existing Product Modifications");
        
        const headers = [
            'Al Habib ERP Code', 'NAME/ DESCRIPTION_US', 'NAME/ DESCRIPTION_AR', 'BRAND Name_US', 
            'BRAND Name_AR', 'SHORT DESCRIPTION_US', 'SHORT DESCRIPTION_AR', 'STORAGE_US', 
            'STORAGE_AR', 'COMPOSITION_US', 'COMPOSITION_AR', 'INDICATION_AR', 'INDICATION_US', 
            'HOW_TO_USE_US', 'HOW_TO_USE_AR', 'POSSIBLE_SIDE_EFFECTS/WARNINGS_US', 
            'POSSIBLE_SIDE_EFFECTS/WARNINGS_AR', 'Category', 'Group', 'Subgroup', 
            'Tags/Filters', 'Suggested Filters in BEAUTY',
            'Division', 'Department', 'Category (POP)', 'Sub-Category (POP)', 'Class', 
            'Image 1', 'Image 2', 'Image 3', 'Image 4', 'Image 5', 'Image 6',
            // Meta
            'Vendor', 'Vendor Contact', 'Vendor Phone', 'Vendor Email', 'Submitted At'
        ];
        
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        
        // Export Filtered Data
        filteredData.forEach(item => {
             const row = [
                 item.sku_gtin,
                 item.name_en,
                 item.name_ar,
                 item.brand_en,
                 item.brand_ar,
                 item.short_description_en,
                 item.short_description_ar,
                 item.storage_en,
                 item.storage_ar,
                 item.composition_en,
                 item.composition_ar,
                 item.indication_en, // Note: The template had swapped orders in some places, mapping blindly to headers
                 item.indication_ar,
                 item.how_to_use_en,
                 item.how_to_use_ar,
                 item.possible_side_effects_en,
                 item.possible_side_effects_ar,
                 item.template_category,
                 item.template_group,
                 item.template_subgroup,
                 item.tags_filters,
                 item.suggested_filters,
                 item.division,
                 item.department,
                 item.category,
                 item.sub_category,
                 item.class_name
             ];
             
             // Add images
             const images = item.image_urls || [];
             // We need to place them in correct columns. Row up to here has 27 items (0-26).
             // Images are at 27,28,29,30,31,32
             
             // Create empty slots for images
             const imageSlots = new Array(6).fill('');
             
             // Add Meta
             const v = item.vendor;
             const meta = [
                 v?.company_name || 'N/A',
                 v?.contact_person_name || 'N/A',
                 v?.mobile_number || v?.phone_number || 'N/A',
                 v?.email_address || 'N/A',
                 new Date(item.created_at).toLocaleDateString()
             ];

             const fullRowData = [...row, ...imageSlots, ...meta];
             const newRow = worksheet.addRow(fullRowData);

             // Hyperlink images similar to Reports.tsx
             images.forEach((img, idx) => {
                 if (idx < 6) {
                    try {
                         // Data columns = 27 (1-27). Image 1 starts at 28.
                         const colIndex = 28 + idx; 
                         
                         // Naming convention:
                         // First image (idx=0) -> force name to ERP.png
                         // Following images -> ERP_2.png, ERP_3.png, etc.
                         const suffix = idx === 0 ? '' : `#${idx}`;
                         const fileName = `${item.sku_gtin}${suffix}.png`;
                         
                         const rowId = newRow.number; 
                         // ExcelJS uses 1-based indexing for getCell(colIndex)
                         const cell = newRow.getCell(colIndex);
                         
                         cell.value = { text: fileName, hyperlink: img };
                         cell.font = { color: { argb: '0000FF' }, underline: true }; // Standard link blue
                    } catch(e) {
                        console.error("Error adding image link", e);
                    }
                 }
             });
        });

        // Widths & Styling
        worksheet.columns.forEach((col, i) => {
            // Default styling
            col.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            
            if (i === 0) col.width = 20; // SKU
            else if (i === 1 || i === 2) col.width = 40; // Names
            else if (i >= 5 && i <= 16) col.width = 50; // Long Text
            else if (i >= 27 && i <= 32) col.width = 30; // Images
            else if (i >= 33) col.width = 25; // Contact Info
            else col.width = 20; // Default others
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Existing_Product_Modifications_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-3xl font-serif font-black text-[#0F3D3E]">Existing Product Modifications</h2>
                    <p className="text-[#C5A065] text-sm font-bold">Review and export modification requests from vendors</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData}>
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    </Button>
                    <Button onClick={handleExport} className="bg-[#0F3D3E] text-white">
                        <Download size={16} className="mr-2" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                 <Search className="text-gray-400" size={20} />
                 <Input 
                    placeholder="Search by SKU, Name, Description, Category..." 
                    className="flex-1 !border-none !ring-0 !shadow-none !p-0" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                 />
                 <span className="text-xs font-bold text-[#0F3D3E] bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                    {filteredData.length} / {data.length} Products
                 </span>
            </div>

            <Card className="border-t-4 border-t-[#0F3D3E]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#Fdfbf7] border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Date</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Vendor</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Contact</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">ERP (SKU)</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Product Name (EN)</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Brand (EN)</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Status</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Images</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={9} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={9} className="p-8 text-center text-gray-400">No records found.</td></tr>
                            ) : (
                                filteredData.map(item => (
                                    <tr key={item.id} className="hover:bg-[#F0F4F4]/50 transition-colors text-sm">
                                        <td className="p-4 font-mono text-gray-500 text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 font-bold text-[#0F3D3E]">{item.vendor?.company_name || 'N/A'}</td>
                                        <td className="p-4 indent-0">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2 bg-[#FAF7F0] p-1.5 rounded-lg border border-[#C5A065]/20 w-fit">
                                                    <User size={16} className="text-[#C5A065] stroke-[3px]" />
                                                    <span className="font-black text-[#0F3D3E] text-xs uppercase tracking-wider">
                                                        {item.vendor?.contact_person_name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-1">
                                                    <Mail size={14} className="text-[#0F3D3E] stroke-[2.5px]" />
                                                    <span className="font-bold text-[#0F3D3E] text-xs">
                                                        {item.vendor?.email_address || 'No Email'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-1">
                                                    <Phone size={14} className="text-[#0F3D3E] stroke-[2.5px]" />
                                                    <span className="font-bold text-[#0F3D3E] text-xs font-mono tracking-tight">
                                                        {item.vendor?.mobile_number || item.vendor?.phone_number || 'No Phone'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-bold text-[#0F3D3E]">{item.sku_gtin}</td>
                                        <td className="p-4 text-gray-600">{item.name_en}</td>
                                        <td className="p-4 text-gray-500">{item.brand_en}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusMeta(item.status).chipClass}`}>
                                                {getStatusMeta(item.status).label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-xs bg-gray-100 w-fit px-2 py-1 rounded">
                                                <ImageIcon size={12} /> {item.image_urls?.length || 0}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button size="sm" onClick={() => openDetails(item)} className="bg-[#0F3D3E] text-white hover:bg-[#0F3D3E]/90 shadow-sm px-3 py-2 text-xs">
                                                <Eye size={14} className="mr-1" /> View
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={!!selectedItem}
                maxWidth="max-w-6xl"
                onClose={() => {
                    setSelectedItem(null);
                    setDecisionComment('');
                }}
                title={selectedItem ? `Review Modification Request: ${selectedItem.sku_gtin}` : 'Review Modification'}
            >
                {selectedItem && (
                    <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Current Status</p>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusMeta(selectedItem.status).chipClass}`}>
                                    {getStatusMeta(selectedItem.status).label}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Vendor</p>
                                <p className="font-bold text-[#0F3D3E]">{selectedItem.vendor?.company_name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{selectedItem.vendor?.contact_person_name || 'No Contact'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-2xl border border-teal-100 bg-teal-50/30 p-5 shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-[#0F3D3E] mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-500"></span> English Details
                                </p>
                                <div className="space-y-3 text-sm text-gray-700">
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Name:</span> {selectedItem.name_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Brand:</span> {selectedItem.brand_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Short Description:</span> {selectedItem.short_description_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Storage:</span> {selectedItem.storage_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Composition:</span> {selectedItem.composition_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Indication:</span> {selectedItem.indication_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">How To Use:</span> {selectedItem.how_to_use_en || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-teal-50"><span className="font-bold text-[#0F3D3E]">Side Effects:</span> {selectedItem.possible_side_effects_en || '-'}</div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5 shadow-sm">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A065] mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Arabic Details
                                </p>
                                <div className="space-y-3 text-sm text-gray-700" dir="rtl">
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">الاسم (Name):</span> {selectedItem.name_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">العلامة التجارية (Brand):</span> {selectedItem.brand_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">وصف قصير (Short Description):</span> {selectedItem.short_description_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">التخزين (Storage):</span> {selectedItem.storage_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">التركيب (Composition):</span> {selectedItem.composition_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">دواعي الاستعمال (Indication):</span> {selectedItem.indication_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">طريقة الاستخدام (How To Use):</span> {selectedItem.how_to_use_ar || '-'}</div>
                                    <div className="bg-white p-2 rounded border border-amber-50"><span className="font-bold text-[#C5A065]">الآثار الجانبية (Side Effects):</span> {selectedItem.possible_side_effects_ar || '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span> Classification Details
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Template Category:</span> {selectedItem.template_category || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Template Group:</span> {selectedItem.template_group || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Template Subgroup:</span> {selectedItem.template_subgroup || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Division:</span> {selectedItem.division || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Department:</span> {selectedItem.department || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Class:</span> {selectedItem.class_name || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Category:</span> {selectedItem.category || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Sub-Category:</span> {selectedItem.sub_category || '-'}</div>
                                <div className="bg-white px-3 py-2 rounded-lg border shadow-sm"><span className="font-bold text-[#0F3D3E] block mb-1">Suggested Filters:</span> {selectedItem.suggested_filters || '-'}</div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0F3D3E] mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#0F3D3E]"></span> Uploaded Images
                            </p>
                            {selectedItem.image_urls && selectedItem.image_urls.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedItem.image_urls.map((imageUrl, index) => (
                                        <a key={`${selectedItem.id}-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50 hover:border-[#C5A065] transition-colors">
                                            <img src={imageUrl} alt={`${selectedItem.sku_gtin} ${index + 1}`} className="h-36 w-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">No images uploaded.</p>
                            )}
                        </div>

                        <div className="rounded-xl border border-gray-200 p-4 bg-[#F8FAFA]">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#0F3D3E] mb-2">Admin Comment <span className="text-red-500">*</span></p>
                            <textarea
                                value={decisionComment}
                                onChange={e => setDecisionComment(e.target.value)}
                                placeholder="Add notes for the vendor (mandatory for approval and revision requests)..."
                                className="w-full min-h-28 rounded-xl border border-gray-200 p-4 text-sm text-[#0F3D3E] outline-none focus:border-[#C5A065] focus:ring-4 focus:ring-[#C5A065]/10"
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500">This comment will be emailed to the vendor and visible in their submission history.</p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-end gap-3 pt-2 border-t mt-4">
                            <Button
                                onClick={() => handleDecision('approved')}
                                disabled={isSavingDecision}
                                className="h-11 px-6 !bg-none !bg-green-600 hover:!bg-green-700 !border-green-600 text-white font-bold transition-colors"
                            >
                                <CheckCircle2 size={18} className="mr-2" /> Approve
                            </Button>
                            <Button
                                onClick={() => handleDecision('revision_required')}
                                disabled={isSavingDecision}
                                className="h-11 px-6 !bg-none !bg-orange-500 hover:!bg-orange-600 !border-orange-500 text-white font-bold transition-colors"
                            >
                                <RotateCcw size={18} className="mr-2" /> Revision Request
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
