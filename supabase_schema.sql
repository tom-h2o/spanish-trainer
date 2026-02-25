-- Note: The words table is created in supabase_seed_words_750.sql.
-- Create a table to track user progress and SM-2 spaced repetition data
create table if not exists public.user_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  word_id integer not null,
  
  -- SM-2 Algorithm specific fields
  repetition integer default 0 not null,
  interval integer default 0 not null,
  easiness_factor numeric default 2.5 not null,
  next_review_date timestamptz default now() not null,
  
  -- Metadata
  level integer default 0 not null, -- The 0-3 level logic for the UI filters 
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  -- Ensure a user only has one tracking record per word
  unique (user_id, word_id)
);

-- Turn on Row Level Security (RLS)
alter table public.user_progress enable row level security;

-- Create policies so users can only read/write their own data
drop policy if exists "Users can view their own progress" on public.user_progress;
create policy "Users can view their own progress"
  on public.user_progress for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own progress" on public.user_progress;
create policy "Users can insert their own progress"
  on public.user_progress for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own progress" on public.user_progress;
create policy "Users can update their own progress"
  on public.user_progress for update
  using ( auth.uid() = user_id );

-- Create a table to track user preferences and settings
create table if not exists public.user_settings (
  user_id uuid references auth.users not null primary key,
  levels integer[] default '{0,1,2,3}',
  parts integer[] default '{1,2,3,4,5,6,7,8,9,10}',
  is_reverse_mode boolean default false,
  updated_at timestamptz default now() not null
);

-- Turn on Row Level Security (RLS)
alter table public.user_settings enable row level security;

-- Create policies so users can only read/write their own settings
drop policy if exists "Users can view their own settings" on public.user_settings;
create policy "Users can view their own settings"
  on public.user_settings for select
  using ( auth.uid() = user_id );

drop policy if exists "Users can insert their own settings" on public.user_settings;
create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own settings" on public.user_settings;
create policy "Users can update their own settings"
  on public.user_settings for update
  using ( auth.uid() = user_id );
