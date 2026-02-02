
import React, { useState, useEffect } from 'react';
import { Card, Input, Select, FileInput } from './UI';
import { Vendor } from '../types';
import { supabase } from '../services/supabase';
import { Save, CheckCircle } from 'lucide-react';

interface NewVendorFormProps {
  currentVendor: Partial<Vendor>;
  onChange: (updates: Partial<Vendor>) => void;
  userRole?: string;
}

export const NewVendorForm: React.FC<NewVendorFormProps> = ({ currentVendor, onChange, userRole }) => {
  // Use local state for immediate feedback
  const [localForm, setLocalForm] = useState<Partial<Vendor>>(currentVendor || {});
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Keep local state in sync if prop changes from outside (e.g. initial load)
  useEffect(() => {
      // If we haven't initialized from a populated vendor object yet, and one arrives:
      if (!hasInitialized && currentVendor && Object.keys(currentVendor).length > 0) {
          setLocalForm(currentVendor);
          setHasInitialized(true);
      }
  }, [currentVendor, hasInitialized]);

  // Debounce the parent update
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localForm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [localForm]); // Only run when localForm changes

  // Update loop: Input -> localForm --(effect w/ debounce)--> onChange -> parent
  // Note: We need to be careful not to create a loop locally.
  // The 'useEffect' above for syncing from props might overlap with the write back.
  // However, since we spread `...prev` and `...currentVendor`, if they match, no re-render.
  // But to be safer, we can just use the local state for inputs and only sync up.
  
  const handleChange = (field: keyof Vendor, value: any) => {
    setLocalForm(prev => ({ ...prev, [field]: value }));
  };

  const getValue = (field: keyof Vendor): string | number | readonly string[] => {
      const val = localForm[field];
      return val !== undefined && val !== null ? val : '';
  };
  
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  const handleUpload = async (file: File | null, fieldName: keyof Vendor) => {
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `vendor-docs/${fileName}`;

      setUploadingState(prev => ({ ...prev, [fieldName]: true }));

      try {
          const { error: uploadError } = await supabase.storage
            .from('portal-uploads')
            .upload(filePath, file);

          if (uploadError) {
              throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('portal-uploads')
            .getPublicUrl(filePath);

          handleChange(fieldName, publicUrl);
      } catch (error) {
          console.error('Error uploading file:', error);
          alert('Error uploading file. Please try again.');
      } finally {
          setUploadingState(prev => ({ ...prev, [fieldName]: false }));
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500">
        <Card title="New Vendor Registration Details" className="border-t-4 border-t-[#0F3D3E]">
             <div className="space-y-6">
                 {/* Basic Info */}
                 <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2">Company Information</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Supplier Name (Legal)" value={getValue('company_name')} onChange={e => handleChange('company_name', e.target.value)} />
                    <Input label="CR Number" value={getValue('cr_number')} onChange={e => handleChange('cr_number', e.target.value)} />
                    <Input label="CR Expiry Date" type="date" value={getValue('cr_expiry_date')} onChange={e => handleChange('cr_expiry_date', e.target.value)} />
                    <Input label="VAT Number" value={getValue('vat_number')} onChange={e => handleChange('vat_number', e.target.value)} />
                    <Input label="Country" value={getValue('country')} onChange={e => handleChange('country', e.target.value)} />
                    <Input label="City" value={getValue('city')} onChange={e => handleChange('city', e.target.value)} />
                    <div className="md:col-span-2">
                         <Input label="Full Address" value={getValue('address')} onChange={e => handleChange('address', e.target.value)} />
                    </div>
                    
                    {/* New Vendor Registration Fees */}
                    <Input 
                        label="New Vendor Registration Fees" 
                        required={userRole === 'category_manager'} 
                        value={getValue('new_vendor_registration_fees')} 
                        onChange={e => handleChange('new_vendor_registration_fees', e.target.value)} 
                        placeholder={userRole === 'category_manager' ? "Required" : "Optional"}
                    />

                 </div>

                 {/* Contact Info */}
                 <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2 pt-4">Contact Details</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Contact Person Name" required value={getValue('contact_person_name')} onChange={e => handleChange('contact_person_name', e.target.value)} />
                    <Input label="Email Address" required type="email" value={getValue('email_address')} onChange={e => handleChange('email_address', e.target.value)} />
                    <Input label="Mobile Number" required value={getValue('mobile_number')} onChange={e => handleChange('mobile_number', e.target.value)} />
                    <Input label="Phone Number" value={getValue('phone_number')} onChange={e => handleChange('phone_number', e.target.value)} />
                    <Input label="Fax" value={getValue('fax')} onChange={e => handleChange('fax', e.target.value)} />
                 </div>

                 {/* Financials */}
                 <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2 pt-4">Financial & Banking</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select label="Invoice Currency" options={['SAR', 'USD', 'EUR', 'GBP']} value={localForm.invoice_currency || 'SAR'} onChange={e => handleChange('invoice_currency', e.target.value)} />
                    <Select label="Payment Currency" options={['SAR', 'USD', 'EUR', 'GBP']} value={localForm.payment_currency || 'SAR'} onChange={e => handleChange('payment_currency', e.target.value)} />
                    <Input label="Payment Terms" placeholder="e.g 60 Days" value={getValue('payment_terms')} onChange={e => handleChange('payment_terms', e.target.value)} />
                    <Select label="Payment Method" options={['Bank Transfer', 'Check', 'Cash']} value={getValue('payment_method')} onChange={e => handleChange('payment_method', e.target.value)} />
                    
                    <Input label="Bank Name" value={getValue('bank_name')} onChange={e => handleChange('bank_name', e.target.value)} />
                    <Input label="Branch" value={getValue('bank_branch')} onChange={e => handleChange('bank_branch', e.target.value)} />
                    <Input label="Branch Address" value={getValue('branch_address')} onChange={e => handleChange('branch_address', e.target.value)} />
                    <Input label="Swift Code" value={getValue('swift_code')} onChange={e => handleChange('swift_code', e.target.value)} />
                    <Input label="IBAN Number" value={getValue('iban_number')} onChange={e => handleChange('iban_number', e.target.value)} />
                    <Input label="Bank Account Number" value={getValue('bank_account_number')} onChange={e => handleChange('bank_account_number', e.target.value)} />
                    <div className="md:col-span-2">
                        <Input label="Supplier Name in Bank Account" value={getValue('supplier_name_in_bank')} onChange={e => handleChange('supplier_name_in_bank', e.target.value)} />
                    </div>
                 </div>

                  {/* Logistics */}
                 <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2 pt-4">Logistics Defaults</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Ship To Address" value={getValue('ship_to')} onChange={e => handleChange('ship_to', e.target.value)} />
                    <Input label="Bill To Address" value={getValue('bill_to')} onChange={e => handleChange('bill_to', e.target.value)} />
                 </div>

                 {/* Uploads */}
                 <h4 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 border-b border-[#C5A065]/30 pb-2 pt-4">Required Documents</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <FileInput label="CR Document" required onFileSelect={(f) => handleUpload(f, 'cr_document_url')} loading={uploadingState['cr_document_url']} accept=".pdf,.png,.jpg,.jpeg" />
                        {localForm.cr_document_url && <a href={localForm.cr_document_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                    <div>
                        <FileInput label="VAT Certificate" required onFileSelect={(f) => handleUpload(f, 'vat_certificate_url')} loading={uploadingState['vat_certificate_url']} accept=".pdf,.png,.jpg,.jpeg" />
                        {localForm.vat_certificate_url && <a href={localForm.vat_certificate_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                    <div>
                        <FileInput label="Bank Certificate" required onFileSelect={(f) => handleUpload(f, 'bank_certificate_url')} loading={uploadingState['bank_certificate_url']} accept=".pdf,.png,.jpg,.jpeg" />
                        {localForm.bank_certificate_url && <a href={localForm.bank_certificate_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                    <div>
                         <FileInput label="Product Catalog / Portfolio" onFileSelect={(f) => handleUpload(f, 'catalog_url')} loading={uploadingState['catalog_url']} accept=".pdf,.xlsx,.xls,.csv" />
                         {localForm.catalog_url && <a href={localForm.catalog_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                    <div>
                         <FileInput label="Guarantee Letter" required onFileSelect={(f) => handleUpload(f, 'guarantee_letter_url')} loading={uploadingState['guarantee_letter_url']} accept=".pdf,.png,.jpg,.jpeg" />
                         {localForm.guarantee_letter_url && <a href={localForm.guarantee_letter_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                    <div>
                         <FileInput label="Non-Refundable Listing Fees" required onFileSelect={(f) => handleUpload(f, 'listing_fees_document_url')} loading={uploadingState['listing_fees_document_url']} accept=".pdf,.png,.jpg,.jpeg" />
                         {localForm.listing_fees_document_url && <a href={localForm.listing_fees_document_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                    <div className="md:col-span-2">
                        <FileInput label="Other Supporting Documents" onFileSelect={(f) => handleUpload(f, 'other_documents_url')} loading={uploadingState['other_documents_url']} accept=".pdf,.zip,.rar" />
                        {localForm.other_documents_url && <a href={localForm.other_documents_url} target="_blank" className="text-[10px] text-green-600 flex items-center gap-1 mt-1 font-bold"><CheckCircle size={12}/> File Uploaded</a>}
                    </div>
                 </div>
             </div>
        </Card>
    </div>
  );
};
