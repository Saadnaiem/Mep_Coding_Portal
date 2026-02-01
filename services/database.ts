import { supabase } from './supabase';
import { ProductRequest, Product, StepAction, Profile, Employee } from '../types';

class DatabaseService {
  
  // --- Requests ---
  async fetchRequests(): Promise<ProductRequest[]> {
    const { data, error } = await supabase
      .from('product_requests')
      .select(`
        *,
        vendor:vendors(*)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
    return data || [];
  }

  async fetchRequestById(id: string): Promise<ProductRequest | null> {
    const { data, error } = await supabase
      .from('product_requests')
      .select(`
        *,
        vendor:vendors(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async createRequest(request: Partial<ProductRequest>): Promise<ProductRequest | null> {
    const { data, error } = await supabase
      .from('product_requests')
      .insert(request)
      .select()
      .single();

    if (error) {
      console.error('Error creating request:', error);
      return null;
    }
    return data;
  }

  async updateRequest(id: string, updates: Partial<ProductRequest>): Promise<boolean> {
    const { error } = await supabase
      .from('product_requests')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating request:', error);
      return false;
    }
    return true;
  }

  // --- Products ---
  async fetchProducts(requestId?: string): Promise<Product[]> {
    let query = supabase.from('products').select('*');
    if (requestId) {
      query = query.eq('request_id', requestId);
    }
    
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    return data || [];
  }

  async createProducts(products: Partial<Product>[]): Promise<boolean> {
    console.log("DatabaseService: createProducts called with", products.length, "products", products);
    
    // Ensure all numeric fields are actually numbers to avoid type errors
    // also remove 'margin' calculated field which is not in DB
    const verifiedProducts = products.map(p => {
        // Create a copy to avoid mutating state
        const safeP: any = { ...p };
        
        // Remove calculated fields that are not in DB
        delete safeP.margin; 
        delete safeP.vendor_name; // Assuming vendor_name is joined view, not column. Use vendor_no if needed or check schema.
        
        return {
          ...safeP,
          price_cost: Number(safeP.price_cost),
          price_retail: Number(safeP.price_retail),
          moh_discount_percentage: safeP.moh_discount_percentage ? Number(safeP.moh_discount_percentage) : undefined,
          invoice_extra_discount: safeP.invoice_extra_discount ? Number(safeP.invoice_extra_discount) : undefined,
          min_order_qty: safeP.min_order_qty ? Number(safeP.min_order_qty) : undefined,
          case_count: safeP.case_count ? Number(safeP.case_count) : undefined
        };
    });

    const { data, error } = await supabase
      .from('products')
      .insert(verifiedProducts)
      .select();

    if (error) {
      console.error('Error creating products details:', error);
      alert(`Error saving products: ${error.message}`); // Alert the user directly
      return false;
    }
    
    console.log("DatabaseService: createProducts success", data);
    return true;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      return false;
    }
    return true;
  }

  // --- Actions / History ---
  async fetchActions(requestId: string): Promise<StepAction[]> {
    let query = supabase
      .from('request_history')
      .select(`
        *,
        actor:profiles(full_name, role)
      `)
      .order('created_at', { ascending: false });
    
    // Only filter if requestId is provided
    if (requestId) {
        query = query.eq('request_id', requestId);
    }

    const { data, error } = await query;

    if (error) return [];
    
    return data.map((item: any) => ({
      ...item,
      action_at: item.created_at, // Map DB column 'created_at' to Type 'action_at'
      actor_name: item.actor?.full_name || 'Unknown',
      actor_role: item.actor?.role || ''
    }));
  }

  async logAction(action: Partial<StepAction>): Promise<boolean> {
    const { error } = await supabase
      .from('request_history')
      .insert({
        request_id: action.request_id,
        user_id: action.actor_id,
        action: action.action,
        comment: action.comment,
        step_number: action.step_number,
        created_at: action.action_at || new Date().toISOString()
      });

    if (error) {
      console.error('Error logging action:', error);
      return false;
    }
    return true;
  }

  // --- Profiles ---
  async fetchProfile(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }
  
  async fetchProfileByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  async fetchEmployees(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
       console.error("Error fetching employees", error);
       return [];
    }
    return data;
  }

  async updateVendor(id: string, updates: Partial<any>): Promise<boolean> {
    const { error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating vendor:', error);
      return false;
    }
    return true;
  }

  // --- Workflow Steps ---
  async fetchWorkflowSteps(): Promise<any[]> {
    const { data, error } = await supabase
        .from('workflow_steps')
        .select('*')
        .order('step_number', { ascending: true });
        
    if (error) return [];
    return data;
  }

  async getVendorByContactId(userId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('contact_person_id', userId)
      .maybeSingle();
    
    // Use maybeSingle to suppress error on 406/Not Found
    if (error) {
      console.error('Error fetching vendor:', error);
      return null;
    }
    return data;
  }

  async createVendor(vendor: Partial<any>): Promise<any | null> {
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      return null;
    }
    return data;
  }
}

export const db = new DatabaseService();
