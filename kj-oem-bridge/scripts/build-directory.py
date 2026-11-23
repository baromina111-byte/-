#!/usr/bin/env python3
"""data/manufacturers.csv -> site/data.js (공개용: 회사명·연락처는 넣지 않는다)."""
import csv, json, re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAGS = [  # (키워드들, id, 일본어, 한국어, 일본 구분)
    (["향수", "퍼퓸", "EDP"], "perfume", "香水", "향수", "cos"),
    (["디퓨저"], "diffuser", "ディフューザー", "디퓨저", "goods"),
    (["룸스프레이", "룸미스트", "룸·차량용 스프레이", "스프레이"], "roomspray", "ルームスプレー", "룸스프레이", "goods"),
    (["캔들"], "candle", "キャンドル", "캔들", "goods"),
    (["섬유향수", "패브릭"], "fabric", "ファブリックミスト", "섬유향수", "goods"),
    (["필로우미스트"], "pillow", "ピローミスト", "필로우미스트", "goods"),
    (["헤어미스트", "헤어퍼퓸", "헤어케어", "헤어·바디", "헤어"], "hair", "ヘアミスト・ヘアケア", "헤어미스트·헤어케어", "cos"),
    (["바디미스트", "바디 스프레이", "바디워시", "바디케어", "바디"], "body", "ボディミスト・ボディケア", "바디미스트·바디케어", "cos"),
    (["인센스"], "incense", "インセンス", "인센스", "goods"),
    (["사쉐", "석고방향제", "고체 방향제", "방향제"], "sachet", "サシェ・芳香剤", "사쉐·방향제", "goods"),
    (["탈취제"], "deodorant", "消臭剤", "탈취제", "goods"),
    (["양말", "삭스", "스타킹"], "socks", "ソックス", "양말", "wear"),
    (["의류", "티셔츠", "맨투맨", "후드", "니트", "셔츠", "팬츠", "봉제", "어패럴"], "apparel", "アパレル", "의류", "wear"),
]
REGION = {"서울": "ソウル", "경기": "京畿道", "인천": "仁川", "부산": "釜山", "울산": "蔚山", "충북": "忠清北道", "충남": "忠清南道", "세종": "世宗", "대구": "大邱", "대전": "大田", "광주": "光州", "강원": "江原道", "경북": "慶尙北道", "경남": "慶尙南道", "전북": "全羅北道", "전남": "全羅南道", "제주": "済州"}
CERTS = ["ISO 22716", "ISO 9001", "ISO 14001", "CGMP"]
rows = list(csv.DictReader(open(os.path.join(ROOT, "data/manufacturers.csv"), encoding="utf-8-sig")))
out = []
for i, r in enumerate(rows, 1):
    items = r["주력품목"]
    tags = [t[1] for t in TAGS if any(k in items for k in t[0])]
    m = None if r["MOQ"].startswith("미확인") else re.search(r"(\d[\d,]*)\s*(?:개|켤레|장|족)", r["MOQ"])
    moq = int(m.group(1).replace(",", "")) if m else None
    reg_ko = next((k for k in REGION if k in r["소재지"]), None)
    certs = [c for c in CERTS if c in r["인증"]]
    if "비건" in r["인증"]: certs.append("Vegan")
    exp = r["수출경험"]
    out.append({
        "id": f"M-{i:02d}", "tags": tags, "moq": moq,
        "region": {"ko": reg_ko or "비공개", "ja": REGION.get(reg_ko, "非公開")},
        "certs": certs, "japan": "일본" in exp,
        "export": not exp.startswith("미확인"),
        "large": r["회사명"].startswith("[대형]"), "checked": r["확인일"],
        "registered": r.get("공장등록", "") == "확인",
    })
tags = [{"id": t[1], "ja": t[2], "ko": t[3], "kind": t[4]} for t in TAGS]
js = "window.SB_TAGS=" + json.dumps(tags, ensure_ascii=False) + ";\nwindow.SB_MAKERS=" + json.dumps(out, ensure_ascii=False) + ";\n"
open(os.path.join(ROOT, "site/data.js"), "w", encoding="utf-8").write(js)
print(len(out), "makers;", sum(1 for o in out if o["moq"]), "with MOQ;", sum(1 for o in out if not o["tags"]), "untagged")
