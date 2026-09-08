---
lang: ko
lang_reason: source-material
---

# [TEST] 테크브릿지 — 고객 요구사항 정리 (client_requirements)

> Procedure: `requirements-confirmation` · Owner: strategy-analyst (+ industry-expert 보강) · Source: `deliverables/references/techbridge-rfp-2026-09-08_ko.md`
> **가상 테스트 데이터**

## 기능 요구사항 (Functional)

| ID | 요구사항 | 출처 |
|----|---------|------|
| F1 | 웹/모바일 앱 임베드형 챗봇 위젯 | RFP §요구사항 1 |
| F2 | 주문조회 / 배송조회 / 반품접수 3대 시나리오 자동응대 | RFP §요구사항 2 |
| F3 | 자동응대 실패 시 상담원 핸드오프 | RFP §요구사항 3 |
| F4 | Zendesk 티켓 시스템 연동 | RFP §요구사항 4 |

## 비기능 요구사항 (Non-functional)

| ID | 요구사항 | 출처 |
|----|---------|------|
| N1 | 응답 지연 3초 이내 | RFP §요구사항 5 |
| N2 | 개인정보(주문정보) 처리 망분리 준수 | RFP §요구사항 6 |

## 제약사항 (Constraint)

| ID | 제약 | 출처 |
|----|------|------|
| C1 | 예산 상한 3억원 | RFP §요구사항 7 |
| C2 | 가동 목표일 2027-03-01 (약 6개월) | RFP §배경, §요구사항 7 |
| C3 | 특정 벤더 락인 구조 지양 | RFP §요구사항 8 |

## 배경 보강 (industry-expert, 공개정보 기반 — 가상)

- 이커머스 물류 업종 특성상 성수기(11~12월) 문의량이 평시 대비 3배 이상 증가하는 경향 — 확장성(scalability) 요건으로 아키텍처에 반영 필요.
- Zendesk는 공식 REST API + Webhook을 제공하므로 F4 연동은 표준 API 연동으로 해결 가능 (커스텀 미들웨어 불필요).

## 미해결 질문 (Open Questions)

- 망분리 요건(N2)이 물리적 망분리인지 논리적(VPC/방화벽) 망분리인지 RFP 원문에 명시 없음 — 견적에 영향이 크므로 확인 필요.
- 챗봇 엔진의 LLM 사용 여부/방식에 대한 고객 측 선호(사내 LLM vs 외부 API) 명시 없음.
