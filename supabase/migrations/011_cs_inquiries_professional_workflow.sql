-- Professional CS workflow: open, in_progress, waiting, resolved, closed
update public.cs_inquiries
set status = case status
  when 'pending' then 'open'
  when 'replied' then 'resolved'
  when 'refunding' then 'waiting'
  else status
end
where status in ('pending', 'replied', 'refunding');

alter table public.cs_inquiries
  drop constraint if exists cs_inquiries_status_check;

alter table public.cs_inquiries
  add constraint cs_inquiries_status_check
  check (status in ('open', 'in_progress', 'waiting', 'resolved', 'closed'));
