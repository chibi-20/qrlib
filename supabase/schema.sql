-- QR Library Borrow/Return System — schema + RLS
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).

create extension if not exists "pgcrypto";

create type transaction_status as enum ('borrowed', 'returned', 'overdue');

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  student_no text unique not null,
  full_name text not null,
  grade_level text not null,
  section text not null,
  created_at timestamptz not null default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  book_code text unique not null,
  title text not null,
  author text,
  total_copies int not null default 1,
  available_copies int not null default 1,
  created_at timestamptz not null default now(),
  constraint available_copies_range check (available_copies >= 0 and available_copies <= total_copies)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete restrict,
  book_id uuid not null references books(id) on delete restrict,
  borrowed_at timestamptz not null default now(),
  due_date date not null,
  returned_at timestamptz,
  status transaction_status not null default 'borrowed',
  scan_duration_ms int,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists transactions_student_id_idx on transactions(student_id);
create index if not exists transactions_book_id_idx on transactions(book_id);
create index if not exists transactions_status_idx on transactions(status);

-- Row Level Security: only authenticated (librarian) users may read/write.
-- No anonymous/public access at all — the app always talks to Supabase
-- using a logged-in librarian session.

alter table students enable row level security;
alter table books enable row level security;
alter table transactions enable row level security;

create policy "authenticated read students" on students
  for select to authenticated using (true);
create policy "authenticated write students" on students
  for all to authenticated using (true) with check (true);

create policy "authenticated read books" on books
  for select to authenticated using (true);
create policy "authenticated write books" on books
  for all to authenticated using (true) with check (true);

create policy "authenticated read transactions" on transactions
  for select to authenticated using (true);
create policy "authenticated write transactions" on transactions
  for all to authenticated using (true) with check (true);

-- Keep available_copies in sync automatically whenever a transaction's
-- status changes, so app code never has to remember to update it manually.
create or replace function sync_book_availability()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    if new.status = 'borrowed' then
      update books set available_copies = available_copies - 1 where id = new.book_id;
    end if;
  elsif (tg_op = 'UPDATE') then
    if old.status = 'borrowed' and new.status = 'returned' then
      update books set available_copies = available_copies + 1 where id = new.book_id;
    elsif old.status = 'returned' and new.status = 'borrowed' then
      update books set available_copies = available_copies - 1 where id = new.book_id;
    end if;
  elsif (tg_op = 'DELETE') then
    if old.status = 'borrowed' then
      update books set available_copies = available_copies + 1 where id = old.book_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_book_availability on transactions;
create trigger trg_sync_book_availability
  after insert or update or delete on transactions
  for each row execute function sync_book_availability();

-- Mark transactions overdue automatically (run manually or on a schedule).
create or replace function mark_overdue_transactions()
returns void as $$
begin
  update transactions
  set status = 'overdue'
  where status = 'borrowed' and due_date < current_date;
end;
$$ language plpgsql security definer;
