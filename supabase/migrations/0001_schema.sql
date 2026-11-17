-- ═══════════════════════════════════════════════════════════════
-- 다색컴패니언 — 0001 스키마 (READY: 아직 어떤 DB에도 적용하지 않음)
-- src/lib/types.ts 의 DEMO 저장 구조와 1:1 대응
-- 원칙: 근거상태(evidence) · DEMO/PILOT/LIVE · 멱등키 · 감사기록
-- ═══════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

create type evidence_status as enum ('VERIFIED','USER_PROVIDED','ASSUMPTION','UNKNOWN');
create type data_status     as enum ('DEMO','PILOT','LIVE');
create type app_role        as enum ('customer','staff','manager');
create type brand_id        as enum ('realsicdan','dasek');

create table business_entities (
  id text primary key,
  brand brand_id not null,
  name text not null,
  description text,
  biz_number text,                         -- 미확인 시 null
  evidence evidence_status not null default 'UNKNOWN',
  note text,
  created_at timestamptz not null default now()
);

create table stores (
  id text primary key,
  brand brand_id not null,
  business_entity_id text not null references business_entities(id),
  name text not null,
  tagline text,
  facts jsonb not null default '{}'::jsonb, -- {address:{value,evidence,source,checkedAt}, hours:..., ...}
  status data_status not null default 'DEMO',
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  role app_role not null default 'customer',
  member_code text not null unique,
  phone_hash text unique,                  -- 서버 측 HMAC-SHA256(pepper, phone). 원문 저장 금지
  phone_last4 text,
  referral_code text unique,
  preferred_brands brand_id[] not null default '{}',
  status text not null default 'active' check (status in ('active','deletion_requested','anonymized')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table staff_store_access (
  profile_id uuid references profiles(id) on delete cascade,
  store_id text references stores(id) on delete cascade,
  primary key (profile_id, store_id)
);

create table consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  purpose text not null check (purpose in ('terms','privacy','age14','marketing_inapp','marketing_push','marketing_kakao')),
  version text not null,
  granted boolean not null,
  at timestamptz not null default now(),
  withdrawn_at timestamptz
);
create index on consents (user_id, purpose, at desc);

create table menu_categories (id text primary key, brand brand_id not null, name text not null, sort_order int not null default 0);

create table menu_items (
  id text primary key,
  brand brand_id not null,
  store_id text not null references stores(id),
  category_id text not null references menu_categories(id),
  name text not null,
  summary text, description text,
  price int check (price is null or price between 0 and 1000000),
  price_evidence evidence_status not null default 'UNKNOWN',
  tags text[] not null default '{}',
  photo_path text,
  nutrition_status text not null default 'UNVERIFIED' check (nutrition_status in ('UNVERIFIED','VERIFIED')),
  allergen_status text not null default 'UNKNOWN' check (allergen_status in ('UNKNOWN','VERIFIED')),
  published boolean not null default false,
  is_signature boolean not null default false,
  evidence evidence_status not null default 'ASSUMPTION',
  source text,
  is_demo boolean not null default false,
  sort_order int not null default 0
);

-- 영양·원재료 검증 자료 (검증 전에는 고객에게 수치 표시 금지)
create table menu_ingredient_verifications (
  id uuid primary key default gen_random_uuid(),
  menu_item_id text not null references menu_items(id) on delete cascade,
  ingredients text[], weight_g int, kcal int, protein_g numeric, allergens text[],
  source_doc_path text not null,
  verified_by uuid references profiles(id),
  verified_at timestamptz
);

create table cafe_cats (
  id text primary key,
  name text not null,
  is_placeholder boolean not null default true,
  tagline text, personality text[] default '{}', likes text[] default '{}', interaction_tips text[] default '{}',
  published boolean not null default false,
  sort_order int not null default 0,
  internal_note text                          -- 직원 전용 (RLS로 고객 차단, 고객용 뷰에서 제외)
);

create table cat_photos (
  id uuid primary key default gen_random_uuid(),
  cat_id text not null references cafe_cats(id) on delete cascade,
  storage_path text not null,
  caption text, alt text not null,
  status text not null default 'PENDING_REVIEW' check (status in ('PUBLISHED','PENDING_REVIEW','HIDDEN')),
  sort_order int not null default 0,
  uploaded_by uuid references profiles(id),
  rights_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create table favorites (
  user_id uuid references profiles(id) on delete cascade,
  menu_item_id text references menu_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, menu_item_id)
);

create table customer_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  type text not null,
  ref text, label text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on customer_events (type, created_at desc);

create table visit_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  store_id text not null references stores(id),
  method text not null check (method in ('DAILY_CODE','STAFF')),
  day_key date not null,
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','REJECTED','REVERSED')),
  decided_at timestamptz, decided_by uuid references profiles(id), reject_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
-- 같은 고객·매장·날짜에 반려되지 않은 체크인은 1건만
create unique index visit_checkins_one_per_day on visit_checkins (user_id, store_id, day_key) where status <> 'REJECTED';

create table order_intents (       -- 링크 클릭 등 의향(실적 아님)
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  store_id text references stores(id),
  kind text not null check (kind in ('LINK_CLICK','SELF_REPORT')),
  channel text, created_at timestamptz not null default now()
);

create table order_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  store_id text not null references stores(id),
  menu_item_ids text[] not null default '{}',
  amount int check (amount is null or amount >= 0),
  method text not null check (method in ('SELF_REPORT','STAFF','POS','RECEIPT')),
  status text not null default 'PENDING' check (status in ('PENDING','CONFIRMED','REJECTED','REVERSED')),
  note text, provenance text not null,
  decided_at timestamptz, decided_by uuid references profiles(id), reject_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table loyalty_rules (
  id text primary key,
  kind text not null unique check (kind in ('SIGNUP','STAMP','REFERRAL_REFERRER','REFERRAL_REFEREE')),
  title text not null, benefit text not null,
  stamps_required int check (stamps_required between 2 and 30),
  valid_days int not null check (valid_days between 1 and 365),
  qualifying_event text not null default 'CONFIRMED_PURCHASE_OR_VISIT',
  active boolean not null default true,
  evidence evidence_status not null default 'ASSUMPTION',
  updated_at timestamptz not null default now(), updated_by uuid references profiles(id)
);

create table coupon_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  rule_id text not null references loyalty_rules(id),
  title text not null, benefit text not null,
  code text not null unique,
  status text not null default 'ISSUED' check (status in ('ISSUED','REDEEMED','EXPIRED','CANCELLED')),
  issued_at timestamptz not null default now(), expires_at timestamptz not null,
  redeemed_at timestamptz, redeemed_by uuid references profiles(id),
  cancelled_at timestamptz, cancel_reason text,
  source text not null,
  idempotency_key text not null unique,     -- 중복 발급 방지
  is_demo boolean not null default false
);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null unique references coupon_issues(id), -- 1회 사용
  store_id text references stores(id),
  redeemed_by uuid not null references profiles(id),
  redeemed_at timestamptz not null default now()
);

create table referral_codes (code text primary key, user_id uuid not null unique references profiles(id));

create table referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles(id),
  referee_id uuid not null unique references profiles(id),  -- 한 회원은 한 번만 귀속
  code text not null,
  status text not null default 'PENDING' check (status in ('PENDING','QUALIFIED','REWARDED','REJECTED','REVERSED')),
  reason text, qualified_at timestamptz, qualifying_ref uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check (referrer_id <> referee_id)
);

create table reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  kind text not null check (kind in ('STAMP','COUPON','REFERRAL_REWARD')),
  delta int not null,
  label text not null,
  status text not null check (status in ('EXPECTED','CONFIRMED','REVERSED')),
  source_ref text not null,
  idempotency_key text not null unique,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null, segment text not null,
  channel text not null check (channel in ('IN_APP','KAKAO','PUSH')),
  title text not null, body text not null,
  draft_method text not null default 'TEMPLATE_RULE',
  status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED','SENT','PAUSED')),
  why text[] default '{}',
  created_by uuid references profiles(id), approved_by uuid references profiles(id),
  created_at timestamptz not null default now(), sent_at timestamptz, recipients int default 0,
  is_demo boolean not null default false
);

create table notification_preferences (user_id uuid primary key references profiles(id) on delete cascade, quiet_hours int4range);

create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('SERVICE','MARKETING')),
  title text not null, body text not null, link text,
  campaign_id uuid references campaigns(id),
  created_at timestamptz not null default now(), read_at timestamptz
);

create table reorder_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  menu_item_id text not null references menu_items(id),
  reasons text[] not null,
  status text not null default 'SUGGESTED' check (status in ('SUGGESTED','APPROVED','DISMISSED','CONVERTED')),
  decided_at timestamptz, decided_by uuid references profiles(id),
  notification_id uuid references notification_logs(id), converted_ref uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index reorder_one_open on reorder_candidates (user_id, menu_item_id) where status in ('SUGGESTED','APPROVED');

create table admin_tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null, ref_id text not null,
  user_id uuid references profiles(id), store_id text references stores(id),
  title text not null,
  status text not null default 'OPEN' check (status in ('OPEN','DONE','DISMISSED')),
  created_at timestamptz not null default now(), done_at timestamptz, done_by uuid references profiles(id)
);

create table proof_events (           -- PROOF_EVENT_SCHEMA.md
  proof_event_id uuid primary key default gen_random_uuid(),
  event_type text not null,
  trigger text not null, decision text not null,
  decision_method text not null check (decision_method in ('RULE','HUMAN','RULE+HUMAN')),
  why text, human_approval uuid references profiles(id),
  action text not null, result text not null,
  kpi_before text, kpi_after text,
  data_source text not null,
  user_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  result_confirmed_at timestamptz,
  evidence_link text,
  status data_status not null
);

create table audit_logs (
  id bigserial primary key,
  actor_id uuid references profiles(id), actor_role text not null,
  action text not null, target text not null, detail text,
  at timestamptz not null default now()
);

create table roadmap_interest (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  item_key text not null,
  notify_consent boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, item_key)
);

-- 고객용 공개 뷰: 내부 메모 제외
create view public_cafe_cats as
  select id, name, is_placeholder, tagline, personality, likes, interaction_tips, sort_order
  from cafe_cats where published;
