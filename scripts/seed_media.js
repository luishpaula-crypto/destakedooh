
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zjabgtavosbikpgpgevp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqYWJndGF2b3NiaWtwZ3BnZXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMzY5ODQsImV4cCI6MjA4MzkxMjk4NH0.TDiKd2fon00TYqDZUN93vxSCAm3QCOEnz1AkmHer6SE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("Seeding media...");

    // 1. Get a client
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .limit(1);

    if (clientError || !clients || clients.length === 0) {
        console.error("Error fetching client or no client found:", clientError);
        return;
    }

    const client = clients[0];
    console.log(`Using client: ${client.name} (${client.id})`);

    // 2. Insert Media
    const media = {
        client_id: client.id,
        name: 'Campanha Teste Verão 2024',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        type: 'video/mp4',
        duration: 30, // 30 seconds
        resolution: '1920x1080',
        size_bytes: 10485760, // 10MB
        status: 'approved'
    };

    const { data: inserted, error: insertError } = await supabase
        .from('media_files')
        .insert(media)
        .select();

    if (insertError) {
        console.error("Error inserting media:", insertError);
    } else {
        console.log("Successfully inserted media:", inserted);
    }
}

seed();
