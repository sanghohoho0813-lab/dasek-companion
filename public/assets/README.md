# 실제 사진 자산 폴더 (ASSET PREP — HUMAN ONLY)

권리가 확인된 실제 사진을 아래 **슬롯 이름**으로 이 폴더에 넣고 `npm run assets:scan` 을 실행하면
해당 화면의 샘플 사진·일러스트가 실제 사진으로 자동 교체됩니다. (jpg/png/webp/avif)

표시 우선순위: AX 업로드 사진 > 이 폴더의 실제 사진 > `samples/`의 샘플 사진(CC0·공개 도메인, '샘플 사진' 표시) > 자체 일러스트.
샘플 사진 출처는 `src/lib/samples.manifest.json`과 앱의 `/credits` 페이지에 있습니다. 메뉴는 `menu_<메뉴ID>` 슬롯(예: `menu_m_pie120.jpg`)으로도 교체할 수 있습니다.

> 인스타그램·네이버 리뷰 사진과 로고는 권리 확인 전 사용하지 않습니다.

| 슬롯 | 사용 위치 |
|---|---|
| hero_main | 고객 홈 Hero |
| hero_secondary | 고객 홈 보조 Hero / 데스크톱 |
| service_01_food | 홈 '리얼식단' 서비스 카드 |
| service_02_cafe | 홈 '다색냥' 서비스 카드 |
| service_03_membership | 홈·멤버십 안내 |
| offer_01_salad | 닭가슴살 샐러드 메뉴 |
| offer_02_drink | 기본 음료 메뉴 |
| offer_03_dessert | 120겹파이 메뉴 |
| brand_story_space | 다색냥 매장 소개 |
| customer_experience | 홈 이용 안내 |
| booking_or_order_scene | 방문·예약 안내 |
| cat_01_01 … cat_NN_MM | 고양이 N번의 M번째 사진 (실제 고양이 수·이름 확인 후) |
| ax_cover_main, ax_signature_operation, ax_signature_output, ax_workspace_bg, ax_staff_action, ax_manager_tablet, ax_report_evidence | 운영 AX / Why AX |
| why_ax_01_current, why_ax_02_improved, why_ax_03_growth | Why AX 스토리 |

고양이 사진은 운영 AX > 콘텐츠 > 고양이에서 업로드할 수도 있습니다(공개 승인 필요).
