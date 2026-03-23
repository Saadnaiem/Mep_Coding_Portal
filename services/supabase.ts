
/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

/**
 * Fires a request to the generic Email Notification Edge Function
 */
export const sendEmailNotification = async (payload: {
  trigger_type: string;
  recipient_email: string;
  recipient_name: string;
  request_id?: string;
  dynamic_data?: any;
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-email-notification', {
      body: payload
    });
    
    if (error) {
      console.error("Error triggering email function:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Exception triggering email:", err);
    return false;
  }
};
