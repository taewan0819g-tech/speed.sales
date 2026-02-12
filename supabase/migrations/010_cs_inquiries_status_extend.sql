-- Extend CS inquiry status for Inbox workflow: In Progress, Done (replied), Refunding
alter table public.cs_inquiries
  drop constraint if exists cs_inquiries_status_check;

alter table public.cs_inquiries
  add constraint cs_inquiries_status_check
  check (status in ('pending', 'in_progress', 'replied', 'refunding'));
