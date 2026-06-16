"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calculator, ChevronRight, AlertTriangle, CheckCircle, Info, TrendingUp,
  RotateCcw, MapPin, X, Globe, FileText, ClipboardList, Download, Clock,
  Home, Wrench,
} from "lucide-react";
import { runDiagnosis } from "@/lib/diagnosis";
import { useBanks } from "@/hooks/useBanks";
import { FIXED_PERIOD_LABELS, SUPPORT_LEVEL_LABELS, SUPPORT_LEVEL_STYLES, REPAYMENT_TIMING_LABELS } from "@/types";
import { judgeArea, judgeAreaMaster, AREA_JUDGMENT_LABELS, AREA_JUDGMENT_STYLES } from "@/lib/areaUtils";
import { loadAreaMaster } from "@/lib/areaMasterStorage";
import { INSTITUTION_TYPE_LABELS } from "@/types";
import type {
  DiagnosisInput, DiagnosisResult, EmploymentType, FixedPeriodType,
  AreaMasterEntry, SupportLevel, BankMaster,
} from "@/types";
import type { AreaJudgment } from "@/lib/areaUtils";

// ── Constants ────────────────────────────────────────────────────────────────

const EMPLOYMENT_TYPES: EmploymentType[] = ['正社員', '公務員', '契約社員', 'パート・アルバイト', '自営業', 'その他'];
const AREAS = ['全国', '北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州・沖縄'];

const INIT: DiagnosisInput = {
  customerName: '',
  age: '',
  income: '',
  yearsEmployed: '',
  employmentType: '正社員',
  spouseIncome: '',
  savings: '',
  existingLoan: '',
  desiredAmount: '',
  repaymentPeriod: '',
  area: '全国',
  constructionAddress: '',
  isBuyingLand: false,
  hasConstructionContract: false,
  hasInterimPayment: false,
  needsBridgeLoan: false,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt万(n: number) { return `${Math.round(n / 10000).toLocaleString()}万円`; }
function fmtMan(n: number) { return `${Math.round(n).toLocaleString()}万円`; }

function SupportBadge({ level }: { level: SupportLevel }) {
  const s = SUPPORT_LEVEL_STYLES[level];
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {SUPPORT_LEVEL_LABELS[level]}
    </span>
  );
}

function AreaBadge({ judgment }: { judgment: AreaJudgment }) {
  const s = AREA_JUDGMENT_STYLES[judgment];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
      style={{ background: s.bg, color: s.color }}>
      <MapPin size={10} />{AREA_JUDGMENT_LABELS[judgment]}
    </span>
  );
}

// ── Form Components ───────────────────────────────────────────────────────────

function InputField({ label, unit, value, onChange, type = 'number', placeholder = '' }: {
  label: string; unit?: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        {unit && <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)}
        className="relative w-10 h-5 rounded-full transition-colors shrink-0"
        style={{ background: checked ? '#3B82F6' : '#D1D5DB' }}>
        <span className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{ background: '#fff', left: checked ? '20px' : '2px' }} />
      </button>
      <span className="text-xs" style={{ color: checked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
    </label>
  );
}

// ── Result Card ───────────────────────────────────────────────────────────────

function ResultCard({
  result, rank, areaJudgment, form, onAddScreening,
}: {
  result: DiagnosisResult;
  rank: number;
  areaJudgment?: AreaJudgment;
  form: DiagnosisInput;
  onAddScreening: (bank: BankMaster, method: 'web' | 'paper') => void;
}) {
  const [open, setOpen] = useState(rank <= 3);
  const b = result.bank;
  const rankColors = ['#f59e0b', '#94a3b8', '#cd7c2e'];
  const rankBg    = ['#FEF3C7', '#F1F5F9', '#FFF7ED'];

  // Bridge loan / split execution warnings
  const bridgeWarning = form.isBuyingLand && b.bridgeLoanSupport === 'unsupported';
  const splitWarning  = form.hasInterimPayment && b.splitExecutionSupport === 'unsupported';

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: `1px solid ${bridgeWarning || splitWarning ? '#FECACA' : 'var(--border)'}` }}>
      {/* Header row */}
      <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: rank <= 3 ? rankBg[rank - 1] : '#F9FAFB', color: rank <= 3 ? rankColors[rank - 1] : 'var(--text-muted)' }}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#DBEAFE', color: '#2563EB' }}>{b.productName}</span>
            {areaJudgment && <AreaBadge judgment={areaJudgment} />}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{result.comment}</p>
            {b.preScreeningDays && (
              <span className="inline-flex items-center gap-1 text-xs shrink-0" style={{ color: '#7C3AED' }}>
                <Clock size={10} />審査目安：{b.preScreeningDays}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>借入可能性</div>
          <div className="font-bold text-sm" style={{ color: result.feasibilityColor }}>{result.feasibility}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
            {b.productType === 'variable' ? '変動金利' : b.fixedPeriod ? FIXED_PERIOD_LABELS[b.fixedPeriod as FixedPeriodType] : '固定金利'}
          </div>
          <div className="font-bold text-sm" style={{ color: b.productType === 'variable' ? '#3b82f6' : '#7c3aed' }}>{b.rate.toFixed(3)}%</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>月々返済</div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{result.monthlyPayment > 0 ? fmt万(result.monthlyPayment) : '—'}</div>
        </div>
        <ChevronRight size={16} className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </div>

      {/* Warnings */}
      {(bridgeWarning || splitWarning) && (
        <div className="px-4 pb-2 space-y-1.5">
          {bridgeWarning && (
            <div className="flex items-start gap-2 text-xs p-2.5 rounded-xl" style={{ background: '#FEF3C7', color: '#92400E' }}>
              <AlertTriangle size={12} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
              この銀行はつなぎ融資非対応のため、土地先行購入には注意が必要です
              {b.bridgeLoanMemo && <span className="ml-1 opacity-80">（{b.bridgeLoanMemo}）</span>}
            </div>
          )}
          {splitWarning && (
            <div className="flex items-start gap-2 text-xs p-2.5 rounded-xl" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              <AlertTriangle size={12} className="shrink-0 mt-0.5" style={{ color: '#EF4444' }} />
              建物中間金がある場合、分割実行またはつなぎ融資の確認が必要です
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 pb-3 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
        {/* WEB申込 */}
        {b.webApplicationUrl ? (
          <a href={b.webApplicationUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
            <Globe size={12} />WEB申込へ
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
            <Globe size={12} />WEB申込URL未登録
          </span>
        )}

        {/* 紙申込 */}
        {b.paperApplicationUrl ? (
          <a href={b.paperApplicationUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: '#F0FDF4', color: '#15803D' }}>
            <Download size={12} />申込書ダウンロード
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
            style={{ background: '#F3F4F6', color: '#9CA3AF' }}>
            <FileText size={12} />申込書未登録
          </span>
        )}

        {/* 事前審査管理に追加 - WEB */}
        <button onClick={() => onAddScreening(b, 'web')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}>
          <ClipboardList size={12} />事前審査に追加
        </button>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            {/* 返済シミュレーション */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>返済シミュレーション</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '月々返済額', value: result.monthlyPayment > 0 ? fmt万(result.monthlyPayment) : '—', color: '#3b82f6' },
                  { label: '総返済額', value: result.totalPayment > 0 ? fmtMan(result.totalPayment / 10000) : '—', color: '#8b5cf6' },
                  { label: b.productType === 'variable' ? '変動金利' : (b.fixedPeriod ? FIXED_PERIOD_LABELS[b.fixedPeriod as FixedPeriodType] : '固定金利'), value: `${b.rate.toFixed(3)}%`, color: b.productType === 'variable' ? '#10b981' : '#7c3aed' },
                  { label: '事務手数料', value: `${b.feeYen.toLocaleString()}円`, color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} className="p-2.5 rounded-xl" style={{ background: '#F9FAFB' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                    <div className="font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* つなぎ融資・分割実行 */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>申込・融資条件</h4>
              <div className="space-y-1.5">
                {[
                  { label: 'WEB申込', val: b.webApplicationUrl ? '可能' : '—', ok: !!b.webApplicationUrl },
                  { label: '紙申込', val: b.paperApplicationUrl ? '可能' : '—', ok: !!b.paperApplicationUrl },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-xs py-0.5">
                    <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                    <span style={{ color: r.ok ? '#10b981' : '#9CA3AF' }}>{r.val}</span>
                  </div>
                ))}
                {b.preScreeningDays && (
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <span style={{ color: 'var(--text-muted)' }}>審査目安</span>
                    <span className="font-semibold" style={{ color: '#7C3AED' }}>{b.preScreeningDays}</span>
                  </div>
                )}
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                  {b.bridgeLoanSupport !== undefined && (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span style={{ color: 'var(--text-muted)' }}>つなぎ融資</span>
                      <SupportBadge level={b.bridgeLoanSupport} />
                    </div>
                  )}
                  {b.splitExecutionSupport !== undefined && (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span style={{ color: 'var(--text-muted)' }}>分割実行</span>
                      <SupportBadge level={b.splitExecutionSupport} />
                    </div>
                  )}
                  {b.landFirstLoanSupport !== undefined && (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span style={{ color: 'var(--text-muted)' }}>土地先行融資</span>
                      <SupportBadge level={b.landFirstLoanSupport} />
                    </div>
                  )}
                  {b.repaymentStartTiming !== undefined && (
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span style={{ color: 'var(--text-muted)' }}>返済開始</span>
                      <span className="text-xs font-medium" style={{ color: '#374151' }}>
                        {REPAYMENT_TIMING_LABELS[b.repaymentStartTiming]}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 特長・注意点 */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>特長・注意点</h4>
              <div className="space-y-1.5">
                {b.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle size={12} className="shrink-0 mt-0.5" style={{ color: '#10b981' }} />
                    {f}
                  </div>
                ))}
              </div>
              {result.cautions.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {result.cautions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg" style={{ background: '#FFFBEB', color: '#fbbf24' }}>
                      <AlertTriangle size={12} className="shrink-0 mt-0.5" />{c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DiagnosisPage() {
  const { banks } = useBanks();
  const router = useRouter();
  const [form, setForm] = useState<DiagnosisInput>(INIT);
  const [results, setResults] = useState<DiagnosisResult[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showOut, setShowOut] = useState(false);

  const set = (key: keyof DiagnosisInput) => (v: string) =>
    setForm(f => ({ ...f, [key]: v }));

  const setB = (key: keyof DiagnosisInput, v: boolean) =>
    setForm(f => ({ ...f, [key]: v }));

  const handleRun = () => {
    const r = runDiagnosis(form, banks.length > 0 ? banks : undefined);
    setResults(r);
    setTimeout(() => document.getElementById('results-top')?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleReset = () => { setForm(INIT); setResults(null); };

  const handleAddScreening = (bank: BankMaster, method: 'web' | 'paper') => {
    const today = new Date().toISOString().slice(0, 10);
    const pending = {
      customerName: form.customerName || '',
      bankName: bank.name,
      productName: bank.productName,
      applicationMethod: method,
      appliedAt: today,
      status: '書類準備中' as const,
      preScreeningDays: bank.preScreeningDays ?? '',
      rate: bank.rate,
      desiredAmount: typeof form.desiredAmount === 'number' ? form.desiredAmount : undefined,
    };
    localStorage.setItem('loan_navi_screening_pending', JSON.stringify(pending));
    setToast(`${bank.name} を事前審査管理に追加しました`);
    setTimeout(() => setToast(null), 3000);
    router.push('/screening');
  };

  return (
    <div className="p-4 md:p-7 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: '#111827', color: '#fff' }}>
          <CheckCircle size={14} className="inline mr-2" style={{ color: '#10B981' }} />
          {toast}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE' }}>
            <Calculator size={18} style={{ color: '#3b82f6' }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>ローン診断</h1>
        </div>
        <p className="text-sm ml-12" style={{ color: 'var(--text-secondary)' }}>
          顧客情報を入力して、通りやすい銀行・おすすめ銀行を自動診断します
        </p>
      </div>

      {/* ── Form ── */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Info size={14} style={{ color: '#3b82f6' }} /> 顧客情報入力
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField label="顧客名" type="text" value={form.customerName} onChange={set('customerName')} placeholder="例：山田 太郎" />
          <InputField label="年齢" unit="歳" value={form.age} onChange={set('age')} placeholder="例：35" />
          <SelectField label="雇用形態" value={form.employmentType} onChange={set('employmentType')} options={EMPLOYMENT_TYPES} />
          <InputField label="年収" unit="万円" value={form.income} onChange={set('income')} placeholder="例：600" />
          <InputField label="勤続年数" unit="年" value={form.yearsEmployed} onChange={set('yearsEmployed')} placeholder="例：5" />
          <InputField label="配偶者年収（合算の場合）" unit="万円" value={form.spouseIncome} onChange={set('spouseIncome')} placeholder="例：300" />
          <InputField label="自己資金" unit="万円" value={form.savings} onChange={set('savings')} placeholder="例：500" />
          <InputField label="既存借入（月額）" unit="万円/月" value={form.existingLoan} onChange={set('existingLoan')} placeholder="例：3" />
          <InputField label="希望借入額" unit="万円" value={form.desiredAmount} onChange={set('desiredAmount')} placeholder="例：3500" />
          <InputField label="希望返済期間" unit="年" value={form.repaymentPeriod} onChange={set('repaymentPeriod')} placeholder="例：35" />
          <SelectField label="希望エリア" value={form.area} onChange={set('area')} options={AREAS} />

          {/* 建築地住所 */}
          <div className="sm:col-span-3">
            <label className="block text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={12} style={{ color: '#3b82f6' }} />建築地住所
              <span className="ml-1 text-xs font-normal" style={{ color: '#9CA3AF' }}>（入力すると融資エリア判定を実施）</span>
            </label>
            <div className="relative">
              <input type="text" value={form.constructionAddress}
                onChange={e => setForm(f => ({ ...f, constructionAddress: e.target.value }))}
                placeholder="例：大阪府松原市〇〇町1-2-3"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
              {form.constructionAddress && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setForm(f => ({ ...f, constructionAddress: '' }))}>
                  <X size={14} style={{ color: '#9CA3AF' }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 物件・購入条件 */}
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Home size={13} />物件・購入条件
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Toggle label="土地から購入" checked={form.isBuyingLand} onChange={v => setB('isBuyingLand', v)} />
            <Toggle label="建物請負契約あり" checked={form.hasConstructionContract} onChange={v => setB('hasConstructionContract', v)} />
            <Toggle label="中間金あり" checked={form.hasInterimPayment} onChange={v => setB('hasInterimPayment', v)} />
            <Toggle label="つなぎ融資が必要" checked={form.needsBridgeLoan} onChange={v => setB('needsBridgeLoan', v)} />
          </div>
          {(form.isBuyingLand || form.needsBridgeLoan || form.hasInterimPayment) && (
            <div className="mt-3 flex items-start gap-2 text-xs p-3 rounded-xl" style={{ background: '#FEF3C7', color: '#92400E' }}>
              <Info size={12} className="shrink-0 mt-0.5" style={{ color: '#F59E0B' }} />
              土地先行購入やつなぎ融資が必要な場合、ネット銀行は非対応のケースが多いため、診断結果に注意表示します
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleRun}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>
            <TrendingUp size={16} />診断を実行する
          </button>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <RotateCcw size={14} />リセット
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {results && (() => {
        const addr = form.constructionAddress.trim();

        const judged = results.map(r => ({
          result: r,
          judgment: addr ? judgeArea(addr, r.bank) : ('unknown' as AreaJudgment),
        }));

        const inArea  = judged.filter(j => j.judgment !== 'out');
        const outArea = judged.filter(j => j.judgment === 'out');

        const variableIn  = inArea.filter(j => j.result.bank.productType === 'variable');
        const fixedIn     = inArea.filter(j => j.result.bank.productType === 'fixed');
        const variableOut = outArea.filter(j => j.result.bank.productType === 'variable');
        const fixedOut    = outArea.filter(j => j.result.bank.productType === 'fixed');

        const areaMasterResults = addr
          ? loadAreaMaster().map(e => ({ entry: e, judgment: judgeAreaMaster(addr, e) })).filter(x => x.judgment !== 'out')
          : [];

        const legend = (
          <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
            {(['高', '中', '低', '困難'] as const).map(f => {
              const colors: Record<string, string> = { 高: '#10b981', 中: '#f59e0b', 低: '#ef4444', 困難: '#6b7280' };
              return (
                <span key={f} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: colors[f] }} />
                  可能性{f}
                </span>
              );
            })}
          </div>
        );

        return (
          <div id="results-top">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                診断結果 — {form.customerName || 'お客様'} 様
                {addr && <span className="ml-2 text-xs font-normal" style={{ color: '#6B7280' }}>（建築地：{addr}）</span>}
              </h2>
              {legend}
            </div>

            {/* 変動金利 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">📈</span>
                <h3 className="text-sm font-bold" style={{ color: '#2563EB' }}>変動金利おすすめ（{variableIn.length}行）</h3>
              </div>
              <div className="space-y-3">
                {variableIn.map(({ result, judgment }, i) => (
                  <ResultCard key={result.bank.id} result={result} rank={i + 1}
                    areaJudgment={addr ? judgment : undefined}
                    form={form} onAddScreening={handleAddScreening} />
                ))}
              </div>
            </div>

            {/* 固定金利 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🏦</span>
                <h3 className="text-sm font-bold" style={{ color: '#7C3AED' }}>固定金利おすすめ（{fixedIn.length}行）</h3>
              </div>
              <div className="space-y-3">
                {fixedIn.map(({ result, judgment }, i) => (
                  <ResultCard key={result.bank.id} result={result} rank={i + 1}
                    areaJudgment={addr ? judgment : undefined}
                    form={form} onAddScreening={handleAddScreening} />
                ))}
              </div>
            </div>

            {/* 融資エリアマスタ */}
            {addr && areaMasterResults.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={15} style={{ color: '#2563EB' }} />
                  <h3 className="text-sm font-bold" style={{ color: '#1D4ED8' }}>
                    「{addr}」で利用可能な地域金融機関（{areaMasterResults.length}件）
                  </h3>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {areaMasterResults.map(({ entry, judgment }) => (
                    <div key={entry.id} className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                        style={{ background: '#DBEAFE', color: '#1D4ED8' }}>
                        {INSTITUTION_TYPE_LABELS[entry.institutionType]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                          {entry.institutionName}
                          {entry.branchName && <span className="ml-1 font-normal" style={{ color: '#6B7280' }}>（{entry.branchName}）</span>}
                        </div>
                        {entry.contactName && <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>担当：{entry.contactName}</div>}
                      </div>
                      <AreaBadge judgment={judgment} />
                      {entry.phone && (
                        <a href={`tel:${entry.phone}`} className="text-xs shrink-0" style={{ color: '#2563EB' }}>
                          {entry.phone}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 融資エリア外 */}
            {addr && (variableOut.length > 0 || fixedOut.length > 0) && (
              <div className="mt-4">
                <button onClick={() => setShowOut(!showOut)}
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors"
                  style={{ background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}>
                  <X size={12} />
                  融資エリア外の銀行（{variableOut.length + fixedOut.length}行）
                  <ChevronRight size={12} className={`transition-transform ${showOut ? 'rotate-90' : ''}`} />
                </button>
                {showOut && (
                  <div className="mt-3 space-y-3 opacity-60">
                    {[...variableOut, ...fixedOut].map(({ result, judgment }, i) => (
                      <ResultCard key={result.bank.id} result={result} rank={i + 1}
                        areaJudgment={judgment} form={form} onAddScreening={handleAddScreening} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
