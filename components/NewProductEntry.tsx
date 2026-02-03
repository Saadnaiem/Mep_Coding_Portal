
import React, { useState, useMemo, useCallback } from 'react';
import { Layers, Plus, X, Image as ImageIcon, Download } from 'lucide-react';
import { Card, Input, Select, Button, FileInput } from './UI'; // Assuming UI.tsx is in the same folder
import { PRODUCT_HIERARCHY } from '../services/mockDb';
import { Product } from '../types';
import { supabase } from '../services/supabase';

interface NewProductEntryProps {
  onAddProduct: (product: Product) => void;
  defaultDivision?: string;
}

export const NewProductEntry: React.FC<NewProductEntryProps> = ({ onAddProduct, defaultDivision }) => {
  const [productForm, setProductForm] = useState({
    brand: '',
    name: '',
    name_ar: '',
    barcode: '',
    manufacturer: '',
    origin: '',
    storage: '',
    pack_size: '',
    division: defaultDivision || '',
    department: '',
    category: '',
    sub_category: '',
    class_name: '',
    uom: '',
    cost: '',
    retail: '',
    
    // Extended MEP Fields
    item_group: '',
    item_sub_group: '',
    purchasing_status: 'New',
    moh_discount_percentage: '',
    invoice_extra_discount: '',
    site_no: '',
    site_name: '',
    vendor_no: '',
    vendor_name: '',
    case_count: '',
    inner_pack_size: '',
    lot_indicator: 'No',
    primary_warehouse: '',
    vendor_system_code: '',
    lead_time: '',
    min_order_qty: '',
    rtv_allowed: 'No',
    category_manager: '',
    buyer: '',
    currency: 'SAR',
    taxable: 'No',
    erp_item_code: '',
    
    // New Fees
    product_listing_fees: '',

    // E-Commerce Assets
    short_description_en: '',
    short_description_ar: '',
    brand_ar: '',
    storage_condition_ar: '',
    composition_en: '',
    composition_ar: '',
    indication_en: '',
    indication_ar: '',
    how_to_use_en: '',
    how_to_use_ar: '',
    side_effects_en: '',
    side_effects_ar: '',
    tags_filters: '',
    suggested_filters: ''
  });

  const [productImages, setProductImages] = useState<string[]>(Array(6).fill(''));
  const [uploadingImages, setUploadingImages] = useState<boolean[]>(Array(6).fill(false));

  const handleImageUpload = async (file: File | null, index: number) => {
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `products/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      setUploadingImages(prev => {
          const newArr = [...prev];
          newArr[index] = true;
          return newArr;
      });

      try {
          const { error: uploadError } = await supabase.storage
            .from('portal-uploads')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('portal-uploads')
            .getPublicUrl(fileName);

          setProductImages(prev => {
              const newArr = [...prev];
              newArr[index] = publicUrl;
              return newArr;
          });
      } catch (error) {
          console.error("Upload error", error);
          alert("Failed to upload image");
      } finally {
          setUploadingImages(prev => {
            const newArr = [...prev];
            newArr[index] = false;
            return newArr;
          });
      }
  };

  const removeImage = (index: number) => {
      setProductImages(prev => {
          const newArr = [...prev];
          newArr[index] = '';
          return newArr;
      });
  };

  // Cascade Logic
  const divisions = useMemo(() => PRODUCT_HIERARCHY.map(d => d.name).filter(n => n !== "Grand Total"), []);
  
  const departments = useMemo(() => {
    const div = PRODUCT_HIERARCHY.find(d => d.name === productForm.division);
    return div?.children?.map(d => d.name) || [];
  }, [productForm.division]);

  const categories = useMemo(() => {
    const div = PRODUCT_HIERARCHY.find(d => d.name === productForm.division);
    const dept = div?.children?.find(d => d.name === productForm.department);
    return dept?.children?.map(c => c.name) || [];
  }, [productForm.division, productForm.department]);

  const subCategories = useMemo(() => {
    const div = PRODUCT_HIERARCHY.find(d => d.name === productForm.division);
    const dept = div?.children?.find(d => d.name === productForm.department);
    const cat = dept?.children?.find(c => c.name === productForm.category);
    return cat?.children?.map(s => s.name) || [];
  }, [productForm.division, productForm.department, productForm.category]);

  const classes = useMemo(() => {
    const div = PRODUCT_HIERARCHY.find(d => d.name === productForm.division);
    const dept = div?.children?.find(d => d.name === productForm.department);
    const cat = dept?.children?.find(c => c.name === productForm.category);
    const sub = cat?.children?.find(s => s.name === productForm.sub_category);
    return sub?.children?.map(cl => cl.name) || [];
  }, [productForm.division, productForm.department, productForm.category, productForm.sub_category]);

  const handleFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setProductForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleHierarchyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setProductForm(prev => {
          const next = { ...prev, [name]: value };
          if (name === 'division') { next.department = ''; next.category = ''; next.sub_category = ''; next.class_name = ''; }
          if (name === 'department') { next.category = ''; next.sub_category = ''; next.class_name = ''; }
          if (name === 'category') { next.sub_category = ''; next.class_name = ''; }
          if (name === 'sub_category') { next.class_name = ''; }
          return next;
      });
  }, []);

  const handleAddToManifest = () => {
    // Validation: Only First Image is mandatory per user request
    const firstImage = productImages[0];
    if (!firstImage || firstImage.trim() === '') {
        alert("Please upload at least the first image (Image 1) to proceed.");
        return;
    }
    
    /*
    // Previous validation logic disabled
    const optionalFields = ['item_group', 'item_sub_group', 'erp_item_code', 'category_manager', 'buyer', 'invoice_extra_discount', 'vendor_no', 'primary_warehouse', 'vendor_name', 'product_listing_fees'];
    const missingFields = Object.keys(productForm)
      .filter(key => !optionalFields.includes(key))
      .filter(key => {
        const val = productForm[key as keyof typeof productForm];
        return val === '' || val === null || val === undefined;
      });

    if (missingFields.length > 0) {
      alert(`Please fill in the following mandatory fields: ${missingFields.map(f => f.replace(/_/g, ' ')).join(', ')}`);
      return;
    }
    */
    
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      request_id: 'pending',
      brand: productForm.brand,
      product_name: productForm.name,
      product_name_ar: productForm.name_ar,
      item_description: `${productForm.name} - ${productForm.brand}`,
      barcode: productForm.barcode,
      manufacturer: productForm.manufacturer,
      country_of_origin: productForm.origin,
      storage_condition: productForm.storage,
      pack_size: productForm.pack_size,
      division: productForm.division,
      department: productForm.department,
      category: productForm.category,
      sub_category: productForm.sub_category,
      class_name: productForm.class_name,
      uom: productForm.uom,
      price_cost: parseFloat(productForm.cost) || 0,
      price_retail: parseFloat(productForm.retail) || 0,
      
      // MEP Mappings
      purchasing_status: productForm.purchasing_status,
      moh_discount_percentage: parseFloat(productForm.moh_discount_percentage) || 0,
      invoice_extra_discount: parseFloat(productForm.invoice_extra_discount) || 0,
      site_no: productForm.site_no,
      site_name: productForm.site_name,
      vendor_no: productForm.vendor_no,
      vendor_name: productForm.vendor_name,
      case_count: parseInt(productForm.case_count) || 0,
      inner_pack_size: productForm.inner_pack_size,
      lot_indicator: productForm.lot_indicator === 'Yes',
      primary_warehouse: productForm.primary_warehouse,
      vendor_system_code: productForm.vendor_system_code,
      lead_time: productForm.lead_time,
      min_order_qty: parseInt(productForm.min_order_qty) || 0,
      rtv_allowed: productForm.rtv_allowed === 'Yes',
      category_manager: productForm.category_manager,
      buyer: productForm.buyer,
      currency: productForm.currency,
      taxable: productForm.taxable === 'Yes',
      erp_item_code: productForm.erp_item_code,
      product_listing_fees: productForm.product_listing_fees,
      item_group: productForm.item_group,
      item_sub_group: productForm.item_sub_group,
      
      // E-Commerce Assets
      short_description_en: productForm.short_description_en,
      short_description_ar: productForm.short_description_ar,
      brand_ar: productForm.brand_ar,
      storage_condition_ar: productForm.storage_condition_ar,
      composition_en: productForm.composition_en,
      composition_ar: productForm.composition_ar,
      indication_en: productForm.indication_en,
      indication_ar: productForm.indication_ar,
      how_to_use_en: productForm.how_to_use_en,
      how_to_use_ar: productForm.how_to_use_ar,
      side_effects_en: productForm.side_effects_en,
      side_effects_ar: productForm.side_effects_ar,
      tags_filters: productForm.tags_filters,
      suggested_filters: productForm.suggested_filters,

      margin: (productForm.cost && productForm.retail && parseFloat(productForm.retail) > 0) 
            ? parseFloat(((1 - (parseFloat(productForm.cost) / parseFloat(productForm.retail))) * 100).toFixed(2)) 
            : 0,
      images: productImages.filter(url => url !== '')
    };

    onAddProduct(newProduct);

    // Reset Form (keep hierarchy and some fields?)
    setProductImages(Array(6).fill(''));
    setProductForm({ 
        ...productForm, 
        name: '', 
        name_ar: '', 
        barcode: '', 
        cost: '', 
        retail: '', 
        // Resetting others to avoid sticking values
        manufacturer: '',
        pack_size: '',
        vendor_system_code: '' 
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500">
        <Card title="Product Hierarchy Selection" className="border-t-4 border-t-[#0F3D3E]">
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-[#F0F4F4] rounded-2xl border border-gray-100 shadow-inner">
               <Select label="Division" name="division" options={divisions} value={productForm.division} onChange={handleHierarchyChange} />
               <Select label="Department" name="department" options={departments} value={productForm.department} onChange={handleHierarchyChange} disabled={!productForm.division} />
               <Select label="Category" name="category" options={categories} value={productForm.category} onChange={handleHierarchyChange} disabled={!productForm.department} />
               <Select label="Sub-Category" name="sub_category" options={subCategories} value={productForm.sub_category} onChange={handleHierarchyChange} disabled={!productForm.category} />
               <Select label="Class" name="class_name" options={classes} value={productForm.class_name} onChange={handleHierarchyChange} disabled={!productForm.sub_category} />
             </div>
        </Card>

        <Card title="Product Listing Specifications" className="border-t-4 border-t-[#C5A065]">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-6">
                  <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2">Basic Information</h4>
                  <Input label="Brand Name (English)" name="brand" placeholder="e.g. Panadol" value={productForm.brand} onChange={handleFieldChange} />
                  <Input label="English Description" name="name" placeholder="e.g. Panadol Advance 500mg" value={productForm.name} onChange={handleFieldChange} />
                  <Input label="Arabic Description" name="name_ar" placeholder="باندول ادفانس ٥٠٠ ملجم" value={productForm.name_ar} onChange={handleFieldChange} />
                  <Input label="GTIN / Barcode / IBC/UBC" name="barcode" placeholder="628XXXXXXXXXX" value={productForm.barcode} onChange={handleFieldChange} />
                  <Input label="Manufacturer" name="manufacturer" placeholder="GSK Ltd." value={productForm.manufacturer} onChange={handleFieldChange} />
                  <Input label="Country of Origin" name="origin" placeholder="Ireland" value={productForm.origin} onChange={handleFieldChange} />
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Vendor System Code" name="vendor_system_code" placeholder="Required" value={productForm.vendor_system_code} onChange={handleFieldChange} />
                     <Input label="Item Code (Optional)" name="erp_item_code" placeholder="Optional" value={productForm.erp_item_code} onChange={handleFieldChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Item Group (Optional)" name="item_group" placeholder="e.g. Pharma" value={productForm.item_group} onChange={handleFieldChange} />
                    <Input label="Item sub_Group" name="item_sub_group" placeholder="e.g. Sub Group" value={productForm.item_sub_group} onChange={handleFieldChange} />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2">Logistics & Supply</h4>
                  <Select label="Purchasing Status" name="purchasing_status" options={['In-Stock', 'Cross Docking', 'DSD']} value={productForm.purchasing_status} onChange={handleFieldChange} />
                  <Select label="Storage / Handling Temp" name="storage" options={['Room Temp (15-25C)', 'Chilled (2-8C)', 'Frozen (-18C)']} value={productForm.storage} onChange={handleFieldChange} />
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Pack Size" name="pack_size" placeholder="24 Tablets / Box" value={productForm.pack_size} onChange={handleFieldChange} />
                     <Select label="UoM" name="uom" options={['Each', 'Box', 'Carton', 'Bottle']} value={productForm.uom} onChange={handleFieldChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <Select label="Lot Indicator" name="lot_indicator" options={['Yes', 'No']} value={productForm.lot_indicator} onChange={handleFieldChange} />
                     <Select label="RTV Allowed" name="rtv_allowed" options={['Yes', 'No']} value={productForm.rtv_allowed} onChange={handleFieldChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Case Count" name="case_count" type="number" value={productForm.case_count} onChange={handleFieldChange} />
                     <Input label="Inner Pack Size" name="inner_pack_size" value={productForm.inner_pack_size} onChange={handleFieldChange} />
                  </div>
                  <Input label="Primary Warehouse (Optional)" name="primary_warehouse" placeholder="e.g. Riyadh Central" value={productForm.primary_warehouse} onChange={handleFieldChange} />
                  <Input label="Lead Time (Days)" name="lead_time" placeholder="e.g. 7 Days" value={productForm.lead_time} onChange={handleFieldChange} />
                </div>

                <div className="space-y-6">
                  <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2">Commercial Terms</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Vendor Price (Cost)" name="cost" type="number" value={productForm.cost} onChange={handleFieldChange} />
                    <Input label="Sales Price" name="retail" type="number" value={productForm.retail} onChange={handleFieldChange} />
                  </div>
                  <div className="bg-[#F0F4F4] p-4 rounded-xl border border-gray-100 mb-2">
                     <p className="text-[9px] font-black text-[#C5A065] uppercase tracking-widest mb-1">Estimated Margin</p>
                     <p className="text-2xl font-black text-[#0F3D3E]">
                        {productForm.cost && productForm.retail && parseFloat(productForm.retail) > 0
                           ? `${((1 - (parseFloat(productForm.cost) / parseFloat(productForm.retail))) * 100).toFixed(2)}%`
                           : '-'}
                     </p>
                  </div>
                  <Select label="Currency" name="currency" options={['SAR', 'USD', 'EUR']} value={productForm.currency} onChange={handleFieldChange} />
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="MOH Disc %" name="moh_discount_percentage" type="number" value={productForm.moh_discount_percentage} onChange={handleFieldChange} />
                     <Input label="Invoice Extra Disc (Optional)" name="invoice_extra_discount" type="number" value={productForm.invoice_extra_discount} onChange={handleFieldChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Taxable" name="taxable" options={['Yes', 'No']} value={productForm.taxable} onChange={handleFieldChange} />
                    <Input label="Minimum Order Qty" name="min_order_qty" type="number" value={productForm.min_order_qty} onChange={handleFieldChange} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <Input label="Site Name" name="site_name" placeholder="e.g. Dammam" value={productForm.site_name} onChange={handleFieldChange} />
                     <Input label="Site No" name="site_no" placeholder="e.g. 102" value={productForm.site_no} onChange={handleFieldChange} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                     <Input label="Vendor No (Optional)" name="vendor_no" placeholder="e.g. 120034" value={productForm.vendor_no} onChange={handleFieldChange} />
                     <Input label="Category Manager (Optional)" name="category_manager" placeholder="Name" value={productForm.category_manager} onChange={handleFieldChange} />
                  </div>
                  <div className="pt-4">
                     <Input label="Buyer (Optional)" name="buyer" placeholder="Name" value={productForm.buyer} onChange={handleFieldChange} />
                     <Input label="Product Listing Fees (Optional)" name="product_listing_fees" placeholder="Annual or One-time Fee" value={productForm.product_listing_fees} onChange={handleFieldChange} />
                  </div>
                </div>
             </div>

             <div className="pt-6 border-t border-gray-100 mt-6">
                <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4">E-Commerce Assets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Short Description (EN)" name="short_description_en" placeholder="Marketing hook..." value={productForm.short_description_en} onChange={handleFieldChange} />
                    <Input label="Short Description (AR)" name="short_description_ar" placeholder="الوصف المختصر..." value={productForm.short_description_ar} onChange={handleFieldChange} />

                    <Input label="Brand Name (AR)" name="brand_ar" placeholder="اسم العلامة التجارية..." value={productForm.brand_ar} onChange={handleFieldChange} />
                    <Input label="Storage Condition (AR)" name="storage_condition_ar" placeholder="ظروف التخزين..." value={productForm.storage_condition_ar} onChange={handleFieldChange} />

                    <Input label="Composition (EN)" name="composition_en" placeholder="Active ingredients..." value={productForm.composition_en} onChange={handleFieldChange} />
                    <Input label="Composition (AR)" name="composition_ar" placeholder="المكونات..." value={productForm.composition_ar} onChange={handleFieldChange} />

                    <Input label="Indication (EN)" name="indication_en" placeholder="Uses..." value={productForm.indication_en} onChange={handleFieldChange} />
                    <Input label="Indication (AR)" name="indication_ar" placeholder="دواعي الاستعمال..." value={productForm.indication_ar} onChange={handleFieldChange} />

                    <Input label="How To Use (EN)" name="how_to_use_en" placeholder="Instructions..." value={productForm.how_to_use_en} onChange={handleFieldChange} />
                    <Input label="How To Use (AR)" name="how_to_use_ar" placeholder="طريقة الاستخدام..." value={productForm.how_to_use_ar} onChange={handleFieldChange} />

                    <Input label="Side Effects / Warnings (EN)" name="side_effects_en" placeholder="Safety info..." value={productForm.side_effects_en} onChange={handleFieldChange} />
                    <Input label="Side Effects / Warnings (AR)" name="side_effects_ar" placeholder="الآثار الجانبية / تحذيرات..." value={productForm.side_effects_ar} onChange={handleFieldChange} />

                    <Input label="Tags / Filters" name="tags_filters" placeholder="Comma separated tags..." value={productForm.tags_filters} onChange={handleFieldChange} />
                    <Input label="Suggested Filters (Beauty)" name="suggested_filters" placeholder="For beauty products..." value={productForm.suggested_filters} onChange={handleFieldChange} />
                </div>
             </div>

             <div className="pt-6 border-t border-gray-100 mt-6">
                 <h5 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ImageIcon size={18} /> Product Images (Max 6)
                 </h5>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {productImages.map((img, idx) => (
                       <div key={idx} className="flex flex-col gap-2">
                          {/* Uniform Label outside the container */}
                          <label className="block text-[10px] font-serif font-bold text-[#0F3D3E]/70 uppercase tracking-widest ml-1">
                             Image {idx + 1} {idx === 0 && <span className="text-red-500">*</span>}
                          </label>

                          {img ? (
                              <div className="relative border border-gray-200 rounded-xl overflow-hidden h-40 bg-white shadow-sm group hover:shadow-md transition-all">
                                  <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-contain p-2" />
                                  
                                  {/* Overlay Actions */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-start justify-end p-2 gap-2">
                                      <a 
                                        href={img} 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white/90 text-[#0F3D3E] rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                                        title="Download/View Full Size"
                                      >
                                          <Download size={14} />
                                      </a>
                                      <button 
                                        onClick={() => removeImage(idx)} 
                                        className="bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                                        title="Remove Image"
                                      >
                                          <X size={14} />
                                      </button>
                                  </div>

                                  {/* Alt Text / Footer */}
                                  <div className="absolute bottom-0 inset-x-0 bg-white/90 border-t border-gray-100 p-1 text-center">
                                      <p className="text-[9px] text-gray-400 font-mono truncate">{img.split('/').pop()?.split('?')[0] || `image-0${idx+1}.jpg`}</p>
                                  </div>
                              </div>
                          ) : (
                              <div className={`relative border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center bg-[#F0F4F4]/30 hover:bg-white hover:border-[#C5A065] transition-all duration-300 group cursor-pointer ${uploadingImages[idx] ? 'opacity-50 cursor-wait' : ''}`}>
                                <input 
                                    type="file" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    disabled={uploadingImages[idx]}
                                    onChange={(e) => handleImageUpload(e.target.files ? e.target.files[0] : null, idx)}
                                    accept="image/*"
                                 />
                                 <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform duration-300">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-[#0F3D3E] group-hover:text-[#C5A065] transition-colors border border-gray-50">
                                        {uploadingImages[idx] ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0F3D3E] border-t-transparent"></div>
                                        ) : (
                                            <Plus size={20} />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-[10px] font-bold text-[#0F3D3E] uppercase tracking-widest group-hover:text-[#C5A065]">
                                            {uploadingImages[idx] ? 'Uploading...' : 'Upload Image'}
                                        </span>
                                    </div>
                                 </div>
                              </div>
                          )}
                       </div>
                    ))}
                 </div>
              </div>

             <div className="pt-6"><Button className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-[#0F3D3E] hover:bg-[#C5A065] text-white shadow-xl transition-all duration-300" onClick={handleAddToManifest}>Add Product to Manifest <Plus size={20} /></Button></div>
        </Card>
    </div>
  );
};
