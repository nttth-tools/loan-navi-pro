"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useBanks } from "@/hooks/useBanks";
import { FIXED_PERIOD_LABELS } from "@/types";
import type { FixedPeriodType } from "@/types";

type RateTab = 'variable' | 'fixed';

export default function RatesPage() {
  const [tab, setTab] = useState<RateTab>('variable');
  const { banks } = useBanks();
  const sorted = [...banks]
    .filter(b => b.productType === tab)
    .sort((a, b) => a.rate - b.rate);
  const rankColors = ['#f59e0b', '#94a3b8', '#cd7c2e'];
  const rankBg = ['#FEF3C7', 'rgba(148,163,184,0.12)', 'rgba(205,124,46,0.12)'];

  return (
    <div className="p-4 md:p-7 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#D1FAE5' }}>
          <TrendingUp size={18} style={{ color: '#10b981' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>金利ランキング</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>登録銀行の最新金利一覧</p>
        </div>
      </div>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab('variable')} className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: tab === 'variable' ? '#BFDBFE' : 'var(--bg-card)', color: tab === 'variable' ? '#2563EB' : 'var(--text-secondary)', border: `1px solid ${tab === 'variable' ? 'rgba(59,130,246,0.3)' : 'var(--border)'}` }}>
          📈 変動金利
        </button>
        <button onClick={() => setTab('fixed')} className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: tab === 'fixed' ? '#EDE9FE' : 'var(--bg-card)', color: tab === 'fixed' ? '#7C3AED' : 'var(--text-secondary)', border: `1px solid ${tab === 'fixed' ? 'rgba(124,58,237,0.3)' : 'var(--border)'}` }}>
          🏦 固定金利
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['順位', '銀行名', '商品名', tab === 'variable' ? '変動金利' : '固定金利', ...(tab === 'fixed' ? ['固定タイプ'] : []), '団信', '事務手数料', '保証料'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((b, i) => {
              const rank = i + 1;
              return (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td className="px-4 py-3">
                    {rank <= 3
                      ? <span className="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold" style={{ background: rankBg[rank - 1], color: rankColors[rank - 1] }}>{rank}</span>
                      : <span className="text-xs pl-1" style={{ color: 'var(--text-muted)' }}>{rank}</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{b.name}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{b.productName}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-sm" style={{ color: tab === 'variable' ? '#3b82f6' : '#7c3aed' }}>{b.rate.toFixed(3)}%</span>
                  </td>
                  {tab === 'fixed' && (
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                        {b.fixedPeriod ? FIXED_PERIOD_LABELS[b.fixedPeriod as FixedPeriodType] : '固定'}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 text-xs" style={{ color: '#10b981' }}>{b.danshin}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{b.feeYen.toLocaleString()}円</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{b.guarantee}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>※ 表示金利は参考値です。最新情報は各銀行にご確認ください。</p>
        </div>
      </div>
    </div>
  );
}
