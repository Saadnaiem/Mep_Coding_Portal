import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Input, Select } from './UI'; // Reuse UI components
import { db } from '../services/database';
import { ProductRequest, Product } from '../types';
import { Download, Calendar, Filter, Search } from 'lucide-react';
import * as XLSX from 'xlsx'; // Need to check if installed, if not fallback to CSV

// Interfaces
interface ReportItem {
    id: string;
    request_id: string;
    created_at: string;
    vendor_name: string;
    vendor_type: string;
    contact_person: string;
    contact_mobile: string;
    email: string;
    brand: string;
    division: string;
    department: string;
    category: string;
    sub_category: string;
    class_name: string;
    description_en: string;
    description_ar: string;
    item_code: string;
    cost_price: number;
    sales_price: number;
    margin: number;
}

export const Reports: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [rawData, setRawData] = useState<ReportItem[]>([]);
    
    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedVendor, setSelectedVendor] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Requests (contains Vendor info)
            const requests = await db.fetchRequests(); // returns ProductRequest[]
            
            // 2. Fetch All Products
            const products = await db.fetchProducts(); // returns Product[]

            // 3. Join logic
            const joinedData: ReportItem[] = products.map(p => {
                const req = requests.find(r => r.id === p.request_id);
                const cost = Number(p.price_cost) || 0;
                const retail = Number(p.price_retail) || 0;
                const margin = (retail > 0 && cost > 0) 
                    ? ((1 - (cost / retail)) * 100) 
                    : 0;

                return {
                    id: p.id,
                    request_id: p.request_id,
                    created_at: req?.created_at || '',
                    vendor_name: req?.vendor?.company_name || 'N/A',
                    vendor_type: req?.vendor?.vendor_type || 'N/A',
                    contact_person: req?.vendor?.contact_person_name || 'N/A',
                    contact_mobile: req?.vendor?.mobile_number || 'N/A',
                    email: req?.vendor?.email_address || 'N/A',
                    brand: p.brand || '',
                    division: p.division || '',
                    department: p.department || '',
                    category: p.category || '',
                    sub_category: p.sub_category || '',
                    class_name: p.class_name || '',
                    description_en: p.product_name || '',
                    description_ar: p.product_name_ar || '',
                    item_code: p.erp_item_code || 'N/A',
                    cost_price: cost,
                    sales_price: retail,
                    margin: parseFloat(margin.toFixed(2))
                };
            });

            // Sort by date descending
            joinedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setRawData(joinedData);
        } catch (error) {
            console.error("Failed to load report data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        return rawData.filter(item => {
            // Date Filter
            const itemDate = new Date(item.created_at).setHours(0,0,0,0);
            const fromDate = dateFrom ? new Date(dateFrom).setHours(0,0,0,0) : null;
            const toDate = dateTo ? new Date(dateTo).setHours(0,0,0,0) : null;

            if (fromDate && itemDate < fromDate) return false;
            if (toDate && itemDate > toDate) return false;

            // Vendor Filter
            if (selectedVendor && item.vendor_name !== selectedVendor) return false;

            // Text Search (Brand, Products, Class, Division)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const match = 
                    item.brand.toLowerCase().includes(q) ||
                    item.division.toLowerCase().includes(q) ||
                    item.class_name.toLowerCase().includes(q) ||
                    item.description_en.toLowerCase().includes(q) ||
                    item.description_ar.toLowerCase().includes(q) ||
                    item.item_code.toLowerCase().includes(q);
                if (!match) return false;
            }

            return true;
        });
    }, [rawData, dateFrom, dateTo, selectedVendor, searchQuery]);

    // Unique Vendors for Dropdown
    const vendors = useMemo(() => {
        const unique = new Set(rawData.map(i => i.vendor_name).filter(n => n !== 'N/A'));
        return Array.from(unique).sort();
    }, [rawData]);

    // Export to Excel/CSV
    const handleExport = () => {
        const csvContent = [
            ['Registration Date', 'Vendor', 'Vendor Type', 'Email', 'Contact Person', 'Mobile', 'Division', 'Department', 'Category', 'Sub-Category', 'Class', 'Brand', 'Item Code', 'Description (EN)', 'Description (AR)', 'Cost Price', 'Sales Price', 'Margin %'],
            ...filteredData.map(item => [
                new Date(item.created_at).toLocaleDateString(),
                `"${item.vendor_name}"`, // Quote CSV fields for safety
                `"${item.vendor_type}"`,
                `"${item.email}"`,
                `"${item.contact_person}"`,
                `"${item.contact_mobile}"`,
                `"${item.division}"`,
                `"${item.department}"`,
                `"${item.category}"`,
                `"${item.sub_category}"`,
                `"${item.class_name}"`,
                `"${item.brand}"`,
                `"${item.item_code}"`,
                `"${item.description_en}"`,
                `"${item.description_ar}"`,
                item.cost_price.toFixed(2),
                item.sales_price.toFixed(2),
                `${item.margin}%`
            ])
        ].map(e => e.join(",")).join("\n");

        // Add Byte Order Mark (BOM) for Excel UTF-8 compatibility
        const BOM = "\uFEFF";
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `MEP_Product_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div>
                   <h2 className="text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">Master Report</h2>
                   <p className="text-[#C5A065] text-sm font-bold tracking-wide">Extract products, prices, and vendor data</p>
                </div>
                <Button onClick={handleExport} className="px-6 h-12 bg-[#0F3D3E] text-white hover:bg-[#C5A065] shadow-lg">
                    <Download className="mr-2" size={20} /> Export CSV
                </Button>
            </div>

            <Card className="border-t-4 border-t-[#0F3D3E]">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-2">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Date From</label>
                        <input type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none focus:border-[#C5A065]" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Date To</label>
                        <input type="date" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none focus:border-[#C5A065]" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Vendor</label>
                        <select className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm outline-none focus:border-[#C5A065]" value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)}>
                            <option value="">All Vendors</option>
                            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                className="w-full p-3 pl-10 bg-white rounded-xl border border-gray-200 text-sm outline-none focus:border-[#C5A065] shadow-sm" 
                                placeholder="Brand, Product, Code..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                     </div>
                </div>
            </Card>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#Fdfbf7] border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Date</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Vendor Details</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Classification</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Brand</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Item Code</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider w-[20%]">Description (EN)</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider w-[20%] text-right">Description (AR)</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Cost</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Retail</th>
                                <th className="p-4 text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider">Margin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={10} className="p-8 text-center text-gray-400">Loading data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={10} className="p-8 text-center text-gray-400">No matching records found.</td></tr>
                            ) : (
                                filteredData.map(item => (
                                    <tr key={item.id} className="hover:bg-[#F0F4F4]/50 transition-colors text-sm">
                                        <td className="p-4 text-gray-500 font-mono text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-[#0F3D3E]">{item.vendor_name}</span>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded w-fit ${item.vendor_type === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    {item.vendor_type === 'new' ? 'New Vendor' : 'Existing'}
                                                </span>
                                                <span className="text-xs text-gray-500">{item.contact_person}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">{item.contact_mobile}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-[10px]">
                                                <span className="font-bold text-[#0F3D3E] bg-[#F0F4F4] px-2 py-0.5 rounded w-fit">{item.division}</span>
                                                <span className="text-gray-500 pl-1">› {item.department}</span>
                                                <span className="text-gray-500 pl-1">› {item.category}</span>
                                                <span className="text-gray-500 pl-1">› {item.sub_category}</span>
                                                <span className="text-gray-500 pl-1">› {item.class_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">{item.brand}</td>
                                        <td className="p-4 font-mono text-xs text-gray-400">{item.item_code}</td>
                                        <td className="p-4 text-[#0F3D3E]">{item.description_en}</td>
                                        <td className="p-4 text-right font-serif">{item.description_ar}</td>
                                        <td className="p-4 font-mono">{item.cost_price.toFixed(2)}</td>
                                        <td className="p-4 font-mono">{item.sales_price.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.margin < 20 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                                {item.margin.toFixed(2)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                    <span>Showing {filteredData.length} records</span>
                </div>
            </div>
        </div>
    );
};
