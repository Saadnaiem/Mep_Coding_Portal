import React, { useState, useEffect } from 'react';
import { db } from '../services/database';
import { ExistingProductModification } from '../types';
import { Button, Card, Input } from './UI';
import { Download, RefreshCw, Image as ImageIcon, Search, User, Mail, Phone } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const ExistingModificationsReport: React.FC = () => {
    const [data, setData] = useState<ExistingProductModification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const mods = await db.fetchExistingModifications();
        setData(mods);
        setIsLoading(false);
    };

    // Filter Data by Search Query
    const filteredData = data.filter(item => {
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
    });

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
                 item.product_name_en,
                 item.product_name_ar,
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
                 item.side_effects_en,
                 item.side_effects_ar,
                 item.category,
                 item.group,
                 item.subgroup,
                 item.tags_filters,
                 item.suggested_filters,
                 item.division,
                 item.department,
                 item.category_pop,
                 item.sub_category_pop,
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
                         const suffix = idx === 0 ? '' : `_${idx + 1}`;
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
                 {searchQuery && (
                     <span className="text-xs text-gray-400">Found {filteredData.length} records</span>
                 )}
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
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Images</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-400">No records found.</td></tr>
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
                                        <td className="p-4 text-gray-600">{item.product_name_en}</td>
                                        <td className="p-4 text-gray-500">{item.brand_en}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-xs bg-gray-100 w-fit px-2 py-1 rounded">
                                                <ImageIcon size={12} /> {item.image_urls?.length || 0}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            {/* Could add a view details modal later */}
                                            <span className="text-gray-300 text-xs">View Only via Export</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
