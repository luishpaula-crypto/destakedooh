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
