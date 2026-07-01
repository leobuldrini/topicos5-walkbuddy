insert into storage.buckets (id, name, public) values ('walker-photos','walker-photos', true)
  on conflict (id) do nothing;
create policy "walker photo read" on storage.objects for select using (bucket_id = 'walker-photos');
create policy "walker photo write own" on storage.objects for insert
  with check (bucket_id = 'walker-photos' and owner = auth.uid());
-- Photos are stored at a stable path per walker (walker-photos/<uid>), so a
-- re-upload replaces the existing object. That requires update/delete
-- privileges scoped to the owner as well, not just insert.
create policy "walker photo update own" on storage.objects for update
  using (bucket_id = 'walker-photos' and owner = auth.uid())
  with check (bucket_id = 'walker-photos' and owner = auth.uid());
create policy "walker photo delete own" on storage.objects for delete
  using (bucket_id = 'walker-photos' and owner = auth.uid());
