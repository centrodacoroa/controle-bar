-- Banco online do Controle de Bar (Supabase). Pode ser público: não contém segredo.
-- Ninguém lê as tabelas direto; só a função bar_sync, com o segredo do link (o banco guarda só o hash dele).
create schema if not exists bar;
revoke all on schema bar from public, anon, authenticated;
create table if not exists bar.bares (id int generated always as identity primary key, nome text unique not null, hash bytea unique not null);
alter table bar.bares add column if not exists aberto boolean not null default false;  -- true: o endereço comum entra com 'aberto-<nome>'
create sequence if not exists bar.rev;
create table if not exists bar.docs (
  bar int not null references bar.bares(id) on delete cascade,
  k text not null, v jsonb, del boolean not null default false, rev bigint not null, em timestamptz not null default now(),
  primary key (bar, k));
create index if not exists docs_rev on bar.docs (bar, rev);
alter table bar.bares enable row level security;
alter table bar.docs enable row level security;
-- cópia do que foi alterado ou apagado (para recuperar); ninguém acessa pela API
create table if not exists bar.antigos (id bigint generated always as identity primary key, bar int not null, k text not null, v jsonb, del boolean, rev bigint, em timestamptz not null default now());
alter table bar.antigos enable row level security;
create or replace function bar.guarda() returns trigger language plpgsql security definer set search_path = '' as $$
begin if old.v is distinct from new.v or old.del is distinct from new.del then insert into bar.antigos(bar,k,v,del,rev) values (old.bar,old.k,old.v,old.del,old.rev); end if; return new; end $$;
drop trigger if exists guarda on bar.docs;
create trigger guarda before update on bar.docs for each row execute function bar.guarda();

create or replace function public.bar_sync(p_chave text, p_desde bigint, p_ops jsonb default '[]'::jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare b int; o jsonb; kk text; vv jsonb; cid text; r jsonb; n int;
begin
  if p_chave is null or length(p_chave) < 20 or length(p_chave) > 100 then return jsonb_build_object('erro','chave'); end if;
  select id into b from bar.bares where hash = sha256(convert_to(p_chave,'UTF8')) or (aberto and p_chave = 'aberto-'||nome);
  if b is null then return jsonb_build_object('erro','chave'); end if;
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) > 300 or length(p_ops::text) > 2000000 then
    return jsonb_build_object('erro','tamanho'); end if;
  if jsonb_array_length(p_ops) > 0 then
    perform pg_advisory_xact_lock(7411, b);  -- grava um de cada vez: rev na ordem em que aparece
    if (select count(*) from bar.docs where bar = b) > 500000 then return jsonb_build_object('erro','cheio'); end if;
    for o in select * from jsonb_array_elements(p_ops) loop
      kk := o->>'k';
      if kk is null or kk !~ '^[pkcihm]:[A-Za-z0-9:_-]{1,120}$' then continue; end if;
      if coalesce((o->>'d')::boolean, false) then
        -- apagar conta que ganhou item em outro celular: não apaga, devolve a conta
        if kk like 'c:%' and exists (select 1 from bar.docs where bar = b and k like replace('i:'||substr(kk,3)||':','_','\_')||'%' and not del) then
          update bar.docs set rev = nextval('bar.rev') where bar = b and k = kk;
        else
          update bar.docs set del = true, rev = nextval('bar.rev'), em = now() where bar = b and k = kk and not del;
        end if;
      else
        vv := o->'v';
        if vv is null or jsonb_typeof(vv) <> 'object' or length(vv::text) > 200000 then continue; end if;
        insert into bar.docs as t (bar, k, v, rev) values (b, kk, vv, nextval('bar.rev'))
          on conflict (bar, k) do update set v = excluded.v, del = false, rev = excluded.rev, em = now()
          where t.del or t.v is distinct from excluded.v;
        if kk like 'i:%' then  -- item lançado em conta apagada por outro celular: a conta volta
          cid := split_part(kk, ':', 2);
          update bar.docs set del = false, rev = nextval('bar.rev') where bar = b and k = 'c:'||cid and del;
        end if;
      end if;
    end loop;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('k',x.k,'v',case when x.del then null else x.v end,'d',x.del,'r',x.rev) order by x.rev),'[]'::jsonb), count(*)
    into r, n from (select k, v, del, rev from bar.docs where bar = b and rev > coalesce(p_desde,0) order by rev limit 1000) x;
  return jsonb_build_object('docs', r, 'mais', n = 1000);
end $$;
revoke all on function public.bar_sync(text,bigint,jsonb) from public, authenticated;
grant execute on function public.bar_sync(text,bigint,jsonb) to anon;
