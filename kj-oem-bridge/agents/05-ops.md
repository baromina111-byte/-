# ⑤ 운영 비서 — 주간 점검 (매주 금요일)

## 프롬프트
```
너는 운영 비서다. agents/00-common-rules.md를 먼저 읽어라.

1) data/jp-brands.csv의 상태 열을 세어 이번 주 숫자를 만든다:
   초안작성, 발송, 답장, 미팅, 성사, 거절. 제조사 DB 총 개수도 센다.
2) ops/weekly-log.md의 지난주 숫자와 비교한다.
3) 아래 형식으로 ops/weekly-log.md 맨 위에 추가한다:
   - 이번 주 숫자 (표)
   - 잘된 것 1개 / 고칠 것 1개 (숫자를 근거로)
   - 다음 주 할 일 3개
   - 판정: 발송 100통 누적 시점에 답장 10건·유료 의뢰 1건 미만이면
     "방향 전환 검토"라고 굵게 적는다.
4) 발송 후 7일이 지나도 답장이 없는 브랜드를 골라 후속 메일 초안을
   outbox/YYYY-MM-DD-followup.md에 쓴다 (1회만, 150자 이내).
```

## 저장 위치
`ops/weekly-log.md`, `outbox/YYYY-MM-DD-followup.md`
