"use client";

import React, { useState, useMemo } from "react";
import {
  Building2, Plus, Pencil, Trash2, X, Save, ChevronDown,
  CheckCircle, XCircle, ChevronRight, Users, Shield, Zap,
  Home, MessageSquare, TrendingUp, CreditCard, Search, AlertTriangle,
  MapPin, Phone, Mail, User,
} from "lucide-react";
import { useBanks } from "@/hooks/useBanks";
import { useLoanScheduleTemplates } from "@/hooks/useLoanScheduleTemplates";
import { PrefCityTagInput } from "@/components/PrefCityTagInput";
import { BANKS } from "@/lib/banks";
import { FIXED_PERIOD_LABELS, SUPPORT_LEVEL_LABELS, SUPPORT_LEVEL_STYLES, REPAYMENT_TIMING_LABELS, LOAN_DATE_LABELS } from "@/types";
import type { BankMaster, BankContact, EmploymentType, LoanImpactLevel, ProductType, FixedPeriodType, SupportLevel, RepaymentStartTiming, LoanDateKey, TemplateTask } from "@/types";

// ── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder, color }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color?: { bg: string; text: string };
}) {
  const [input, setInput] = React.useState('');
  const bgCol = color?.bg ?? '#DBEAFE';
  const txtCol = color?.text ?? '#1D4ED8';

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) { onChange([...tags, v]); }
    setInput('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: bgCol, color: txtCol }}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter(x => x !== t))}
              className="opacity-60 hover:opacity-100">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none"
          style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
        />
        <button type="button" onClick={add}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: bgCol, color: txtCol }}>
          追加
        </button>
      </div>
    </div>
  );
}

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_EMPLOYMENT_TYPES: EmploymentType[] = [
  '正社員', '公務員', '契約社員', 'パート・アルバイト', '自営業', 'その他'
];
const IMPACT_LEVELS: LoanImpactLevel[] = ['なし', '低', '中', '高'];

const FIXED_PERIOD_OPTIONS: FixedPeriodType[] = ['flat35', 'fixed10', 'fixed20', 'allFixed'];

function emptyContact(): BankContact {
  return { name: '', branch: '', phone: '', email: '', mobile: '', title: '', availableAreas: [], lastContactDate: '', memo: '' };
}

function emptyBank(): Omit<BankMaster, 'id'> {
  return {
    name: '', productName: '', productType: 'variable', rate: 0,
    danshin: '', feeYen: 55000, guarantee: '不要',
    areas: ['全国'], minIncome: 200, minYearsEmployed: 1,
    allowedEmployments: ['正社員', '公務員'],
    maxLoanRatio: 7, features: [''],
    jobChangeMonths: 6, selfEmployedYears: 2,
    corporateRepOk: true, contractOk: false, dispatchOk: false,
    foreignNationalOk: true, permanentResidencyRequired: false,
    incomeAggregationOk: true, pairLoanOk: true,
    carLoanImpact: '中', cardLoanImpact: '中',
    danshinTypes: ['一般団信（無料）'],
    zehDiscount: null, longTermQualityDiscount: null,
    targetAreas: [], excludedAreas: [],
    contact: emptyContact(),
    webApplicationUrl: '', paperApplicationUrl: '', preScreeningDays: '',
    bridgeLoanSupport: 'confirm', splitExecutionSupport: 'confirm',
    landFirstLoanSupport: 'confirm', buildingInterimSupport: 'confirm',
    repaymentStartTiming: 'confirm',
    bridgeLoanMemo: '', splitExecutionMemo: '', repaymentStartMemo: '',
    staffMemo: '', lastConfirmedDate: '', confirmedBy: '',
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function YesNo({ val }: { val: boolean }) {
  return val
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#DCFCE7', color: '#15803D' }}><CheckCircle size={10} />可</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FEE2E2', color: '#DC2626' }}><XCircle size={10} />不可</span>;
}

function ImpactBadge({ level }: { level: LoanImpactLevel }) {
  const s: Record<LoanImpactLevel, { bg: string; color: string }> = {
    なし: { bg: '#F0FDF4', color: '#15803D' },
    低:   { bg: '#FEF9C3', color: '#854D0E' },
    中:   { bg: '#FEF3C7', color: '#B45309' },
    高:   { bg: '#FEE2E2', color: '#DC2626' },
  };
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: s[level].bg, color: s[level].color }}>{level}</span>;
}

function SecTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-3 pb-1.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
      <span style={{ color: '#6B7280' }}>{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#374151' }}>{label}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1" style={{ borderBottom: '1px solid #F9FAFB' }}>
      <span className="text-xs shrink-0" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-xs font-medium text-right" style={{ color: '#111827' }}>{children}</span>
    </div>
  );
}

// ── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ b, onEdit, onDelete }: {
  b: BankMaster;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="px-5 pb-6 pt-4" style={{ background: '#FAFBFC' }}>
      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
        >
          <Pencil size={12} />編集
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
        >
          <Trash2 size={12} />削除
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* 雇用・属性条件 */}
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SecTitle icon={<Users size={13} />} label="雇用・属性条件" />
          <Row label="転職後">
            {b.jobChangeMonths === null ? <span style={{ color: '#15803D' }}>制限なし</span>
              : b.jobChangeMonths === 0 ? <span style={{ color: '#15803D' }}>転職直後から可</span>
              : `${b.jobChangeMonths}ヶ月以上`}
          </Row>
          <Row label="自営業">
            {b.selfEmployedYears === null ? <span style={{ color: '#15803D' }}>制限なし</span>
              : `${b.selfEmployedYears}期以上の確定申告`}
          </Row>
          <Row label="法人代表"><YesNo val={b.corporateRepOk} /></Row>
          <Row label="契約社員"><YesNo val={b.contractOk} /></Row>
          <Row label="派遣社員"><YesNo val={b.dispatchOk} /></Row>
          <Row label="外国籍"><YesNo val={b.foreignNationalOk} /></Row>
          <Row label="永住権">
            {b.permanentResidencyRequired
              ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#FEE2E2', color: '#DC2626' }}>必須</span>
              : <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#DCFCE7', color: '#15803D' }}>不要（在留資格可）</span>}
          </Row>
        </div>

        {/* ローン組み方・審査基準 */}
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SecTitle icon={<TrendingUp size={13} />} label="ローン組み方・審査基準" />
          <Row label="収入合算"><YesNo val={b.incomeAggregationOk} /></Row>
          <Row label="ペアローン"><YesNo val={b.pairLoanOk} /></Row>
          <Row label="最低年収">{b.minIncome > 0 ? `${b.minIncome}万円以上` : <span style={{ color: '#15803D' }}>制限なし</span>}</Row>
          <Row label="最低勤続">{b.minYearsEmployed > 0 ? `${b.minYearsEmployed}年以上` : <span style={{ color: '#15803D' }}>制限なし</span>}</Row>
          <Row label="借入倍率">年収の最大{b.maxLoanRatio}倍</Row>
          <Row label="融資エリア">{b.areas.join('、')}</Row>
          <div className="mt-3 mb-1.5 pb-1.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#374151' }}>対象雇用形態</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {b.allowedEmployments.map(e => (
              <span key={e} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>{e}</span>
            ))}
          </div>
        </div>

        {/* 既存ローン影響 + 省エネ優遇 */}
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SecTitle icon={<CreditCard size={13} />} label="既存ローン影響度" />
          <Row label="車ローン"><ImpactBadge level={b.carLoanImpact} /></Row>
          <Row label="カードローン"><ImpactBadge level={b.cardLoanImpact} /></Row>
          <div className="mt-4">
            <SecTitle icon={<Zap size={13} />} label="省エネ・性能優遇" />
            <Row label="ZEH優遇">
              {b.zehDiscount ? <span style={{ color: '#7C3AED', fontWeight: 600 }}>-{b.zehDiscount.toFixed(3)}%</span> : <span style={{ color: '#9CA3AF' }}>なし</span>}
            </Row>
            <Row label="長期優良住宅">
              {b.longTermQualityDiscount ? <span style={{ color: '#7C3AED', fontWeight: 600 }}>-{b.longTermQualityDiscount.toFixed(3)}%</span> : <span style={{ color: '#9CA3AF' }}>なし</span>}
            </Row>
          </div>
          {(b.lastConfirmedDate || b.confirmedBy) && (
            <div className="mt-4">
              <SecTitle icon={<CheckCircle size={13} />} label="最終確認" />
              {b.lastConfirmedDate && <Row label="確認日">{b.lastConfirmedDate}</Row>}
              {b.confirmedBy && <Row label="確認者">{b.confirmedBy}</Row>}
            </div>
          )}
        </div>

        {/* 団信 */}
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SecTitle icon={<Shield size={13} />} label="団信ラインナップ" />
          <div className="space-y-2">
            {b.danshinTypes.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle size={11} className="shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                <span className="text-xs" style={{ color: '#374151' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* おすすめポイント */}
        <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
          <SecTitle icon={<Home size={13} />} label="おすすめポイント" />
          <div className="space-y-2">
            {b.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <ChevronRight size={11} className="shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
                <span className="text-xs" style={{ color: '#374151' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 営業担当メモ */}
        <div className="rounded-xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <SecTitle icon={<MessageSquare size={13} />} label="営業担当メモ" />
          <p className="text-xs leading-relaxed" style={{ color: '#78350F' }}>{b.staffMemo || '（メモなし）'}</p>
        </div>

        {/* 融資エリア */}
        {((b.targetAreas?.length ?? 0) > 0 || (b.excludedAreas?.length ?? 0) > 0) && (
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
            <SecTitle icon={<MapPin size={13} />} label="融資エリア詳細" />
            {(b.targetAreas?.length ?? 0) > 0 && (
              <div className="mb-2">
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>対象エリア</p>
                <div className="flex flex-wrap gap-1">
                  {b.targetAreas!.map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#DCFCE7', color: '#15803D' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            {(b.excludedAreas?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#6B7280' }}>対象外エリア</p>
                <div className="flex flex-wrap gap-1">
                  {b.excludedAreas!.map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#FEE2E2', color: '#DC2626' }}>除外：{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 連絡先 */}
        {b.contact && b.contact.name && (
          <div className="rounded-xl p-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
            <SecTitle icon={<User size={13} />} label="銀行担当者" />
            <Row label="担当者">{b.contact.name}{b.contact.title && ` (${b.contact.title})`}</Row>
            {b.contact.branch && <Row label="支店">{b.contact.branch}</Row>}
            {b.contact.phone && <Row label="電話">{b.contact.phone}</Row>}
            {b.contact.mobile && <Row label="携帯">{b.contact.mobile}</Row>}
            {b.contact.email && <Row label="メール">{b.contact.email}</Row>}
            {b.contact.lastContactDate && <Row label="最終連絡日">{b.contact.lastContactDate}</Row>}
            {b.contact.memo && (
              <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: '#F9FAFB', color: '#374151' }}>
                {b.contact.memo}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Schedule Template Tab ─────────────────────────────────────────────────────

const LOAN_DATE_OPTIONS = Object.entries(LOAN_DATE_LABELS) as [LoanDateKey, string][];

type TaskDraft = { name: string; baseDateKey: LoanDateKey; offsetDays: number; notes: string };
const emptyTaskDraft = (): TaskDraft => ({ name: '', baseDateKey: 'mainApplicationDate', offsetDays: -7, notes: '' });

function TemplateTabContent({ bankId }: { bankId: string }) {
  const { addTemplate, updateTemplate, deleteTemplate, addTask, updateTask, deleteTask, getByBankOnly } = useLoanScheduleTemplates();
  const bankTemplates = getByBankOnly(bankId);

  const [newName, setNewName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTaskDraft());
  const [editingTask, setEditingTask] = useState<{ templateId: string; taskId: string } | null>(null);
  const [editDraft, setEditDraft] = useState<TaskDraft>(emptyTaskDraft());

  const inputCls = "w-full px-3 py-1.5 rounded-lg text-xs outline-none";
  const inputSt = { background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' };

  const handleAddTemplate = () => {
    if (!newName.trim()) return;
    const t = addTemplate({ name: newName.trim(), bankId, tasks: [] });
    setNewName('');
    setExpandedId(t.id);
  };

  const startAddTask = (tid: string) => {
    setEditingTask(null);
    setTaskDraft(emptyTaskDraft());
    setAddingTo(tid);
  };

  const handleAddTask = (tid: string) => {
    if (!taskDraft.name.trim()) return;
    addTask(tid, { ...taskDraft, requiredDocuments: [] });
    setAddingTo(null);
    setTaskDraft(emptyTaskDraft());
  };

  const startEditTask = (tid: string, task: TemplateTask) => {
    setAddingTo(null);
    setEditingTask({ templateId: tid, taskId: task.id });
    setEditDraft({ name: task.name, baseDateKey: task.baseDateKey, offsetDays: task.offsetDays, notes: task.notes ?? '' });
  };

  const handleSaveEditTask = () => {
    if (!editingTask || !editDraft.name.trim()) return;
    updateTask(editingTask.templateId, editingTask.taskId, { ...editDraft });
    setEditingTask(null);
  };

  const TaskForm = ({ draft, setDraft, onSave, onCancel }: {
    draft: TaskDraft;
    setDraft: (d: TaskDraft) => void;
    onSave: () => void;
    onCancel: () => void;
  }) => (
    <div className="mt-2 p-3 rounded-xl space-y-2" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
      <div>
        <div className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>タスク名</div>
        <input className={inputCls} style={inputSt} value={draft.name}
          onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="例：事前審査書類準備" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>基準日</div>
          <select className={inputCls} style={inputSt} value={draft.baseDateKey}
            onChange={e => setDraft({ ...draft, baseDateKey: e.target.value as LoanDateKey })}>
            {LOAN_DATE_OPTIONS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <div className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>オフセット（日）</div>
          <input type="number" className={inputCls} style={inputSt} value={draft.offsetDays}
            onChange={e => setDraft({ ...draft, offsetDays: Number(e.target.value) })}
            placeholder="-7（7日前）" />
          <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {draft.offsetDays < 0 ? `${Math.abs(draft.offsetDays)}日前` : draft.offsetDays === 0 ? '当日' : `${draft.offsetDays}日後`}
          </div>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold mb-1" style={{ color: '#374151' }}>メモ（任意）</div>
        <input className={inputCls} style={inputSt} value={draft.notes}
          onChange={e => setDraft({ ...draft, notes: e.target.value })} placeholder="備考・注意事項" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1 rounded-lg text-xs"
          style={{ background: '#F3F4F6', color: '#374151' }}>キャンセル</button>
        <button onClick={onSave} className="px-3 py-1 rounded-lg text-xs font-semibold"
          style={{ background: '#2563EB', color: '#fff' }}>保存</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl text-xs" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
        この銀行専用のスケジュールテンプレートを管理します。ローンスケジュール画面でこのテンプレートを選択できます。
      </div>

      {/* 新規テンプレート追加 */}
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
          style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' }}
          value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddTemplate(); }}
          placeholder="新しいテンプレート名（例：標準スケジュール）" />
        <button onClick={handleAddTemplate}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: '#DBEAFE', color: '#1D4ED8', border: '1px solid #93C5FD', whiteSpace: 'nowrap' }}>
          <Plus size={12} />追加
        </button>
      </div>

      {bankTemplates.length === 0 && (
        <div className="text-center py-8 text-xs" style={{ color: '#9CA3AF' }}>
          この銀行のテンプレートはまだありません。上から追加してください。
        </div>
      )}

      {bankTemplates.map(tmpl => {
        const isExpanded = expandedId === tmpl.id;
        return (
          <div key={tmpl.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
            {/* テンプレートヘッダー */}
            <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#F9FAFB', borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none' }}>
              <button onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}
                className="shrink-0 p-0.5 rounded transition-colors"
                style={{ color: '#6B7280' }}>
                <ChevronRight size={14} style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              <input
                className="flex-1 px-2 py-1 rounded-lg text-xs font-semibold outline-none"
                style={{ background: 'transparent', border: '1px solid transparent', color: '#111827' }}
                onFocus={e => (e.currentTarget.style.border = '1px solid #93C5FD')}
                onBlur={e => (e.currentTarget.style.border = '1px solid transparent')}
                value={tmpl.name}
                onChange={e => updateTemplate(tmpl.id, { name: e.target.value })}
              />
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                {tmpl.tasks.length}タスク
              </span>
              <button onClick={() => { if (confirm(`「${tmpl.name}」を削除しますか？`)) deleteTemplate(tmpl.id); }}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#DC2626' }}>
                <Trash2 size={13} />
              </button>
            </div>

            {/* タスク一覧 */}
            {isExpanded && (
              <div className="p-3 space-y-1.5">
                {tmpl.tasks.length === 0 && addingTo !== tmpl.id && (
                  <div className="text-xs text-center py-3" style={{ color: '#9CA3AF' }}>
                    タスクがありません。下の「＋タスク追加」から追加してください。
                  </div>
                )}

                {tmpl.tasks.map(task => {
                  const isEditing = editingTask?.taskId === task.id;
                  return (
                    <div key={task.id}>
                      {isEditing ? (
                        <TaskForm
                          draft={editDraft}
                          setDraft={setEditDraft}
                          onSave={handleSaveEditTask}
                          onCancel={() => setEditingTask(null)}
                        />
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg group"
                          style={{ background: '#fff', border: '1px solid #F3F4F6' }}>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate" style={{ color: '#111827' }}>{task.name}</div>
                            <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                              {LOAN_DATE_LABELS[task.baseDateKey]}
                              {task.offsetDays < 0 ? ` の${Math.abs(task.offsetDays)}日前` : task.offsetDays === 0 ? ' 当日' : ` の${task.offsetDays}日後`}
                            </div>
                          </div>
                          <button onClick={() => startEditTask(tmpl.id, task)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: '#3B82F6' }}>
                            <Pencil size={12} />
                          </button>
                          <button onClick={() => deleteTask(tmpl.id, task.id)}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: '#DC2626' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* タスク追加フォーム */}
                {addingTo === tmpl.id ? (
                  <TaskForm
                    draft={taskDraft}
                    setDraft={setTaskDraft}
                    onSave={() => handleAddTask(tmpl.id)}
                    onCancel={() => setAddingTo(null)}
                  />
                ) : (
                  <button onClick={() => startAddTask(tmpl.id)}
                    className="w-full mt-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{ background: '#F0FDF4', color: '#15803D', border: '1px dashed #86EFAC' }}>
                    ＋ タスク追加
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Bank Form Modal ───────────────────────────────────────────────────────────

type FormTab = '基本情報' | '審査条件' | '雇用・属性' | 'ローン・団信' | '申込・審査' | 'つなぎ融資' | '融資エリア' | '連絡先' | '営業メモ' | 'スケジュールテンプレート';

function BankModal({ bank, onSave, onClose }: {
  bank: Partial<BankMaster> | null;
  onSave: (b: BankMaster) => void;
  onClose: () => void;
}) {
  const isNew = !bank?.id;
  const [tab, setTab] = useState<FormTab>('基本情報');
  const [form, setForm] = useState<Omit<BankMaster, 'id'>>(() => ({
    ...emptyBank(),
    ...(bank ? {
      name: bank.name ?? '',
      productName: bank.productName ?? '',
      productType: bank.productType ?? 'variable',
      fixedPeriod: bank.fixedPeriod,
      rate: bank.rate ?? 0,
      danshin: bank.danshin ?? '',
      feeYen: bank.feeYen ?? 55000,
      guarantee: bank.guarantee ?? '不要',
      areas: bank.areas ?? ['全国'],
      minIncome: bank.minIncome ?? 200,
      minYearsEmployed: bank.minYearsEmployed ?? 1,
      allowedEmployments: bank.allowedEmployments ?? ['正社員', '公務員'],
      maxLoanRatio: bank.maxLoanRatio ?? 7,
      features: bank.features ?? [''],
      jobChangeMonths: bank.jobChangeMonths ?? 6,
      selfEmployedYears: bank.selfEmployedYears ?? 2,
      corporateRepOk: bank.corporateRepOk ?? true,
      contractOk: bank.contractOk ?? false,
      dispatchOk: bank.dispatchOk ?? false,
      foreignNationalOk: bank.foreignNationalOk ?? true,
      permanentResidencyRequired: bank.permanentResidencyRequired ?? false,
      incomeAggregationOk: bank.incomeAggregationOk ?? true,
      pairLoanOk: bank.pairLoanOk ?? true,
      carLoanImpact: bank.carLoanImpact ?? '中',
      cardLoanImpact: bank.cardLoanImpact ?? '中',
      danshinTypes: bank.danshinTypes ?? ['一般団信（無料）'],
      zehDiscount: bank.zehDiscount ?? null,
      longTermQualityDiscount: bank.longTermQualityDiscount ?? null,
      targetAreas: bank.targetAreas ?? [],
      excludedAreas: bank.excludedAreas ?? [],
      contact: bank.contact ?? emptyContact(),
      webApplicationUrl: bank.webApplicationUrl ?? '',
      paperApplicationUrl: bank.paperApplicationUrl ?? '',
      preScreeningDays: bank.preScreeningDays ?? '',
      bridgeLoanSupport: bank.bridgeLoanSupport ?? 'confirm',
      splitExecutionSupport: bank.splitExecutionSupport ?? 'confirm',
      landFirstLoanSupport: bank.landFirstLoanSupport ?? 'confirm',
      buildingInterimSupport: bank.buildingInterimSupport ?? 'confirm',
      repaymentStartTiming: bank.repaymentStartTiming ?? 'confirm',
      bridgeLoanMemo: bank.bridgeLoanMemo ?? '',
      splitExecutionMemo: bank.splitExecutionMemo ?? '',
      repaymentStartMemo: bank.repaymentStartMemo ?? '',
      staffMemo: bank.staffMemo ?? '',
      lastConfirmedDate: bank.lastConfirmedDate ?? '',
      confirmedBy: bank.confirmedBy ?? '',
    } : {}),
  }));

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) { alert('銀行名を入力してください'); return; }
    if (!form.productName.trim()) { alert('商品名を入力してください'); return; }
    onSave({
      ...form,
      id: bank?.id ?? `bank_${Date.now()}`,
    });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors";
  const inputStyle = { background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' };
  const inputFocus = "focus:ring-2 focus:ring-blue-200";
  const labelCls = "block text-xs font-semibold mb-1.5";
  const labelStyle = { color: '#374151' };

  const tabs: FormTab[] = ['基本情報', '審査条件', '雇用・属性', 'ローン・団信', '申込・審査', 'つなぎ融資', '融資エリア', '連絡先', '営業メモ', 'スケジュールテンプレート'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', border: '1px solid #E5E7EB', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div>
            <h2 className="font-bold text-sm" style={{ color: '#111827' }}>
              {isNew ? '銀行を新規追加' : `${bank?.name} を編集`}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {isNew ? '住宅ローン銀行情報を登録してください' : '銀行情報を更新してください'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors"
              style={{
                borderBottom: tab === t ? '2px solid #3B82F6' : '2px solid transparent',
                color: tab === t ? '#1D4ED8' : '#6B7280',
                background: tab === t ? '#fff' : 'transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── 基本情報 ── */}
          {tab === '基本情報' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>銀行名 <span style={{ color: '#EF4444' }}>*</span></label>
                  <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="住信SBIネット銀行" />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>商品名 <span style={{ color: '#EF4444' }}>*</span></label>
                  <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.productName} onChange={e => set('productName', e.target.value)} placeholder="ネット専用住宅ローン" />
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>商品タイプ <span style={{ color: '#EF4444' }}>*</span></label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => set('productType', 'variable')}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: form.productType === 'variable' ? '#DBEAFE' : '#F3F4F6', color: form.productType === 'variable' ? '#1D4ED8' : '#6B7280', border: form.productType === 'variable' ? '1px solid #93C5FD' : '1px solid transparent' }}>
                    📈 変動金利
                  </button>
                  <button type="button" onClick={() => set('productType', 'fixed')}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: form.productType === 'fixed' ? '#EDE9FE' : '#F3F4F6', color: form.productType === 'fixed' ? '#7C3AED' : '#6B7280', border: form.productType === 'fixed' ? '1px solid #C4B5FD' : '1px solid transparent' }}>
                    🏦 固定金利
                  </button>
                </div>
              </div>
              {form.productType === 'fixed' && (
                <div>
                  <label className={labelCls} style={labelStyle}>固定タイプ</label>
                  <div className="flex gap-2 flex-wrap">
                    {FIXED_PERIOD_OPTIONS.map(p => (
                      <button key={p} type="button" onClick={() => set('fixedPeriod', p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: form.fixedPeriod === p ? '#EDE9FE' : '#F3F4F6', color: form.fixedPeriod === p ? '#7C3AED' : '#6B7280', border: form.fixedPeriod === p ? '1px solid #C4B5FD' : '1px solid transparent' }}>
                        {FIXED_PERIOD_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>{form.productType === 'variable' ? '変動金利' : '固定金利'}（%）</label>
                  <input type="number" step="0.001" min="0" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.rate} onChange={e => set('rate', Number(e.target.value))} placeholder="0.320" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {form.productType === 'variable' ? '変動金利ランキング・提案書に表示されます' : '固定金利ランキング・提案書に表示されます'}
                  </p>
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>団信内容（概要）</label>
                <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.danshin} onChange={e => set('danshin', e.target.value)} placeholder="無料（全疾病保障付）" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>事務手数料（円）</label>
                  <input type="number" min="0" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.feeYen} onChange={e => set('feeYen', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>保証料</label>
                  <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.guarantee} onChange={e => set('guarantee', e.target.value)} placeholder="不要" />
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>融資エリア（カンマ区切り）</label>
                <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.areas.join('、')} onChange={e => set('areas', e.target.value.split(/[,、]/g).map(s => s.trim()).filter(Boolean))} placeholder="全国" />
              </div>
            </div>
          )}

          {/* ── 審査条件 ── */}
          {tab === '審査条件' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>最低年収（万円）</label>
                  <input type="number" min="0" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.minIncome} onChange={e => set('minIncome', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>最低勤続年数（年）</label>
                  <input type="number" min="0" step="0.5" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.minYearsEmployed} onChange={e => set('minYearsEmployed', Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>借入倍率（年収の最大N倍）</label>
                <input type="number" min="1" max="20" step="0.5" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={form.maxLoanRatio} onChange={e => set('maxLoanRatio', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>対象雇用形態</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ALL_EMPLOYMENT_TYPES.map(e => {
                    const checked = form.allowedEmployments.includes(e);
                    return (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          set('allowedEmployments', checked
                            ? form.allowedEmployments.filter(x => x !== e)
                            : [...form.allowedEmployments, e]);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: checked ? '#DBEAFE' : '#F3F4F6',
                          color: checked ? '#1D4ED8' : '#6B7280',
                          border: checked ? '1px solid #93C5FD' : '1px solid transparent',
                        }}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>おすすめポイント（1行1項目）</label>
                {form.features.map((f, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className={`${inputCls} ${inputFocus} flex-1`}
                      style={inputStyle}
                      value={f}
                      onChange={e => {
                        const next = [...form.features];
                        next[i] = e.target.value;
                        set('features', next);
                      }}
                      placeholder={`おすすめポイント ${i + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => set('features', form.features.filter((_, j) => j !== i))}
                      className="px-2 rounded-lg hover:bg-red-50 transition-colors"
                      style={{ color: '#DC2626' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set('features', [...form.features, ''])}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
                >
                  + 項目を追加
                </button>
              </div>
            </div>
          )}

          {/* ── 雇用・属性 ── */}
          {tab === '雇用・属性' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>転職後何ヶ月から可</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0"
                      className={`${inputCls} ${inputFocus} flex-1`}
                      style={inputStyle}
                      value={form.jobChangeMonths ?? ''}
                      onChange={e => set('jobChangeMonths', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="0 = 直後から可"
                    />
                    <span className="text-xs shrink-0" style={{ color: '#6B7280' }}>ヶ月</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>空欄 = 制限なし、0 = 転職直後から可</p>
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>自営業何期から可</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0"
                      className={`${inputCls} ${inputFocus} flex-1`}
                      style={inputStyle}
                      value={form.selfEmployedYears ?? ''}
                      onChange={e => set('selfEmployedYears', e.target.value === '' ? null : Number(e.target.value))}
                      placeholder="2"
                    />
                    <span className="text-xs shrink-0" style={{ color: '#6B7280' }}>期</span>
                  </div>
                </div>
              </div>

              {/* Toggle group */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  ['法人代表', 'corporateRepOk'],
                  ['契約社員', 'contractOk'],
                  ['派遣社員', 'dispatchOk'],
                  ['外国籍', 'foreignNationalOk'],
                  ['収入合算', 'incomeAggregationOk'],
                  ['ペアローン', 'pairLoanOk'],
                ] as [string, keyof BankMaster][]).map(([label, key]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                    <span className="text-xs font-medium" style={{ color: '#374151' }}>{label}</span>
                    <button
                      type="button"
                      onClick={() => set(key as keyof typeof form, !(form[key as keyof typeof form]) as never)}
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{ background: form[key as keyof typeof form] ? '#3B82F6' : '#D1D5DB' }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                        style={{
                          background: '#fff',
                          left: form[key as keyof typeof form] ? '20px' : '2px',
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div>
                  <span className="text-xs font-medium" style={{ color: '#374151' }}>永住権必須</span>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>オフ = 在留資格があれば可</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('permanentResidencyRequired', !form.permanentResidencyRequired)}
                  className="relative w-10 h-5 rounded-full transition-colors shrink-0"
                  style={{ background: form.permanentResidencyRequired ? '#EF4444' : '#D1D5DB' }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                    style={{ background: '#fff', left: form.permanentResidencyRequired ? '20px' : '2px' }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── ローン・団信 ── */}
          {tab === 'ローン・団信' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>車ローン影響度</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {IMPACT_LEVELS.map(l => (
                      <button key={l} type="button" onClick={() => set('carLoanImpact', l)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: form.carLoanImpact === l ? (l === '高' ? '#FEE2E2' : l === '中' ? '#FEF3C7' : l === '低' ? '#FEF9C3' : '#F0FDF4') : '#F3F4F6',
                          color: form.carLoanImpact === l ? (l === '高' ? '#DC2626' : l === '中' ? '#B45309' : l === '低' ? '#854D0E' : '#15803D') : '#6B7280',
                          border: form.carLoanImpact === l ? '1px solid currentColor' : '1px solid transparent',
                        }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>カードローン影響度</label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {IMPACT_LEVELS.map(l => (
                      <button key={l} type="button" onClick={() => set('cardLoanImpact', l)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: form.cardLoanImpact === l ? (l === '高' ? '#FEE2E2' : l === '中' ? '#FEF3C7' : l === '低' ? '#FEF9C3' : '#F0FDF4') : '#F3F4F6',
                          color: form.cardLoanImpact === l ? (l === '高' ? '#DC2626' : l === '中' ? '#B45309' : l === '低' ? '#854D0E' : '#15803D') : '#6B7280',
                          border: form.cardLoanImpact === l ? '1px solid currentColor' : '1px solid transparent',
                        }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls} style={labelStyle}>団信ラインナップ（1行1プラン）</label>
                {form.danshinTypes.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className={`${inputCls} ${inputFocus} flex-1`}
                      style={inputStyle}
                      value={d}
                      onChange={e => {
                        const next = [...form.danshinTypes];
                        next[i] = e.target.value;
                        set('danshinTypes', next);
                      }}
                      placeholder="一般団信（無料）"
                    />
                    <button type="button" onClick={() => set('danshinTypes', form.danshinTypes.filter((_, j) => j !== i))}
                      className="px-2 rounded-lg hover:bg-red-50" style={{ color: '#DC2626' }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => set('danshinTypes', [...form.danshinTypes, ''])}
                  className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                  + プランを追加
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>ZEH優遇（%、空欄 = なし）</label>
                  <input type="number" step="0.001" min="0"
                    className={`${inputCls} ${inputFocus}`} style={inputStyle}
                    value={form.zehDiscount ?? ''}
                    onChange={e => set('zehDiscount', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0.050" />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>長期優良優遇（%、空欄 = なし）</label>
                  <input type="number" step="0.001" min="0"
                    className={`${inputCls} ${inputFocus}`} style={inputStyle}
                    value={form.longTermQualityDiscount ?? ''}
                    onChange={e => set('longTermQualityDiscount', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0.050" />
                </div>
              </div>
            </div>
          )}

          {/* ── 申込・審査 ── */}
          {tab === '申込・審査' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={labelStyle}>事前審査目安日数</label>
                <input className={`${inputCls} ${inputFocus}`} style={inputStyle}
                  value={form.preScreeningDays ?? ''}
                  onChange={e => set('preScreeningDays', e.target.value)}
                  placeholder="例：最短3営業日 / 3〜5営業日" />
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>診断結果や事前審査管理の回答予定日に使用されます</p>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>WEB事前審査URL</label>
                <input type="url" className={`${inputCls} ${inputFocus}`} style={inputStyle}
                  value={form.webApplicationUrl ?? ''}
                  onChange={e => set('webApplicationUrl', e.target.value)}
                  placeholder="https://..." />
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>「WEB申込へ」ボタンを押したときに開くURLです</p>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>紙申込書ダウンロードURL</label>
                <input type="url" className={`${inputCls} ${inputFocus}`} style={inputStyle}
                  value={form.paperApplicationUrl ?? ''}
                  onChange={e => set('paperApplicationUrl', e.target.value)}
                  placeholder="https://...（PDFのURL）" />
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>申込PDFのURL。未設定の場合「申込書未登録」と表示されます</p>
              </div>
            </div>
          )}

          {/* ── つなぎ融資 ── */}
          {tab === 'つなぎ融資' && (
            <div className="space-y-5">
              {(
                [
                  ['つなぎ融資対応', 'bridgeLoanSupport'],
                  ['分割実行対応', 'splitExecutionSupport'],
                  ['土地先行融資', 'landFirstLoanSupport'],
                  ['建物中間金対応', 'buildingInterimSupport'],
                ] as [string, keyof typeof form][]
              ).map(([label, key]) => (
                <div key={key}>
                  <label className={labelCls} style={labelStyle}>{label}</label>
                  <div className="flex gap-2">
                    {(['supported', 'unsupported', 'confirm'] as SupportLevel[]).map(lv => {
                      const s = SUPPORT_LEVEL_STYLES[lv];
                      const current = (form[key] as SupportLevel) ?? 'confirm';
                      return (
                        <button key={lv} type="button" onClick={() => set(key as keyof typeof form, lv as never)}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{
                            background: current === lv ? s.bg : '#F3F4F6',
                            color: current === lv ? s.color : '#6B7280',
                            border: current === lv ? `1px solid ${s.color}40` : '1px solid transparent',
                          }}>
                          {SUPPORT_LEVEL_LABELS[lv]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className={labelCls} style={labelStyle}>返済開始タイミング</label>
                <div className="flex flex-wrap gap-2">
                  {(['land', 'building', 'final', 'interestOnly', 'confirm'] as RepaymentStartTiming[]).map(t => {
                    const current = (form.repaymentStartTiming ?? 'confirm') as RepaymentStartTiming;
                    return (
                      <button key={t} type="button" onClick={() => set('repaymentStartTiming', t as never)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: current === t ? '#DBEAFE' : '#F3F4F6',
                          color: current === t ? '#1D4ED8' : '#6B7280',
                          border: current === t ? '1px solid #93C5FD' : '1px solid transparent',
                        }}>
                        {REPAYMENT_TIMING_LABELS[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls} style={labelStyle}>つなぎ融資メモ</label>
                <textarea rows={2} className={`${inputCls} ${inputFocus} resize-none`} style={inputStyle}
                  value={form.bridgeLoanMemo ?? ''}
                  onChange={e => set('bridgeLoanMemo', e.target.value)}
                  placeholder="つなぎ融資に関する注意事項、担当者コメントなど..." />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>分割実行メモ</label>
                <textarea rows={2} className={`${inputCls} ${inputFocus} resize-none`} style={inputStyle}
                  value={form.splitExecutionMemo ?? ''}
                  onChange={e => set('splitExecutionMemo', e.target.value)}
                  placeholder="分割実行に関する条件、注意事項など..." />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>支払い開始メモ</label>
                <textarea rows={2} className={`${inputCls} ${inputFocus} resize-none`} style={inputStyle}
                  value={form.repaymentStartMemo ?? ''}
                  onChange={e => set('repaymentStartMemo', e.target.value)}
                  placeholder="返済開始タイミングに関する補足など..." />
              </div>
            </div>
          )}

          {/* ── 融資エリア ── */}
          {tab === '融資エリア' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={13} style={{ color: '#15803D' }} />
                  <span className="text-xs font-bold" style={{ color: '#15803D' }}>融資対象エリア</span>
                </div>
                <PrefCityTagInput
                  tags={form.targetAreas ?? []}
                  onChange={v => set('targetAreas', v)}
                  color={{ bg: '#DCFCE7', text: '#15803D' }}
                />
              </div>
              <div className="p-4 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div className="flex items-center gap-2 mb-2">
                  <X size={13} style={{ color: '#DC2626' }} />
                  <span className="text-xs font-bold" style={{ color: '#DC2626' }}>対象外エリア</span>
                </div>
                <PrefCityTagInput
                  tags={form.excludedAreas ?? []}
                  onChange={v => set('excludedAreas', v)}
                  color={{ bg: '#FEE2E2', text: '#DC2626' }}
                />
              </div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>
                ※ 「全国」と入力すると全国対応とみなされます。地域名（関西・関東・東北など）も使用できます。
              </p>
            </div>
          )}

          {/* ── 連絡先 ── */}
          {tab === '連絡先' && (() => {
            const c = form.contact ?? emptyContact();
            const setC = (k: keyof BankContact, v: string | string[]) =>
              set('contact', { ...c, [k]: v });
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}>担当者名</label>
                    <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.name} onChange={e => setC('name', e.target.value)} placeholder="田中 一郎" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}>役職</label>
                    <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.title} onChange={e => setC('title', e.target.value)} placeholder="住宅ローン担当" />
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>支店名</label>
                  <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.branch} onChange={e => setC('branch', e.target.value)} placeholder="○○市支店" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls} style={labelStyle}><Phone size={11} className="inline mr-1" />電話番号</label>
                    <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.phone} onChange={e => setC('phone', e.target.value)} placeholder="06-XXXX-XXXX" />
                  </div>
                  <div>
                    <label className={labelCls} style={labelStyle}><Phone size={11} className="inline mr-1" />携帯番号</label>
                    <input className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.mobile} onChange={e => setC('mobile', e.target.value)} placeholder="090-XXXX-XXXX" />
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}><Mail size={11} className="inline mr-1" />メールアドレス</label>
                  <input type="email" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.email} onChange={e => setC('email', e.target.value)} placeholder="tanaka@bank.co.jp" />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>対応可能エリア</label>
                  <TagInput
                    tags={c.availableAreas}
                    onChange={v => setC('availableAreas', v)}
                    placeholder="エリアを入力してEnter"
                    color={{ bg: '#DBEAFE', text: '#1D4ED8' }}
                  />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>最終連絡日</label>
                  <input type="date" className={`${inputCls} ${inputFocus}`} style={inputStyle} value={c.lastContactDate} onChange={e => setC('lastContactDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>連絡先メモ</label>
                  <textarea rows={4} className={`${inputCls} ${inputFocus} resize-none`} style={inputStyle} value={c.memo} onChange={e => setC('memo', e.target.value)} placeholder="担当者との関係、注意事項、好みの連絡方法など..." />
                </div>
              </div>
            );
          })()}

          {/* ── スケジュールテンプレート ── */}
          {tab === 'スケジュールテンプレート' && (
            isNew ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#FEF3C7' }}>
                  <Save size={20} style={{ color: '#D97706' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: '#111827' }}>先に銀行情報を保存してください</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>銀行を追加してから、テンプレートタブで編集できます。</p>
              </div>
            ) : (
              <TemplateTabContent bankId={bank!.id!} />
            )
          )}

          {/* ── 営業メモ ── */}
          {tab === '営業メモ' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls} style={labelStyle}>営業担当メモ</label>
                <textarea
                  rows={8}
                  className={`${inputCls} ${inputFocus} resize-none`}
                  style={inputStyle}
                  value={form.staffMemo}
                  onChange={e => set('staffMemo', e.target.value)}
                  placeholder="この銀行の特徴、顧客への提案ポイント、注意事項などを記録してください..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={labelStyle}>最終確認日</label>
                  <input type="date" className={`${inputCls} ${inputFocus}`} style={inputStyle}
                    value={form.lastConfirmedDate ?? ''}
                    onChange={e => set('lastConfirmedDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>確認者</label>
                  <input className={`${inputCls} ${inputFocus}`} style={inputStyle}
                    value={form.confirmedBy ?? ''}
                    onChange={e => set('confirmedBy', e.target.value)}
                    placeholder="山田 太郎" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            {isNew ? '新しい銀行情報を追加します' : '変更はLocalStorageに保存されます'}
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: '#F3F4F6', color: '#374151' }}>
              キャンセル
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
              <Save size={14} />{isNew ? '追加する' : '更新する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ bankName, onConfirm, onClose }: {
  bankName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEE2E2' }}>
            <AlertTriangle size={22} style={{ color: '#DC2626' }} />
          </div>
          <h3 className="font-bold text-sm mb-2" style={{ color: '#111827' }}>銀行を削除しますか？</h3>
          <p className="text-xs mb-1" style={{ color: '#374151' }}>
            <strong>{bankName}</strong> をマスタから削除します。
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>この操作は元に戻せません。</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}>
            キャンセル
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#DC2626', color: '#fff' }}>
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BanksPage() {
  const { banks, loaded, addBank, updateBank, deleteBank } = useBanks();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<'add' | BankMaster | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankMaster | null>(null);
  const [search, setSearch] = useState('');
  const [productTab, setProductTab] = useState<ProductType>('variable');

  const filtered = useMemo(() =>
    banks.filter(b =>
      b.productType === productTab &&
      (b.name.toLowerCase().includes(search.toLowerCase()) || b.productName.toLowerCase().includes(search.toLowerCase()))
    ),
    [banks, search, productTab]
  );

  const handleSave = (b: BankMaster) => {
    if (modal === 'add') {
      addBank(b);
    } else {
      updateBank(b.id, b);
      // Update expanded if editing the currently expanded bank
      if (expanded === (modal as BankMaster).id) setExpanded(b.id);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteBank(deleteTarget.id);
    if (expanded === deleteTarget.id) setExpanded(null);
    setDeleteTarget(null);
  };

  const handleReset = () => {
    if (!confirm('銀行マスタをデフォルトデータにリセットしますか？\n（追加・編集した内容はすべて失われます）')) return;
    import('@/lib/bankStorage').then(m => {
      m.saveBanks(BANKS);
      window.location.reload();
    });
  };

  return (
    <div className="p-4 md:p-7 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEF3C7' }}>
            <Building2 size={18} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>銀行マスタ</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              住宅ローン取扱銀行の管理（{loaded ? filtered.length : '…'}行{search ? ' / 全' + banks.length + '行' : ''}）
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleReset} className="text-xs px-3 py-2 rounded-lg transition-colors"
            style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
            デフォルトにリセット
          </button>
          <button
            onClick={() => setModal('add')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
          >
            <Plus size={15} />銀行を追加
          </button>
        </div>
      </div>

      {/* Product Type Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => { setProductTab('variable'); setExpanded(null); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: productTab === 'variable' ? '#DBEAFE' : 'var(--bg-card)', color: productTab === 'variable' ? '#1D4ED8' : 'var(--text-secondary)', border: `1px solid ${productTab === 'variable' ? '#93C5FD' : 'var(--border)'}` }}>
          📈 変動金利
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: productTab === 'variable' ? '#93C5FD' : '#E5E7EB', color: productTab === 'variable' ? '#1D4ED8' : '#6B7280' }}>
            {banks.filter(b => b.productType === 'variable').length}
          </span>
        </button>
        <button onClick={() => { setProductTab('fixed'); setExpanded(null); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: productTab === 'fixed' ? '#EDE9FE' : 'var(--bg-card)', color: productTab === 'fixed' ? '#7C3AED' : 'var(--text-secondary)', border: `1px solid ${productTab === 'fixed' ? '#C4B5FD' : 'var(--border)'}` }}>
          🏦 固定金利
          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: productTab === 'fixed' ? '#C4B5FD' : '#E5E7EB', color: productTab === 'fixed' ? '#7C3AED' : '#6B7280' }}>
            {banks.filter(b => b.productType === 'fixed').length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
        <Search size={14} style={{ color: '#9CA3AF' }} />
        <input
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: '#111827' }}
          placeholder="銀行名・商品名で検索..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs" style={{ color: '#6B7280' }}>
        <span>車/カードローン影響：</span>
        {(['なし', '低', '中', '高'] as LoanImpactLevel[]).map(l => (
          <span key={l}><ImpactBadge level={l} /></span>
        ))}
        <span className="ml-3">▼ 行をクリックで詳細展開</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: '#F9FAFB' }}>
                {['銀行名 / 商品名', '金利', ...(productTab === 'fixed' ? ['固定タイプ'] : []), '事務手数料', '車', 'カード', '合算', 'ペア', 'ZEH', '長期優良', '操作', ''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <React.Fragment key={b.id}>
                  <tr
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: expanded === b.id ? 'none' : '1px solid #F3F4F6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                    onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.productName}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-sm" style={{ color: productTab === 'variable' ? '#3B82F6' : '#7C3AED' }}>{b.rate.toFixed(3)}%</span>
                    </td>
                    {productTab === 'fixed' && (
                      <td className="px-3 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                          {b.fixedPeriod ? FIXED_PERIOD_LABELS[b.fixedPeriod as FixedPeriodType] : '固定'}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {b.feeYen > 0 ? `${b.feeYen.toLocaleString()}円` : '無料'}
                    </td>
                    <td className="px-3 py-3"><ImpactBadge level={b.carLoanImpact} /></td>
                    <td className="px-3 py-3"><ImpactBadge level={b.cardLoanImpact} /></td>
                    <td className="px-3 py-3"><YesNo val={b.incomeAggregationOk} /></td>
                    <td className="px-3 py-3"><YesNo val={b.pairLoanOk} /></td>
                    <td className="px-3 py-3 text-xs" style={{ color: b.zehDiscount ? '#7C3AED' : '#9CA3AF' }}>
                      {b.zehDiscount ? `-${b.zehDiscount.toFixed(3)}%` : 'なし'}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: b.longTermQualityDiscount ? '#7C3AED' : '#9CA3AF' }}>
                      {b.longTermQualityDiscount ? `-${b.longTermQualityDiscount.toFixed(3)}%` : 'なし'}
                    </td>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal(b)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#3B82F6' }}
                          title="編集"
                          onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: '#DC2626' }}
                          title="削除"
                          onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${expanded === b.id ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </td>
                  </tr>
                  {expanded === b.id && (
                    <tr key={`${b.id}-detail`} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td colSpan={productTab === 'fixed' ? 12 : 11} className="p-0">
                        <DetailPanel b={b} onEdit={() => setModal(b)} onDelete={() => setDeleteTarget(b)} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={productTab === 'fixed' ? 12 : 11} className="py-16 text-center text-sm" style={{ color: '#9CA3AF' }}>
                    {search ? `「${search}」に一致する銀行は見つかりませんでした` : '銀行が登録されていません'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y" style={{ borderColor: '#F3F4F6' }}>
          {filtered.map(b => (
            <div key={b.id}>
              <button
                className="w-full px-4 py-4 text-left"
                onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{b.productName}</div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 shrink-0 ml-2 ${expanded === b.id ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                  />
                </div>
                <div className="flex gap-4 mt-2">
                  <div>
                    <div className="text-xs" style={{ color: '#9CA3AF' }}>{productTab === 'variable' ? '変動金利' : (b.fixedPeriod ? FIXED_PERIOD_LABELS[b.fixedPeriod as FixedPeriodType] : '固定金利')}</div>
                    <div className="font-bold text-sm" style={{ color: productTab === 'variable' ? '#3B82F6' : '#7C3AED' }}>{b.rate.toFixed(3)}%</div>
                  </div>
                  <div className="flex items-end gap-1.5 pb-0.5">
                    <ImpactBadge level={b.carLoanImpact} />
                    <ImpactBadge level={b.cardLoanImpact} />
                  </div>
                </div>
              </button>
              {expanded === b.id && (
                <DetailPanel b={b} onEdit={() => setModal(b)} onDelete={() => setDeleteTarget(b)} />
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm" style={{ color: '#9CA3AF' }}>
              {search ? `「${search}」に一致する銀行は見つかりませんでした` : '銀行が登録されていません'}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal !== null && (
        <BankModal
          bank={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          bankName={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
