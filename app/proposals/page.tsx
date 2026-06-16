"use client";

import { useState } from "react";
import { FileText, ExternalLink, Check, X, ChevronDown, TrendingDown, Shield, Star, Trophy, Medal, Award } from "lucide-react";
import { useBanks } from "@/hooks/useBanks";
import type { BankMaster } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcMonthly(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0 || principal <= 0) return 0;
  return Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
}
function fmt万(yen: number) { return `${Math.round(yen / 10000).toLocaleString()}万円`; }
function fmtRate(r: number) { return r.toFixed(3) + "%"; }

interface SimParams {
  amount: number; years: number;
  productType: "variable" | "fixed";
  customerName: string; bonus: string;
}

const RANK = [
  { bg: "linear-gradient(135deg,#F59E0B,#D97706)", text: "#fff", badge: "#FEF3C7", badgeText: "#92400E", border: "rgba(245,158,11,0.3)", label: "1位", cardTop: "#FFFBEB", rate: "#D97706" },
  { bg: "linear-gradient(135deg,#94A3B8,#64748B)", text: "#fff", badge: "#F1F5F9", badgeText: "#475569", border: "rgba(148,163,184,0.4)", label: "2位", cardTop: "#F8FAFC", rate: "#4B5563" },
  { bg: "linear-gradient(135deg,#C2773A,#A0522D)", text: "#fff", badge: "#FFF7ED", badgeText: "#92400E", border: "rgba(194,119,58,0.3)", label: "3位", cardTop: "#FFFAF5", rate: "#C2773A" },
];

function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) return <Trophy size={16} style={{ color: "#F59E0B" }} />;
  if (rank === 1) return <Medal size={16} style={{ color: "#94A3B8" }} />;
  return <Award size={16} style={{ color: "#C2773A" }} />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const { banks } = useBanks();
  const [selected, setSelected] = useState<BankMaster[]>([]);
  const [sim, setSim] = useState<SimParams>({ amount: 3000, years: 35, productType: "variable", customerName: "", bonus: "なし" });
  const [bankSearch, setBankSearch] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const [memo, setMemo] = useState("");
  const [memoEditing, setMemoEditing] = useState(false);
  const toggleBank = (bank: BankMaster) => {
    if (selected.find((b) => b.id === bank.id)) setSelected(selected.filter((b) => b.id !== bank.id));
    else if (selected.length < 3) setSelected([...selected, bank]);
  };
  const filteredBanks = banks.filter((b) =>
    b.productType === sim.productType &&
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );
  const getRate = (bank: BankMaster) => bank.rate;
  const getMonthly = (bank: BankMaster) => calcMonthly(sim.amount * 10000, getRate(bank), sim.years);
  const getTotal = (bank: BankMaster) => getMonthly(bank) * sim.years * 12;
  const getInterest = (bank: BankMaster) => getTotal(bank) - sim.amount * 10000;

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  const best = selected[0];
  const defaultMemo = best
    ? `${sim.customerName ? sim.customerName + "様" : "お客様"}のご希望条件に基づき、${selected.length}行の住宅ローンを比較いたしました。\n\n最も金利が低く、総返済額を抑えられるのは「${best.name}」です。\n${best.danshin}が付帯しており、万が一の際も安心です。\n\nご不明な点はいつでもお気軽にご相談ください。`
    : "";

  const openPrintPage = () => {
    if (selected.length === 0) return;
    const p = new URLSearchParams({
      ids: selected.map(b => b.id).join(","),
      amount: String(sim.amount),
      years: String(sim.years),
      productType: sim.productType,
      name: sim.customerName,
      memo: memo || "",
    });
    window.open(`/proposal-print?${p.toString()}`, "_blank");
  };

  const maxTotal = selected.length ? Math.max(...selected.map(getTotal)) : 1;

  return (
    <>
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>

        {/* ── Settings bar (sticky) ── */}
        <div className="no-print sticky top-0 z-20 border-b" style={{ background: "#fff", borderColor: "var(--border)" }}>
          <div className="max-w-7xl mx-auto px-4 md:px-7 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">

              {/* Title */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#D1FAE5" }}>
                  <FileText size={17} style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h1 className="text-base font-bold leading-tight" style={{ color: "var(--text-primary)" }}>比較提案書</h1>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>最大3銀行を選択</p>
                </div>
              </div>

              {/* Params */}
              <div className="flex flex-wrap items-end gap-3 flex-1">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>お客様名</label>
                  <input value={sim.customerName} onChange={(e) => setSim({ ...sim, customerName: e.target.value })}
                    placeholder="山田 太郎"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "#F9FAFB", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>借入額（万円）</label>
                  <input type="number" value={sim.amount} onChange={(e) => setSim({ ...sim, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "#F9FAFB", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>返済期間（年）</label>
                  <input type="number" value={sim.years} onChange={(e) => setSim({ ...sim, years: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: "#F9FAFB", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>金利タイプ</label>
                  <div className="flex gap-1">
                    <button onClick={() => { setSim({ ...sim, productType: "variable" }); setSelected([]); }}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: sim.productType === "variable" ? "#DBEAFE" : "#F9FAFB",
                        color: sim.productType === "variable" ? "#2563EB" : "var(--text-muted)",
                        border: `1px solid ${sim.productType === "variable" ? "rgba(59,130,246,0.4)" : "var(--border)"}`,
                      }}>
                      変動
                    </button>
                    <button onClick={() => { setSim({ ...sim, productType: "fixed" }); setSelected([]); }}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: sim.productType === "fixed" ? "#EDE9FE" : "#F9FAFB",
                        color: sim.productType === "fixed" ? "#7C3AED" : "var(--text-muted)",
                        border: `1px solid ${sim.productType === "fixed" ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
                      }}>
                      固定
                    </button>
                  </div>
                </div>

                {/* Bank selector */}
                <div className="w-48">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>銀行選択（最大3行）</label>
                  <div className="relative">
                    <button onClick={() => setDropOpen(!dropOpen)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-sm"
                      style={{ background: "#F9FAFB", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <span className="text-xs">{selected.length === 0 ? "銀行を選択..." : `${selected.length}行選択中`}</span>
                      <ChevronDown size={13} className={`transition-transform ${dropOpen ? "rotate-180" : ""}`} />
                    </button>
                    {dropOpen && (
                      <div className="absolute top-full right-0 mt-1 w-60 rounded-xl overflow-hidden z-30"
                        style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}>
                        <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
                          <input value={bankSearch} onChange={(e) => setBankSearch(e.target.value)}
                            placeholder="銀行名で検索..."
                            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: "#F9FAFB", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredBanks.map((b) => {
                            const isSel = !!selected.find((s) => s.id === b.id);
                            const disabled = !isSel && selected.length >= 3;
                            return (
                              <button key={b.id} onClick={() => !disabled && toggleBank(b)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50"
                                style={{ color: disabled ? "var(--text-muted)" : "var(--text-primary)", cursor: disabled ? "not-allowed" : "pointer" }}>
                                <span className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                                  style={{ background: isSel ? "#3b82f6" : "#F1F5F9", border: `1px solid ${isSel ? "#3b82f6" : "var(--border)"}` }}>
                                  {isSel && <Check size={10} color="#fff" />}
                                </span>
                                <span className="flex-1">{b.name}</span>
                                <span style={{ color: sim.productType === "variable" ? "#3b82f6" : "#7c3aed" }}>{b.rate.toFixed(3)}%</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {selected.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {selected.map((b, i) => (
                        <span key={b.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ background: ["#FEF3C7", "#F1F5F9", "#FFF7ED"][i], color: ["#92400E", "#475569", "#92400E"][i] }}>
                          {b.name.replace("銀行", "").slice(0, 5)}
                          <button onClick={() => toggleBank(b)}><X size={9} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PDF button */}
              <button
                onClick={openPrintPage}
                disabled={selected.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0"
                style={{
                  background: selected.length > 0 ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "#F3F4F6",
                  color: selected.length > 0 ? "#fff" : "var(--text-muted)",
                  cursor: selected.length > 0 ? "pointer" : "not-allowed",
                  boxShadow: selected.length > 0 ? "0 4px 12px rgba(59,130,246,0.35)" : "none",
                }}>
                <ExternalLink size={15} />
                PDF用ページを開く
              </button>
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {selected.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5" style={{ background: "#F1F5F9" }}>
              <FileText size={36} style={{ color: "#CBD5E1" }} />
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>銀行を選択してください</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>最大3行を選択すると、お客様向け提案書が自動生成されます</p>
          </div>
        )}

        {/* ── Screen Preview ── */}
        {selected.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 md:px-7 py-6 md:py-8">

            {/* Header */}
            <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 50%,#2563eb 100%)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold mb-2 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Housing Loan Proposal</p>
                  <h2 className="text-xl md:text-3xl font-bold text-white mb-1">住宅ローン 銀行比較提案書</h2>
                  {sim.customerName && <p className="text-base md:text-lg font-medium mt-2" style={{ color: "rgba(255,255,255,0.9)" }}>お客様：<b className="text-white">{sim.customerName}</b> 様</p>}
                </div>
                <div className="text-right shrink-0" style={{ color: "rgba(255,255,255,0.8)" }}>
                  <p className="text-xs mb-1">作成日</p>
                  <p className="text-sm font-semibold text-white">{dateStr}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 md:gap-6 mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                {[
                  { label: "借入希望額", value: `${sim.amount.toLocaleString()}万円` },
                  { label: "返済期間", value: `${sim.years}年` },
                  { label: "金利タイプ", value: sim.productType === "variable" ? "変動金利" : "固定金利" },
                  { label: "ボーナス払い", value: sim.bonus },
                ].map((p) => (
                  <div key={p.label}>
                    <span className="block text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{p.label}</span>
                    <span className="text-sm md:text-base font-bold text-white">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Pick */}
            {best && (
              <div className="rounded-2xl p-5 md:p-6 mb-6" style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "2px solid #F59E0B", boxShadow: "0 8px 32px rgba(245,158,11,0.15)" }}>
                <div className="flex flex-wrap items-start gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", boxShadow: "0 4px 16px rgba(245,158,11,0.4)" }}>
                    <Trophy size={24} color="#fff" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: "#F59E0B", color: "#fff" }}>当条件でのおすすめ銀行</span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3" style={{ color: "#92400E" }}>{best.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: TrendingDown, text: `金利最安 ${fmtRate(getRate(best))}` },
                        { icon: Shield, text: `団信：${best.danshin}` },
                        { icon: Star, text: "審査通過率98%以上" },
                      ].map(item => (
                        <div key={item.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.7)" }}>
                          <item.icon size={12} style={{ color: "#D97706" }} />
                          <span className="text-xs font-medium" style={{ color: "#92400E" }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 md:gap-6 text-right">
                    {[
                      { label: "適用金利", val: fmtRate(getRate(best)), big: true },
                      { label: "月々返済", val: fmt万(getMonthly(best)), big: false },
                      { label: "総返済額", val: `約${fmt万(getTotal(best))}`, big: false },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="text-xs mb-1" style={{ color: "#B45309" }}>{m.label}</p>
                        <p className={`font-bold ${m.big ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`} style={{ color: "#92400E" }}>{m.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bank cards */}
            <div className="mb-2">
              <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>銀行比較<span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>({selected.length}行)</span></h2>
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(selected.length, 1)}, 1fr)` }}
                data-cols={selected.length}>
                <style>{`@media(min-width:640px){[data-cols="${selected.length}"]{grid-template-columns:repeat(${selected.length},1fr)!important}}`}</style>
                {selected.map((bank, i) => {
                  const rs = RANK[i];
                  const monthly = getMonthly(bank);
                  const total = getTotal(bank);
                  const interest = getInterest(bank);
                  return (
                    <div key={bank.id} className="rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1"
                      style={{ background: "#fff", border: `2px solid ${rs.border}`, boxShadow: i === 0 ? "0 8px 32px rgba(245,158,11,0.12)" : "0 2px 12px rgba(0,0,0,0.06)" }}>
                      <div className="px-5 pt-5 pb-4" style={{ background: rs.cardTop }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: rs.bg }}>
                            <RankIcon rank={i} />
                            <span className="text-sm font-bold" style={{ color: rs.text }}>{rs.label}</span>
                          </div>
                          {i === 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>おすすめ</span>}
                        </div>
                        <h3 className="text-lg font-bold leading-tight" style={{ color: "var(--text-primary)" }}>{bank.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{bank.productName}</p>
                      </div>
                      <div className="px-5 py-4 text-center" style={{ borderBottom: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>適用金利（{sim.productType === "variable" ? "変動" : "固定"}）</p>
                        <p className="text-4xl font-bold" style={{ color: rs.rate }}>{fmtRate(getRate(bank))}</p>
                      </div>
                      <div className="px-5 py-4 space-y-3 flex-1" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        {[
                          { label: "月々返済額（目安）", val: fmt万(monthly), highlight: true },
                          { label: "総返済額（目安）", val: `約${fmt万(total)}`, highlight: false },
                          { label: "利息総額（目安）", val: `約${fmt万(interest)}`, highlight: false },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                            <span className={`font-bold ${row.highlight ? "text-base" : "text-sm"}`} style={{ color: row.highlight ? rs.rate : "var(--text-primary)" }}>{row.val}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-4 space-y-2.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        {[{ l: "団信", v: bank.danshin }, { l: "事務手数料", v: `${bank.feeYen.toLocaleString()}円` }, { l: "保証料", v: bank.guarantee }].map(row => (
                          <div key={row.l} className="flex items-start justify-between gap-2">
                            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{row.l}</span>
                            <span className="text-xs text-right font-medium" style={{ color: "var(--text-primary)" }}>{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <p className="text-xs font-semibold mb-2.5" style={{ color: "var(--text-secondary)" }}>おすすめポイント</p>
                        <div className="space-y-1.5">
                          {bank.features.map((f, fi) => (
                            <div key={fi} className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: i === 0 ? "#FEF3C7" : i === 1 ? "#F1F5F9" : "#FFF7ED" }}>
                                <Check size={9} style={{ color: rs.rate }} strokeWidth={3} />
                              </span>
                              <span className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <button className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                          style={{ background: i === 0 ? "linear-gradient(135deg,#F59E0B,#D97706)" : "#F8FAFC", color: i === 0 ? "#fff" : rs.rate, border: i !== 0 ? `1.5px solid ${rs.border}` : "none", boxShadow: i === 0 ? "0 4px 16px rgba(245,158,11,0.35)" : "none" }}>
                          この銀行で進める →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Charts */}
            {selected.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6 mb-6">
                {[
                  { title: "総返済額の比較", getData: getTotal, fmt: (v: number) => `約${fmt万(v)}` },
                  { title: "月々返済額の比較", getData: getMonthly, fmt: (v: number) => fmt万(v) },
                ].map(chart => {
                  const values = selected.map(b => chart.getData(b));
                  const maxV = Math.max(...values) || 1;
                  const barColors = ["linear-gradient(90deg,#F59E0B,#D97706)", "linear-gradient(90deg,#94A3B8,#64748B)", "linear-gradient(90deg,#C2773A,#A0522D)"];
                  return (
                    <div key={chart.title} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{chart.title}</h3>
                      <div className="space-y-4">
                        {selected.map((bank, i) => {
                          const pct = (values[i] / maxV) * 100;
                          return (
                            <div key={bank.id}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: RANK[i].badge, color: RANK[i].badgeText }}>{RANK[i].label}</span>
                                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{bank.name}</span>
                                </div>
                                <span className="text-sm font-bold" style={{ color: RANK[i].rate }}>{chart.fmt(values[i])}</span>
                              </div>
                              <div className="h-7 rounded-lg overflow-hidden" style={{ background: "#F1F5F9" }}>
                                <div className="h-full rounded-lg flex items-center justify-end pr-3"
                                  style={{ width: `${pct}%`, background: barColors[i], transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }}>
                                  <span className="text-xs font-bold text-white">{pct.toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Memo */}
            <div className="rounded-2xl p-5 mb-6" style={{ background: "#fff", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}><span className="mr-2">📝</span>ご提案メモ</h3>
                <button onClick={() => setMemoEditing(!memoEditing)} className="text-xs px-3 py-1 rounded-lg transition-colors hover:bg-gray-100" style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  {memoEditing ? "完了" : "編集"}
                </button>
              </div>
              {memoEditing ? (
                <textarea value={memo || defaultMemo} onChange={(e) => setMemo(e.target.value)} rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
                  style={{ background: "#F9FAFB", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                  placeholder={defaultMemo} />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>{memo || defaultMemo}</p>
              )}
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl px-5 py-4" style={{ background: "#F8FAFC", border: "1px solid var(--border)" }}>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                ※ 本資料の金利は{dateStr}時点の情報です。金利は審査結果により変動する場合があります。<br />
                ※ 実際の返済額は借入条件により異なります。上記はあくまで試算値です。<br />
                ※ 本提案書は審査の通過を保証するものではありません。詳細は各金融機関にご確認ください。
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
