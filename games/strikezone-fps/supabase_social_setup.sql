-- STRIKEZONE FPS v3.36 — registered players, friendships and game invitations
-- Run once in the Supabase SQL Editor for the existing EasyABC project.
-- Uses the existing Supabase Auth password hashing/session system.
-- IMPORTANT: Username-only synthetic-email registration needs email
-- confirmation disabled for the Auth project. THIS SETTING AFFECTS OTHER
-- APPS USING THE SAME SUPABASE PROJECT. On the shared EasyABC project,
-- do NOT disable confirmation without assessing that project-wide impact.
-- Prefer a separate STRIKEZONE Supabase Auth project for username-only
-- accounts, or a future real-email signup / verified-email recovery flow.
-- Password recovery is not possible for these synthetic addresses.
--
-- Registered STRIKEZONE users log in with USERNAME + PASSWORD.
-- Synthetic Auth email: sz_<username>@accounts.strikezone.invalid
-- Existing EasyABC auth users are not changed by this migration.
-- Re-run is safe: idempotent DDL policies and functions.

begin;

create table if not exists public.sz_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique,
 created_at timestamptz not null default now(),
 constraint sz_username_format check (username ~ '^[a-z][a-z0-9_]{2,19}$')
);
create unique index if not exists sz_profiles_username_lower_unique
 on public.sz_profiles (lower(username));

create table if not exists public.sz_friend_requests (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.sz_profiles(id) on delete cascade,
 recipient_id uuid not null references public.sz_profiles(id) on delete cascade,
 status text not null default 'pending'
   check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 constraint sz_friend_request_not_self check (sender_id <> recipient_id),
 unique(sender_id, recipient_id)
);
create index if not exists sz_friend_requests_recipient_status_idx
 on public.sz_friend_requests(recipient_id,status,created_at desc);

create table if not exists public.sz_friendships (
 user_a uuid not null references public.sz_profiles(id) on delete cascade,
 user_b uuid not null references public.sz_profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_a,user_b),
 constraint sz_friend_order check (user_a < user_b)
);
create index if not exists sz_friendships_user_b_idx on public.sz_friendships(user_b);

create table if not exists public.sz_room_invites (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.sz_profiles(id) on delete cascade,
 recipient_id uuid not null references public.sz_profiles(id) on delete cascade,
 room_code text not null check (room_code ~ '^[A-Z2-9]{6}$'),
 status text not null default 'pending'
   check (status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now() + interval '15 minutes'),
 responded_at timestamptz,
 constraint sz_room_invite_not_self check(sender_id <> recipient_id)
);
create index if not exists sz_room_invites_recipient_idx
 on public.sz_room_invites(recipient_id,status,expires_at desc);

alter table public.sz_profiles enable row level security;
alter table public.sz_friend_requests enable row level security;
alter table public.sz_friendships enable row level security;
alter table public.sz_room_invites enable row level security;

drop policy if exists "sz_profiles_visible_to_registered" on public.sz_profiles;
create policy "sz_profiles_visible_to_registered"
 on public.sz_profiles for select to authenticated using (true);

drop policy if exists "sz_requests_visible_to_participants" on public.sz_friend_requests;
create policy "sz_requests_visible_to_participants"
 on public.sz_friend_requests for select to authenticated
 using (sender_id=auth.uid() or recipient_id=auth.uid());

drop policy if exists "sz_friendships_visible_to_members" on public.sz_friendships;
create policy "sz_friendships_visible_to_members"
 on public.sz_friendships for select to authenticated
 using (user_a=auth.uid() or user_b=auth.uid());

drop policy if exists "sz_invites_visible_to_members" on public.sz_room_invites;
create policy "sz_invites_visible_to_members"
 on public.sz_room_invites for select to authenticated
 using (sender_id=auth.uid() or recipient_id=auth.uid());

-- After 30 Oct 2026, explicit grants are required for newly created public tables.
revoke all on public.sz_profiles,public.sz_friend_requests,
 public.sz_friendships,public.sz_room_invites from PUBLIC,anon,authenticated;
grant select on public.sz_profiles,public.sz_friend_requests,
 public.sz_friendships,public.sz_room_invites to authenticated;
grant all on public.sz_profiles,public.sz_friend_requests,
 public.sz_friendships,public.sz_room_invites to service_role;

-- Trigger uses auth.user_metadata set during signUp. Usernames cannot be
-- forged via client inserts into profiles; the PK is the authenticated UID.
create or replace function public.sz_create_profile_for_new_auth_user()
returns trigger language plpgsql security definer
set search_path = '' as $$
declare requested_name text;
begin
 requested_name:=lower(trim(coalesce(new.raw_user_meta_data->>'strikezone_username','')));
 if requested_name='' then return new; end if;
 if requested_name !~ '^[a-z][a-z0-9_]{2,19}$' then
   raise exception 'Invalid STRIKEZONE username';
 end if;
 if lower(coalesce(new.email,'')) <>
    ('sz_'||requested_name||'@accounts.strikezone.invalid') then
   raise exception 'STRIKEZONE account address does not match username';
 end if;
 insert into public.sz_profiles(id,username) values(new.id,requested_name);
 return new;
end;
$$;
drop trigger if exists sz_create_profile_when_signup on auth.users;
create trigger sz_create_profile_when_signup
 after insert on auth.users for each row
 execute function public.sz_create_profile_for_new_auth_user();

-- All mutations use SECURITY DEFINER functions; no direct authenticated
-- INSERT/UPDATE/DELETE is granted on friendships, requests, or invitations.
create or replace function public.sz_username_available(p_username text)
returns boolean language sql stable security definer
set search_path='' as $$
 select coalesce(
   p_username ~ '^[a-z][a-z0-9_]{2,19}$'
   and not exists(select 1 from public.sz_profiles where username=p_username)
   ,false);
$$;

create or replace function public.sz_send_friend_request(p_username text)
returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); target uuid; already uuid; request_id uuid;
begin
 if me is null or not exists(select 1 from public.sz_profiles where id=me)
 then raise exception 'Sign in to send friend requests'; end if;
 select id into target from public.sz_profiles
  where username=lower(trim(p_username));
 if target is null then raise exception 'Player not found'; end if;
 if me=target then raise exception 'You cannot add yourself'; end if;
 if exists(select 1 from public.sz_friendships
  where user_a=least(me,target) and user_b=greatest(me,target))
 then raise exception 'Already friends'; end if;
 if exists(select 1 from public.sz_friend_requests
   where sender_id=target and recipient_id=me and status='pending')
 then raise exception 'This player has invited you; accept their request instead'; end if;
 if (select count(*) from public.sz_friend_requests
     where sender_id=me and created_at>now()-interval '1 hour')>=20
 then raise exception 'Too many requests. Try later'; end if;
 insert into public.sz_friend_requests(sender_id,recipient_id,status,responded_at)
 values(me,target,'pending',null)
 on conflict(sender_id,recipient_id) do update
  set status='pending',created_at=now(),responded_at=null
 returning id into request_id;
 return request_id;
end;
$$;

create or replace function public.sz_respond_friend_request(p_request_id uuid,p_accept boolean)
returns text language plpgsql security definer set search_path='' as $$
declare req public.sz_friend_requests%rowtype; me uuid:=auth.uid();
begin
 if me is null then raise exception 'Sign in required'; end if;
 select * into req from public.sz_friend_requests
  where id=p_request_id and recipient_id=me and status='pending' for update;
 if not found then raise exception 'Pending request not found'; end if;
 update public.sz_friend_requests set
  status=case when p_accept then 'accepted' else 'declined' end,
  responded_at=now() where id=req.id;
 if p_accept then
  insert into public.sz_friendships(user_a,user_b)
  values(least(me,req.sender_id),greatest(me,req.sender_id))
  on conflict do nothing;
 end if;
 return case when p_accept then 'accepted' else 'declined' end;
end;
$$;

create or replace function public.sz_send_room_invite(p_friend_id uuid,p_room_code text)
returns uuid language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid(); invite_id uuid;
begin
 if me is null or not exists(select 1 from public.sz_profiles where id=me)
 then raise exception 'Registered account required'; end if;
 if p_room_code is null or upper(p_room_code) !~ '^[A-Z2-9]{6}$'
 then raise exception 'Invalid room code'; end if;
 if me=p_friend_id or not exists(select 1 from public.sz_friendships
  where user_a=least(me,p_friend_id) and user_b=greatest(me,p_friend_id))
 then raise exception 'You can only invite accepted friends'; end if;
 if (select count(*) from public.sz_room_invites
  where sender_id=me and created_at>now()-interval '1 hour')>=30
 then raise exception 'Too many invitations. Try later'; end if;
 if exists(select 1 from public.sz_room_invites
  where sender_id=me and recipient_id=p_friend_id
  and room_code=upper(p_room_code) and status='pending'
  and created_at>now()-interval '25 seconds')
 then raise exception 'Invite already sent. Please wait'; end if;
 insert into public.sz_room_invites(sender_id,recipient_id,room_code)
 values(me,p_friend_id,upper(p_room_code)) returning id into invite_id;
 return invite_id;
end;
$$;

create or replace function public.sz_respond_room_invite(p_invite_id uuid,p_accept boolean)
returns text language plpgsql security definer set search_path='' as $$
declare target public.sz_room_invites%rowtype; me uuid:=auth.uid();
begin
 if me is null then raise exception 'Sign in required'; end if;
 select * into target from public.sz_room_invites
  where id=p_invite_id and recipient_id=me and status='pending' for update;
 if not found then raise exception 'Pending invitation not found'; end if;
 if target.expires_at<=now() then raise exception 'This invitation has expired'; end if;
 update public.sz_room_invites set
 status=case when p_accept then 'accepted' else 'declined' end,
 responded_at=now() where id=target.id;
 return case when p_accept then 'accepted' else 'declined' end;
end;
$$;

revoke all on function public.sz_username_available(text) from public;
revoke all on function public.sz_send_friend_request(text) from public;
revoke all on function public.sz_respond_friend_request(uuid,boolean) from public;
revoke all on function public.sz_send_room_invite(uuid,text) from public;
revoke all on function public.sz_respond_room_invite(uuid,boolean) from public;
grant execute on function public.sz_username_available(text) to anon,authenticated;
grant execute on function public.sz_send_friend_request(text),
 public.sz_respond_friend_request(uuid,boolean),
 public.sz_send_room_invite(uuid,text),
 public.sz_respond_room_invite(uuid,boolean) to authenticated;

commit;
