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

-- INVENTORY CONTROL MODULE MIGRATION

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    contact_info text,
    document text, -- CNPJ/CPF
    email text,
    phone text,
    address text,
    created_at timestamptz DEFAULT now()
);

-- 2. Enhanced Inventory Items Table (Replaces or Extends existing 'inventory')
-- If 'inventory' exists, we might need to migrate data or rename it. 
-- For safety, let's assume we are extending the concept but maybe using a cleaner table name or checking if 'inventory' is sufficient.
-- The current 'inventory' table structure is unknown in detail but likely simple. 
-- Let's stick to 'inventory' but ensure all columns exist.

CREATE TABLE IF NOT EXISTS inventory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS type text, -- raw_material, wip, merchandise, asset
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'un',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_quantity numeric,
ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0, -- Cost Price
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0, -- Selling Price
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Inventory Movements (Audit Log)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id uuid REFERENCES inventory(id) ON DELETE CASCADE,
    type text NOT NULL, -- IN, OUT, ADJUSTMENT
    quantity numeric NOT NULL, -- Positive for IN, Negative for OUT (or absolute value controlled by type)
    previous_quantity numeric,
    new_quantity numeric,
    reference_type text, -- PO, SALE, INVOICE, MAINTENANCE
    reference_id text,
    reason text,
    user_id text, -- Auth user id
    created_at timestamptz DEFAULT now()
);

-- 4. Production Orders (WIP/PCP)
CREATE TABLE IF NOT EXISTS production_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code serial, -- Friendly ID 
    description text,
    status text DEFAULT 'draft', -- draft, in_progress, completed, cancelled
    start_date date,
    due_date date,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 5. Production Items (BOM - Bill of Materials & Outputs)
CREATE TABLE IF NOT EXISTS production_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    production_order_id uuid REFERENCES production_orders(id) ON DELETE CASCADE,
    item_id uuid REFERENCES inventory(id),
    type text NOT NULL, -- INPUT (consumed), OUTPUT (produced)
    quantity_planned numeric DEFAULT 0,
    quantity_actual numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type);
CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_production_items_order ON production_items(production_order_id);
-- MEDIA FILES (Content Library)
CREATE TABLE IF NOT EXISTS media_files (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id text NOT NULL, -- Logical link to client (though we don't strictly enforce FK if client table isn't rigid)
    name text NOT NULL,
    url text NOT NULL,
    type text NOT NULL, -- 'image', 'video'
    duration integer DEFAULT 10, -- in seconds
    resolution text, -- '1920x1080'
    size_bytes bigint,
    status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'archived'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- PLAYLIST ITEMS (The "Grid" - Links Media to Asset at specific times)
CREATE TABLE IF NOT EXISTS playlist_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id text REFERENCES assets(id) ON DELETE CASCADE,
    media_id uuid REFERENCES media_files(id) ON DELETE CASCADE,
    quote_id text, -- Optional link to the origin sales quote
    start_date date NOT NULL,
    end_date date NOT NULL,
    start_time time DEFAULT '06:00:00',
    end_time time DEFAULT '23:00:00',
    days_of_week jsonb DEFAULT '["sun", "mon", "tue", "wed", "thu", "fri", "sat"]'::jsonb,
    priority integer DEFAULT 1, -- 1=Normal, 2=High
    created_at timestamptz DEFAULT now()
);

-- PLAY LOGS (Proof of Play - Simplified)
CREATE TABLE IF NOT EXISTS play_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id text REFERENCES assets(id) ON DELETE CASCADE,
    media_id uuid REFERENCES media_files(id) ON DELETE SET NULL,
    played_at timestamptz DEFAULT now(),
    duration_played integer
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_playlist_asset_date ON playlist_items(asset_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_media_client ON media_files(client_id);
