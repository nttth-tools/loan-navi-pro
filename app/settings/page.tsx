"use client";

import { Settings, User, Bell, Database, Shield, ChevronRight } from "lucide-react";
import { useState } from "react";

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="relative w-10 h-5 rounded-full transition-colors shrink-0"
      style={{ background: value ? '#3b82f6' : 'rgba(0,0,0,0.06)' }}>
      <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm"
        style={{ left: value ? '22px' : '2px' }} />
    </button>
  );
}

function Card({ icon: Icon, iconColor, iconBg, title, children }: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  iconColor: string; iconBg: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 mb-5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [notifs, setNotifs] = useState({ rateUpdate: true, screeningDeadline: true, customerFollow: true, bankConfirm: false });
  const [cleared, setCleared] = useState(false);

  const handleClear = () => {
    if (confirm('LocalStorageのデータをすべてリセットしますか？\n（顧客・事前審査・タスクのデータが削除されます）')) {
      localStorage.clear();
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    }
  };

  const iStyle = { background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-primary)' } as const;
  const cls = "w-full px-3 py-2.5 rounded-xl text-sm outline-none";

  return (
    <div className="p-4 md:p-7 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F1F5F9' }}>
          <Settings size={18} style={{ color: '#94a3b8' }} />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>設定</h1>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <Card icon={User} iconColor="#3b82f6" iconBg="#DBEAFE" title="プロフィール">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: '氏名', value: '山田 太郎', placeholder: '山田 太郎' },
              { label: '役職・担当', value: '営業担当', placeholder: '営業担当' },
              { label: '会社名', value: '株式会社〇〇ハウス', placeholder: '株式会社〇〇' },
              { label: 'メールアドレス', value: 'yamada@example.com', placeholder: 'example@email.com' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                <input defaultValue={f.value} placeholder={f.placeholder} className={cls} style={iStyle} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button className="px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff' }}>
              変更を保存
            </button>
          </div>
        </Card>

        {/* Notifications */}
        <Card icon={Bell} iconColor="#f59e0b" iconBg="#FEF3C7" title="通知設定">
          <div className="space-y-4">
            {[
              { key: 'rateUpdate' as const, label: '金利更新アラート', desc: '銀行の金利が更新された際に通知します' },
              { key: 'screeningDeadline' as const, label: '審査期限アラート', desc: '事前審査の回答期限が近づいた際に通知します' },
              { key: 'customerFollow' as const, label: '顧客フォローリマインダー', desc: '顧客への連絡が必要な際にリマインドします' },
              { key: 'bankConfirm' as const, label: '銀行情報確認アラート', desc: '最終確認から30日以上経過した銀行情報を通知します' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between gap-4 py-1">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
                <Toggle value={notifs[item.key]} onChange={v => setNotifs(n => ({ ...n, [item.key]: v }))} />
              </div>
            ))}
          </div>
        </Card>

        {/* Data management */}
        <Card icon={Database} iconColor="#10b981" iconBg="#D1FAE5" title="データ管理">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>データのエクスポート</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>顧客・審査データをJSONファイルとしてダウンロード</p>
              </div>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  const data = { customers: localStorage.getItem('loan_navi_customers'), screening: localStorage.getItem('loan_navi_screening'), tasks: localStorage.getItem('loan_navi_tasks') };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'loan_navi_export.json'; a.click();
                }}>
                エクスポート <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>データをリセット</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>LocalStorageの全データを削除します（元に戻せません）</p>
              </div>
              <button onClick={handleClear} className="px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                {cleared ? '✓ リセット完了' : 'リセット'}
              </button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card icon={Shield} iconColor="#8b5cf6" iconBg="#EDE9FE" title="このアプリについて">
          <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: 'var(--text-muted)' }}>アプリ名</span><span>Loan Navi Pro</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: 'var(--text-muted)' }}>バージョン</span><span>1.0.0 (MVP)</span>
            </div>
            <div className="flex justify-between py-1" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: 'var(--text-muted)' }}>データ保存</span><span>LocalStorage（ブラウザ内）</span>
            </div>
            <div className="flex justify-between py-1">
              <span style={{ color: 'var(--text-muted)' }}>対応金融機関</span><span>10行</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
