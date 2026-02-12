-- Ensure operations_logs.kind exists (fix "Could not find 'kind' column" if table was created without it)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'operations_logs') then
    alter table public.operations_logs
      add column if not exists kind text not null default 'note';
    if not exists (select 1 from pg_constraint where conname = 'operations_logs_kind_check') then
      alter table public.operations_logs
        add constraint operations_logs_kind_check
        check (kind in ('note', 'request', 'reminder'));
    end if;
  end if;
end $$;
