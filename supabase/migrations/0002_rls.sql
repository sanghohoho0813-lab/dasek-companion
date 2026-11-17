-- ═══════════════════════════════════════════════════════════════
-- 0002 RLS — src/lib/permissions.ts 와 같은 규칙 (READY)
-- 고객: 본인 기록만 / 직원: 담당 매장 업무 / 책임자: 사업·매장 관리
-- ═══════════════════════════════════════════════════════════════
create or replace function my_role() returns app_role language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function is_operator() returns boolean language sql stable as $$ select my_role() in ('staff','manager') $$;
create or replace function is_manager()  returns boolean language sql stable as $$ select my_role() = 'manager' $$;
create or replace function can_store(sid text) returns boolean language sql stable security definer set search_path = public as
$$ select is_manager() or exists (select 1 from staff_store_access where profile_id = auth.uid() and store_id = sid) $$;

do $$ declare t text; begin
  for t in select unnest(array['business_entities','stores','profiles','staff_store_access','consents','menu_categories','menu_items','menu_ingredient_verifications','cafe_cats','cat_photos','favorites','customer_events','visit_checkins','order_intents','order_verifications','loyalty_rules','coupon_issues','coupon_redemptions','referral_codes','referral_attributions','reward_ledger','campaigns','notification_preferences','notification_logs','reorder_candidates','admin_tasks','proof_events','audit_logs','roadmap_interest']) loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;

-- 공개 콘텐츠 (비회원 열람 가능)
create policy "public read stores" on stores for select using (true);
create policy "public read categories" on menu_categories for select using (true);
create policy "public read menu" on menu_items for select using (published or is_operator());
create policy "operators read cats" on cafe_cats for select using (is_operator()); -- 고객은 public_cafe_cats 뷰 사용
create policy "public read photos" on cat_photos for select using (status = 'PUBLISHED' or is_operator());
create policy "public read rules" on loyalty_rules for select using (true);

-- 본인 데이터
create policy "own profile" on profiles for select using (id = auth.uid() or is_operator());
create policy "own profile update name" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = 'customer');
create policy "own consents" on consents for select using (user_id = auth.uid() or is_operator());
create policy "insert own consents" on consents for insert with check (user_id = auth.uid());
create policy "own favorites" on favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own coupons" on coupon_issues for select using (user_id = auth.uid() or is_operator());
create policy "own ledger" on reward_ledger for select using (user_id = auth.uid() or is_operator());
create policy "own notifications" on notification_logs for select using (user_id = auth.uid());
create policy "read own notifications" on notification_logs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own checkins" on visit_checkins for select using (user_id = auth.uid() or can_store(store_id));
create policy "own verifications" on order_verifications for select using (user_id = auth.uid() or can_store(store_id));
create policy "own referrals" on referral_attributions for select using (referrer_id = auth.uid() or referee_id = auth.uid() or is_operator());
create policy "own events insert" on customer_events for insert with check (user_id is null or user_id = auth.uid());
create policy "operators read events" on customer_events for select using (is_operator());
create policy "own roadmap" on roadmap_interest for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 운영
create policy "staff tasks" on admin_tasks for select using (is_operator() and (store_id is null or can_store(store_id)));
create policy "manager campaigns" on campaigns for all using (is_manager()) with check (is_manager());
create policy "staff read campaigns" on campaigns for select using (is_operator());
create policy "staff draft campaigns" on campaigns for insert with check (is_operator() and status = 'DRAFT');
create policy "manager rules" on loyalty_rules for update using (is_manager()) with check (is_manager());
create policy "manager content" on menu_items for update using (is_manager()) with check (is_manager());
create policy "manager cats" on cafe_cats for all using (is_manager()) with check (is_manager());
create policy "operators upload photos" on cat_photos for insert with check (is_operator() and status = 'PENDING_REVIEW');
create policy "manager review photos" on cat_photos for update using (is_manager());
create policy "operators reorder read" on reorder_candidates for select using (is_operator());
create policy "operators proof read" on proof_events for select using (is_operator());
create policy "manager audit read" on audit_logs for select using (is_manager());

-- 상태 변경(확인·보상·발송)은 아래 0003 의 security definer RPC 로만 수행한다.
-- 클라이언트가 coupon_issues / reward_ledger / referral_attributions / proof_events 에 직접 insert/update 하는 정책은 두지 않는다.
