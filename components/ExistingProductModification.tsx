import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/database';
import { supabase } from '../services/supabase';
import { ExistingProductModification as ExistingProductModificationType, Profile } from '../types';
import { Button, Card, Input} from './UI';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExistingProductModificationProps {
    user: Profile;
    vendorId?: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export const ExistingProductModification: React.FC<ExistingProductModificationProps> = ({ user, vendorId, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState<Partial<ExistingProductModificationType>>({
        sku_gtin: '',
        product_name_en: '',
        product_name_ar: '',
        brand_en: '',
        brand_ar: '',
        status: 'submitted'
    });
    
    // Modification History
    const [history, setHistory] = useState<any[]>([]);
    
    // File Upload State
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [manifest, setManifest] = useState<Partial<ExistingProductModificationType>[]>([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await db.fetchExistingModifications();
        if (vendorId) {
             setHistory(data);
        }
    };

    // Derived: Group history by Date and Brand
    const historySummary = useMemo(() => {
        // Structure: { "YYYY-MM-DD": { "BrandName": { count: 5, images: 10 } } }
        const groups: Record<string, Record<string, { count: number, images: number }>> = {};
        
        // Sort history by date descending first
        const sorted = [...history].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        sorted.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString();
            const brand = item.brand_en || 'Unknown Brand';
            
            if (!groups[date]) groups[date] = {};
            if (!groups[date][brand]) groups[date][brand] = { count: 0, images: 0 };
            
            groups[date][brand].count++;
            groups[date][brand].images += (item.image_urls?.length || 0);
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
        
        history.forEach(item => {
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
             const images = item.image_urls || [];
             const imageSlots = new Array(6).fill('');
             const meta = [new Date(item.created_at).toLocaleDateString()];

             const fullRowData = [...row, ...imageSlots, ...meta];
             const newRow = worksheet.addRow(fullRowData);

             images.forEach((img: string, idx: number) => {
                 if (idx < 6) {
                    try {
                         // Data columns end at 27 (0-26). Image 1 is 27 (28th column). Actually headers[27] is Image 1.
                         const colIndex = 28 + idx; // 1-based index (27 + 1)
                         
                         const suffix = idx === 0 ? '' : `_${idx + 1}`;
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
        saveAs(new Blob([buffer]), `My_Existing_Product_Mods_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleChange = (field: keyof ExistingProductModificationType, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (files.length + newFiles.length > 6) {
                alert("Maximum 6 images allowed.");
                return;
            }
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        setIsUploading(true);
        const uploadedUrls: string[] = [];
        const erpCode = formData.sku_gtin || 'temp';
        const timestamp = Date.now();
        
        const folderName = `existing_modifications/${vendorId}/${erpCode}_${timestamp}`;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const sanitizedErp = erpCode.replace(/[^a-zA-Z0-9-_]/g, '');
            const suffix = i === 0 ? '' : `_${i + 1}`;
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
        
        setIsUploading(true);
        let imageUrls: string[] = [];
        if (files.length > 0) {
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
        setFiles([]);
    };

    const handleRemoveFromManifest = (index: number) => {
        setManifest(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinalSubmit = async () => {
        if (manifest.length === 0) {
            alert("No products in manifest to submit.");
            return;
        }

        setIsLoading(true);
        let successCount = 0;
        
        for (const item of manifest) {
            const success = await db.createExistingModification(item);
            if (success) successCount++;
        }

        setIsLoading(false);
        if (successCount === manifest.length) {
            alert(`Successfully submitted ${successCount} modification requests!`);
            setManifest([]);
            loadHistory();
            if (onSuccess) onSuccess(); 
        } else {
            alert(`Submitted ${successCount} out of ${manifest.length}. Some requests failed.`);
            loadHistory();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-[#0F3D3E]">Existing Products Modification</h2>
                    <p className="text-gray-500 text-sm">Update data for products already listed.</p>
                </div>
                <Button variant="outline" onClick={onCancel}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
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
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Al Habib ERP Code *</label>
                                <Input value={formData.sku_gtin || ''} onChange={e => handleChange('sku_gtin', e.target.value)} placeholder="Enter ERP Code..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name (EN)</label>
                                <Input value={formData.product_name_en || ''} onChange={e => handleChange('product_name_en', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name (AR)</label>
                                <Input value={formData.product_name_ar || ''} onChange={e => handleChange('product_name_ar', e.target.value)} className="text-right font-serif" />
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
                             <Input label="Category" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} />
                             <Input label="Group" value={formData.group || ''} onChange={e => handleChange('group', e.target.value)} />
                             <Input label="Subgroup" value={formData.subgroup || ''} onChange={e => handleChange('subgroup', e.target.value)} />
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
                             <div className="flex items-center gap-4">
                                 <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                     <Plus size={16} /> <span>Add Images</span>
                                     <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                                 </label>
                                 <span className="text-xs text-gray-400">{files.length} / 6 selected</span>
                             </div>
                             
                             {files.length > 0 && (
                                 <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                     {files.map((file, idx) => (
                                         <div key={idx} className="relative group aspect-square bg-gray-50 rounded border flex items-center justify-center overflow-hidden">
                                             <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                             <button onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Trash2 size={10} />
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             )}
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
                            <Button variant="outline" size="sm" onClick={handleExportHistory} title="Export to Excel">
                                <Download size={14} />
                            </Button>
                         </div>
                         
                         {Object.keys(historySummary).length === 0 ? (
                             <p className="text-sm text-gray-400 italic">No modifications submitted yet.</p>
                         ) : (
                             <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                                 {Object.entries(historySummary).map(([date, brands]) => (
                                     <div key={date}>
                                         <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b pb-1">{date}</h4>
                                         <div className="space-y-2">
                                             {Object.entries(brands).map(([brand, stats]) => (
                                                 <div key={brand} className="p-3 bg-gray-50 rounded border border-gray-100 text-xs hover:bg-[#F0F4F4] transition-colors">
                                                     <div className="font-bold text-[#0F3D3E] text-sm mb-1">{brand}</div>
                                                     <div className="flex justify-between items-center text-gray-500">
                                                         <span>{stats.count} Products</span>
                                                         <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                             <ImageIcon size={10} /> {stats.images}
                                                         </div>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                     </div>
                </div>
            </div>
        </div>
    );
};
