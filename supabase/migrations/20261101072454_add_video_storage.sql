insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('videos','videos',true,104857600,array['video/mp4','video/webm','video/quicktime'])
 on conflict (id) do update set public=true,file_size_limit=104857600,allowed_mime_types=array['video/mp4','video/webm','video/quicktime'];
 create policy "Anyone can view videos" on storage.objects for select using (bucket_id='videos');
 create policy "Channel owners upload video files" on storage.objects for insert to authenticated with check (
   bucket_id='videos' and exists (
     select 1 from public.channels c
     where c.owner_id=auth.uid() and c.id::text=(storage.foldername(name))[1]
   )
 );
 create policy "Channel owners update video files" on storage.objects for update to authenticated using (
   bucket_id='videos' and exists (
     select 1 from public.channels c
     where c.owner_id=auth.uid() and c.id::text=(storage.foldername(name))[1]
   )
 );
 create policy "Channel owners delete video files" on storage.objects for delete to authenticated using (
   bucket_id='videos' and exists (
     select 1 from public.channels c
     where c.owner_id=auth.uid() and c.id::text=(storage.foldername(name))[1]
   )
 );

