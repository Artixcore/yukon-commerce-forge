-- Add product_code column and auto-generation trigger
alter table public.products
add column if not exists product_code text;

create unique index if not exists products_product_code_key
  on public.products (product_code);

create sequence if not exists public.product_code_seq;

create or replace function public.generate_product_code()
returns trigger
language plpgsql
as $$
begin
  if new.product_code is null or new.product_code = '' then
    new.product_code := 'YL-PROD-' || lpad(nextval('public.product_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists products_generate_code on public.products;
create trigger products_generate_code
before insert on public.products
for each row
execute function public.generate_product_code();

-- Initialize sequence and backfill existing products
select setval(
  'public.product_code_seq',
  (select coalesce(count(*), 0) from public.products),
  true
);

update public.products
set product_code = 'YL-PROD-' || lpad(nextval('public.product_code_seq')::text, 6, '0')
where product_code is null or product_code = '';
