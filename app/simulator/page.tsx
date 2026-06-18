"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart2, AlertCircle, ArrowRight, Calculator, FileText, Users,
  Wallet, TrendingUp,
} from "lucide-react";
import { useBanks } from "@/hooks/useBanks";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'income' | 'amount' | 'monthly';
type RateType = 'variable' | 'fixed';

// ── Financial Math ─────────────────────────────────────────────────────────────

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || years <= 0) return 0;
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

function calcMaxLoan(monthlyPayment: number, annualRate: number, years: number): number {
  if (monthlyPayment <= 0 || years <= 0) return 0;
  if (annualRate === 0) return monthlyPayment * years * 12;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return monthlyPayment * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
}

function fmtEnMan(yen: number): string {
  return `${Math.round(yen / 10000).toLocaleString()}万円`;
}

function fmtMonthly(yen: number): string {
  const man = yen / 10000;
  return `${man.toFixed(2)}万円`;
}

// ── Design Tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
  border: '#E5E7EB',
  accent: '#2563EB',
  highlight: '#FEFCE8',
  highlightBorder: '#FCD34D',
  divider: '#F3F4F6',
} as const;

// ── UI Parts ──────────────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-4">
      {icon && <span style={{ color: C.sub }}>{icon}</span>}
      <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: C.sub }}>
        {children}
      </span>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: C.text }}>
      {children}
      {hint && <span className="ml-1.5 text-xs font-normal" style={{ color: C.sub }}>{hint}</span>}
    </label>
  );
}

function NumInput({ value, onChange, suffix, placeholder = '0' }: {
  value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number" inputMode="decimal"
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all"
        style={{ background: '#FAFAFA', border: `1.5px solid ${C.border}`, color: C.text }}
        onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
        onBlur={e => (e.currentTarget.style.borderColor = C.border)}
      />
      {suffix && <span className="text-sm shrink-0 w-8 text-right" style={{ color: C.sub }}>{suffix}</span>}
    </div>
  );
}

function SegmentControl({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: `1.5px solid ${C.border}` }}>
      {options.map((o, i) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className="flex-1 py-2.5 text-sm font-medium transition-all"
          style={{
            background: value === o.value ? C.accent : C.card,
            color: value === o.value ? '#fff' : C.sub,
            borderRight: i < options.length - 1 ? `1px solid ${C.border}` : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** 月々返済額専用の強調カード（薄黄色） */
function MonthlyHighlightCard({ value, sub }: { value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: C.highlight, border: `1.5px solid ${C.highlightBorder}` }}>
      <div className="text-xs font-medium mb-2" style={{ color: '#92400E' }}>月々返済額</div>
      <div className="text-4xl font-bold tracking-tight mb-2" style={{ color: C.text, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: '#A16207' }}>{sub}</div>
      )}
    </div>
  );
}

/** 借入可能額専用の強調カード（薄黄色） */
function LoanHighlightCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: C.highlight, border: `1.5px solid ${C.highlightBorder}` }}>
      <div className="text-xs font-medium mb-2" style={{ color: '#92400E' }}>{label}</div>
      <div className="text-4xl font-bold tracking-tight mb-2" style={{ color: C.text, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && <div className="text-xs" style={{ color: '#A16207' }}>{sub}</div>}
    </div>
  );
}

/** 通常結果カード（白背景、数字は青） */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="text-xs mb-1.5" style={{ color: C.sub }}>{label}</div>
      <div className="text-lg font-bold" style={{ color: C.accent }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: C.sub }}>{sub}</div>}
    </div>
  );
}

/** 明細行 */
function DetailRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${C.divider}` }}>
      <span className="text-sm" style={{ color: C.sub }}>{label}</span>
      <span className="text-sm font-semibold" style={{ color: bold ? C.text : C.sub, fontWeight: bold ? 700 : 500 }}>
        {value}
      </span>
    </div>
  );
}

function BankPicker({ banks, onSelect }: {
  banks: ReturnType<typeof useBanks>['banks'];
  onSelect: (rate: number, type: RateType) => void;
}) {
  const [val, setVal] = useState('');
  const options = useMemo(() => {
    const out: { label: string; rate: number; type: RateType }[] = [];
    banks.forEach(b => {
      const type: RateType = b.productType === 'variable' ? 'variable' : 'fixed';
      const typeLabel = b.productType === 'variable' ? '変動' : '固定';
      out.push({ label: `${b.name}｜${typeLabel} ${b.rate}%`, rate: b.rate, type });
    });
    // dedupe by rate+type, sort ascending, cap at 16
    const seen = new Set<string>();
    return out.filter(o => {
      const k = `${o.rate}-${o.type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => a.rate - b.rate).slice(0, 16);
  }, [banks]);

  if (options.length === 0) return null;

  return (
    <div>
      <FieldLabel hint="選択すると適用金利に反映">銀行金利から選択</FieldLabel>
      <select
        value={val}
        onChange={e => {
          const opt = options[parseInt(e.target.value)];
          if (opt) onSelect(opt.rate, opt.type);
          setVal(e.target.value);
        }}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
        style={{ background: '#FAFAFA', border: `1.5px solid ${C.border}`, color: C.text }}
      >
        <option value="">選択してください</option>
        {options.map((o, i) => <option key={i} value={i}>{o.label}</option>)}
      </select>
    </div>
  );
}

function InputCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function ActionButtons({ onDiagnosis, onProposal }: { onDiagnosis: () => void; onProposal: () => void }) {
  return (
    <div className="space-y-2 pt-2">
      <div className="w-full h-px" style={{ background: C.border }} />
      <button onClick={onDiagnosis}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
        style={{ background: C.accent, color: '#fff' }}>
        <Calculator size={14} />
        ローン診断へ進む
        <ArrowRight size={13} />
      </button>
      <button onClick={onProposal}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
        style={{ background: C.card, color: C.sub, border: `1px solid ${C.border}` }}>
        <FileText size={13} />比較提案書を作成
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl p-10 flex flex-col items-center gap-3"
      style={{ background: C.card, border: `1.5px dashed ${C.border}` }}>
      <BarChart2 size={28} style={{ color: '#D1D5DB' }} />
      <p className="text-sm text-center" style={{ color: C.sub }}>{label}</p>
    </div>
  );
}

// ── Tab 1: 年収から借入可能額 ──────────────────────────────────────────────────

function Tab1({ banks }: { banks: ReturnType<typeof useBanks>['banks'] }) {
  const router = useRouter();
  const [income, setIncome] = useState('');
  const [spouseIncome, setSpouseIncome] = useState('');
  const [savings, setSavings] = useState('');
  const [existingLoan, setExistingLoan] = useState('');
  const [years, setYears] = useState('35');
  const [examRate, setExamRate] = useState('3.0');
  const [actualRate, setActualRate] = useState('0.5');
  const [ratio, setRatio] = useState('35');
  const [rateType, setRateType] = useState<RateType>('variable');
  const [buildingBudget, setBuildingBudget] = useState('2500');

  const result = useMemo(() => {
    const inc = parseFloat(income) || 0;
    const sInc = parseFloat(spouseIncome) || 0;
    const sav = (parseFloat(savings) || 0) * 10000;
    const existing = (parseFloat(existingLoan) || 0) * 10000;
    const yr = parseFloat(years) || 35;
    const eRate = parseFloat(examRate) || 3.0;
    const aRate = parseFloat(actualRate) || 0.5;
    const rat = (parseFloat(ratio) || 35) / 100;
    const totalIncome = (inc + sInc) * 10000;
    if (totalIncome <= 0) return null;

    const annualRepayable = totalIncome * rat;
    const existingAnnual = existing * 12;
    const housingMonthly = Math.max(0, (annualRepayable - existingAnnual) / 12);
    const maxLoan = calcMaxLoan(housingMonthly, eRate, yr);
    const actualMonthly = calcMonthlyPayment(maxLoan, aRate, yr);
    const totalRepay = actualMonthly * yr * 12;
    const actualRatio = (actualMonthly * 12) / totalIncome;
    const withExisting = ((actualMonthly + existing) * 12) / totalIncome;
    const totalBudget = maxLoan + sav;
    const misc = totalBudget * 0.08;
    const building = (parseFloat(buildingBudget) || 2500) * 10000;
    const land = Math.max(0, totalBudget - building - misc);

    return { maxLoan, totalBudget, actualMonthly, totalRepay, totalInterest: totalRepay - maxLoan, actualRatio, withExisting, land, building, misc };
  }, [income, spouseIncome, savings, existingLoan, years, examRate, actualRate, ratio, buildingBudget]);

  return (
    <div className="space-y-5">
      <InputCard>
        <SectionLabel icon={<Users size={12} />}>お客様情報</SectionLabel>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div><FieldLabel hint="万円">年収</FieldLabel><NumInput value={income} onChange={setIncome} suffix="万円" placeholder="600" /></div>
          <div><FieldLabel hint="万円">配偶者年収</FieldLabel><NumInput value={spouseIncome} onChange={setSpouseIncome} suffix="万円" placeholder="0" /></div>
          <div><FieldLabel hint="万円">自己資金</FieldLabel><NumInput value={savings} onChange={setSavings} suffix="万円" placeholder="500" /></div>
          <div><FieldLabel hint="万円/月">既存借入（月額）</FieldLabel><NumInput value={existingLoan} onChange={setExistingLoan} suffix="万円" placeholder="0" /></div>
        </div>
      </InputCard>

      <InputCard>
        <SectionLabel icon={<TrendingUp size={12} />}>ローン条件</SectionLabel>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div><FieldLabel>返済期間</FieldLabel><NumInput value={years} onChange={setYears} suffix="年" placeholder="35" /></div>
          <div><FieldLabel>返済負担率</FieldLabel><NumInput value={ratio} onChange={setRatio} suffix="%" placeholder="35" /></div>
          <div><FieldLabel hint="借入可能額の算出に使用">審査金利</FieldLabel><NumInput value={examRate} onChange={setExamRate} suffix="%" placeholder="3.0" /></div>
          <div><FieldLabel hint="返済額の算出に使用">適用金利</FieldLabel><NumInput value={actualRate} onChange={setActualRate} suffix="%" placeholder="0.5" /></div>
        </div>
        <div>
          <FieldLabel>金利タイプ</FieldLabel>
          <SegmentControl options={[{ value: 'variable', label: '変動金利' }, { value: 'fixed', label: '固定金利' }]} value={rateType} onChange={v => setRateType(v as RateType)} />
        </div>
        <BankPicker banks={banks} onSelect={(r, t) => { setActualRate(r.toString()); setRateType(t); }} />
      </InputCard>

      {result ? (
        <div className="space-y-4">
          {/* Primary highlight */}
          <LoanHighlightCard
            label={`借入可能額（審査金利 ${examRate}% 基準）`}
            value={fmtEnMan(result.maxLoan)}
            sub={`自己資金込み総予算：${fmtEnMan(result.totalBudget)}`}
          />

          {/* Monthly payment — secondary highlight */}
          <MonthlyHighlightCard
            value={`${fmtMonthly(result.actualMonthly)}／月`}
            sub={`適用金利 ${actualRate}%　返済期間 ${years}年`}
          />

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="年間返済額" value={fmtEnMan(result.actualMonthly * 12)} />
            <StatCard label="総返済額" value={fmtEnMan(result.totalRepay)} />
            <StatCard label="返済負担率" value={`${(result.actualRatio * 100).toFixed(1)}%`} sub="住宅ローンのみ" />
            <StatCard label="既存借入込み" value={`${(result.withExisting * 100).toFixed(1)}%`} sub="返済負担率合計" />
            <StatCard label="利息総額" value={fmtEnMan(result.totalInterest)} />
          </div>

          {/* Budget breakdown */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <SectionLabel>土地・建物予算内訳</SectionLabel>
              <span className="text-xs" style={{ color: C.sub }}>総予算 {fmtEnMan(result.totalBudget)}</span>
            </div>
            <div>
              <FieldLabel hint="手入力で変更可">建物予算</FieldLabel>
              <NumInput value={buildingBudget} onChange={setBuildingBudget} suffix="万円" placeholder="2500" />
            </div>
            <div className="space-y-0" style={{ borderTop: `1px solid ${C.divider}` }}>
              <DetailRow label="土地予算目安" value={fmtEnMan(result.land)} bold />
              <DetailRow label="建物予算目安" value={fmtEnMan(result.building)} bold />
              <DetailRow label="諸費用目安（総予算の8%）" value={fmtEnMan(result.misc)} />
            </div>
            <div className="flex rounded-full overflow-hidden h-2">
              {(() => {
                const t = result.land + result.building + result.misc;
                if (t === 0) return null;
                return [
                  { pct: result.land / t * 100, color: '#2563EB' },
                  { pct: result.building / t * 100, color: '#7C3AED' },
                  { pct: result.misc / t * 100, color: '#059669' },
                ].map((s, i) => <div key={i} style={{ width: `${s.pct}%`, background: s.color }} />);
              })()}
            </div>
            <div className="flex gap-4 text-xs" style={{ color: C.sub }}>
              {[['土地', '#2563EB'], ['建物', '#7C3AED'], ['諸費用', '#059669']].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          <ActionButtons onDiagnosis={() => router.push('/diagnosis')} onProposal={() => router.push('/proposals')} />
        </div>
      ) : (
        <EmptyState label="年収を入力すると借入可能額が表示されます" />
      )}
    </div>
  );
}

// ── Tab 2: 借入希望額から月々返済額 ──────────────────────────────────────────────

function Tab2({ banks }: { banks: ReturnType<typeof useBanks>['banks'] }) {
  const router = useRouter();
  const [principal, setPrincipal] = useState('');
  const [years, setYears] = useState('35');
  const [rate, setRate] = useState('0.5');
  const [bonus, setBonus] = useState('');

  const result = useMemo(() => {
    const p = (parseFloat(principal) || 0) * 10000;
    const yr = parseFloat(years) || 35;
    const r = parseFloat(rate) || 0.5;
    const bon = (parseFloat(bonus) || 0) * 10000;
    if (p <= 0) return null;
    const monthly = calcMonthlyPayment(p, r, yr);
    const bonusAnnual = bon * 2;
    const yearlyRepay = monthly * 12 + bonusAnnual;
    const totalRepay = monthly * yr * 12 + bonusAnnual * yr;
    return { monthly, bonusAnnual, yearlyRepay, totalRepay, totalInterest: totalRepay - p, principal: p, years: yr, rate: r };
  }, [principal, years, rate, bonus]);

  const incomeFor25 = result ? (result.monthly * 12) / 0.25 : 0;

  return (
    <div className="space-y-5">
      <InputCard>
        <SectionLabel icon={<Calculator size={12} />}>借入条件</SectionLabel>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div><FieldLabel hint="万円">借入希望額</FieldLabel><NumInput value={principal} onChange={setPrincipal} suffix="万円" placeholder="3000" /></div>
          <div><FieldLabel hint="年">返済期間</FieldLabel><NumInput value={years} onChange={setYears} suffix="年" placeholder="35" /></div>
          <div><FieldLabel hint="年利">適用金利（年利）</FieldLabel><NumInput value={rate} onChange={setRate} suffix="%" placeholder="0.5" /></div>
          <div><FieldLabel hint="年2回">ボーナス返済額（1回）</FieldLabel><NumInput value={bonus} onChange={setBonus} suffix="万円" placeholder="0" /></div>
        </div>
        <BankPicker banks={banks} onSelect={r => setRate(r.toString())} />
      </InputCard>

      {result ? (
        <div className="space-y-4">
          <MonthlyHighlightCard
            value={`${fmtMonthly(result.monthly)}／月`}
            sub={`金利 ${rate}%　返済期間 ${years}年`}
          />

          {/* Detail table */}
          <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel>返済内訳</SectionLabel>
            <div style={{ borderTop: `1px solid ${C.divider}` }}>
              <DetailRow label="毎月返済額（元金＋利息）" value={`${fmtMonthly(result.monthly)}`} bold />
              {parseFloat(bonus) > 0 && <>
                <DetailRow label="ボーナス加算額（1回あたり）" value={`${bonus}万円`} />
                <DetailRow label="ボーナス月返済額（年間）" value={fmtEnMan(result.bonusAnnual)} />
              </>}
              <DetailRow label="年間返済額" value={fmtEnMan(result.yearlyRepay)} bold />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="総返済額" value={fmtEnMan(result.totalRepay)} />
            <StatCard label="利息総額" value={fmtEnMan(result.totalInterest)} sub={`借入額の${((result.totalInterest / result.principal) * 100).toFixed(0)}%`} />
          </div>

          {/* 返済比率 */}
          <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <SectionLabel>返済比率の目安</SectionLabel>
            <div style={{ borderTop: `1px solid ${C.divider}` }}>
              <DetailRow label="この返済額に必要な年収目安（25%）" value={`${Math.ceil(incomeFor25 / 10000)}万円以上`} />
            </div>
          </div>

          <ActionButtons onDiagnosis={() => router.push('/diagnosis')} onProposal={() => router.push('/proposals')} />
        </div>
      ) : (
        <EmptyState label="借入希望額を入力すると月々返済額が表示されます" />
      )}
    </div>
  );
}

// ── Tab 3: 月々返済額から借入可能額 ──────────────────────────────────────────────

function Tab3({ banks }: { banks: ReturnType<typeof useBanks>['banks'] }) {
  const router = useRouter();
  const [monthly, setMonthly] = useState('');
  const [years, setYears] = useState('35');
  const [rate, setRate] = useState('0.5');
  const [bonus, setBonus] = useState('');

  const result = useMemo(() => {
    const m = (parseFloat(monthly) || 0) * 10000;
    const yr = parseFloat(years) || 35;
    const r = parseFloat(rate) || 0.5;
    const bon = (parseFloat(bonus) || 0) * 10000;
    if (m <= 0) return null;
    const effectiveMonthly = m + bon * 2 / 12;
    const maxLoan = calcMaxLoan(effectiveMonthly, r, yr);
    const totalRepay = m * yr * 12 + bon * 2 * yr;
    return { maxLoan, totalRepay, totalInterest: totalRepay - maxLoan };
  }, [monthly, years, rate, bonus]);

  return (
    <div className="space-y-5">
      <InputCard>
        <SectionLabel icon={<Wallet size={12} />}>希望返済条件</SectionLabel>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div><FieldLabel hint="万円/月">希望月々返済額</FieldLabel><NumInput value={monthly} onChange={setMonthly} suffix="万円" placeholder="8" /></div>
          <div><FieldLabel hint="年">返済期間</FieldLabel><NumInput value={years} onChange={setYears} suffix="年" placeholder="35" /></div>
          <div><FieldLabel hint="年利">適用金利（年利）</FieldLabel><NumInput value={rate} onChange={setRate} suffix="%" placeholder="0.5" /></div>
          <div><FieldLabel hint="年2回">ボーナス返済（1回）</FieldLabel><NumInput value={bonus} onChange={setBonus} suffix="万円" placeholder="0" /></div>
        </div>
        <BankPicker banks={banks} onSelect={r => setRate(r.toString())} />
      </InputCard>

      {result ? (
        <div className="space-y-4">
          <LoanHighlightCard
            label="借入可能額"
            value={fmtEnMan(result.maxLoan)}
            sub={`月々 ${monthly}万円返済　金利 ${rate}%　${years}年`}
          />
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="総返済額" value={fmtEnMan(result.totalRepay)} />
            <StatCard label="利息総額" value={fmtEnMan(result.totalInterest)} />
          </div>
          <ActionButtons onDiagnosis={() => router.push('/diagnosis')} onProposal={() => router.push('/proposals')} />
        </div>
      ) : (
        <EmptyState label="希望月々返済額を入力すると借入可能額が表示されます" />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; short: string; desc: string }[] = [
  { id: 'income',  label: '年収から借入可能額を調べる',  short: '年収から',  desc: '年収・自己資金から借入上限を算出' },
  { id: 'amount',  label: '借入希望額から月々返済額を調べる', short: '借入額から', desc: '借入額・金利から月返済額を算出' },
  { id: 'monthly', label: '月々返済額から借入可能額を調べる', short: '月返済から', desc: '希望月返済額から借入上限を算出' },
];

export default function SimulatorPage() {
  const { banks } = useBanks();
  const [activeTab, setActiveTab] = useState<TabId>('income');

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.accent }}>
            <BarChart2 size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: C.text }}>借入シミュレーター</h1>
            <p className="text-xs mt-0.5" style={{ color: C.sub }}>年収・返済額から借入可能額をすぐに確認</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="rounded-xl mb-1" style={{ background: C.card, border: `1px solid ${C.border}`, padding: '4px' }}>
          <div className="flex gap-1">
            {TABS.map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? C.accent : 'transparent',
                  color: activeTab === tab.id ? '#fff' : C.sub,
                }}
              >
                {tab.short}
              </button>
            ))}
          </div>
        </div>

        {/* Active tab description */}
        <div className="mb-5 px-1">
          <p className="text-xs" style={{ color: C.sub }}>
            {TABS.find(t => t.id === activeTab)?.desc}
          </p>
        </div>

        {/* Tab section heading */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-5 rounded-full" style={{ background: C.accent }} />
          <h2 className="text-sm font-bold" style={{ color: C.text }}>
            {TABS.find(t => t.id === activeTab)?.label}
          </h2>
        </div>

        {/* Content */}
        {activeTab === 'income'  && <Tab1 banks={banks} />}
        {activeTab === 'amount'  && <Tab2 banks={banks} />}
        {activeTab === 'monthly' && <Tab3 banks={banks} />}

        {/* Disclaimer */}
        <div className="mt-8 rounded-xl p-4 flex gap-3"
          style={{ background: '#FFFBEB', border: `1px solid #FDE68A` }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: '#D97706' }} />
          <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
            本シミュレーションは概算です。実際の借入可能額は金融機関の審査により異なります。
            金利・団信・返済期間・既存借入・勤務状況により結果は変動します。
          </p>
        </div>

      </div>
    </div>
  );
}
