"use client";

import { useState } from "react";
import { Bell, CheckSquare, Square, Plus, X, AlertTriangle, Clock, RefreshCw, CheckCircle } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/hooks/useTasks";

const TAG_OPTIONS = [
  { label: '事前審査', color: '#3b82f6', bg: '#DBEAFE' },
  { label: '提案',     color: '#f59e0b', bg: '#FEF3C7' },
  { label: '本審査',   color: '#8b5cf6', bg: '#EDE9FE' },
  { label: '書類',     color: '#10b981', bg: '#D1FAE5' },
  { label: 'フォロー', color: '#06b6d4', bg: '#CFFAFE' },
];

function relDate(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function relDateSlash(n: number): string {
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

const SAMPLE_TASKS: Task[] = [
  { id:'1', text:'山田 様 書類提出フォロー', tag:'事前審査', tagColor:'#3b82f6', tagBg:'#DBEAFE', date:relDate(0), done:false },
  { id:'2', text:'佐藤 様 銀行比較提案書作成', tag:'提案', tagColor:'#f59e0b', tagBg:'#FEF3C7', date:relDate(1), done:false },
  { id:'3', text:'鈴木 様 追加資料依頼', tag:'事前審査', tagColor:'#3b82f6', tagBg:'#DBEAFE', date:relDate(2), done:false },
  { id:'4', text:'田中 様 本審査進捗確認', tag:'本審査', tagColor:'#8b5cf6', tagBg:'#EDE9FE', date:relDate(2), done:false },
  { id:'5', text:'高橋 様 面談', tag:'提案', tagColor:'#f59e0b', tagBg:'#FEF3C7', date:relDate(3), done:false },
];

const ALERTS = [
  { type:'error', icon:AlertTriangle, title:'最終確認日が30日以上前の銀行があります', sub:'7件の銀行が対象です', date:relDateSlash(0), color:'#ef4444', bg:'#FEF2F2' },
  { type:'warning', icon:Clock, title:'事前審査の回答期限が近い案件があります', sub:'3件の案件が対象です', date:relDateSlash(0), color:'#f59e0b', bg:'#FFFBEB' },
  { type:'info', icon:RefreshCw, title:'金利が更新された銀行があります', sub:'住信SBIネット銀行、楽天銀行 など', date:relDateSlash(-1), color:'#3b82f6', bg:'#EFF6FF' },
  { type:'success', icon:CheckCircle, title:'事前審査が承認されました', sub:'田中 様（住信SBIネット銀行）', date:relDateSlash(-1), color:'#10b981', bg:'#ECFDF5' },
];

export default function TasksPage() {
  const { tasks, addTask: fsAddTask, toggleTask, deleteTask } = useTasks();
  const [newText, setNewText] = useState('');
  const [newTag, setNewTag] = useState(TAG_OPTIONS[0]);
  const [newDate, setNewDate] = useState('');
  const [adding, setAdding] = useState(false);

  const toggle = (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (t) toggleTask(id, !t.done);
  };
  const remove = (id: string) => deleteTask(id);

  const addTask = () => {
    if (!newText.trim()) return;
    fsAddTask({ text: newText.trim(), tag: newTag.label, tagColor: newTag.color, tagBg: newTag.bg, date: newDate, done: false });
    setNewText(''); setNewDate(''); setAdding(false);
  };

  const displayTasks = tasks.length === 0 ? SAMPLE_TASKS : tasks;
  const pending = displayTasks.filter(t => !t.done);
  const done = displayTasks.filter(t => t.done);

  return (
    <div className="p-4 md:p-7 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
          <Bell size={18} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>タスク・アラート</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>未完了 {pending.length}件 / 完了 {done.length}件</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Tasks column */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>今週のタスク</h2>
            <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>
              <Plus size={13} /> タスクを追加
            </button>
          </div>

          {/* Add form */}
          {adding && (
            <div className="rounded-2xl p-4 mb-3" style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <div className="space-y-3">
                <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="タスク内容を入力..."
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onKeyDown={e => e.key === 'Enter' && addTask()} />
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1.5 flex-wrap">
                    {TAG_OPTIONS.map(t => (
                      <button key={t.label} onClick={() => setNewTag(t)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{ background: newTag.label === t.label ? t.bg : '#F9FAFB', color: newTag.label === t.label ? t.color : 'var(--text-muted)', border: `1px solid ${newTag.label === t.label ? t.color + '44' : 'var(--border)'}` }}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="ml-auto px-3 py-1.5 rounded-xl text-xs outline-none"
                    style={{ background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-xl text-xs hover:bg-gray-50" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>キャンセル</button>
                  <button onClick={addTask} className="px-4 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90" style={{ background: '#3b82f6', color: '#fff' }}>追加する</button>
                </div>
              </div>
            </div>
          )}

          {/* Pending tasks */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {pending.length === 0
              ? <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>未完了のタスクはありません 🎉</div>
              : pending.map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <button onClick={() => toggle(t.id)} className="shrink-0">
                    <Square size={16} style={{ color: 'var(--text-muted)' }} />
                  </button>
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>{t.text}</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium shrink-0" style={{ background: t.tagBg, color: t.tagColor }}>{t.tag}</span>
                  {t.date && <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{t.date}</span>}
                  <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-gray-50 shrink-0"><X size={12} style={{ color: 'var(--text-muted)' }} /></button>
                </div>
              ))
            }
          </div>

          {/* Done tasks */}
          {done.length > 0 && (
            <>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>完了済み（{done.length}件）</h3>
              <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                {done.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3 opacity-50 hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <button onClick={() => toggle(t.id)} className="shrink-0">
                      <CheckSquare size={16} style={{ color: '#10b981' }} />
                    </button>
                    <span className="flex-1 text-sm line-through" style={{ color: 'var(--text-muted)' }}>{t.text}</span>
                    <button onClick={() => remove(t.id)} className="p-1 rounded hover:bg-gray-50 shrink-0"><X size={12} style={{ color: 'var(--text-muted)' }} /></button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Alerts column */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>アラート・お知らせ</h2>
          <div className="space-y-2">
            {ALERTS.map((a, i) => (
              <div key={i} className="flex gap-2.5 p-3 rounded-xl" style={{ background: a.bg, border: `1px solid ${a.color}22` }}>
                <a.icon size={14} className="shrink-0 mt-0.5" style={{ color: a.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.sub}</p>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{a.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
