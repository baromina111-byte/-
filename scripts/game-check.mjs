#!/usr/bin/env node
/**
 * 김성태전: 제국의 시대 — 회귀 점검 봇
 *
 * kim-seongtae-v10-grand-remaster/index.html 를 임시 정적 서버에 올리고
 * 헤드리스 Chromium 으로 실제 조작해서 회귀를 잡는다.
 * 어서션은 "로딩되는가"가 아니라 "경영 시뮬레이션이 여전히 말이 되는가"를 본다.
 *
 *   node scripts/game-check.mjs                 요약 출력, 실패 시 exit 1
 *   node scripts/game-check.mjs --json out.json 기계 판독용 리포트도 기록
 *   node scripts/game-check.mjs --keep-open     통과한 어서션까지 전부 출력
 *   node scripts/game-check.mjs --dir <path>    다른 빌드 디렉터리를 점검
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGV = process.argv.slice(2);
const flag = (name, fallback) => ARGV.includes(name) ? ARGV[ARGV.indexOf(name) + 1] : fallback;
/* --dir 로 다른 빌드를 겨냥할 수 있다. 점검 자체를 검증할 때(고의로 망가뜨린 사본) 쓴다. */
const GAME_DIR = path.resolve(flag('--dir', path.join(ROOT, 'kim-seongtae-v10-grand-remaster')));
const JSON_OUT = flag('--json', null);
const VERBOSE = ARGV.includes('--keep-open');

/* Playwright 는 환경에 따라 전역 설치만 되어 있을 수 있다. */
async function loadChromium() {
  const candidates = ['playwright', '/opt/node22/lib/node_modules/playwright/index.mjs'];
  const errors = [];
  for (const spec of candidates) {
    try { return (await import(spec)).chromium; } catch (e) { errors.push(`${spec}: ${e.message}`); }
  }
  throw new Error('Playwright 를 찾지 못했습니다.\n  ' + errors.join('\n  '));
}

const MIME = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.js': 'text/javascript' };
function serve(dir) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]);
      const file = path.join(dir, rel === '/' ? 'index.html' : rel);
      if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }).end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

/* ---------- 점검 러너 ---------- */
const results = [];
let current = null;
function check(name) { current = { name, assertions: [], status: 'pass', notes: [] }; results.push(current); return current; }
function ok(label, condition, detail) {
  current.assertions.push({ label, pass: !!condition, detail: detail ?? null });
  if (!condition) current.status = 'fail';
  return !!condition;
}
function note(text) { current.notes.push(text); }

const FINITE_FIELDS = ['cash', 'debt', 'revenue', 'profit', 'ar', 'reputation', 'equity', 'month'];

async function main() {
  if (!fs.existsSync(path.join(GAME_DIR, 'index.html'))) {
    console.error(`게임 파일을 찾을 수 없습니다: ${path.join(GAME_DIR, 'index.html')}`);
    process.exit(2);
  }
  const chromium = await loadChromium();
  const { server, port } = await serve(GAME_DIR);
  const base = `http://127.0.0.1:${port}/index.html`;
  const browser = await chromium.launch();

  const pageErrors = [];
  async function fresh(difficulty) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => pageErrors.push(`[${difficulty || 'boot'}] ${e.message}`));
    page.on('console', m => {
      if (m.type() !== 'error') return;
      const t = m.text();
      /* 폰트 CDN 차단은 컨테이너 네트워크 정책이지 게임 결함이 아니다. */
      if (/Failed to load resource|fonts\.(googleapis|gstatic)\.com/.test(t)) return;
      pageErrors.push(`[${difficulty || 'boot'}] console: ${t}`);
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('.brand').length === 4 && typeof state !== 'undefined');
    if (difficulty) {
      await page.evaluate(d => {
        try { ['kim_seongtae_empire_v10_save', 'kim_seongtae_empire_v10_backup_1', 'kim_seongtae_empire_v10_backup_2'].forEach(k => localStorage.removeItem(k)); } catch (e) {}
        state = defaultState(d); save();
      }, difficulty);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await ready(page);
    }
    return { ctx, page };
  }
  const ready = p => p.waitForFunction(() => document.querySelectorAll('.brand').length === 4 && typeof state !== 'undefined');
  const snap = page => page.evaluate(() => ({
    month: state.month, cash: state.cash, debt: state.debt, revenue: state.revenue, profit: state.profit,
    ar: state.ar, reputation: state.reputation, equity: state.equity, grade: grade().g, nw: netWorth(),
    goal: state.goal, ending: state.ending, cycle: state.cycle.phase, conflict: avgConflict(), brand: avgBrand(),
    contracts: state.contracts.length, openEvents: state.events.filter(e => !e.done).length,
    achievements: Object.keys(state.achievements).length, history: state.history.length,
    payroll: payroll(), difficulty: state.difficulty
  }));

  /* ---------- 1. 부팅 ---------- */
  {
    check('boot');
    const { ctx, page } = await fresh(null);
    const title = await page.title();
    ok('타이틀에 v10.0', /v10\.0/.test(title), title);
    const v = await page.evaluate(() => VERSION);
    ok('VERSION === 10.0', v === '10.0', v);
    const s = await snap(page);
    ok('핵심 수치가 모두 유한', FINITE_FIELDS.every(f => Number.isFinite(s[f])), JSON.stringify(s));
    ok('브랜드 4개 렌더', await page.locator('.brand').count() === 4);
    ok('차트 영역 존재', await page.locator('#chart').count() === 1);
    await ctx.close();
  }

  /* ---------- 2. 페이지 구조 ---------- */
  {
    check('navigation');
    const { ctx, page } = await fresh(null);
    const pages = ['dashboard', 'brands', 'contracts', 'events', 'finance', 'archive'];
    for (const p of pages) {
      await page.click(`.nav [data-page="${p}"]`);
      await page.waitForTimeout(120);
      const active = await page.locator(`#page-${p}.active`).count();
      const cards = await page.locator(`#page-${p} .card`).count();
      ok(`${p} 활성화 + 카드 렌더`, active === 1 && cards > 0, `active=${active} cards=${cards}`);
    }
    ok('모바일 내비 6탭', await page.locator('.mnav [data-page]').count() === 6);
    await ctx.close();
  }

  /* ---------- 3. 브랜드 · 채널 ---------- */
  {
    check('brands');
    const { ctx, page } = await fresh('normal');
    await page.click('.nav [data-page="brands"]');
    await page.waitForTimeout(200);
    ok('브랜드마다 크레스트 SVG', await page.locator('.brand svg.crest').count() === 4);
    ok('브랜드마다 채널 버튼 4개', await page.locator('.brand .seg button').count() === 16);

    const before = await page.evaluate(() => {
      const b = state.brands.find(x => x.id === 'commov');
      return { channel: b.channel, conflict: b.conflict, margin: b.margin };
    });
    const target = before.channel === 'dtc' ? 'b2b' : 'dtc';
    await page.click(`[data-brand="commov"][data-ch="${target}"]`);
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => {
      const b = state.brands.find(x => x.id === 'commov');
      return { channel: b.channel, conflict: b.conflict, margin: b.margin };
    });
    ok('채널 전환이 반영됨', after.channel === target, `${before.channel} → ${after.channel}`);
    ok('채널 전환이 충돌/마진을 움직임',
      after.conflict !== before.conflict || after.margin !== before.margin,
      JSON.stringify({ before, after }));

    const inv = await page.evaluate(() => {
      const b = state.brands.find(x => x.id === 'dnj');
      const cash0 = state.cash, brand0 = b.brand, monthly0 = b.monthly;
      investBrand('dnj');
      const b2 = state.brands.find(x => x.id === 'dnj');
      return { cashDown: cash0 - state.cash, brandUp: b2.brand - brand0, monthlyUp: b2.monthly - monthly0 };
    });
    ok('브랜드 투자가 현금을 쓰고 브랜드력을 올림',
      inv.cashDown > 0 && inv.brandUp > 0 && inv.monthlyUp > 0, JSON.stringify(inv));

    const drift = await page.evaluate(() => Object.fromEntries(Object.entries(CHANNELS).map(([k, c]) => [k, c.drift])));
    ok('채널 충돌 표류가 트레이드오프를 유지 (DTC/지역 음수, 혼합 양수)',
      drift.dtc < 0 && drift.local < 0 && drift.hybrid > 0, JSON.stringify(drift));
    await ctx.close();
  }

  /* ---------- 4. 계약 · 미수금 ---------- */
  {
    check('contracts');
    const { ctx, page } = await fresh('normal');
    await page.click('.nav [data-page="contracts"]');
    await page.waitForTimeout(200);
    await page.fill('#contractAmount', '4000');

    const created = await page.evaluate(() => {
      const q = contractQuote();
      const cash0 = state.cash, ar0 = state.ar, n0 = state.contracts.length;
      addContract();
      return { q, cashUp: state.cash - cash0, arUp: state.ar - ar0, added: state.contracts.length - n0,
               risk: state.contracts[0].risk, days: state.contracts[0].days };
    });
    ok('계약 1건 등록', created.added === 1);
    ok('선금만큼 현금 증가', created.cashUp === created.q.upfront, JSON.stringify(created));
    ok('잔금만큼 미수금 증가', created.arUp === created.q.balance, JSON.stringify(created));
    ok('부실위험이 0~1 범위', created.risk > 0 && created.risk < 1, String(created.risk));

    const collected = await page.evaluate(() => {
      const c = state.contracts[0];
      const cash0 = state.cash, ar0 = state.ar, bal = c.balance;
      collect(c.id);
      return { cashUp: state.cash - cash0, arDown: ar0 - state.ar, bal, status: state.contracts[0].status,
               balAfter: state.contracts[0].balance };
    });
    ok('회수 시 현금 증가', collected.cashUp > 0, JSON.stringify(collected));
    ok('회수 시 미수금 전액 제거', collected.arDown === collected.bal, JSON.stringify(collected));
    ok('회수액이 잔금을 넘지 않음', collected.cashUp <= collected.bal, JSON.stringify(collected));
    ok('계약 잔금 0 + 종결 상태', collected.balAfter === 0 && collected.status !== '진행', JSON.stringify(collected));

    const term = await page.evaluate(() => {
      document.getElementById('contractTerm').value = '30'; const a = contractQuote().amount;
      document.getElementById('contractTerm').value = '90'; const b = contractQuote().amount;
      return { d30: a, d90: b };
    });
    ok('회수기한이 길수록 단가가 오름', term.d90 > term.d30, JSON.stringify(term));
    await ctx.close();
  }

  /* ---------- 5. 사건 ---------- */
  {
    check('events');
    const { ctx, page } = await fresh('normal');
    const ev = await page.evaluate(() => {
      const open = state.events.filter(e => !e.done);
      const first = open[0];
      const n0 = state.stats.eventsResolved;
      resolveEvent(first.id, 0);
      return { had: open.length, id: first.id, story: first.story,
               done: state.events.find(e => e.id === first.id).done,
               resolvedUp: state.stats.eventsResolved - n0 };
    });
    ok('시작 시 고정 사건이 대기', ev.had >= 4, String(ev.had));
    ok('사건 처리 시 done 처리', ev.done === true);
    ok('처리 카운터 증가', ev.resolvedUp === 1);

    const expiry = await page.evaluate(() => {
      const e = state.events.find(x => !x.done);
      e.deadline = 1;
      const cash0 = state.cash;
      expireEvents();
      return { done: state.events.find(x => x.id === e.id).done, cashMoved: state.cash !== cash0,
               log: state.logs[0].t };
    });
    ok('기한 초과 사건이 자동 처리됨', expiry.done === true, expiry.log);
    ok('자동 처리에 불리한 효과가 적용됨', /기한 초과/.test(expiry.log), expiry.log);

    const pool = await page.evaluate(() => ({ pool: eventPool.length, story: storyEvents.length }));
    ok('랜덤 사건 풀이 비지 않음', pool.pool >= 12, JSON.stringify(pool));
    await ctx.close();
  }

  /* ---------- 6. 재무 ---------- */
  {
    check('finance');
    const { ctx, page } = await fresh('normal');
    const loan = await page.evaluate(() => {
      const limit = loanLimit();
      document.getElementById('loanAmount').value = String(Math.round(limit / 2 / 500) * 500);
      const cash0 = state.cash, debt0 = state.debt;
      takeLoan();
      const taken = { cashUp: state.cash - cash0, debtUp: state.debt - debt0 };
      document.getElementById('loanAmount').value = String(loanLimit() + 50000);
      const cash1 = state.cash; takeLoan();
      return { limit, taken, overLimitBlocked: state.cash === cash1, rate: interestRate() };
    });
    ok('대출이 현금과 부채를 같이 올림', loan.taken.cashUp > 0 && loan.taken.cashUp === loan.taken.debtUp, JSON.stringify(loan.taken));
    ok('한도 초과 대출은 거부', loan.overLimitBlocked);
    ok('금리가 2%~20% 범위', loan.rate >= 0.02 && loan.rate <= 0.2, String(loan.rate));

    const eq = await page.evaluate(() => {
      document.getElementById('equityPct').value = '5';
      const cash0 = state.cash, eq0 = state.equity;
      raiseRound();
      const first = { cashUp: state.cash - cash0, eqDown: eq0 - state.equity };
      state.equity = 42; document.getElementById('equityPct').value = '10';
      const cash1 = state.cash; raiseRound();
      return { first, floorHeld: state.cash === cash1 && state.equity === 42 };
    });
    ok('투자 유치가 현금↑ 지분↓', eq.first.cashUp > 0 && eq.first.eqDown === 5, JSON.stringify(eq.first));
    ok('지분 40% 하한이 지켜짐', eq.floorHeld);

    const staff = await page.evaluate(() => {
      const p0 = payroll(), n0 = state.staff.finance;
      hire('finance');
      const p1 = payroll();
      fire('finance');
      return { hired: state.staff.finance - n0 + 1, payrollUp: p1 - p0, payrollBack: payroll() === p0 };
    });
    ok('채용이 인건비를 늘림', staff.payrollUp === 200, JSON.stringify(staff));
    ok('감원이 인건비를 되돌림', staff.payrollBack);

    const grades = await page.evaluate(() => GRADES.map(g => g.g));
    ok('신용등급 8단계 유지', grades.length === 8 && grades[0] === 'AAA' && grades[7] === 'D', grades.join(','));
    await ctx.close();
  }

  /* ---------- 7. 시뮬레이션 안정성 (난이도 3종 × 36개월) ---------- */
  for (const d of ['easy', 'normal', 'hard']) {
    check(`simulate:${d}`);
    const { ctx, page } = await fresh(d);
    const run = await page.evaluate(() => {
      const bad = [];
      const fields = ['cash', 'debt', 'revenue', 'profit', 'ar', 'reputation', 'equity', 'month'];
      let prevMonth = state.month, ran = 0;
      for (let i = 0; i < 36; i++) {
        /* 엔딩에 도달하면 simulate() 는 의도적으로 조기 반환한다 — 거기서 멈춘다. */
        if (state.ending) break;
        simulate(true); ran++;
        for (const f of fields) if (!Number.isFinite(state[f])) bad.push(`${f}@m${state.month}=${state[f]}`);
        if (!Number.isFinite(netWorth())) bad.push(`netWorth@m${state.month}`);
        if (state.month !== prevMonth + 1) bad.push(`month jumped ${prevMonth}→${state.month}`);
        prevMonth = state.month;
        state.brands.forEach(b => {
          if (!Number.isFinite(b.monthly) || b.monthly < 0) bad.push(`${b.id}.monthly@m${state.month}=${b.monthly}`);
          if (b.brand < 0 || b.brand > 100) bad.push(`${b.id}.brand out of range ${b.brand}`);
          if (b.conflict < 0 || b.conflict > 100) bad.push(`${b.id}.conflict out of range ${b.conflict}`);
          if (b.margin < 0) bad.push(`${b.id}.margin ${b.margin}`);
        });
        if (state.reputation < 0 || state.reputation > 100) bad.push(`reputation ${state.reputation}`);
        if (state.ar < 0) bad.push(`ar negative ${state.ar}`);
      }
      return { bad, ran, history: state.history.length, month: state.month,
               revenue: state.revenue, nw: netWorth(), ending: state.ending };
    });
    ok(`${run.ran}개월 동안 비정상 수치 없음`, run.bad.length === 0, run.bad.slice(0, 8).join(' | '));
    ok('히스토리가 48개월 상한을 지킴', run.history <= 48, String(run.history));
    ok('매출이 0으로 죽지 않음', run.revenue > 0, String(run.revenue));
    ok('36개월을 다 돌았거나 엔딩에서 멈춤', run.ran === 36 || !!run.ending,
      `ran=${run.ran} ending=${run.ending}`);
    note(`${run.month}개월차 매출 ${run.revenue} / 순자산 ${run.nw}${run.ending ? ' / 엔딩 ' + run.ending : ''}`);
    await ctx.close();
  }

  /* ---------- 8. 저장 · 복구 ---------- */
  {
    check('persistence');
    const { ctx, page } = await fresh('normal');
    await page.evaluate(() => { for (let i = 0; i < 5; i++) simulate(true); save(); });
    const before = await snap(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    const after = await snap(page);
    ok('새로고침 후 상태 보존',
      before.month === after.month && before.cash === after.cash && before.ar === after.ar,
      JSON.stringify({ before: { m: before.month, c: before.cash }, after: { m: after.month, c: after.cash } }));

    const tamper = await page.evaluate(() => {
      const raw = localStorage.getItem('kim_seongtae_empire_v10_save');
      const p = JSON.parse(raw);
      p.data.cash = 999999999;            // 체크섬은 그대로 → 검증 실패해야 함
      let rejected = false;
      try { unpack(JSON.stringify(p)); } catch (e) { rejected = true; }
      return rejected;
    });
    ok('변조된 저장을 체크섬이 거부', tamper);

    const recovered = await page.evaluate(() => {
      const good = localStorage.getItem('kim_seongtae_empire_v10_save');
      localStorage.setItem('kim_seongtae_empire_v10_backup_1', good);
      localStorage.setItem('kim_seongtae_empire_v10_save', '{"data":{"month":1},"checksum":"deadbeef"}');
      return true;
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    const rec = await page.evaluate(() => ({ month: state.month, log: state.logs.map(l => l.t).join(' || ') }));
    ok('본 저장이 깨지면 백업에서 복구',
      recovered && rec.month === before.month && /백업 복구/.test(rec.log),
      `month=${rec.month} expected=${before.month}`);
    await ctx.close();
  }

  /* ---------- 9. v9.3 마이그레이션 ---------- */
  {
    check('migration');
    const { ctx, page } = await fresh(null);
    await page.evaluate(() => {
      const old = {
        version: '9.3', month: 7, cash: 51234, debt: 9000, revenue: 12345, profit: 2222,
        ar: 3456, reputation: 71,
        brands: [{ id: 'commov', brand: 88, conflict: 41, channel: 'b2b' }]
      };
      localStorage.clear();
      localStorage.setItem('kim_seongtae_empire_v93_save', JSON.stringify({ data: old, checksum: checksum(old) }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    const m = await page.evaluate(() => ({
      from: state.migratedFrom, month: state.month, cash: state.cash, ar: state.ar, reputation: state.reputation,
      commov: state.brands.find(b => b.id === 'commov'), version: state.version
    }));
    ok('v9.3 저장을 이전함', m.from === 'kim_seongtae_empire_v93_save', String(m.from));
    ok('핵심 재무 수치 승계', m.month === 7 && m.cash === 51234 && m.ar === 3456 && m.reputation === 71, JSON.stringify(m));
    ok('브랜드력·충돌·채널 승계',
      m.commov.brand === 88 && m.commov.conflict === 41 && m.commov.channel === 'b2b', JSON.stringify(m.commov));
    ok('버전이 10.0 으로 올라감', m.version === '10.0', m.version);
    await ctx.close();
  }

  /* ---------- 10. 밸런스 (경제가 죽지도, 터지지도 않았는가) ---------- */
  {
    check('balance');
    const { ctx, page } = await fresh('easy');
    const easy = await page.evaluate(() => {
      /* 합리적으로 플레이하는 가상 플레이어: 사건은 기대값이 가장 높은 선택지,
         충돌이 오르면 현금회수로 전환, 여유 현금은 브랜드에 재투자. */
      hire('sales'); hire('marketing'); hire('finance');
      const track = [];
      for (let i = 0; i < 60 && !state.ending; i++) {
        state.events.filter(e => !e.done).forEach(e => {
          let best = 0, bs = -Infinity;
          e.choices.forEach((c, idx) => {
            const f = c[1];
            const s = (f.cash || 0) + (f.brand || 0) * 160 + (f.rep || 0) * 120 - (f.conflict || 0) * 90 + (f.ar || 0) * 0.35;
            if (s > bs) { bs = s; best = idx }
          });
          resolveEvent(e.id, best);
        });
        while (state.cash > 55000) {
          const weakest = state.brands.slice().sort((a, b) => a.brand - b.brand)[0];
          const c0 = state.cash; investBrand(weakest.id);
          if (state.cash === c0) break;
        }
        document.getElementById('adSpend').value = String(Math.min(3000, Math.max(300, Math.round(state.revenue * 0.12 / 100) * 100)));
        document.getElementById('focus').value = avgConflict() > 38 ? 'cash' : 'growth';
        simulate(true);
        if (state.month % 12 === 0) track.push({ m: state.month, rev: state.revenue, nw: netWorth() });
      }
      return { months: state.month, ending: state.ending, nw: netWorth(), goal: state.goal,
               rev: state.revenue, achievements: Object.keys(state.achievements).length, track };
    });
    ok('쉬움 난이도가 60개월 안에 승리 가능', easy.ending === 'win',
      `month=${easy.months} nw=${easy.nw} goal=${easy.goal}`);
    ok('업적이 최소 6개 해금', easy.achievements >= 6, String(easy.achievements));
    note(`쉬움 자동플레이: ${easy.months}개월, 순자산 ${easy.nw} / 목표 ${easy.goal}, 업적 ${easy.achievements}`);
    note('연차 추이 ' + easy.track.map(t => `${t.m}M:${t.nw}`).join(' '));
    await ctx.close();

    const { ctx: ctx2, page: page2 } = await fresh('hard');
    const hard = await page2.evaluate(() => {
      for (let i = 0; i < 12 && !state.ending; i++) simulate(true);
      return { ending: state.ending, nw: netWorth(), goal: state.goal };
    });
    ok('어려움이 1년 만에 터지지 않음 (인플레 회귀 감지)', hard.ending !== 'win',
      `nw=${hard.nw} goal=${hard.goal}`);
    note(`어려움 12개월 무개입: 순자산 ${hard.nw} / 목표 ${hard.goal}`);
    await ctx2.close();
  }

  /* ---------- 11. 콘솔 · 페이지 에러 ---------- */
  {
    check('runtime-errors');
    ok('JS 에러 0건', pageErrors.length === 0, pageErrors.slice(0, 10).join(' | '));
  }

  await browser.close();
  server.close();

  /* ---------- 리포트 ---------- */
  const failed = results.filter(r => r.status === 'fail');
  const totalAssertions = results.reduce((a, r) => a + r.assertions.length, 0);
  const failedAssertions = results.reduce((a, r) => a + r.assertions.filter(x => !x.pass).length, 0);

  console.log('\n김성태전 v10.0 회귀 점검 — ' + new Date().toISOString());
  console.log('='.repeat(72));
  for (const r of results) {
    console.log(`${r.status === 'pass' ? ' PASS ' : ' FAIL '} ${r.name}`);
    for (const a of r.assertions) {
      if (a.pass && !VERBOSE) continue;
      console.log(`        ${a.pass ? '·' : '✗'} ${a.label}${a.detail ? `\n            ${a.detail}` : ''}`);
    }
    for (const n of r.notes) console.log(`        ℹ ${n}`);
  }
  console.log('='.repeat(72));
  console.log(`점검 ${results.length}개 · 어서션 ${totalAssertions}개 · 실패 ${failedAssertions}개`);

  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({
      ranAt: new Date().toISOString(), ok: failed.length === 0,
      checks: results.length, assertions: totalAssertions, failedAssertions,
      pageErrors, results
    }, null, 2));
    console.log(`리포트 기록: ${path.resolve(JSON_OUT)}`);
  }

  if (failed.length) {
    console.log(`\n실패한 점검: ${failed.map(f => f.name).join(', ')}`);
    process.exit(1);
  }
  console.log('\n회귀 없음.');
}

main().catch(e => { console.error('점검 러너 자체가 실패했습니다:\n', e); process.exit(2); });
