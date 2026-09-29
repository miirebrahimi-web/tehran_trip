-- =====================================================================
--  سفر تهران | ۲ شب و ۳ روز  —  ONE FILE to set up the whole database
--  Paste this whole file in: Supabase -> SQL Editor -> New query -> Run
--  Safe to run more than once.
-- =====================================================================

-- Normalizes names so "املت" / "املت " / Arabic ي vs Persian ی count as duplicates
create or replace function public.normalize_name(t text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    lower(btrim(replace(replace(replace(replace(t, 'ي', 'ی'), 'ك', 'ک'), E'\u200c', ' '), E'\u200f', ''))),
    '\s+', ' ', 'g'
  )
$$;

-- ---------------------------------------------------------------- trips
create table if not exists public.trips (
  id uuid primary key,
  title text not null,
  nights int not null default 2,
  days int not null default 3,
  group_chat_id bigint,               -- filled automatically when the bot sees your group
  created_at timestamptz not null default now()
);

-- The one permanent trip everybody joins
insert into public.trips (id, title, nights, days)
values ('00000000-0000-4000-8000-000000000001', 'تهران | ۲ شب و ۳ روز', 2, 3)
on conflict (id) do nothing;

-- --------------------------------------------------------- participants
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  telegram_user_id bigint not null,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  username text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id, telegram_user_id)
);

-- ---------------------------------------------------------- food options
create table if not exists public.food_options (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  name_key text generated always as (public.normalize_name(name)) stored,
  is_user_added boolean not null default false,
  is_joke boolean not null default false,
  sort_order int not null default 500,
  created_by bigint,
  created_at timestamptz not null default now(),
  unique (trip_id, meal, name_key),
  unique (id, meal)
);
create index if not exists food_options_trip_idx on public.food_options (trip_id, meal);

-- ------------------------------------------------------------ food votes
-- Primary key (participant, meal) = exactly ONE vote per meal per person
create table if not exists public.food_votes (
  participant_id uuid not null references public.participants(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner')),
  option_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (participant_id, meal),
  foreign key (option_id, meal) references public.food_options (id, meal) on delete cascade
);
create index if not exists food_votes_option_idx on public.food_votes (option_id);

-- ------------------------------------------------------- location options
create table if not exists public.location_options (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  name_key text generated always as (public.normalize_name(name)) stored,
  category text not null check (category in ('free', 'cheap', 'expensive')),
  image_url text,
  is_user_added boolean not null default false,
  sort_order int not null default 500,
  created_by bigint,
  created_at timestamptz not null default now(),
  unique (trip_id, name_key)
);
create index if not exists location_options_trip_idx on public.location_options (trip_id);

-- ----------------------------------------------------- location votes
-- A participant can vote for many places (one row per place)
create table if not exists public.location_votes (
  participant_id uuid not null references public.participants(id) on delete cascade,
  option_id uuid not null references public.location_options(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (participant_id, option_id)
);
create index if not exists location_votes_option_idx on public.location_votes (option_id);

-- ----------------------------------------------------------- security
-- Row Level Security ON and NO public policies:
-- the browser can NOT read or write these tables directly.
-- Everything goes through the app's server (which verifies Telegram identity),
-- so individual votes are never exposed. Live updates use Realtime Broadcast.
alter table public.trips            enable row level security;
alter table public.participants     enable row level security;
alter table public.food_options     enable row level security;
alter table public.food_votes       enable row level security;
alter table public.location_options enable row level security;
alter table public.location_votes   enable row level security;

revoke all on all tables in schema public from anon, authenticated;

-- ============================================================ SEED DATA
-- Breakfast
insert into public.food_options (trip_id, meal, name, sort_order)
select '00000000-0000-4000-8000-000000000001', 'breakfast', n, ord
from unnest(array[
  'املت گوجه','نیمرو','سوسیس تخم‌مرغ','عدسی','لوبیا','حلیم','آش',
  'نان، پنیر، گردو و سبزی','کره و مربا / عسل','تست تخم‌مرغ و پنیر',
  'پنکیک','نان و کره و مربا','پنیر و خیار و گوجه'
]) with ordinality as t(n, ord)
on conflict do nothing;

-- Lunch
insert into public.food_options (trip_id, meal, name, sort_order)
select '00000000-0000-4000-8000-000000000001', 'lunch', n, ord
from unnest(array[
  'ماکارونی','عدس‌پلو','لوبیاپلو','استانبولی','دمپختک','کوکو سیب‌زمینی',
  'کوکو سبزی','کتلت','الویه','ساندویچ مرغ','ساندویچ تن ماهی','مرغ و برنج',
  'جوجه‌کباب','پاستا','هات‌داگ'
]) with ordinality as t(n, ord)
on conflict do nothing;

-- Dinner
insert into public.food_options (trip_id, meal, name, sort_order)
select '00000000-0000-4000-8000-000000000001', 'dinner', n, ord
from unnest(array[
  'فلافل','سمبوسه','املت','سوسیس تخم‌مرغ','سوسیس و سیب‌زمینی','کوکو سیب‌زمینی',
  'کتلت','الویه','ماکارونی','پاستا','سیب‌زمینی تنوری','ساندویچ تن ماهی',
  'ساندویچ مرغ','نان و پنیر و گردو','فست‌فود'
]) with ordinality as t(n, ord)
on conflict do nothing;

-- Dinner: the joke option (still selectable)
insert into public.food_options (trip_id, meal, name, is_joke, sort_order)
values ('00000000-0000-4000-8000-000000000001', 'dinner', 'نون پنیر هندونه و آب‌دوغ‌خیار 😂', true, 100)
on conflict do nothing;

-- Locations: free
insert into public.location_options (trip_id, name, category, sort_order)
select '00000000-0000-4000-8000-000000000001', n, 'free', ord
from unnest(array[
  'دربند','دریاچه چیتگر','باغ کتاب','بازار تجریش','پل طبیعت','بام تهران',
  'بازار بزرگ','پارک جمشیدیه','پارک قیطریه','پارک پرواز','باغ ایرانی'
]) with ordinality as t(n, ord)
on conflict do nothing;

-- Locations: cheap
insert into public.location_options (trip_id, name, category, sort_order)
select '00000000-0000-4000-8000-000000000001', n, 'cheap', 100 + ord
from unnest(array[
  'کاخ گلستان','باغ فردوس','کاخ سعدآباد','کاخ نیاوران','پارک ارم','تله‌کابین توچال',
  'تله‌سیژ دربند','موزه زمان','هلیوم پارک','رویا پارک','آکواریوم پارک'
]) with ordinality as t(n, ord)
on conflict do nothing;

-- Locations: expensive
insert into public.location_options (trip_id, name, category, sort_order)
select '00000000-0000-4000-8000-000000000001', n, 'expensive', 200 + ord
from unnest(array[
  'سورتمه توچال','پارک ژوراسیک','پارک آبی اُپارک','بانجی جامپینگ',
  'اسکی روی آب','بالن‌سواری','کارتینگ آزادی','گلف باشگاه انقلاب'
]) with ordinality as t(n, ord)
on conflict do nothing;

-- Done. You should see "Success. No rows returned".
