-- Phase 2: auth profile creation, RLS hardening, and private media storage.
-- Object paths are <channel-id>/<video-id>/<filename>; DB fields store paths.

create index if not exists channel_subscriptions_user_id_idx on public.channel_subscriptions(user_id);
create index if not exists comments_parent_id_idx on public.comments(parent_id);
create index if not exists comments_user_id_idx on public.comments(user_id);
create index if not exists notifications_actor_id_idx on public.notifications(actor_id);
create index if not exists notifications_video_id_idx on public.notifications(video_id);
create index if not exists video_likes_user_id_idx on public.video_likes(user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare candidate_avatar text;
begin
  candidate_avatar := new.raw_user_meta_data ->> 'avatar_url';
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(left(new.raw_user_meta_data ->> 'full_name', 100), ''),
      nullif(left(new.raw_user_meta_data ->> 'name', 100), ''),
      'New creator'
    ),
    case when candidate_avatar ~ '^https?://' then left(candidate_avatar, 2048) else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Recreate existing policies with init-plan friendly auth.uid() calls.
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users create their own profile" on public.profiles;
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select to public using (true);
create policy "Users create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Channels are viewable by everyone" on public.channels;
drop policy if exists "Owners create their channel" on public.channels;
drop policy if exists "Owners update their channel" on public.channels;
drop policy if exists "Owners delete their channel" on public.channels;
create policy "Channels are viewable by everyone" on public.channels for select to public using (true);
create policy "Owners create their channel" on public.channels for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update their channel" on public.channels for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "Owners delete their channel" on public.channels for delete to authenticated using ((select auth.uid()) = owner_id);

drop policy if exists "Public and unlisted videos are viewable" on public.videos;
drop policy if exists "Channel owners upload videos" on public.videos;
drop policy if exists "Channel owners update videos" on public.videos;
drop policy if exists "Channel owners delete videos" on public.videos;
create policy "Public and unlisted videos are viewable" on public.videos for select to public using (
  visibility in ('public', 'unlisted') or exists (
    select 1 from public.channels c where c.id = videos.channel_id and c.owner_id = (select auth.uid())
  )
);
create policy "Channel owners upload videos" on public.videos for insert to authenticated with check (
  exists (select 1 from public.channels c where c.id = videos.channel_id and c.owner_id = (select auth.uid()))
);
create policy "Channel owners update videos" on public.videos for update to authenticated using (
  exists (select 1 from public.channels c where c.id = videos.channel_id and c.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.channels c where c.id = videos.channel_id and c.owner_id = (select auth.uid()))
);
create policy "Channel owners delete videos" on public.videos for delete to authenticated using (
  exists (select 1 from public.channels c where c.id = videos.channel_id and c.owner_id = (select auth.uid()))
);

drop policy if exists "Likes are viewable by everyone" on public.video_likes;
drop policy if exists "Users like videos as themselves" on public.video_likes;
drop policy if exists "Users remove their own likes" on public.video_likes;
create policy "Likes are viewable by everyone" on public.video_likes for select to public using (
  exists (select 1 from public.videos v where v.id = video_likes.video_id)
);
create policy "Users like videos as themselves" on public.video_likes for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (select 1 from public.videos v where v.id = video_likes.video_id)
);
create policy "Users remove their own likes" on public.video_likes for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Users add their own comments" on public.comments;
drop policy if exists "Users edit their own comments" on public.comments;
drop policy if exists "Users delete their own comments" on public.comments;
create policy "Comments are viewable by everyone" on public.comments for select to public using (
  exists (select 1 from public.videos v where v.id = comments.video_id)
);
create policy "Users add their own comments" on public.comments for insert to authenticated with check (
  (select auth.uid()) = user_id and exists (select 1 from public.videos v where v.id = comments.video_id)
);
create policy "Users edit their own comments" on public.comments for update to authenticated using (
  (select auth.uid()) = user_id
) with check (
  (select auth.uid()) = user_id and exists (select 1 from public.videos v where v.id = comments.video_id)
);
create policy "Users delete their own comments" on public.comments for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Subscriptions are viewable by everyone" on public.channel_subscriptions;
drop policy if exists "Users subscribe as themselves" on public.channel_subscriptions;
drop policy if exists "Users remove their own subscriptions" on public.channel_subscriptions;
create policy "Users view related subscriptions" on public.channel_subscriptions for select to authenticated using (
  (select auth.uid()) = user_id or exists (
    select 1 from public.channels c where c.id = channel_subscriptions.channel_id and c.owner_id = (select auth.uid())
  )
);
create policy "Users subscribe as themselves" on public.channel_subscriptions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users remove their own subscriptions" on public.channel_subscriptions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users view their own notifications" on public.notifications;
drop policy if exists "Users update their own notifications" on public.notifications;
create policy "Users view their own notifications" on public.notifications for select to authenticated using ((select auth.uid()) = recipient_id);
create policy "Users update their own notifications" on public.notifications for update to authenticated using ((select auth.uid()) = recipient_id) with check ((select auth.uid()) = recipient_id);

-- Keep video and thumbnail objects private; clients use signed URLs after RLS checks.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos', 'videos', false, 104857600, array['video/mp4', 'video/webm', 'video/quicktime']),
  ('thumbnails', 'thumbnails', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on column public.videos.video_url is 'Private Storage object path <channel-id>/<video-id>/<filename>; issue short-lived signed URLs for playback.';
comment on column public.videos.thumbnail_url is 'Private thumbnails object path <channel-id>/<video-id>/<filename>; issue short-lived signed URLs for display.';

drop policy if exists "Anyone can view videos" on storage.objects;
drop policy if exists "Channel owners upload video files" on storage.objects;
drop policy if exists "Channel owners update video files" on storage.objects;
drop policy if exists "Channel owners delete video files" on storage.objects;
drop policy if exists "Owners read visible video files" on storage.objects;
drop policy if exists "Owners upload video files" on storage.objects;
drop policy if exists "Owners update video files" on storage.objects;
drop policy if exists "Owners delete video files" on storage.objects;
drop policy if exists "Owners read visible thumbnails" on storage.objects;
drop policy if exists "Owners upload thumbnails" on storage.objects;
drop policy if exists "Owners update thumbnails" on storage.objects;
drop policy if exists "Owners delete thumbnails" on storage.objects;

create policy "Owners read visible video files" on storage.objects for select to public using (
  bucket_id = 'videos' and exists (
    select 1 from public.videos v join public.channels c on c.id = v.channel_id
    where v.id::text = (storage.foldername(storage.objects.name))[2]
      and c.id::text = (storage.foldername(storage.objects.name))[1]
      and v.video_url = storage.objects.name
      and (v.visibility in ('public', 'unlisted') or c.owner_id = (select auth.uid()))
  )
);
create policy "Owners upload video files" on storage.objects for insert to authenticated with check (
  bucket_id = 'videos' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
);
create policy "Owners update video files" on storage.objects for update to authenticated using (
  bucket_id = 'videos' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
) with check (
  bucket_id = 'videos' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
);
create policy "Owners delete video files" on storage.objects for delete to authenticated using (
  bucket_id = 'videos' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
);

create policy "Owners read visible thumbnails" on storage.objects for select to public using (
  bucket_id = 'thumbnails' and exists (
    select 1 from public.videos v join public.channels c on c.id = v.channel_id
    where v.id::text = (storage.foldername(storage.objects.name))[2]
      and c.id::text = (storage.foldername(storage.objects.name))[1]
      and v.thumbnail_url = storage.objects.name
      and (v.visibility in ('public', 'unlisted') or c.owner_id = (select auth.uid()))
  )
);
create policy "Owners upload thumbnails" on storage.objects for insert to authenticated with check (
  bucket_id = 'thumbnails' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
);
create policy "Owners update thumbnails" on storage.objects for update to authenticated using (
  bucket_id = 'thumbnails' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
) with check (
  bucket_id = 'thumbnails' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
);
create policy "Owners delete thumbnails" on storage.objects for delete to authenticated using (
  bucket_id = 'thumbnails' and exists (
    select 1 from public.channels c
    where c.id::text = (storage.foldername(storage.objects.name))[1] and c.owner_id = (select auth.uid())
  )
);

