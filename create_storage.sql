-- Enable the storage extension if not already enabled (usually enabled by default in Supabase)
-- create extension if not exists "storage";

-- Create a new public bucket named 'portal-uploads'
insert into storage.buckets (id, name, public)
values ('portal-uploads', 'portal-uploads', true)
on conflict (id) do nothing;

-- Create a policy to allow anyone to upload files (for unauthenticated vendors)
-- WARNING: In production, you might want to restrict this or use a more secure method
create policy "Allow public uploads"
on storage.objects for insert
with check ( bucket_id = 'portal-uploads' );

-- Create a policy to allow public read access
create policy "Allow public read access"
on storage.objects for select
using ( bucket_id = 'portal-uploads' );

-- Create a policy to allow updates (if needed, e.g. overwriting files)
create policy "Allow public updates"
on storage.objects for update
with check ( bucket_id = 'portal-uploads' );

-- NOTE: You can run these commands in the Supabase SQL Editor.
