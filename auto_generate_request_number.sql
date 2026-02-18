-- Function to generate incremental request number
-- Format: HPL-YYYY-MM-SEQUENCE (e.g., HPL-2026-02-001)

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
    curr_year text;
    curr_month text;
    prefix text;
    last_val text;
    next_seq int;
BEGIN
    -- Get current year and month
    curr_year := to_char(now(), 'YYYY');
    curr_month := to_char(now(), 'MM');
    prefix := 'HPL-' || curr_year || '-' || curr_month || '-';
    
    -- Find the last request number for this month
    -- We order by length first to handle 9 vs 10 correctly, then by the text value
    SELECT request_number 
    INTO last_val 
    FROM product_requests 
    WHERE request_number LIKE prefix || '%' 
    ORDER BY length(request_number) DESC, request_number DESC 
    LIMIT 1;
    
    -- Calculate next sequence
    IF last_val IS NULL THEN
        next_seq := 1;
    ELSE
        -- Extract the number part and increment
        -- We handle potential non-numeric suffixes or errors by regex or simple substring if format is strict
        -- substring(string from pattern) can be used.
        -- simpler: substring from length(prefix)+1
        BEGIN
            next_seq := substring(last_val from length(prefix) + 1)::int + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Fallback if parsing fails (e.g. old format existed)
            next_seq := 1; 
        END;
    END IF;
    
    -- Set the new ID with 3-digit padding (001, 002... 999, 1000)
    NEW.request_number := prefix || lpad(next_seq::text, 3, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS set_request_number_trigger ON product_requests;
CREATE TRIGGER set_request_number_trigger
BEFORE INSERT ON product_requests
FOR EACH ROW
EXECUTE FUNCTION generate_request_number();
    