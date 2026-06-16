"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MapPin, Plus, Pencil, Trash2, X, Save, Search, Phone, Mail,
  ChevronDown, AlertTriangle, CheckCircle, HelpCircle,
} from "lucide-react";
import { loadAreaMaster, saveAreaMaster, AREA_MASTER_DEFAULTS } from "@/lib/areaMasterStorage";
import { judgeAreaMaster, AREA_JUDGMENT_LABELS, AREA_JUDGMENT_STYLES } from "@/lib/areaUtils";
import { INSTITUTION_TYPE_LABELS } from "@/types";
import type { AreaMasterEntry, InstitutionType } from "@/types";
import type { AreaJudgment } from "@/lib/areaUtils";

// ── Constants ────────────────────────────────────────────────────────────────

const INSTITUTION_TYPES: InstitutionType[] = ['ja', 'shinkin', 'rokin', 'chiho', 'mega', 'net', 'other'];

const TYPE_COLORS: Record<InstitutionType, { bg: string; color: string }> = {
  ja:      { bg: '#DCFCE7', color: '#15803D' },
  shinkin: { bg: '#DBEAFE', color: '#1D4ED8' },
  rokin:   { bg: '#EDE9FE', color: '#7C3AED' },
  chiho:   { bg: '#FEF3C7', color: '#B45309' },
  mega:    { bg: '#F1F5F9', color: '#475569' },
  net:     { bg: '#ECFDF5', color: '#059669' },
  other:   { bg: '#F3F4F6', color: '#6B7280' },
};

function emptyEntry(): Omit<AreaMasterEntry, 'id'> {
  return {
    institutionType: 'ja',
    institutionName: '',
    branchName: '',
    contactName: '',
    phone: '',
    targetAreas: [],
    excludedAreas: [],
    notes: '',
    lastConfirmedDate: '',
  };
}

// ── Tag Input ────────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder, color }: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color?: { bg: string; text: string };
}) {
  const [input, setInput] = useState('');
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
              className="opacity-60 hover:opacity-100 ml-0.5">
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

// ── Entry Modal ──────────────────────────────────────────────────────────────

function EntryModal({ entry, onSave, onClose }: {
  entry: AreaMasterEntry | null;
  onSave: (e: AreaMasterEntry) => void;
  onClose: () => void;
}) {
  const isNew = !entry?.id;
  const [form, setForm] = useState<Omit<AreaMasterEntry, 'id'>>(() => ({
    ...emptyEntry(),
    ...(entry ? {
      institutionType: entry.institutionType,
      institutionName: entry.institutionName,
      branchName: entry.branchName,
      contactName: entry.contactName,
      phone: entry.phone,
      targetAreas: entry.targetAreas,
      excludedAreas: entry.excludedAreas,
      notes: entry.notes,
      lastConfirmedDate: entry.lastConfirmedDate,
    } : {}),
  }));

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.institutionName.trim()) { alert('金融機関名を入力してください'); return; }
    onSave({ ...form, id: entry?.id ?? `am_${Date.now()}` });
  };

  const inputCls = "w-full px-3 py-2 rounded-lg text-sm outline-none";
  const inputStyle = { background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#111827' };
  const labelCls = "block text-xs font-semibold mb-1.5";
  const labelStyle = { color: '#374151' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden flex flex-col" style={{ background: '#fff', border: '1px solid #E5E7EB', maxHeight: '90vh' }}>
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h2 className="font-bold text-sm" style={{ color: '#111827' }}>
            {isNew ? '融資エリアを新規追加' : `${entry?.institutionName} を編集`}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-50">
            <X size={16} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* 種別 */}
          <div>
            <label className={labelCls} style={labelStyle}>金融機関種別</label>
            <div className="flex flex-wrap gap-2">
              {INSTITUTION_TYPES.map(t => {
                const c = TYPE_COLORS[t];
                return (
                  <button key={t} type="button" onClick={() => set('institutionType', t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.institutionType === t ? c.bg : '#F3F4F6',
                      color: form.institutionType === t ? c.color : '#6B7280',
                      border: form.institutionType === t ? `1px solid ${c.color}40` : '1px solid transparent',
                    }}>
                    {INSTITUTION_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>金融機関名 *</label>
              <input className={inputCls} style={inputStyle} value={form.institutionName}
                onChange={e => set('institutionName', e.target.value)} placeholder="JA大阪中河内" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>支店名</label>
              <input className={inputCls} style={inputStyle} value={form.branchName}
                onChange={e => set('branchName', e.target.value)} placeholder="松原支店" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>担当者名</label>
              <input className={inputCls} style={inputStyle} value={form.contactName}
                onChange={e => set('contactName', e.target.value)} placeholder="田中 一郎" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>電話番号</label>
              <input className={inputCls} style={inputStyle} value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="072-333-XXXX" />
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>融資対象エリア</label>
            <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>
              例：大阪府松原市 / 奈良県全域 / 関西 / 全国
            </p>
            <TagInput
              tags={form.targetAreas}
              onChange={v => set('targetAreas', v)}
              placeholder="エリアを入力してEnter（例：大阪府松原市）"
              color={{ bg: '#DCFCE7', text: '#15803D' }}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>対象外エリア</label>
            <TagInput
              tags={form.excludedAreas}
              onChange={v => set('excludedAreas', v)}
              placeholder="対象外エリアを入力してEnter（例：兵庫県全域）"
              color={{ bg: '#FEE2E2', text: '#DC2626' }}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>備考・メモ</label>
            <textarea rows={3} className={`${inputCls} resize-none`} style={inputStyle}
              value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="審査のポイント、担当者との関係、注意事項など..." />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>最終確認日</label>
            <input type="date" className={inputCls} style={inputStyle}
              value={form.lastConfirmedDate} onChange={e => set('lastConfirmedDate', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #E5E7EB', background: '#F9FAFB' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}>
            キャンセル
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff' }}>
            <Save size={14} />{isNew ? '追加する' : '更新する'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onClose }: {
  name: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEE2E2' }}>
            <AlertTriangle size={22} style={{ color: '#DC2626' }} />
          </div>
          <h3 className="font-bold text-sm mb-2" style={{ color: '#111827' }}>削除しますか？</h3>
          <p className="text-xs" style={{ color: '#374151' }}><strong>{name}</strong> を削除します。</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: '#F3F4F6', color: '#374151' }}>キャンセル</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: '#DC2626', color: '#fff' }}>削除する</button>
        </div>
      </div>
    </div>
  );
}

// ── Area Judge Badge ──────────────────────────────────────────────────────────

function JudgeBadge({ judgment }: { judgment: AreaJudgment }) {
  const style = AREA_JUDGMENT_STYLES[judgment];
  const icon = judgment === 'in' ? <CheckCircle size={11} /> : judgment === 'out' ? <X size={11} /> : <HelpCircle size={11} />;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: style.bg, color: style.color }}>
      {icon}{AREA_JUDGMENT_LABELS[judgment]}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AreaMasterPage() {
  const [entries, setEntries] = useState<AreaMasterEntry[]>([]);
  const [modal, setModal] = useState<'add' | AreaMasterEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AreaMasterEntry | null>(null);
  const [search, setSearch] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [filterType, setFilterType] = useState<InstitutionType | 'all'>('all');

  useEffect(() => { setEntries(loadAreaMaster()); }, []);

  const save = useCallback((list: AreaMasterEntry[]) => {
    setEntries(list);
    saveAreaMaster(list);
  }, []);

  const handleSave = (e: AreaMasterEntry) => {
    if (modal === 'add') {
      save([...entries, e]);
    } else {
      save(entries.map(x => x.id === e.id ? e : x));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    save(entries.filter(x => x.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleReset = () => {
    if (!confirm('デフォルトデータにリセットしますか？')) return;
    save(AREA_MASTER_DEFAULTS);
  };

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchType = filterType === 'all' || e.institutionType === filterType;
      const matchSearch = !search || e.institutionName.includes(search) || e.branchName.includes(search) || e.contactName.includes(search);
      return matchType && matchSearch;
    });
  }, [entries, search, filterType]);

  // Address search results
  const addressResults = useMemo(() => {
    if (!addressSearch.trim()) return [];
    return entries.map(e => ({
      entry: e,
      judgment: judgeAreaMaster(addressSearch, e),
    })).filter(r => r.judgment !== 'out');
  }, [entries, addressSearch]);

  return (
    <div className="p-4 md:p-7 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#DBEAFE' }}>
            <MapPin size={18} style={{ color: '#2563EB' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>融資エリアマスタ</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              JA・信金・ろうきん・地方銀行の融資対象エリア管理（{entries.length}件）
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleReset} className="text-xs px-3 py-2 rounded-lg"
            style={{ background: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
            デフォルトにリセット
          </button>
          <button onClick={() => setModal('add')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
            <Plus size={15} />金融機関を追加
          </button>
        </div>
      </div>

      {/* Address Search */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <MapPin size={14} style={{ color: '#2563EB' }} /> 建築地住所から利用可能金融機関を検索
        </h2>
        <div className="flex gap-3 items-center">
          <input
            value={addressSearch}
            onChange={e => setAddressSearch(e.target.value)}
            placeholder="例：大阪府松原市〇〇町"
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />
          {addressSearch && (
            <button onClick={() => setAddressSearch('')} className="p-2 rounded-lg hover:bg-gray-100">
              <X size={14} style={{ color: '#9CA3AF' }} />
            </button>
          )}
        </div>
        {addressSearch && (
          <div className="mt-4">
            {addressResults.length === 0 ? (
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                「{addressSearch}」に対応する金融機関が見つかりませんでした
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
                  「{addressSearch}」で利用可能な金融機関（{addressResults.length}件）
                </p>
                <div className="grid gap-2">
                  {addressResults.map(({ entry, judgment }) => {
                    const tc = TYPE_COLORS[entry.institutionType];
                    return (
                      <div key={entry.id} className="flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                          style={{ background: tc.bg, color: tc.color }}>
                          {INSTITUTION_TYPE_LABELS[entry.institutionType]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs" style={{ color: '#111827' }}>
                            {entry.institutionName}
                            {entry.branchName && <span className="ml-1 font-normal" style={{ color: '#6B7280' }}>（{entry.branchName}）</span>}
                          </div>
                          {entry.contactName && (
                            <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>担当：{entry.contactName}</div>
                          )}
                        </div>
                        <JudgeBadge judgment={judgment} />
                        {entry.phone && (
                          <a href={`tel:${entry.phone}`} className="flex items-center gap-1 text-xs shrink-0"
                            style={{ color: '#2563EB' }}>
                            <Phone size={11} />{entry.phone}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filter + Search bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterType('all')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: filterType === 'all' ? '#DBEAFE' : 'var(--bg-card)', color: filterType === 'all' ? '#1D4ED8' : 'var(--text-secondary)', border: `1px solid ${filterType === 'all' ? '#93C5FD' : 'var(--border)'}` }}>
          すべて ({entries.length})
        </button>
        {INSTITUTION_TYPES.map(t => {
          const count = entries.filter(e => e.institutionType === t).length;
          if (count === 0) return null;
          const c = TYPE_COLORS[t];
          return (
            <button key={t} onClick={() => setFilterType(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: filterType === t ? c.bg : 'var(--bg-card)', color: filterType === t ? c.color : 'var(--text-secondary)', border: `1px solid ${filterType === t ? c.color + '40' : 'var(--border)'}` }}>
              {INSTITUTION_TYPE_LABELS[t]} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
        <Search size={14} style={{ color: '#9CA3AF' }} />
        <input className="flex-1 text-sm outline-none bg-transparent" style={{ color: '#111827' }}
          placeholder="金融機関名・支店名・担当者で検索..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(entry => {
          const tc = TYPE_COLORS[entry.institutionType];
          return (
            <div key={entry.id} className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-3">
                <span className="text-xs px-2 py-1 rounded-full font-semibold shrink-0 mt-0.5"
                  style={{ background: tc.bg, color: tc.color }}>
                  {INSTITUTION_TYPE_LABELS[entry.institutionType]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {entry.institutionName}
                    </span>
                    {entry.branchName && (
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{entry.branchName}</span>
                    )}
                  </div>
                  {entry.contactName && (
                    <div className="text-xs mt-1 flex items-center gap-3 flex-wrap" style={{ color: '#6B7280' }}>
                      <span>担当：{entry.contactName}</span>
                      {entry.phone && (
                        <span className="flex items-center gap-1"><Phone size={10} />{entry.phone}</span>
                      )}
                    </div>
                  )}
                  {/* Target Areas */}
                  {entry.targetAreas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.targetAreas.map(a => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#DCFCE7', color: '#15803D' }}>{a}</span>
                      ))}
                    </div>
                  )}
                  {/* Excluded Areas */}
                  {entry.excludedAreas.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.excludedAreas.map(a => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#FEE2E2', color: '#DC2626' }}>除外：{a}</span>
                      ))}
                    </div>
                  )}
                  {entry.notes && (
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: '#6B7280' }}>{entry.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {entry.lastConfirmedDate && (
                    <span className="text-xs mr-2" style={{ color: '#9CA3AF' }}>{entry.lastConfirmedDate}</span>
                  )}
                  <button onClick={() => setModal(entry)} className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#3B82F6' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleteTarget(entry)} className="p-1.5 rounded-lg transition-colors"
                    style={{ color: '#DC2626' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <MapPin size={36} className="mx-auto mb-3" style={{ color: '#CBD5E1' }} />
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              {search ? `「${search}」に一致する金融機関はありません` : '金融機関が登録されていません'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal !== null && (
        <EntryModal
          entry={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          name={`${deleteTarget.institutionName} ${deleteTarget.branchName}`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
