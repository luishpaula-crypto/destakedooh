-- Create Quotes Table if not exists (base structure)
CREATE TABLE IF NOT EXISTS quotes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

-- Add columns to quotes table (safe for existing tables)
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS control_number SERIAL,
ADD COLUMN IF NOT EXISTS campaign_name text,
ADD COLUMN IF NOT EXISTS client jsonb,
ADD COLUMN IF NOT EXISTS assets jsonb,
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date,
ADD COLUMN IF NOT EXISTS days integer,
ADD COLUMN IF NOT EXISTS quotas integer,
ADD COLUMN IF NOT EXISTS discount_pct numeric,
ADD COLUMN IF NOT EXISTS discount numeric,
ADD COLUMN IF NOT EXISTS total numeric,
ADD COLUMN IF NOT EXISTS observations text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'rascunho',
ADD COLUMN IF NOT EXISTS media_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS pi_generated_at timestamptz;

-- Alter control_number to BIGINT for custom YYYYMMXXXX format
ALTER TABLE quotes
ALTER COLUMN control_number TYPE bigint USING control_number::bigint,
ALTER COLUMN control_number DROP DEFAULT;

-- Create Transactions Table if it doesn't exist (base)
CREATE TABLE IF NOT EXISTS transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

-- Add columns to transactions (safe update)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS amount numeric,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS client_id text REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS quote_id text REFERENCES quotes(id),
ADD COLUMN IF NOT EXISTS tax_type text;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes ((client->>'id'));
CREATE INDEX IF NOT EXISTS idx_transactions_quote ON transactions (quote_id);
