-- RUN THIS IN YOUR SUPABASE PROJET SQL EDITOR
-- NOTE: This script assumes 'inventory.id' is of type TEXT based on the previous error.

-- 1. Suppliers Table (No changes needed)
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

-- 2. Inventory Table (Add missing columns)
-- We skip CREATE TABLE because it exists.
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'un',
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_quantity numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_quantity numeric,
ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES suppliers(id),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Inventory Movements
-- CHANGED: item_id to TEXT to match inventory.id
CREATE TABLE IF NOT EXISTS inventory_movements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id text REFERENCES inventory(id) ON DELETE CASCADE, 
    type text NOT NULL,
    quantity numeric NOT NULL,
    previous_quantity numeric,
    new_quantity numeric,
    reference_type text,
    reference_id text,
    reason text,
    user_id text,
    created_at timestamptz DEFAULT now()
);

-- 4. Production Orders
CREATE TABLE IF NOT EXISTS production_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code serial,
    description text,
    status text DEFAULT 'draft',
    start_date date,
    due_date date,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 5. Production Items
-- CHANGED: item_id to TEXT to match inventory.id
CREATE TABLE IF NOT EXISTS production_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    production_order_id uuid REFERENCES production_orders(id) ON DELETE CASCADE,
    item_id text REFERENCES inventory(id),
    type text NOT NULL,
    quantity_planned numeric DEFAULT 0,
    quantity_actual numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
