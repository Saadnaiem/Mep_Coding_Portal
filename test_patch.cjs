const fs = require('fs');

let ap = fs.readFileSync('components/ItemMasterAssignment.tsx', 'utf8');

// Update fetchItems signature
const targetStr1 = `    const fetchItems = async (page = currentPage) => {
        setLoading(true);
        // Request count alongside the data
        let query = supabase.from('item_master').select('*', { count: 'exact' })
            .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

        if (searchTerm) {`;

const replaceStr1 = `    const fetchItems = async (page = currentPage, overrides?: { dateFrom?: string, dateTo?: string }) => {
        const effDateFrom = overrides && overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom;
        const effDateTo = overrides && overrides.dateTo !== undefined ? overrides.dateTo : dateTo;
        
        setLoading(true);
        // Request count alongside the data
        let query = supabase.from('item_master').select('*', { count: 'exact' })
            .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

        if (searchTerm) {`;

ap = ap.replace(targetStr1, replaceStr1);

// Replace date fields in fetchItems
const targetStr2 = `        if (dateFrom) {
            query = query.gte('created_at', new Date(dateFrom).toISOString());
        }
        if (dateTo) {
            // Include the whole day by setting time to 23:59:59
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            query = query.lte('created_at', toDate.toISOString());
        }`;

const replaceStr2 = `        if (effDateFrom) {
            query = query.gte('created_at', new Date(effDateFrom).toISOString());
        }
        if (effDateTo) {
            // Include the whole day by setting time to 23:59:59
            const toDate = new Date(effDateTo);
            toDate.setHours(23, 59, 59, 999);
            query = query.lte('created_at', toDate.toISOString());
        }`;

ap = ap.replace(targetStr2, replaceStr2);

const targetStr3 = `            if (dateFrom) newCountQuery = newCountQuery.gte('created_at', new Date(dateFrom) > new Date('2026-03-21T00:00:00Z') ? new Date(dateFrom).toISOString() : '2026-03-21T00:00:00Z');
            if (dateTo) {
                const toD = new Date(dateTo);
                toD.setHours(23, 59, 59, 999);
                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());
            }`;

const replaceStr3 = `            if (effDateFrom) newCountQuery = newCountQuery.gte('created_at', new Date(effDateFrom) > new Date('2026-03-21T00:00:00Z') ? new Date(effDateFrom).toISOString() : '2026-03-21T00:00:00Z');
            if (effDateTo) {
                const toD = new Date(effDateTo);
                toD.setHours(23, 59, 59, 999);
                newCountQuery = newCountQuery.lte('created_at', toD.toISOString());
            }`;
            
ap = ap.replace(targetStr3, replaceStr3);

fs.writeFileSync('components/ItemMasterAssignment.tsx', ap, 'utf8');
console.log('ItemMasterAssignment updated step 1!');
