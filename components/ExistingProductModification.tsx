import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database';
import { supabase, sendEmailNotification } from '../services/supabase';
import { ExistingProductModification as ExistingProductModificationType, Profile } from '../types';
import { Button, Card, Input, Modal } from './UI';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Download, ExternalLink, X, UploadCloud, AlertCircle } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExistingProductModificationProps {
    user: Profile;
    vendorId?: string;
    onCancel: () => void;
    onSuccess: () => void;
}

const getModificationStatusMeta = (status: string) => {
    switch (status) {
        case 'approved':
            return { label: 'Approved', className: 'bg-green-100 text-green-700 border border-green-200' };
        case 'rejected':
            return { label: 'Rejected', className: 'bg-red-100 text-red-700 border border-red-200' };
        case 'revision_required':
            return { label: 'Needs Revision', className: 'bg-orange-100 text-orange-700 border border-orange-200' };
        case 'pending':
        default:
            return { label: 'Pending', className: 'bg-blue-50 text-blue-600 border border-blue-100' };
    }
};

export const ExistingProductModification: React.FC<ExistingProductModificationProps> = ({ user, vendorId, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState<Partial<ExistingProductModificationType>>({
        sku_gtin: '',
        product_name_en: '',
        product_name_ar: '',
        brand_en: '',
        brand_ar: '',
        status: 'submitted'
    });
    
    // Item Master Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const searchItems = async () => {
            if (!searchTerm || searchTerm.length < 3) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const { data, error } = await supabase
                    .from('item_master')
                    .select('*')
                    .or(`erp_item_code.ilike.%${searchTerm}%,item_description.ilike.%${searchTerm}%`)
                    .limit(10);
                
                if (error) throw error;
                if (data) {
                    setSearchResults(data);
                    setShowResults(true);
                }
            } catch (error) {
                console.error('Error searching items:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const timer = setTimeout(searchItems, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSelectSearchItem = (item: any) => {
        setFormData(prev => ({
            ...prev,
            sku_gtin: item.erp_item_code,
            name_en: item.item_description,
            brand_en: item.brand,
            division: item.division,
            department: item.department,
            category_pop: item.category,
            sub_category_pop: item.sub_category,
            class_name: item.class_name || item.class || ''
        }));
        setSearchTerm(item.erp_item_code);
        setShowResults(false);
    };

    // Modification History
    const [history, setHistory] = useState<any[]>([]);
    const [selectedBrandHistory, setSelectedBrandHistory] = useState<string | null>(null);
    
    // File Upload State
    const [files, setFiles] = useState<(File | null)[]>(Array(6).fill(null));
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Bulk Upload State for Assigned Items
    const [bulkUploadedData, setBulkUploadedData] = useState<Record<string, Partial<ExistingProductModificationType>>>({});

    const [manifest, setManifest] = useState<Partial<ExistingProductModificationType>[]>([]);
    const [itemStatuses, setItemStatuses] = useState<Record<string, 'in_progress' | 'done'>>({});

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await db.fetchExistingModifications();
        if (vendorId) {
             setHistory(data.filter((item: any) => item.vendor_id === vendorId));
        }
    };

// Derived: Items assigned by Ecommerce admin (pending updates)
    const assignedItems = useMemo(() => {
        return history.filter(item => {
            const isAssigned = item.type === 'admin_assigned' && item.status === 'pending_vendor';
            if (!isAssigned) return false;
            // Removed: Do not filter out in-manifest items so they stay as 'done' and green until submitted
            return true;
        });
    }, [history]);

    const handleEditAssigned = async (originalItem: ExistingProductModificationType) => {
        const item: any = originalItem;
        // Find if we have bulk uploaded data for this specific SKU
        const uploadedData = item.sku_gtin ? bulkUploadedData[item.sku_gtin] : null;

        let masterInfo: any = {};
        if (item.sku_gtin) {
            try {
                const { data } = await supabase
                    .from('item_master')
                    .select('*')
                    .eq('erp_item_code', item.sku_gtin)
                    .single();
                if (data) masterInfo = data;
            } catch (err) {
                console.error('Error fetching master info for item:', err);
            }
        }

        // Pre-fill the form with the assigned item's known data, overridden by any bulk uploaded data
        setFormData({
            id: item.id, // track the DB id so we update instead of insert new!
            sku_gtin: uploadedData?.sku_gtin || item.sku_gtin || '',
            name_en: uploadedData?.name_en || item.name_en || '',
            brand_en: uploadedData?.brand_en || item.brand_en || '',
            name_ar: uploadedData?.name_ar || item.name_ar || '',
            brand_ar: uploadedData?.brand_ar || item.brand_ar || '',
            short_description_en: uploadedData?.short_description_en || item.short_description_en || '',
            short_description_ar: uploadedData?.short_description_ar || item.short_description_ar || '',
            storage_en: uploadedData?.storage_en || item.storage_en || '',
            storage_ar: uploadedData?.storage_ar || item.storage_ar || '',
            composition_en: uploadedData?.composition_en || item.composition_en || '',
            composition_ar: uploadedData?.composition_ar || item.composition_ar || '',
            indication_en: uploadedData?.indication_en || item.indication_en || '',
            indication_ar: uploadedData?.indication_ar || item.indication_ar || '',
            how_to_use_en: uploadedData?.how_to_use_en || item.how_to_use_en || '',
            how_to_use_ar: uploadedData?.how_to_use_ar || item.how_to_use_ar || '',
            side_effects_en: uploadedData?.side_effects_en || item.side_effects_en || '',
            side_effects_ar: uploadedData?.side_effects_ar || item.side_effects_ar || '',
            category: uploadedData?.category || item.category || '',
            group: uploadedData?.group || item.group || '',
            subgroup: uploadedData?.subgroup || item.subgroup || '',
            tags_filters: uploadedData?.tags_filters || item.tags_filters || '',
            suggested_filters: uploadedData?.suggested_filters || item.suggested_filters || '',
            division: uploadedData?.division || item.division || masterInfo.division || '',
            department: uploadedData?.department || item.department || masterInfo.department || '',
            class_name: uploadedData?.class_name || item.class_name || masterInfo.class_name || '',
            category_pop: uploadedData?.category_pop || item.category_pop || masterInfo.category || '',
            sub_category_pop: uploadedData?.sub_category_pop || item.sub_category_pop || masterInfo.sub_category || '',
            status: item.status || 'submitted'
        });

        // Show an alert if data was prefilled from upload
        if (uploadedData) {
            alert(`Product mapped from uploaded Excel sheet. Please review and upload required images.`);
        }

        // Scroll to form or give feedback (optional)
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (item.sku_gtin) {
            setItemStatuses(prev => {
                const newStatuses = { ...prev };
                // Remove 'in_progress' status from any other items so only one is active at a time
                Object.keys(newStatuses).forEach(key => {
                    if (newStatuses[key] === 'in_progress') {
                        delete newStatuses[key];
                    }
                });
                newStatuses[item.sku_gtin] = 'in_progress';
                return newStatuses;
            });
        }
    };

    const handleExportAssigned = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Assigned Items");

        const fileFields = [
            // Product Details
            { header: "SKU / GTIN", key: "sku_gtin" },
            { header: "Name EN", key: "name_en" },
            { header: "Name AR", key: "name_ar" },
            { header: "Brand EN", key: "brand_en" },
            { header: "Brand AR", key: "brand_ar" },
            // E-Commerce Content
            { header: "Short Description EN", key: "short_description_en" },
            { header: "Short Description AR", key: "short_description_ar" },
            { header: "Storage EN", key: "storage_en" },
            { header: "Storage AR", key: "storage_ar" },
            { header: "Composition EN", key: "composition_en" },
            { header: "Composition AR", key: "composition_ar" },
            { header: "Indication EN", key: "indication_en" },
            { header: "Indication AR", key: "indication_ar" },
            { header: "How To Use EN", key: "how_to_use_en" },
            { header: "How To Use AR", key: "how_to_use_ar" },
            { header: "Side Effects EN", key: "side_effects_en" },
            { header: "Side Effects AR", key: "side_effects_ar" },
            // Classification & Filters
            { header: "Category", key: "category" },
            { header: "Group", key: "group" },
            { header: "Subgroup", key: "subgroup" },
            { header: "Tags / Filters", key: "tags_filters" },
            { header: "Suggested Filters", key: "suggested_filters" },
            // POP Hierarchy
            { header: "Division", key: "division" },
            { header: "Department", key: "department" },
            { header: "Category (POP)", key: "category_pop" },
            { header: "Sub-Category (POP)", key: "sub_category_pop" },
            { header: "Class", key: "class_name" }
        ];

        worksheet.columns = fileFields.map(f => ({ header: f.header, key: f.key, width: 25 }));

        for (const item of assignedItems) {
            let masterInfo: any = {};
            if (item.sku_gtin) {
                try {
                    const { data } = await supabase
                        .from('item_master')
                        .select('*')
                        .eq('erp_item_code', item.sku_gtin)
                        .single();
                    if (data) masterInfo = data;
                } catch (err) {
                    console.error('Error fetching master info for item:', err);
                }
            }

            const rowData: any = {};
            fileFields.forEach(f => {
                if (f.key === 'division') rowData[f.key] = (item as any)[f.key] || masterInfo.division || '';
                else if (f.key === 'department') rowData[f.key] = (item as any)[f.key] || masterInfo.department || '';
                else if (f.key === 'class_name') rowData[f.key] = (item as any)[f.key] || masterInfo.class_name || '';
                else if (f.key === 'category_pop') rowData[f.key] = (item as any)[f.key] || masterInfo.category || '';
                else if (f.key === 'sub_category_pop') rowData[f.key] = (item as any)[f.key] || masterInfo.sub_category || '';
                else rowData[f.key] = (item as any)[f.key] || '';
            });
            worksheet.addRow(rowData);
        }

        worksheet.getRow(1).font = { bold: true };
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Assigned_Updates_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleImportAssigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        
        const headers: Record<number, string> = {};
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text.trim();
        });

        const headerToKeyMap: Record<string, string> = {
            // Product Details
            "SKU / GTIN": "sku_gtin",
            "Name EN": "name_en",
            "Name AR": "name_ar",
            "Brand EN": "brand_en",
            "Brand AR": "brand_ar",
            // E-Commerce Content
            "Short Description EN": "short_description_en",
            "Short Description AR": "short_description_ar",
            "Storage EN": "storage_en",
            "Storage AR": "storage_ar",
            "Composition EN": "composition_en",
            "Composition AR": "composition_ar",
            "Indication EN": "indication_en",
            "Indication AR": "indication_ar",
            "How To Use EN": "how_to_use_en",
            "How To Use AR": "how_to_use_ar",
            "Side Effects EN": "side_effects_en",
            "Side Effects AR": "side_effects_ar",
            // Classification & Filters
            "Category": "category",
            "Group": "group",
            "Subgroup": "subgroup",
            "Tags / Filters": "tags_filters",
            "Suggested Filters": "suggested_filters",
            // POP Hierarchy
            "Division": "division",
            "Department": "department",
            "Category (POP)": "category_pop",
            "Sub-Category (POP)": "sub_category_pop",
            "Class": "class_name"
        };

        const newBulkData: Record<string, Partial<ExistingProductModificationType>> = {};
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip headers
            let rowObj: any = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const header = headers[colNumber];
                if (!header) return;
                
                const key = headerToKeyMap[header];
                if (key) {
                    rowObj[key] = typeof cell.value === 'object' && cell.value !== null && 'text' in cell.value 
                        ? cell.value.text 
                        : (cell.value?.toString() || "");
                }
            });

            if (rowObj.sku_gtin) {
                newBulkData[rowObj.sku_gtin] = rowObj;
            }
        });

        if (Object.keys(newBulkData).length > 0) {
            setBulkUploadedData(prev => ({ ...prev, ...newBulkData }));
            alert(`Successfully loaded data for ${Object.keys(newBulkData).length} items. Click "Update Item" in the table below to prefill your form.`);
        } else {
            alert("No recognizable data found in the Excel sheet.");
        }
        e.target.value = ''; // Reset input
    };

// Derived: Group history by Brand
    const historySummary = useMemo(() => {
        // Structure: { "BrandName": [item1, item2] }
        const groups: Record<string, any[]> = {};

        // Sort history by date descending first, and DO NOT include pending_vendor items (they are for the Assigned Items section)
        const filteredHistory = history.filter(item => item.status !== 'pending_vendor');
        const sorted = [...filteredHistory].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        sorted.forEach(item => {
            const brand = item.brand_en || 'Unknown Brand';
            if (!groups[brand]) groups[brand] = [];
            groups[brand].push(item);
        });
        
        return groups;
    }, [history]);

    const handleExportHistory = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("My Modifications");
        
        const headers = [
            'Al Habib ERP Code', 'NAME/ DESCRIPTION_US', 'NAME/ DESCRIPTION_AR', 'BRAND Name_US', 
            'BRAND Name_AR', 'SHORT DESCRIPTION_US', 'SHORT DESCRIPTION_AR', 'STORAGE_US', 
            'STORAGE_AR', 'COMPOSITION_US', 'COMPOSITION_AR', 'INDICATION_AR', 'INDICATION_US', 
            'HOW_TO_USE_US', 'HOW_TO_USE_AR', 'POSSIBLE_SIDE_EFFECTS/WARNINGS_US', 
            'POSSIBLE_SIDE_EFFECTS/WARNINGS_AR', 'Category', 'Group', 'Subgroup', 
            'Tags/Filters', 'Suggested Filters in BEAUTY',
            'Division', 'Department', 'Category (POP)', 'Sub-Category (POP)', 'Class', 
            'Image 1', 'Image 2', 'Image 3', 'Image 4', 'Image 5', 'Image 6',
            'Submitted At'
        ];
        
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        
        history.filter(item => item.status !== 'pending_vendor').forEach(item => {
             // Safe parse images
             let customImages = [];
             if (Array.isArray(item.image_urls)) {
                 customImages = item.image_urls;
             } else if (typeof item.image_urls === 'string') {
                 try { customImages = JSON.parse(item.image_urls); } catch(e){}
             }

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
                 item.indication_en,
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
             
             // Images
             
             const imageSlots = new Array(6).fill('');
             const meta = [new Date(item.created_at).toLocaleDateString()];

             const fullRowData = [...row.map(val => (val === null || val === undefined) ? '' : String(val)), ...imageSlots, ...meta];
             const newRow = worksheet.addRow(fullRowData);

             customImages.forEach((img: string, idx: number) => {
                 if (idx < 6) {
                    try {
                         // Data columns end at 27 (0-26). Image 1 is 27 (28th column). Actually headers[27] is Image 1.
                         const colIndex = 28 + idx; // 1-based index (27 + 1)
                         
                         const suffix = idx === 0 ? '' : `#${idx}`;
                         const fileName = `${item.sku_gtin}${suffix}.png`;
                         
                         const cell = newRow.getCell(colIndex);
                         
                         cell.value = { text: fileName, hyperlink: img };
                         cell.font = { color: { argb: '0000FF' }, underline: true };
                    } catch(e) {}
                 }
             });
        });

        worksheet.columns.forEach((col, i) => {
            col.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
            
            if (i === 0) col.width = 20; // SKU
            else if (i === 1 || i === 2) col.width = 40; // Names
            else if (i >= 5 && i <= 16) col.width = 50; // Long description fields
            else if (i >= 27 && i <= 32) col.width = 30; // Images
            else col.width = 20;
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `My_Existing_Product_Mods_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleChange = (field: keyof ExistingProductModificationType, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const newFile = e.target.files[0];
            const newFiles = [...files];
            newFiles[index] = newFile;
            setFiles(newFiles);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        newFiles[index] = null;
        setFiles(newFiles);
    };

    const uploadFiles = async () => {
        setIsUploading(true);
        const uploadedUrls: string[] = [];
        const erpCode = formData.sku_gtin || 'temp';
        const timestamp = Date.now();

        const folderName = `existing_modifications/${vendorId}/${erpCode}_${timestamp}`;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file) continue;
            
            const fileExt = file.name.split('.').pop();
            const sanitizedErp = erpCode.replace(/[^a-zA-Z0-9-_]/g, '');
            const suffix = i === 0 ? '' : `#${i}`;
            const fileName = `${sanitizedErp}${suffix}.${fileExt}`;
            const filePath = `${folderName}/${fileName}`;
            
            const { data, error } = await supabase.storage
                .from('portal-uploads')
                .upload(filePath, file);

            if (error) {
                console.error("Upload error", error);
                continue;
            }
            
            const { data: { publicUrl } } = supabase.storage
                .from('portal-uploads')
                .getPublicUrl(filePath);
            
            uploadedUrls.push(publicUrl);
        }
        setIsUploading(false);
        return uploadedUrls;
    };
    
    // Add current form data to manifest
    const handleAddToManifest = async () => {
        if (!vendorId) {
            alert("Vendor ID missing");
            return;
        }
        if (!formData.sku_gtin) {
             alert("SKU / GTIN (ERP Code) is required");
             return;
        }

        if (!files[0]) {
            alert("The first image is mandatory.");
            return;
        }

        setIsUploading(true);
        let imageUrls: string[] = [];
        const hasFiles = files.some(f => f !== null);
        
        if (hasFiles) {
            try {
                imageUrls = await uploadFiles();
            } catch (err) {
                console.error("Upload failed", err);
                setIsUploading(false);
                return;
            }
        }
        setIsUploading(false);
        
        const newItem: Partial<ExistingProductModificationType> = {
            ...formData,
            vendor_id: vendorId,
            image_urls: imageUrls,
            status: 'submitted',
            created_at: new Date().toISOString() // Temporary for display
        };
        
        setManifest(prev => [...prev, newItem]);
        if (formData.sku_gtin) {
            setItemStatuses(prev => ({ ...prev, [formData.sku_gtin!]: 'done' }));
        }

        // Reset Form
        setFormData({
            sku_gtin: '',
            product_name_en: '',
            product_name_ar: '',
            brand_en: '',
            brand_ar: '',
            short_description_en: '',
            short_description_ar: '',
            storage_en: '',
            storage_ar: '',
            composition_en: '',
            composition_ar: '',
            indication_en: '',
            indication_ar: '',
            how_to_use_en: '',
            how_to_use_ar: '',
            side_effects_en: '',
            side_effects_ar: '',
            category: '',
            group: '',
            subgroup: '',
            tags_filters: '',
            suggested_filters: '',
            division: '',
            department: '',
            class_name: '',
            category_pop: '',
            sub_category_pop: '',
            status: 'submitted'
        });
        setFiles(Array(6).fill(null));
    };

    const handleRemoveFromManifest = (index: number) => {
        setManifest(prev => {
            const itemToRemove = prev[index];
            if (itemToRemove && itemToRemove.sku_gtin) {
                setItemStatuses(statuses => {
                    const newStatuses = { ...statuses };
                    if (newStatuses[itemToRemove.sku_gtin!]) {
                        newStatuses[itemToRemove.sku_gtin!] = 'in_progress';
                    }
                    return newStatuses;
                });
            }
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleFinalSubmit = async () => {
        if (manifest.length === 0) {
            alert("No products in manifest to submit.");
            return;
        }

        setIsLoading(true);
        let successCount = 0;

        for (const item of manifest) {
            let success;
            if (item.id) {
                const { id, created_at, ...updates } = item;
                success = await db.updateExistingModification(id, updates);       
            } else {
                const { created_at, ...insertData } = item;
                success = await db.createExistingModification(insertData);        
            }
            if (success) successCount++;
        }

        setIsLoading(false);

        if (successCount === manifest.length) {
            // Trigger Email to E-Commerce Admin
            try {
                const employees = await db.fetchEmployeesByRole("e_commerce_admin");
                const adminEmails = employees.map(e => e.email).filter(Boolean);
                const admins = await db.fetchEmployeesByRole("super_admin");
                const superAdminEmails = admins.map(e => e.email).filter(Boolean);
                const allAdminEmails = Array.from(new Set([...adminEmails, ...superAdminEmails]));
                
                const brandCounts: Record<string, number> = {};
                manifest.forEach(m => {
                    const brand = m.brand_en || m.brand || "Unknown Brand";
                    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
                });
                
                const brandDetails = Object.entries(brandCounts)
                    .map(([brand, count]) => `${brand} (${count} products)`)
                    .join(", ");

                for (const email of allAdminEmails) {
                    await sendEmailNotification({
                        trigger_type: "MODIFICATION_SUBMITTED",
                        recipient_email: email,
                        recipient_name: "Admin",
                        request_id: "MOD-" + Date.now().toString().slice(-6),
                        dynamic_data: {
                            total_products: manifest.length.toString(),
                            brandDetails: brandDetails
                        }
                    });
                }
                
                alert(`Successfully submitted ${successCount} products for modification review.\n\nEmail notification will be sent immediately to the E-Commerce Admin.`);
            } catch (err) {
                console.error("Failed to send email notification", err);
                alert(`Successfully submitted ${successCount} products for modification review.`);
            }

            setManifest([]);
            setFormData({});
        } else {
            alert(`Submitted ${successCount} out of ${manifest.length}. Some requests failed.`);
        }
        loadHistory();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-[#0F3D3E]">Existing Products Modification</h2>
                    <p className="text-gray-500 text-sm">Update data for products already listed.</p>
                </div>
                <Button className="bg-[#107c41] text-white hover:bg-[#0c5b2f]" onClick={onCancel}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Assigned Items Section */}
                    {assignedItems.length > 0 && (
                        <Card title={<div className="flex items-center gap-2"><span className="text-white">Items Assigned for Update by E-Commerce Admin</span><span className="bg-[#C5A065] text-white text-base px-3 py-1 rounded-full font-extrabold shadow-md">{assignedItems.length}</span></div>} className="border-t-4 border-t-[#C5A065]" headerClassName="bg-[#0F3D3E] text-white">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 bg-red-50/50 p-3 rounded-lg border border-red-100">
                                <div className="text-sm text-gray-700">
                                    <p className="font-bold text-[#0F3D3E]">Bulk Update Process:</p>
                                    <ol className="list-decimal pl-5 mt-2 text-sm text-gray-700 font-medium space-y-1">
                                        <li>Export assigned items to Excel</li>
                                        <li>Fill in product data (except images)</li>
                                        <li>Upload the updated file back here</li>
                                        <li>Click "Update Item" to prefill form and add required images</li>
                                    </ol>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button onClick={handleExportAssigned} className="bg-white text-white hover:bg-green-700 whitespace-nowrap" size="sm">
                                        <Download size={14} className="mr-2" /> Export to Excel
                                    </Button>
                                    <label className="cursor-pointer bg-white border border-[#107c41] text-[#107c41] hover:bg-green-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium whitespace-nowrap shadow-sm">
                                        <UploadCloud size={14} /> <span>Upload Bulk Data</span>
                                        <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportAssigned} />
                                    </label>
                                </div>
                            </div>
                            
                            {Object.keys(bulkUploadedData).length > 0 && (
                                <div className="mb-4 text-xs font-bold text-green-700 bg-green-50 p-2 rounded border border-green-200">
                                    ✓ Data loaded for {Object.keys(bulkUploadedData).length} items. Click "Update Item" below to review and submit with images.
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                      <thead className="text-white bg-[#0F3D3E] font-bold">
                                          <tr>
                                              <th className="p-3 border-b border-[#0F3D3E] bg-[#0F3D3E] text-white">SKU / GTIN</th>
                                              <th className="p-3 border-b border-[#0F3D3E] bg-[#0F3D3E] text-white">English Name</th>
                                              <th className="p-3 border-b border-[#0F3D3E] bg-[#0F3D3E] text-white">Brand</th>
                                              <th className="p-3 border-b border-[#0F3D3E] bg-[#0F3D3E] text-white text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedItems.map(item => {
                                            const status = item.sku_gtin ? itemStatuses[item.sku_gtin] : null;
                                            let trClass = "border-b hover:bg-gray-50 transition-colors bg-white";
                                            if (status === 'done') trClass = "border-b transition-colors bg-green-50 hover:bg-green-100";
                                            else if (status === 'in_progress') trClass = "border-b transition-colors bg-yellow-50 hover:bg-yellow-100";

                                            return (
                                                <tr key={item.id} className={trClass}>
                                                    <td className="p-3 font-medium text-[#0F3D3E]">                                                          <div className="flex items-center gap-2">                                                              {item.sku_gtin}
                                                            {status === 'done' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 border border-green-200">Done</span>}
                                                            {status === 'in_progress' && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">In Progress</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 whitespace-pre-wrap text-[#0F3D3E]">{item.name_en}</td>
                                                    <td className="p-3 text-[#0F3D3E]">{item.brand_en}</td>
                                                    <td className="p-3 text-right">
                                                        <Button size="sm" onClick={() => handleEditAssigned(item)} className="bg-[#107c41] text-white hover:bg-[#0c5b2f]">
                                                            Update Item
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Manifest Summary */}
                    {manifest.length > 0 && (
                        <Card title={`Manifest (${manifest.length} Products)`} className="border-t-4 border-t-blue-500">
                             <div className="space-y-2">
                                 {manifest.map((item, idx) => (
                                     <div key={idx} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                         <div className="flex items-center gap-4">
                                             <span className="bg-white px-2 py-1 rounded text-xs font-bold text-[#0F3D3E] shadow-sm">{idx + 1}</span>
                                             <div>
                                                 <p className="font-bold text-sm text-[#0F3D3E]">{item.sku_gtin}</p>
                                                 <p className="text-xs text-gray-500">{item.product_name_en}</p>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-4">
                                             <span className="text-xs font-medium text-gray-500">{item.image_urls?.length || 0} Images</span>
                                             <Button variant="danger" size="sm" onClick={() => handleRemoveFromManifest(idx)}>Remove</Button>
                                         </div>
                                     </div>
                                 ))}
                                 <div className="flex justify-end pt-2">
                                     <Button onClick={handleFinalSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto px-6 h-12 shadow-lg">
                                         {isLoading ? 'Submitting...' : `Save Modification Request (${manifest.length} Products)`}
                                     </Button>
                                 </div>
                             </div>
                        </Card>
                    )}

                    <Card title="Product Details" className="border-t-4 border-t-[#C5A065]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="col-span-2 relative">
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Search Al Habib ERP Code or Description *</label>
                                  <Input 
                                      value={searchTerm || formData.sku_gtin || ''} 
                                      onChange={e => {
                                          setSearchTerm(e.target.value);
                                          handleChange('sku_gtin', e.target.value);
                                      }}
                                      placeholder="Search Master Catalog by ERP Code or Description..." 
                                      onFocus={() => {
                                          if (searchTerm.length >= 3) setShowResults(true);
                                      }}
                                      onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                  />
                                  {showResults && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                          {isSearching ? (
                                              <div className="p-4 text-sm text-gray-500 text-center bg-gray-50">Searching master catalog...</div>
                                          ) : searchResults.length > 0 ? (
                                              searchResults.map((item, idx) => (
                                                  <div 
                                                      key={idx} 
                                                      onMouseDown={(e) => {
                                                          e.preventDefault(); // Prevent onBlur before click
                                                          handleSelectSearchItem(item);
                                                      }}
                                                      className="p-3 hover:bg-sky-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                                  >
                                                      <div className="flex justify-between items-center">
                                                          <span className="font-bold text-[#0F3D3E]">{item.erp_item_code}</span>
                                                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{item.brand || 'No Brand'}</span>
                                                      </div>
                                                      <div className="text-sm text-gray-600 truncate mt-1">
                                                          {item.item_description}
                                                      </div>
                                                  </div>
                                              ))
                                          ) : (
                                              <div className="p-4 text-sm text-gray-500 text-center bg-gray-50">No catalog items found. You can still modify manually.</div>
                                          )}
                                      </div>
                                  )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name (EN)</label>
                                <Input value={formData.name_en || ''} onChange={e => handleChange('name_en', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name (AR)</label>
                                <Input value={formData.name_ar || ''} onChange={e => handleChange('name_ar', e.target.value)} className="text-right font-serif" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand (EN)</label>
                                <Input value={formData.brand_en || ''} onChange={e => handleChange('brand_en', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Brand (AR)</label>
                                <Input value={formData.brand_ar || ''} onChange={e => handleChange('brand_ar', e.target.value)} className="text-right font-serif" />
                            </div>
                        </div>
                    </Card>

                    <Card title="E-Commerce Content" className="border-t-4 border-t-[#0F3D3E]">
                         <div className="space-y-4">
                            {/* Descriptions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Short Desc (EN)</label><textarea className="w-full p-2 border rounded text-sm" rows={2} value={formData.short_description_en || ''} onChange={e => handleChange('short_description_en', e.target.value)} /></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Short Desc (AR)</label><textarea className="w-full p-2 border rounded text-sm text-right" rows={2} value={formData.short_description_ar || ''} onChange={e => handleChange('short_description_ar', e.target.value)} /></div>
                            </div>
                            {/* Detailed Fields */}
                            {['Storage', 'Composition', 'Indication', 'How To Use', 'Side Effects'].map((field) => {
                                const keyBase = field.toLowerCase().replace(/ /g, '_');
                                return (
                                    <div key={field} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                                        <div><label className="text-[10px] font-bold text-gray-400 uppercase">{field} (EN)</label><textarea className="w-full p-2 border rounded text-sm" rows={2} value={(formData as any)[`${keyBase}_en`] || ''} onChange={e => handleChange(`${keyBase}_en` as any, e.target.value)} /></div>
                                        <div><label className="text-[10px] font-bold text-gray-400 uppercase">{field} (AR)</label><textarea className="w-full p-2 border rounded text-sm text-right" rows={2} value={(formData as any)[`${keyBase}_ar`] || ''} onChange={e => handleChange(`${keyBase}_ar` as any, e.target.value)} /></div>
                                    </div>
                                );
                            })}
                         </div>
                    </Card>
                    
                    <Card title="Classification & Filters">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <Input label="Category" value={(formData as any).category || ''} onChange={e => handleChange('category' as any, e.target.value)} />
                            <Input label="Group" value={(formData as any).group || ''} onChange={e => handleChange('group' as any, e.target.value)} />
                            <Input label="Subgroup" value={(formData as any).subgroup || ''} onChange={e => handleChange('subgroup' as any, e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                             <Input label="Tags / Filters" value={formData.tags_filters || ''} onChange={e => handleChange('tags_filters', e.target.value)} />
                             <Input label="Suggested Filters" value={formData.suggested_filters || ''} onChange={e => handleChange('suggested_filters', e.target.value)} />
                        </div>
                        <div className="border-t pt-4">
                           <h5 className="font-bold text-xs uppercase text-gray-500 mb-2">POP Hierarchy</h5>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input label="Division" value={formData.division || ''} onChange={e => handleChange('division', e.target.value)} />
                                <Input label="Department" value={formData.department || ''} onChange={e => handleChange('department', e.target.value)} />
                                <Input label="Class" value={formData.class_name || ''} onChange={e => handleChange('class_name', e.target.value)} />
                                <Input label="Category (POP)" value={formData.category_pop || ''} onChange={e => handleChange('category_pop', e.target.value)} />
                                <Input label="Sub-Category (POP)" value={formData.sub_category_pop || ''} onChange={e => handleChange('sub_category_pop', e.target.value)} />
                           </div>
                        </div>
                    </Card>

                    <Card title="Product Images (Max 6)" className="border-t-4 border-t-pink-500">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors group">
                                        {file ? (
                                            <>
                                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-lg" alt={`Upload ${idx + 1}`} />
                                                <button onClick={() => removeFile(idx)} className="absolute top-2 right-2 bg-red-400 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={12} />
                                                </button>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center p-4 text-center">
                                                <UploadCloud size={20} className="text-gray-400 mb-2" />
                                                <span className="text-xs text-gray-500 font-medium">Image {idx + 1}{idx === 0 && <span className="text-red-500 ml-1">*</span>}</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(idx, e)} />
                                            </label>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 italic flex items-center gap-1">
                                <AlertCircle size={12} /> The first image is mandatory. Subsequent images are optional.
                            </p>
                        </div>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleAddToManifest} disabled={isLoading || isUploading} className="bg-[#0F3D3E] text-white px-8 h-12 text-lg shadow-xl hover:bg-[#C5A065]">
                            {isUploading ? 'Uploading...' : 'Add to Manifest'}
                        </Button>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="lg:col-span-1">
                     <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[#0F3D3E] flex items-center gap-2">
                                <Save size={18} /> Submission History
                            </h3>
                            <Button size="sm" onClick={handleExportHistory} title="Export to Excel" className="bg-[#107c41] text-white hover:bg-[#0c5b2f]">
                                <Download size={14} />
                            </Button>
                         </div>
                         
                         {Object.keys(historySummary).length === 0 ? (
                             <p className="text-sm text-gray-400 italic">No modifications submitted yet.</p>
                         ) : (
                             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                 {Object.entries(historySummary).map(([brand, items]: [string, any]) => {
                                     const imageCount = items.reduce((acc: number, item: any) => {
                                            return acc + ((item.image_urls && Array.isArray(item.image_urls)) ? item.image_urls.length : 0);
                                        }, 0);
                                        const approvedCount = items.filter((item: any) => item.status === 'approved').length;
                                        const totalCount = items.length;

                                        return (
                                            <div key={brand}
                                              className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:border-[#C5A065] transition-all hover:shadow-md"
                                              onClick={() => setSelectedBrandHistory(brand)}>
                                             <div className="p-4">
                                                 <div className="flex justify-between items-center mb-3">
                                                     <h4 className="font-bold text-[#0F3D3E] text-sm truncate pr-2">{brand}</h4>
                                                     <ExternalLink size={14} className="text-[#C5A065] flex-shrink-0" />
                                                 </div>
                                                 <div className="grid grid-cols-2 gap-2 text-xs">
                                                     <div className="bg-white p-2 rounded-lg border border-gray-100 flex flex-col items-center">
                                                         <span className="text-gray-500 font-semibold mb-1 text-[10px] uppercase tracking-wider">Submitted</span>
                                                         <span className="font-bold text-[#0F3D3E] text-base">{totalCount}</span>
                                                     </div>
                                                     <div className="bg-white p-2 rounded-lg border border-gray-100 flex flex-col items-center">
                                                         <span className="text-gray-500 font-semibold mb-1 text-[10px] uppercase tracking-wider">Images</span>
                                                         <span className="font-bold text-[#0F3D3E] text-base">{imageCount}</span>
                                                     </div>
                                                     <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex flex-col items-center col-span-2">
                                                         <span className="text-emerald-700 font-semibold mb-1 text-[10px] uppercase tracking-wider">Approved</span>
                                                         <span className="font-bold text-emerald-600 text-base">{approvedCount}</span>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         )}
                     </div>
                </div>
            </div>

            {/* Brand History Details Modal */}
            <Modal isOpen={!!selectedBrandHistory} onClose={() => setSelectedBrandHistory(null)} title={`${selectedBrandHistory} - Detailed History`} maxWidth="max-w-4xl">
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {selectedBrandHistory && historySummary[selectedBrandHistory] && historySummary[selectedBrandHistory].map((item: any) => {
                        const statusMeta = getModificationStatusMeta(item.status);
                        return (
                            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-4">
                                    <div>
                                        <div className="font-bold text-[#0F3D3E] text-base">{item.sku_gtin}</div>
                                        <div className="text-sm text-gray-600 font-medium mt-1">{item.name_en || 'No Name Provided'}</div>
                                        <div className="text-xs text-gray-500 mt-1">Submitted on: {new Date(item.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-sm ${statusMeta.className}`}>
                                        {statusMeta.label}
                                    </span>
                                </div>
                                
                                {(item.rejection_reason || item.status === 'revision_required') && (
                                    <div className="mb-4 rounded-lg bg-rose-50 border border-rose-100 p-3 text-sm text-rose-800">
                                        <span className="font-bold uppercase tracking-wider block mb-1">Admin Note / Revision Reason:</span>
                                        {item.rejection_reason || 'Please review and revise this submission.'}
                                    </div>
                                )}

                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Uploaded Images</h5>
                                    {item.image_urls && item.image_urls.length > 0 ? (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {item.image_urls.map((img: string, idx: number) => (
                                                <a key={idx} href={img} target="_blank" rel="norenoopener noreferrer" className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 overflow-hidden bg-white hover:opacity-80 transition-opacity">
                                                    <img src={img} alt={`Img ${idx}`} className="w-full h-full object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">No images uploaded.</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="outline" onClick={() => setSelectedBrandHistory(null)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};












