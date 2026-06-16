"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList, Plus, Pencil, Trash2, X, Save, Search, Filter,
  Globe, FileText, Calendar, Clock, CheckCircle, AlertTriangle,
} from "lucide-react";
import { loadScreenings, saveScreenings } from "@/lib/screeningStorage";
import { useBanks } from "@/hooks/useBanks";
import type { ScreeningRecord, ScreeningStatus, ApplicationMethod } from "@/types";

// ── Constants ────────────────────────────────────────────────────────────────

const STATUSES: ScreeningStatus[] = ['未申込', '書類準備中', '申込済', '審査中', '承認', '否決', '保留'];

const STATUS_STYLE: Record<ScreeningStatus, { color: string; bg: string }> = {
  '未申込':   { color: '#64748b', bg: '#F1F5F9' },
  '書類準備中': { color: '#f59e0b', bg: '#FEF3C7' },
  '申込済':   { color: '#06b6d4', bg: '#CFFAFE' },
  '審査中':   { color: '#3b82f6', bg: '#DBEAFE' },
  '承認':     { color: '#10b981', bg: '#D1FAE5' },
  '否決':     { color: '#ef4444', bg: '#FEE2E2' },
  '保留':     { color: '#8b5cf6', bg: '#EDE9FE' },
};

const METHOD_LABELS: Record<ApplicationMethod, string> = {
  web: 'WEB',
  paper: '紙申込',
  unknown: '未定',
};
const METHOD_STYLES: Record<ApplicationMethod, { bg: string; color: string }> = {
  web:     { bg: '#DBEAFE', color: '#1D4ED8' },
  paper:   { bg: '#F0FDF4', color: '#15803D' },
  unknown: { bg: '#F3F4F6', color: '#6B7280' },
};

const SAMPLE_DATA: ScreeningRecord[] = [
  {
    id: '1', customerName: '田中 健一', bankName: '住信SBIネット銀行', productName: 'ネット専用住宅ローン（変動）',
    applicationMethod: 'web', appliedAt: '2024-07-01', status: '審査中',
    expectedResponseDate: '2024-07-05', requiredDocs: '源泉徴収票、在職証明書', missingDocs: '',
    bankContact: '担当：鈴木', memo: '年収600万円、勤続10年。通過見込み高', createdAt: '2024-07-01',
    preScreeningDays: '最短3営業日',
  },
  {
    id: '2', customerName: '佐藤 美咲', bankName: 'auじぶん銀行', productName: 'じぶんローン（変動）',
    applicationMethod: 'web', appliedAt: '2024-07-03', status: '書類準備中',
    expectedResponseDate: '2024-07-09', requiredDocs: '源泉徴収票、住民票、建築確認申請書', missingDocs: '住民票',
    bankContact: '', memo: '配偶者年収合算で申込予定', createdAt: '2024-07-03',
    preScreeningDays: '3〜5営業日',
  },
  {
    id: '3', customerName: '鈴木 大輔', bankName: 'フラット35（ARUHI）', productName: 'フラット35（全期間固定）',
    applicationMethod: 'paper', appliedAt: '', status: '未申込',
    expectedResponseDate: '', requiredDocs: '', missingDocs: '',
    bankContact: '', memo: '自営業のためフラット35が最適', createdAt: '2024-07-05',
    preScreeningDays: '5〜7営業日',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function addBusinessDays(dateStr: string, daysStr: string): string {
  if (!dateStr) return '';
  const match = daysStr.match(/\d+/g);
  if (!match) return '';
  const days = parseInt(match[match.length - 1], 10); // use upper bound
  const date = new Date(dateStr);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return date.toISOString().slice(0, 10);
}

function emptyRecord(): Omit<ScreeningRecord, 'id' | 'createdAt'> {
  return {
    customerName: '', bankName: '', productName: '', applicationMethod: 'web',
    appliedAt: new Date().toISOString().slice(0, 10), status: '書類準備中',
    expectedResponseDate: '', requiredDocs: '', missingDocs: '', bankContact: '', memo: '',
  };
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ScreeningModal({ record, bankNames, onSave, onClose }: {
  record: Partial<ScreeningRecord> | null;
  bankNames: string[];
  onSave: (r: ScreeningRecord) => void;
  onClose: () => void;
}) {
  const isNew = !record?.id;
  const [form, setForm] = useState<Omit<ScreeningRecord, 'id' | 'createdAt'>>({
    ...emptyRecord(),
    ...(record ? {
      customerName: record.customerName ?? '',
      bankName: record.bankName ?? '',
      productName: record.productName ?? '',
      applicationMethod: record.applicationMethod ?? 'web',
      appliedAt: record.appliedAt ?? new Date().toISOString().slice(0, 10),
      status: record.status ?? '書類準備中',
      expectedResponseDate: record.expectedResponseDate ?? '',
      requiredDocs: record.requiredDocs ?? '',
      missingDocs: record.missingDocs ?? '',
      bankContact: record.bankContact ?? '',
      memo: record.memo ?? '',
      desiredAmount: record.desiredAmount,
      rate: record.rate,
      preScreeningDays: record.preScreeningDays ?? '',
    } : {}),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Auto-calculate expectedResponseDate when appliedAt or preScreeningDays change
  useEffect(() => {
    if (form.appliedAt && form.preScreeningDays && !form.expectedResponseDate) {
      const auto = addBusinessDays(form.appliedAt, form.preScreeningDays);
      if (auto) set('expectedResponseDate', auto);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.appliedAt, form.preScreeningDays]);

  const handleSave = () => {
    if (!form.customerName.trim()) { alert('顧客名を入力してください'); return; }
    onSave({ ...form, id: record?.id ?? `scr_${Date.now()}`, createdAt: (record as ScreeningRecord)?.createdAt ?? new Date().toISOString().slice(0, 10) });
  };

  const inputCls = "w-full px-3 py-2 rounded-xl text-sm outline-none";
  const inputStyle = { background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' };
  const labelCls = "block text-xs font-medium mb-1.5";
  const labelStyle = { color: '#374151' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', border: '1px solid #E5E7EB', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h2 className="font-semibold text-sm" style={{ color: '#111827' }}>
            {isNew ? '事前審査を追加' : '事前審査を編集'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>顧客名 <span style={{ color: '#EF4444' }}>*</span></label>
            <input className={inputCls} style={inputStyle} value={form.customerName}
              onChange={e => set('customerName', e.target.value)} placeholder="山田 太郎" />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>申込銀行</label>
            <select className={inputCls} style={{ ...inputStyle, background: '#fff' }}
              value={form.bankName} onChange={e => set('bankName', e.target.value)}>
              <option value="">選択してください</option>
              {bankNames.map(n => <option key={n} value={n}>{n}</option>)}
              <option value="その他">その他</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} style={labelStyle}>商品名</label>
            <input className={inputCls} style={inputStyle} value={form.productName}
              onChange={e => set('productName', e.target.value)} placeholder="ネット専用住宅ローン（変動）" />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>申込方法</label>
            <div className="flex gap-2">
              {(['web', 'paper', 'unknown'] as ApplicationMethod[]).map(m => (
                <button key={m} type="button" onClick={() => set('applicationMethod', m)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: form.applicationMethod === m ? METHOD_STYLES[m].bg : '#F3F4F6',
                    color: form.applicationMethod === m ? METHOD_STYLES[m].color : '#6B7280',
                    border: form.applicationMethod === m ? `1px solid ${METHOD_STYLES[m].color}40` : '1px solid transparent',
                  }}>
                  {m === 'web' ? <Globe size={11} className="inline mr-1" /> : m === 'paper' ? <FileText size={11} className="inline mr-1" /> : null}
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>進捗ステータス</label>
            <select className={inputCls} style={{ ...inputStyle, background: '#fff' }}
              value={form.status} onChange={e => set('status', e.target.value as ScreeningStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>申込日</label>
            <input type="date" className={inputCls} style={inputStyle} value={form.appliedAt}
              onChange={e => set('appliedAt', e.target.value)} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>
              回答予定日
              {form.preScreeningDays && <span className="ml-1 font-normal" style={{ color: '#9CA3AF' }}>（目安：{form.preScreeningDays}）</span>}
            </label>
            <input type="date" className={inputCls} style={inputStyle} value={form.expectedResponseDate}
              onChange={e => set('expectedResponseDate', e.target.value)} />
          </div>
          {(form.desiredAmount || form.rate) && (
            <>
              {form.desiredAmount && (
                <div>
                  <label className={labelCls} style={labelStyle}>希望借入額</label>
                  <input type="number" className={inputCls} style={inputStyle} value={form.desiredAmount}
                    onChange={e => set('desiredAmount', Number(e.target.value))} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>万円</span>
                </div>
              )}
              {form.rate && (
                <div>
                  <label className={labelCls} style={labelStyle}>適用金利</label>
                  <input type="number" step="0.001" className={inputCls} style={inputStyle} value={form.rate}
                    onChange={e => set('rate', Number(e.target.value))} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>%</span>
                </div>
              )}
            </>
          )}
          <div>
            <label className={labelCls} style={labelStyle}>銀行担当者</label>
            <input className={inputCls} style={inputStyle} value={form.bankContact}
              onChange={e => set('bankContact', e.target.value)} placeholder="担当：田中様" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} style={labelStyle}>必要書類</label>
            <input className={inputCls} style={inputStyle} value={form.requiredDocs}
              onChange={e => set('requiredDocs', e.target.value)}
              placeholder="源泉徴収票、在職証明書、住民票..." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} style={labelStyle}>不足書類</label>
            <input className={inputCls} style={inputStyle} value={form.missingDocs}
              onChange={e => set('missingDocs', e.target.value)}
              placeholder="未提出の書類を入力..." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} style={labelStyle}>メモ</label>
            <textarea rows={3} className={`${inputCls} resize-none`} style={inputStyle}
              value={form.memo} onChange={e => set('memo', e.target.value)}
              placeholder="審査に関するメモ、特記事項..." />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}>
            キャンセル
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff' }}>
            <Save size={14} />{isNew ? '追加する' : '更新する'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ScreeningPage() {
  const { banks } = useBanks();
  const [records, setRecords] = useState<ScreeningRecord[]>([]);
  const [modal, setModal] = useState<Partial<ScreeningRecord> | null | false>(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ScreeningStatus | ''>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadScreenings();
    setRecords(saved.length > 0 ? saved : SAMPLE_DATA);
    // Check for pending record from diagnosis page
    const pendingRaw = typeof window !== 'undefined' ? localStorage.getItem('loan_navi_screening_pending') : null;
    if (pendingRaw) {
      try {
        localStorage.removeItem('loan_navi_screening_pending');
        const pending = JSON.parse(pendingRaw) as Partial<ScreeningRecord>;
        setModal(pending);
      } catch { /* ignore */ }
    }
  }, []);

  const persist = useCallback((next: ScreeningRecord[]) => {
    setRecords(next);
    saveScreenings(next);
  }, []);

  const handleSave = (r: ScreeningRecord) => {
    const exists = records.some(x => x.id === r.id);
    persist(exists ? records.map(x => x.id === r.id ? r : x) : [r, ...records]);
    setModal(false);
  };

  const handleDelete = (id: string) => {
    persist(records.filter(r => r.id !== id));
    setDeleteId(null);
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.customerName.toLowerCase().includes(q) || r.bankName.toLowerCase().includes(q);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = records.filter(r => r.status === s).length;
    return acc;
  }, {});

  const bankNames = [...new Set(banks.map(b => b.name))];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4 md:p-7 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EDE9FE' }}>
              <ClipboardList size={18} style={{ color: '#8b5cf6' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>事前審査管理</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--text-secondary)' }}>
            顧客ごとの事前審査進捗を一元管理（{records.length}件）
          </p>
        </div>
        <button onClick={() => setModal({})}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff' }}>
          <Plus size={16} /> 新規追加
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className="rounded-xl p-3 text-center transition-all"
            style={{
              background: filterStatus === s ? STATUS_STYLE[s].bg : 'var(--bg-card)',
              border: `1px solid ${filterStatus === s ? STATUS_STYLE[s].color : 'var(--border)'}`,
            }}>
            <div className="text-xl font-bold" style={{ color: filterStatus === s ? STATUS_STYLE[s].color : 'var(--text-primary)' }}>
              {counts[s] ?? 0}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s}</div>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="顧客名・銀行名で検索..."
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
        </div>
        {filterStatus && (
          <button onClick={() => setFilterStatus('')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
            style={{ background: STATUS_STYLE[filterStatus].bg, color: STATUS_STYLE[filterStatus].color, border: `1px solid ${STATUS_STYLE[filterStatus].color}` }}>
            <Filter size={12} />{filterStatus}<X size={10} />
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl py-12 text-center text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            該当する案件がありません
          </div>
        ) : filtered.map(r => {
          const overdue = r.expectedResponseDate && r.expectedResponseDate < today && r.status !== '承認' && r.status !== '否決';
          return (
            <div key={r.id} className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: `1px solid ${overdue ? '#FECACA' : 'var(--border)'}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: '#BFDBFE', color: '#2563EB' }}>
                    {r.customerName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{r.customerName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.bankName || '—'}</p>
                    {r.productName && <p className="text-xs" style={{ color: '#9CA3AF' }}>{r.productName}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded-lg text-xs font-medium"
                    style={{ background: STATUS_STYLE[r.status].bg, color: STATUS_STYLE[r.status].color }}>
                    {r.status}
                  </span>
                  <button onClick={() => setModal(r)} className="p-1.5 rounded-lg" style={{ background: '#EFF6FF' }}>
                    <Pencil size={13} style={{ color: '#3b82f6' }} />
                  </button>
                  <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg" style={{ background: '#FEF2F2' }}>
                    <Trash2 size={13} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {r.applicationMethod && r.applicationMethod !== 'unknown' && (
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: METHOD_STYLES[r.applicationMethod].bg, color: METHOD_STYLES[r.applicationMethod].color }}>
                      {METHOD_LABELS[r.applicationMethod]}
                    </span>
                  </div>
                )}
                {r.preScreeningDays && <div style={{ color: '#9CA3AF' }}>目安：{r.preScreeningDays}</div>}
                <div><span style={{ color: 'var(--text-muted)' }}>申込日：</span>{r.appliedAt || '—'}</div>
                <div style={{ color: overdue ? '#DC2626' : 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>回答予定：</span>{r.expectedResponseDate || '—'}
                  {overdue && ' ⚠️'}
                </div>
                {r.missingDocs && <div className="col-span-2" style={{ color: '#ef4444' }}>不足書類：{r.missingDocs}</div>}
                {r.memo && <div className="col-span-2 truncate" style={{ color: 'var(--text-muted)' }}>{r.memo}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB' }}>
              {['顧客名', '申込銀行 / 商品', '申込方法', '進捗', '申込日', '回答予定日', '審査日数', '不足書類', '操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  該当する案件がありません
                </td>
              </tr>
            ) : filtered.map(r => {
              const overdue = r.expectedResponseDate && r.expectedResponseDate < today && r.status !== '承認' && r.status !== '否決';
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors"
                  style={{ borderBottom: '1px solid #F3F4F6', background: overdue ? '#FFF5F5' : '' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: '#BFDBFE', color: '#2563EB' }}>
                        {r.customerName[0]}
                      </div>
                      <span className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>{r.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{r.bankName || '—'}</div>
                    {r.productName && <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{r.productName}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {r.applicationMethod && r.applicationMethod !== 'unknown' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: METHOD_STYLES[r.applicationMethod].bg, color: METHOD_STYLES[r.applicationMethod].color }}>
                        {METHOD_LABELS[r.applicationMethod]}
                      </span>
                    ) : <span className="text-xs" style={{ color: '#9CA3AF' }}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: STATUS_STYLE[r.status].bg, color: STATUS_STYLE[r.status].color }}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{r.appliedAt || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: overdue ? '#DC2626' : 'var(--text-secondary)' }}>
                    {r.expectedResponseDate || '—'}
                    {overdue && <AlertTriangle size={11} className="inline ml-1" />}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>
                    {r.preScreeningDays || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs max-w-32 truncate"
                    style={{ color: r.missingDocs ? '#ef4444' : 'var(--text-muted)' }}>
                    {r.missingDocs || 'なし'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModal(r)} className="p-1.5 rounded-lg hover:bg-gray-50"
                        title="編集">
                        <Pencil size={13} style={{ color: '#3b82f6' }} />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-gray-50"
                        title="削除">
                        <Trash2 size={13} style={{ color: '#ef4444' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal !== false && (
        <ScreeningModal
          record={modal}
          bankNames={bankNames}
          onSave={handleSave}
          onClose={() => setModal(false)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 w-80" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#111827' }}>削除の確認</h3>
            <p className="text-sm mb-5" style={{ color: '#374151' }}>この案件を削除しますか？この操作は元に戻せません。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm"
                style={{ border: '1px solid #E5E7EB', color: '#374151' }}>
                キャンセル
              </button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: '#ef4444', color: '#fff' }}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
