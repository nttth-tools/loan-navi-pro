"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Search, X, Save } from "lucide-react";
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from "@/lib/storage";
import type { Customer } from "@/types";

const CUSTOMER_STATUSES = ['情報収集中','提案中','前審査待ち','事前審査中','本審査中','契約準備中','契約済'];
const EMPLOYMENT_TYPES = ['正社員','公務員','契約社員','パート・アルバイト','自営業','その他'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  '情報収集中': { color: '#64748b', bg: '#F1F5F9' },
  '提案中':     { color: '#f59e0b', bg: '#FEF3C7' },
  '前審査待ち': { color: '#06b6d4', bg: '#CFFAFE' },
  '事前審査中': { color: '#3b82f6', bg: '#DBEAFE' },
  '本審査中':   { color: '#8b5cf6', bg: '#EDE9FE' },
  '契約準備中': { color: '#10b981', bg: '#D1FAE5' },
  '契約済':     { color: '#10b981', bg: '#A7F3D0' },
};

const SAMPLE: Customer[] = [
  { id:'1', name:'田中 健一', age:'35', employer:'株式会社ABC', yearsEmployed:'10', income:'600', spouseIncome:'0', employment:'正社員', savings:'500', existingLoan:'0', desiredAmount:'4000', desiredPayment:'12', area:'東京都', builder:'ハウスメーカーA', referral:'紹介', memo:'夫婦での合算検討中', status:'事前審査中', createdAt:'2024-07-01' },
  { id:'2', name:'佐藤 美咲', age:'32', employer:'株式会社XYZ', yearsEmployed:'5', income:'450', spouseIncome:'300', employment:'正社員', savings:'300', existingLoan:'0', desiredAmount:'3500', desiredPayment:'10', area:'神奈川県', builder:'工務店B', referral:'展示場', memo:'配偶者合算で申込希望', status:'提案中', createdAt:'2024-07-03' },
  { id:'3', name:'鈴木 大輔', age:'40', employer:'公務員', yearsEmployed:'15', income:'700', spouseIncome:'0', employment:'公務員', savings:'800', existingLoan:'3', desiredAmount:'5000', desiredPayment:'15', area:'大阪府', builder:'ハウスメーカーC', referral:'WEB', memo:'カーローン残あり', status:'前審査待ち', createdAt:'2024-07-05' },
];

const EMPTY: Omit<Customer,'id'|'createdAt'> = {
  name:'', age:'', employer:'', yearsEmployed:'', income:'', spouseIncome:'',
  employment:'正社員', savings:'', existingLoan:'', desiredAmount:'', desiredPayment:'',
  area:'', builder:'', referral:'', memo:'', status:'情報収集中',
};

const iStyle = { background:'#F9FAFB', border:'1px solid var(--border)', color:'var(--text-primary)' } as const;
const sStyle = { background:'#FFFFFF', border:'1px solid var(--border)', color:'var(--text-primary)' } as const;
const cls = "w-full px-3 py-2 rounded-xl text-sm outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>{children}</label>;
}

function Modal({ record, onSave, onClose }: {
  record: Partial<Customer> | null;
  onSave: (c: Customer) => void;
  onClose: () => void;
}) {
  const existing = record as Customer | null;
  const [form, setForm] = useState<Omit<Customer,'id'|'createdAt'>>({ ...EMPTY, ...existing });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background:'#FFFFFF', border:'1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom:'1px solid var(--border)' }}>
          <h2 className="font-semibold text-sm" style={{ color:'var(--text-primary)' }}>{existing?.id ? '顧客を編集' : '顧客を追加'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50"><X size={16} style={{ color:'var(--text-muted)' }}/></button>
        </div>
        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[80vh]">
          <div><Label>顧客名 *</Label><input className={cls} style={iStyle} value={form.name} onChange={e=>set('name')(e.target.value)} placeholder="山田 太郎"/></div>
          <div><Label>年齢</Label><input type="number" className={cls} style={iStyle} value={form.age} onChange={e=>set('age')(e.target.value)} placeholder="35"/></div>
          <div><Label>勤務先</Label><input className={cls} style={iStyle} value={form.employer} onChange={e=>set('employer')(e.target.value)} placeholder="株式会社〇〇"/></div>
          <div><Label>勤続年数（年）</Label><input type="number" className={cls} style={iStyle} value={form.yearsEmployed} onChange={e=>set('yearsEmployed')(e.target.value)} placeholder="5"/></div>
          <div><Label>雇用形態</Label>
            <select className={cls} style={sStyle} value={form.employment} onChange={e=>set('employment')(e.target.value)}>
              {EMPLOYMENT_TYPES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><Label>年収（万円）</Label><input type="number" className={cls} style={iStyle} value={form.income} onChange={e=>set('income')(e.target.value)} placeholder="600"/></div>
          <div><Label>配偶者年収（万円）</Label><input type="number" className={cls} style={iStyle} value={form.spouseIncome} onChange={e=>set('spouseIncome')(e.target.value)} placeholder="0"/></div>
          <div><Label>自己資金（万円）</Label><input type="number" className={cls} style={iStyle} value={form.savings} onChange={e=>set('savings')(e.target.value)} placeholder="500"/></div>
          <div><Label>既存借入（万円/月）</Label><input type="number" className={cls} style={iStyle} value={form.existingLoan} onChange={e=>set('existingLoan')(e.target.value)} placeholder="3"/></div>
          <div><Label>希望借入額（万円）</Label><input type="number" className={cls} style={iStyle} value={form.desiredAmount} onChange={e=>set('desiredAmount')(e.target.value)} placeholder="3500"/></div>
          <div><Label>希望返済額（万円/月）</Label><input type="number" className={cls} style={iStyle} value={form.desiredPayment} onChange={e=>set('desiredPayment')(e.target.value)} placeholder="10"/></div>
          <div><Label>希望エリア</Label><input className={cls} style={iStyle} value={form.area} onChange={e=>set('area')(e.target.value)} placeholder="東京都"/></div>
          <div><Label>建築会社</Label><input className={cls} style={iStyle} value={form.builder} onChange={e=>set('builder')(e.target.value)} placeholder="ハウスメーカーA"/></div>
          <div><Label>紹介元</Label><input className={cls} style={iStyle} value={form.referral} onChange={e=>set('referral')(e.target.value)} placeholder="展示場"/></div>
          <div><Label>進捗状況</Label>
            <select className={cls} style={sStyle} value={form.status} onChange={e=>set('status')(e.target.value)}>
              {CUSTOMER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-2"><Label>メモ</Label>
            <textarea className={cls} style={{ ...iStyle, resize:'none' } as React.CSSProperties} rows={3} value={form.memo} onChange={e=>set('memo')(e.target.value)} placeholder="特記事項..."/>
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderBottom:'none', borderTop:'1px solid var(--border)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors" style={{ border:'1px solid var(--border)', color:'var(--text-secondary)' }}>キャンセル</button>
          <button onClick={() => onSave({ ...form, id: existing?.id ?? String(Date.now()), createdAt: existing?.createdAt ?? new Date().toISOString().split('T')[0] })}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff' }}>
            <Save size={14}/> 保存する
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modal, setModal] = useState<Partial<Customer> | null | false>(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string|null>(null);

  useEffect(() => {
    const saved = loadFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
    setCustomers(saved.length > 0 ? saved : SAMPLE);
  }, []);

  const persist = useCallback((next: Customer[]) => {
    setCustomers(next);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, next);
  }, []);

  const handleSave = (c: Customer) => {
    persist(customers.some(x => x.id === c.id) ? customers.map(x => x.id === c.id ? c : x) : [...customers, c]);
    setModal(false);
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.employer.toLowerCase().includes(q) || c.area.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 md:p-7 max-w-7xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#DBEAFE' }}>
              <Users size={18} style={{ color:'#3b82f6' }}/>
            </div>
            <h1 className="text-xl font-bold" style={{ color:'var(--text-primary)' }}>顧客管理</h1>
          </div>
          <p className="text-sm ml-12" style={{ color:'var(--text-secondary)' }}>全{customers.length}名の顧客情報を管理しています</p>
        </div>
        <button onClick={() => setModal({})} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background:'linear-gradient(135deg,#3b82f6,#6366f1)', color:'#fff' }}>
          <Plus size={16}/> 顧客を追加
        </button>
      </div>

      <div className="relative max-w-xs mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'var(--text-muted)' }}/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="顧客名・勤務先・エリアで検索..."
          className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
          style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)' }}/>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0
          ? <div className="rounded-2xl py-12 text-center text-sm" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-muted)' }}>顧客が登録されていません</div>
          : filtered.map(c => {
            const sc = STATUS_STYLE[c.status] ?? { color:'#64748b', bg:'#F1F5F9' };
            return (
              <div key={c.id} className="rounded-2xl p-4" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background:'#BFDBFE', color:'#2563EB' }}>{c.name[0]}</div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color:'var(--text-primary)' }}>{c.name}</p>
                      <p className="text-xs" style={{ color:'var(--text-secondary)' }}>{c.employment} {c.age ? `・${c.age}歳` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background:sc.bg, color:sc.color }}>{c.status}</span>
                    <button onClick={() => setModal(c)} className="p-1.5 rounded-lg" style={{ background:'#EFF6FF' }}><Pencil size={13} style={{ color:'#3b82f6' }}/></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg" style={{ background:'#FEF2F2' }}><Trash2 size={13} style={{ color:'#ef4444' }}/></button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mt-2" style={{ color:'var(--text-secondary)' }}>
                  <div><span style={{ color:'var(--text-muted)' }}>年収</span><br/><b style={{ color:'var(--text-primary)' }}>{c.income ? `${c.income}万円` : '—'}</b></div>
                  <div><span style={{ color:'var(--text-muted)' }}>借入希望</span><br/><b style={{ color:'var(--text-primary)' }}>{c.desiredAmount ? `${c.desiredAmount}万円` : '—'}</b></div>
                  <div><span style={{ color:'var(--text-muted)' }}>登録日</span><br/>{c.createdAt}</div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background:'var(--bg-card)', border:'1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom:'1px solid var(--border)' }}>
              {['顧客名','年齢','雇用形態','年収','希望借入額','進捗状況','登録日','操作'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color:'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color:'var(--text-muted)' }}>顧客が登録されていません</td></tr>
              : filtered.map(c => {
                const sc = STATUS_STYLE[c.status] ?? { color:'#64748b', bg:'#F1F5F9' };
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom:'1px solid #F3F4F6' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background:'#BFDBFE', color:'#2563EB' }}>{c.name[0]}</div>
                        <span className="font-medium text-xs" style={{ color:'var(--text-primary)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color:'var(--text-secondary)' }}>{c.age ? `${c.age}歳` : '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color:'var(--text-secondary)' }}>{c.employment}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color:'var(--text-primary)' }}>{c.income ? `${c.income}万円` : '—'}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color:'var(--text-primary)' }}>{c.desiredAmount ? `${c.desiredAmount}万円` : '—'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background:sc.bg, color:sc.color }}>{c.status}</span></td>
                    <td className="px-4 py-3 text-xs" style={{ color:'var(--text-muted)' }}>{c.createdAt}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(c)} className="p-1.5 rounded-lg hover:bg-gray-50"><Pencil size={13} style={{ color:'#3b82f6' }}/></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-gray-50"><Trash2 size={13} style={{ color:'#ef4444' }}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {modal !== false && <Modal record={modal} onSave={handleSave} onClose={() => setModal(false)}/>}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background:'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl p-6 w-80" style={{ background:'#FFFFFF', border:'1px solid var(--border)' }}>
            <h3 className="font-semibold mb-2" style={{ color:'var(--text-primary)' }}>削除の確認</h3>
            <p className="text-sm mb-5" style={{ color:'var(--text-secondary)' }}>この顧客データを削除しますか？この操作は元に戻せません。</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-xl text-sm hover:bg-gray-50" style={{ border:'1px solid var(--border)', color:'var(--text-secondary)' }}>キャンセル</button>
              <button onClick={() => { persist(customers.filter(c => c.id !== deleteId)); setDeleteId(null); }}
                className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90" style={{ background:'#ef4444', color:'#fff' }}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
