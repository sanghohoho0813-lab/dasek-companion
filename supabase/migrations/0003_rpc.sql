-- ═══════════════════════════════════════════════════════════════
-- 0003 RPC — 트랜잭션 경계 (READY · 핵심 1개 예시 + 나머지 목록)
-- src/lib/domain.ts 의 같은 이름 함수가 기준 구현(테스트: tests/unit/domain.test.ts)
-- ═══════════════════════════════════════════════════════════════

-- 체크인 확인: 권한 확인 → 상태 전이 → 스탬프(매장·일 1회 멱등) → 추천 자격 → Proof → 감사
create or replace function decide_checkin(p_checkin uuid, p_approve boolean, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c visit_checkins; k text;
begin
  select * into c from visit_checkins where id = p_checkin for update;
  if not found then raise exception 'not found'; end if;
  if not can_store(c.store_id) then raise exception 'forbidden'; end if;
  if c.status <> 'PENDING' then raise exception 'already decided'; end if;

  update visit_checkins set status = case when p_approve then 'CONFIRMED' else 'REJECTED' end,
         decided_at = now(), decided_by = auth.uid(), reject_reason = case when p_approve then null else coalesce(p_reason,'매장 확인 불가') end
   where id = p_checkin;
  update admin_tasks set status = 'DONE', done_at = now(), done_by = auth.uid() where ref_id = p_checkin::text and status = 'OPEN';
  insert into audit_logs(actor_id, actor_role, action, target, detail) values (auth.uid(), my_role()::text, case when p_approve then 'checkin.confirm' else 'checkin.reject' end, p_checkin::text, p_reason);
  if not p_approve then return; end if;

  k := format('stamp:%s:%s:%s', c.user_id, c.store_id, c.day_key);
  insert into reward_ledger(user_id, kind, delta, label, status, source_ref, idempotency_key)
  values (c.user_id, 'STAMP', 1, '스탬프 +1 (방문 확인)', 'CONFIRMED', p_checkin::text, k)
  on conflict (idempotency_key) do nothing;

  perform qualify_referral(c.user_id, p_checkin);   -- TODO(READY): domain.ts afterVerifiedUse 와 동일 로직
  perform issue_stamp_reward_if_due(c.user_id);     -- TODO(READY)

  insert into proof_events(event_type, trigger, decision, decision_method, why, human_approval, action, result, data_source, user_id, result_confirmed_at, status)
  values ('VERIFIED_VISIT','고객 앱 체크인(오늘의 코드)','직원이 매장 내 방문을 확인','RULE+HUMAN','코드 일치 + 직원 확인', auth.uid(), '방문 확정, 스탬프 판정','고객 방문 이력·혜택 갱신', 'visit_checkins/'||p_checkin, c.user_id, now(), 'PILOT');
end $$;

-- 같은 패턴으로 구현할 RPC (READY):
--   signup_profile(name, phone, consents jsonb, referral_code)   — phone_hash 는 서버 pepper 로 계산
--   submit_checkin(store_id, code)                                — 오늘 코드 검증은 서버에서
--   self_report_purchase(store_id, menu_item_ids, note)
--   decide_purchase(id, approve, amount, reason) / staff_record_purchase(user_id, store_id, items, amount)
--   reverse_use(kind, id, reason)                                 — manager 전용
--   redeem_coupon(coupon_id) / cancel_coupon(coupon_id, reason) / reissue_coupon(coupon_id, reason)
--   refresh_reorder_candidates() / decide_reorder(id, approve)
--   create_campaign(...) / approve_and_send_campaign(id)          — IN_APP 만, 동의자만
--   process_deletion(user_id)                                     — 익명화
