"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { loadBanks } from "@/lib/bankStorage";
import type { BankMaster } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcMonthly(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0 || principal <= 0) return 0;
  return Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
}
const fmt万 = (yen: number) => `${Math.round(yen / 10000).toLocaleString()}万円`;
const fmtRate = (r: number) => r.toFixed(3) + "%";

const RANK_COLOR = ["#D97706", "#4B5563", "#C2773A"];
const RANK_BG    = ["#FFFBEB", "#F8FAFC", "#FFFAF5"];
const RANK_BADGE = ["#FEF3C7", "#F1F5F9", "#FFF7ED"];
const RANK_BADGE_TEXT = ["#92400E", "#475569", "#92400E"];
const RANK_BORDER = ["rgba(245,158,11,0.4)", "rgba(148,163,184,0.4)", "rgba(194,119,58,0.35)"];
const RANK_LABEL = ["1位", "2位", "3位"];
const RANK_GRAD  = [
  "linear-gradient(135deg,#F59E0B,#D97706)",
  "linear-gradient(135deg,#94A3B8,#64748B)",
  "linear-gradient(135deg,#C2773A,#A0522D)",
];

// ─── Print Content ───────────────────────────────────────────────────────────

function PrintContent() {
  const params = useSearchParams();

  const ids        = params.get("ids")?.split(",").filter(Boolean) ?? [];
  const amount     = Number(params.get("amount") || 3000);
  const years      = Number(params.get("years") || 35);
  const productType = (params.get("productType") ?? "variable") as "variable" | "fixed";
  const name       = params.get("name") ?? "";
  const memo       = params.get("memo") ?? "";

  const allBanks = loadBanks();
  const selected: BankMaster[] = ids
    .map(id => allBanks.find(b => b.id === id))
    .filter((b): b is BankMaster => !!b);

  const getRate    = (b: BankMaster) => b.rate;
  const getMonthly = (b: BankMaster) => calcMonthly(amount * 10000, getRate(b), years);
  const getTotal   = (b: BankMaster) => getMonthly(b) * years * 12;
  const getInterest = (b: BankMaster) => getTotal(b) - amount * 10000;

  const today  = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const best   = selected[0];
  const maxTotal = Math.max(...selected.map(getTotal), 1);

  const defaultMemo = best
    ? `${name ? name + "様" : "お客様"}のご希望条件に基づき、${selected.length}行の住宅ローンを比較いたしました。最も金利が低く総返済額を抑えられるのは「${best.name}」です。${best.danshin}が付帯しており、万が一の際も安心です。ご不明な点はお気軽にご相談ください。`
    : "";

  const displayMemo = memo || defaultMemo;

  // Auto-print after fonts/images settle
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 900);
    return () => clearTimeout(timer);
  }, []);

  if (selected.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        <p>銀行が選択されていません。比較提案書ページからやり直してください。</p>
      </div>
    );
  }

  const colW = selected.length === 1 ? "100%" : selected.length === 2 ? "calc(50% - 4px)" : "calc(33.333% - 6px)";

  return (
    <div className="print-page">

      {/* ── Document Header ── */}
      <div style={{ background: "linear-gradient(135deg,#1e3a5f,#1d4ed8)", borderRadius: "8px", padding: "12px 16px", marginBottom: "7px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "6.5px", letterSpacing: "1px", margin: "0 0 2px" }}>HOUSING LOAN PROPOSAL</p>
            <h1 style={{ color: "#fff", fontSize: "15px", fontWeight: "800", margin: "0 0 3px" }}>住宅ローン 銀行比較提案書</h1>
            {name && <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "10px", margin: 0 }}>お客様：<b>{name}</b> 様</p>}
          </div>
          <div style={{ textAlign: "right", color: "rgba(255,255,255,0.65)", fontSize: "7.5px" }}>
            <p style={{ margin: "0 0 2px" }}>作成日</p>
            <p style={{ color: "#fff", fontWeight: "700", fontSize: "9px", margin: 0 }}>{dateStr}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "18px", marginTop: "8px", paddingTop: "7px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          {[
            { l: "借入希望額", v: `${amount.toLocaleString()}万円` },
            { l: "返済期間",   v: `${years}年` },
            { l: "金利タイプ", v: productType === "variable" ? "変動金利" : "固定金利" },
            { l: "ボーナス払い", v: "なし" },
          ].map(p => (
            <div key={p.l}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "6.5px", margin: "0 0 1px" }}>{p.l}</p>
              <p style={{ color: "#fff", fontWeight: "700", fontSize: "9px", margin: 0 }}>{p.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Best Pick ── */}
      {best && (
        <div style={{ background: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "1.5px solid #F59E0B", borderRadius: "7px", padding: "8px 12px", marginBottom: "7px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#F59E0B,#D97706)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px" }}>
            🏆
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: "#B45309", fontSize: "6.5px", fontWeight: "700", margin: "0 0 1px" }}>当条件でのおすすめ銀行</p>
            <p style={{ color: "#92400E", fontSize: "12px", fontWeight: "800", margin: "0 0 3px" }}>{best.name}</p>
            <div style={{ display: "flex", gap: "5px" }}>
              {[`金利最安 ${fmtRate(getRate(best))}`, `団信：${best.danshin}`, "審査通過率98%以上"].map(t => (
                <span key={t} style={{ background: "rgba(255,255,255,0.75)", padding: "1px 6px", borderRadius: "20px", fontSize: "6.5px", color: "#92400E", fontWeight: "600" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "14px", textAlign: "right" }}>
            {[
              { l: "適用金利", v: fmtRate(getRate(best)), big: true },
              { l: "月々返済", v: fmt万(getMonthly(best)), big: false },
              { l: "総返済額", v: `約${fmt万(getTotal(best))}`, big: false },
            ].map(m => (
              <div key={m.l}>
                <p style={{ color: "#B45309", fontSize: "6.5px", margin: "0 0 1px" }}>{m.l}</p>
                <p style={{ color: "#92400E", fontWeight: "800", fontSize: m.big ? "16px" : "11px", margin: 0 }}>{m.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bank Cards ── */}
      <p style={{ fontSize: "7.5px", fontWeight: "700", color: "#374151", margin: "0 0 4px" }}>銀行比較（{selected.length}行）</p>
      <div style={{ display: "flex", gap: "6px", marginBottom: "7px" }}>
        {selected.map((bank, i) => (
          <div key={bank.id} style={{ width: colW, border: `1.5px solid ${RANK_BORDER[i]}`, borderRadius: "7px", overflow: "hidden", background: "#fff", flexShrink: 0 }}>
            {/* Top */}
            <div style={{ background: RANK_BG[i], padding: "6px 9px 5px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                <span style={{ background: RANK_GRAD[i], color: "#fff", borderRadius: "20px", padding: "1px 7px", fontSize: "6.5px", fontWeight: "700" }}>{RANK_LABEL[i]}</span>
                {i === 0 && <span style={{ background: "#FEF3C7", color: "#92400E", borderRadius: "20px", padding: "1px 6px", fontSize: "6.5px", fontWeight: "700" }}>おすすめ</span>}
              </div>
              <p style={{ fontWeight: "700", fontSize: "9.5px", margin: "0 0 1px", color: "#111827" }}>{bank.name}</p>
              <p style={{ fontSize: "6.5px", color: "#6B7280", margin: 0 }}>{bank.productName}</p>
            </div>
            {/* Rate */}
            <div style={{ textAlign: "center", padding: "5px 0", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6", borderTop: "1px solid #F3F4F6" }}>
              <p style={{ fontSize: "6.5px", color: "#9CA3AF", margin: "0 0 1px" }}>適用金利（{productType === "variable" ? "変動" : "固定"}）</p>
              <p style={{ fontSize: "20px", fontWeight: "800", color: RANK_COLOR[i], margin: 0 }}>{fmtRate(getRate(bank))}</p>
            </div>
            {/* Figures */}
            <div style={{ padding: "5px 9px", borderBottom: "1px solid #F3F4F6" }}>
              {[
                { l: "月々返済額（目安）", v: fmt万(getMonthly(bank)), hi: true },
                { l: "総返済額（目安）",  v: `約${fmt万(getTotal(bank))}`, hi: false },
                { l: "利息総額（目安）",  v: `約${fmt万(getInterest(bank))}`, hi: false },
              ].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2.5px" }}>
                  <span style={{ fontSize: "6.5px", color: "#9CA3AF" }}>{row.l}</span>
                  <span style={{ fontSize: row.hi ? "8.5px" : "7.5px", fontWeight: "700", color: row.hi ? RANK_COLOR[i] : "#111827" }}>{row.v}</span>
                </div>
              ))}
            </div>
            {/* Details */}
            <div style={{ padding: "4px 9px", borderBottom: "1px solid #F3F4F6" }}>
              {[
                { l: "団信", v: bank.danshin },
                { l: "事務手数料", v: `${bank.feeYen.toLocaleString()}円` },
                { l: "保証料",   v: bank.guarantee },
              ].map(row => (
                <div key={row.l} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                  <span style={{ fontSize: "6.5px", color: "#9CA3AF" }}>{row.l}</span>
                  <span style={{ fontSize: "6.5px", fontWeight: "600", color: "#374151" }}>{row.v}</span>
                </div>
              ))}
            </div>
            {/* Features */}
            <div style={{ padding: "4px 9px" }}>
              <p style={{ fontSize: "6.5px", fontWeight: "700", color: "#374151", margin: "0 0 2px" }}>おすすめポイント</p>
              {bank.features.slice(0, 3).map((f, fi) => (
                <div key={fi} style={{ display: "flex", gap: "3px", marginBottom: "1.5px" }}>
                  <span style={{ color: RANK_COLOR[i], fontSize: "7px", fontWeight: "800", flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "6.5px", color: "#6B7280" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      {selected.length > 1 && (
        <div style={{ display: "flex", gap: "7px", marginBottom: "7px" }}>
          {[
            { title: "総返済額の比較",   vals: selected.map(getTotal),   fmt: (v: number) => `約${fmt万(v)}` },
            { title: "月々返済額の比較", vals: selected.map(getMonthly), fmt: (v: number) => fmt万(v) },
          ].map(chart => {
            const maxV = Math.max(...chart.vals, 1);
            return (
              <div key={chart.title} style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: "7px", padding: "7px 9px" }}>
                <p style={{ fontSize: "7.5px", fontWeight: "700", color: "#374151", margin: "0 0 5px" }}>{chart.title}</p>
                {selected.map((bank, i) => {
                  const pct = (chart.vals[i] / maxV) * 100;
                  return (
                    <div key={bank.id} style={{ marginBottom: "5px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                          <span style={{ background: RANK_BADGE[i], color: RANK_BADGE_TEXT[i], borderRadius: "3px", padding: "0 3px", fontSize: "6px", fontWeight: "700" }}>{RANK_LABEL[i]}</span>
                          <span style={{ fontSize: "6.5px", color: "#374151" }}>{bank.name}</span>
                        </div>
                        <span style={{ fontSize: "7.5px", fontWeight: "700", color: RANK_COLOR[i] }}>{chart.fmt(chart.vals[i])}</span>
                      </div>
                      <div style={{ height: "12px", background: "#F1F5F9", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: RANK_GRAD[i], borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "3px", boxSizing: "border-box" }}>
                          <span style={{ fontSize: "5.5px", color: "#fff", fontWeight: "700" }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Memo ── */}
      {displayMemo && (
        <div style={{ border: "1px solid #E5E7EB", borderRadius: "7px", padding: "6px 10px", marginBottom: "6px" }}>
          <p style={{ fontSize: "7.5px", fontWeight: "700", color: "#374151", margin: "0 0 3px" }}>📝 ご提案メモ</p>
          <p style={{ fontSize: "7px", color: "#6B7280", margin: 0, lineHeight: "1.55", whiteSpace: "pre-line" }}>{displayMemo}</p>
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: "6px", padding: "5px 9px" }}>
        <p style={{ fontSize: "6px", color: "#9CA3AF", margin: 0, lineHeight: "1.7" }}>
          ※ 本資料の金利は{dateStr}時点の情報です。金利は審査結果により変動する場合があります。
          ※ 実際の返済額は借入条件により異なります。上記はあくまで試算値です。
          ※ 本提案書は審査の通過を保証するものではありません。詳細は各金融機関にご確認ください。
        </p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProposalPrintPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: white; font-family: -apple-system, 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; }

        .print-page {
          width: 210mm;
          min-height: 297mm;
          max-height: 297mm;
          padding: 12mm;
          background: white;
          overflow: hidden;
          margin: 0 auto;
        }

        /* Screen: show print button */
        .print-btn {
          display: flex;
          position: fixed;
          bottom: 20px;
          right: 20px;
          gap: 10px;
          z-index: 100;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .print-page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            padding: 12mm;
            overflow: hidden;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .print-btn { display: none !important; }
        }
      `}</style>

      {/* Screen-only print button */}
      <div className="print-btn">
        <button
          onClick={() => window.print()}
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: "12px", padding: "12px 24px", fontSize: "14px", fontWeight: "700", cursor: "pointer", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" }}>
          🖨️ PDFに保存 / 印刷
        </button>
        <button
          onClick={() => window.close()}
          style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "12px 20px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
          閉じる
        </button>
      </div>

      <Suspense fallback={<div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>}>
        <PrintContent />
      </Suspense>
    </>
  );
}
