const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://brgjfnbmlelpqjlubcnc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZ2pmbmJtbGVscHFqbHViY25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2ODc5NTcsImV4cCI6MjA4NTI2Mzk1N30.GLCOVf5mnTem9wB3DJKbbXUUNNgGXt0waR6ZCLqhyJI');

async function fixIssues() {
  const emails = ['hisam.calbi@hmg.local', 'maram.alhamdan@hmg.local'];
  for (const email of emails) {
    console.log("Trying", email);
    const { data, error } = await supabase.auth.signInWithPassword({
        email, password: 'password'
    });
    if (!error) { console.log('Logged in!', email); return; }
    const { data2, error2 } = await supabase.auth.signInWithPassword({
        email, password: 'password123'
    });
    if (!error2) { console.log('Logged in!', email); return; }
  }
}
fixIssues();
