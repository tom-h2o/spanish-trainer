import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const sql = `
    create table if not exists public.user_settings (
      user_id uuid references auth.users not null primary key,
      levels integer[] default '{0,1,2,3}',
      parts integer[] default '{1,2,3,4,5,6,7,8,9,10}',
      is_reverse_mode boolean default false,
      updated_at timestamptz default now() not null
    );

    alter table public.user_settings enable row level security;

    create policy "Users can view their own settings"
      on public.user_settings for select
      using ( auth.uid() = user_id );

    create policy "Users can insert their own settings"
      on public.user_settings for insert
      with check ( auth.uid() = user_id );

    create policy "Users can update their own settings"
      on public.user_settings for update
      using ( auth.uid() = user_id );
  `;

    // Actually, we cannot run arbitrary DDL commands via the supabase-js client directly 
    // without a custom RPC function. So I will instruct the user to run it manually later.
    console.log("Please run this SQL in your Supabase dashboard.");
}

run();
