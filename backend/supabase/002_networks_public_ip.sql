-- Incremental migration for existing NetAtlas Supabase projects — adds the
-- columns backend/supabase/schema.sql already has for fresh installs.
-- Run once in the SQL Editor.
alter table networks add column if not exists public_ip text;
alter table networks add column if not exists last_report_at timestamptz;
create index if not exists idx_networks_public_ip on networks (public_ip);
