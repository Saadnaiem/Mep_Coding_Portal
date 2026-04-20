
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
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token || supabaseAnonKey;

    const res = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error(`Edge Function Error (${res.status}):`, responseText);
      return { success: false, error: `Status ${res.status} - ${responseText}` };
    }
    
    let jsonData;
    try {
      jsonData = JSON.parse(responseText);
    } catch(e) {
      jsonData = responseText;
    }
    
    return { success: true, data: jsonData };
  } catch (err: any) {
    console.error("Exception triggering email:", err);
    return { success: false, error: err.message || err };
  }
};
