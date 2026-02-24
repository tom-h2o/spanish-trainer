import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('words').select('*').eq('type', 'verb').limit(3);
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Found verbs:", data.length);
    for (const word of data) {
        console.log(`Word: ${word.es} | Conjugations:`, word.conjugations);
    }
}

check();
