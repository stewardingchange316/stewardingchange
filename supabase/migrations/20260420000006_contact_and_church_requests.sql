-- Contact form submissions
create table if not exists contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz default now()
);

-- Allow anonymous inserts (public contact form)
alter table contact_submissions enable row level security;
create policy "Anyone can submit contact form"
  on contact_submissions for insert
  with check (true);

-- Only admins can read
create policy "Admins can read contact submissions"
  on contact_submissions for select
  using (public.is_admin());

-- Church onboarding requests
create table if not exists church_requests (
  id uuid primary key default gen_random_uuid(),
  church_name text not null,
  city text,
  state text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  message text,
  created_at timestamptz default now()
);

alter table church_requests enable row level security;
create policy "Anyone can submit church request"
  on church_requests for insert
  with check (true);

create policy "Admins can read church requests"
  on church_requests for select
  using (public.is_admin());
