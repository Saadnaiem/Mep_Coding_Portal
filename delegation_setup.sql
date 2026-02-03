-- Create delegations table
CREATE TABLE IF NOT EXISTS delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id UUID REFERENCES profiles(id) NOT NULL,
    delegatee_id UUID REFERENCES profiles(id) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- Add RLS policies (Open for employees/admins typically, but for now simple)
ALTER TABLE delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for employees" ON delegations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type IN ('employee', 'admin')
        )
    );
