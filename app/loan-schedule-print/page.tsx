"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, X } from "lucide-react";
import { loadFromStorage } from "@/lib/storage";
import type { LoanSchedule, LoanDateKey } from "@/types";

// ─── 定数 ──────────────────────────────────────────────────────────────────────

const TIMELINE_STEPS: {
  key: LoanDateKey;
  label: string;
  icon: string;
  category: string;
}[] = [
  { key: "preLoanApplicationDate",  label: "事前審査申込",    icon: "①", category: "審査" },
  { key: "preLoanApprovalDate",     label: "事前審査承認",    icon: "②", category: "審査" },
  { key: "mainApplicationDate",     label: "本申込",          icon: "③", category: "審査" },
  { key: "mainApprovalDate",        label: "本申込承認",      icon: "④", category: "審査" },
  { key: "landContractDate",        label: "土地契約",        icon: "⑤", category: "契約" },
  { key: "landSettlementDate",      label: "土地決済",        icon: "⑥", category: "決済" },
  { key: "buildingContractDate",    label: "建物請負契約",    icon: "⑦", category: "契約" },
  { key: "constructionStartDate",   label: "着工",            icon: "⑧", category: "工事" },
  { key: "constructionPaymentDate", label: "着工金",          icon: "⑨", category: "決済" },
  { key: "raisedFrameDate",         label: "上棟",            icon: "⑩", category: "工事" },
  { key: "interimPaymentDate",      label: "中間金",          icon: "⑪", category: "決済" },
  { key: "loanContractDate",        label: "金消契約",        icon: "⑫", category: "融資" },
  { key: "loanExecutionDate",       label: "融資実行",        icon: "⑬", category: "融資" },
  { key: "deliveryDate",            label: "お引渡し",        icon: "⑭", category: "完了" },
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  審査: { bg: "#F0F4FF", border: "#C7D2FE", text: "#4338CA" },
  契約: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" },
  決済: { bg: "#FFF7ED", border: "#FDBA74", text: "#9A3412" },
  工事: { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
  融資: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  完了: { bg: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9" },
};

// 工程ごとのデフォルト必要書類
const DEFAULT_REQUIRED_DOCS: Partial<Record<LoanDateKey, string[]>> = {
  preLoanApplicationDate: [
    "源泉徴収票（直近2年分）",
    "住民票（発行3ヶ月以内）",
    "健康保険証（コピー）",
    "本人確認書類（運転免許証など）",
    "物件資料（パンフレット・図面等）",
  ],
  preLoanApprovalDate: [],
  mainApplicationDate: [
    "土地売買契約書（原本）",
    "工事請負契約書（原本）",
    "登記簿謄本（土地・建物）",
    "固定資産税評価証明書",
    "確定申告書3期分（自営業の場合）",
    "法人決算書3期分（法人代表の場合）",
  ],
  mainApprovalDate: [],
  landContractDate: [
    "印鑑証明書（3ヶ月以内）",
    "住民票（最新）",
    "実印",
  ],
  landSettlementDate: [
    "土地代金（振込 or 小切手）",
    "仲介手数料",
    "登記費用（司法書士費用）",
    "各種精算金",
  ],
  buildingContractDate: [
    "印鑑証明書",
    "実印",
    "請負契約書印紙代",
  ],
  constructionStartDate: [],
  constructionPaymentDate: [
    "着工金（工事請負金額の約30%）",
    "着工確認書",
  ],
  raisedFrameDate: [],
  interimPaymentDate: [
    "中間金（工事請負金額の約30%）",
    "中間検査済証（取得の場合）",
  ],
  loanContractDate: [
    "実印",
    "印鑑証明書（3ヶ月以内）",
    "通帳（融資実行口座）",
    "権利証（登記識別情報）",
    "収入印紙（金消契約書用）",
  ],
  loanExecutionDate: [
    "建物表題登記・保存登記完了証",
    "火災保険証券（証券番号）",
    "残代金振込先口座情報",
  ],
  deliveryDate: [
    "残代金（建物）",
    "最終金（工事請負金額の約40%）",
    "検査済証",
    "各種保証書・取扱説明書",
    "鍵の受取",
  ],
};

// ─── ユーティリティ ─────────────────────────────────────────────────────────────

function fmtDate(d: string | undefined): string {
  if (!d) return "—";
  const dt = new Date(d);
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function loadScheduleById(scheduleId: string): LoanSchedule | null {
  const all = loadFromStorage<LoanSchedule[]>("loan_navi_loan_schedules", []);
  return all.find(s => s.id === scheduleId) ?? null;
}

// ─── Print Content ──────────────────────────────────────────────────────────────

function PrintPage() {
  const params = useSearchParams();
  const scheduleId   = params.get("scheduleId") ?? "";
  const customerName = params.get("customerName") ?? "";
  const staffName    = params.get("staffName") ?? "";
  const bankName     = params.get("bankName") ?? "";

  const [schedule, setSchedule] = useState<LoanSchedule | null>(null);
  const [today] = useState(todayStr());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (scheduleId) setSchedule(loadScheduleById(scheduleId));
  }, [scheduleId]);

  const handleDownloadPdf = async () => {
    const el = document.getElementById("pdf-content");
    if (!el) return;
    setGenerating(true);
    try {
      // dynamic import — html2pdf.js は browser-only
      const html2pdf = (await import("html2pdf.js")).default;
      const filename = customerName
        ? `住宅ローンスケジュール_${customerName}.pdf`
        : "住宅ローンスケジュール.pdf";
      await html2pdf()
        .set({
          margin:       [12, 14, 12, 14],  // mm: top, right, bottom, left
          filename,
          image:        { type: "jpeg", quality: 0.97 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(el)
        .save();
    } finally {
      setGenerating(false);
    }
  };

  // タスクから追加書類を取得
  const getTaskDocs = (key: LoanDateKey): string[] => {
    if (!schedule) return [];
    const docs: string[] = [];
    schedule.tasks
      .filter(t => t.baseDateKey === key && t.requiredDocuments.length > 0)
      .forEach(t => docs.push(...t.requiredDocuments));
    return [...new Set(docs)];
  };

  // 表示ステップを絞り込む（設定された日程のある工程 + 必ず主要工程は含める）
  const ALWAYS_SHOW: LoanDateKey[] = [
    "preLoanApplicationDate", "mainApplicationDate",
    "landSettlementDate", "loanContractDate", "loanExecutionDate", "deliveryDate",
  ];
  const visibleSteps = TIMELINE_STEPS.filter(
    s => schedule?.dates[s.key] || ALWAYS_SHOW.includes(s.key)
  );

  const handlePrint = () => window.print();

  return (
    <>
      {/* 印刷しないコントロールバー */}
      <div className="no-print" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "#1F2937", color: "#fff",
      }}>
        {/* メインバー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>PDF プレビュー</span>
            {customerName && <span style={{ fontSize: 13, opacity: 0.6 }}>— {customerName}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleDownloadPdf} disabled={generating}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: generating ? "#64748B" : "#3B82F6", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer",
              }}>
              <Printer size={14} />
              {generating ? "生成中..." : "PDFをダウンロード"}
            </button>
            <button onClick={handlePrint}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.12)", color: "#fff",
                fontSize: 12, cursor: "pointer",
              }}>
              <Printer size={13} />ブラウザ印刷
            </button>
            <button onClick={() => window.close()}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 12px", borderRadius: 8, border: "none",
                background: "rgba(255,255,255,0.08)", color: "#CBD5E1",
                fontSize: 12, cursor: "pointer",
              }}>
              <X size={13} />閉じる
            </button>
          </div>
        </div>

        {/* 印刷設定ガイド（ブラウザ印刷用） */}
        <div style={{
          background: "#0F172A", padding: "8px 24px",
          display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
            ブラウザ印刷を使う場合の設定：
          </span>
          {[
            "余白 → なし",
            "ヘッダーとフッター → オフ",
            "背景のグラフィック → オン",
          ].map(tip => (
            <span key={tip} style={{
              fontSize: 11, color: "#E2E8F0",
              background: "rgba(255,255,255,0.07)",
              padding: "2px 10px", borderRadius: 4,
            }}>
              {tip}
            </span>
          ))}
          <span style={{ fontSize: 11, color: "#64748B", marginLeft: "auto" }}>
            ※ PDFダウンロードボタンを使うと設定不要です
          </span>
        </div>
      </div>

      {/* A4 印刷エリア */}
      <div className="print-page" style={{ paddingTop: "88px" }}>
        <div className="a4" id="pdf-content">

          {/* ── ヘッダー ── */}
          <div className="doc-header">
            <div className="doc-header-left">
              <div className="doc-title">住宅ローン・建築スケジュール</div>
              <div className="doc-subtitle">ご購入の流れと必要書類のご案内</div>
            </div>
            <div className="doc-header-right">
              <table className="meta-table">
                <tbody>
                  <tr>
                    <td className="meta-label">お客様名</td>
                    <td className="meta-value">{customerName || "　　　　　　　　"} 様</td>
                  </tr>
                  {bankName && (
                    <tr>
                      <td className="meta-label">金融機関</td>
                      <td className="meta-value">{bankName}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="meta-label">担当者</td>
                    <td className="meta-value">{staffName || "　　　　　　　　"}</td>
                  </tr>
                  <tr>
                    <td className="meta-label">作成日</td>
                    <td className="meta-value">{today}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 注意書き ── */}
          <div className="notice-box">
            ※ 日程は目安です。金融機関・住宅会社の状況により変更になる場合があります。不明点はお気軽にご相談ください。
          </div>

          {/* ── タイムライン ── */}
          <div className="timeline">
            {visibleSteps.map((step, idx) => {
              const date     = schedule?.dates[step.key];
              const catColor = CATEGORY_COLORS[step.category] ?? CATEGORY_COLORS["審査"];
              const defaultDocs = DEFAULT_REQUIRED_DOCS[step.key] ?? [];
              const taskDocs    = getTaskDocs(step.key);
              const allDocs     = [...new Set([...defaultDocs, ...taskDocs])];
              const isLast      = idx === visibleSteps.length - 1;

              // タスクの備考
              const taskNotes = schedule?.tasks
                .filter(t => t.baseDateKey === step.key && t.notes)
                .map(t => t.notes!)
                .filter(Boolean) ?? [];

              return (
                <div key={step.key} className="step-row">
                  {/* 左: ステップ番号 + 縦線 */}
                  <div className="step-left">
                    <div className="step-dot" style={{ background: catColor.bg, border: `2px solid ${catColor.border}`, color: catColor.text }}>
                      {step.icon}
                    </div>
                    {!isLast && <div className="step-line" />}
                  </div>

                  {/* 右: カード */}
                  <div className={`step-card ${!isLast ? "step-card-mb" : ""}`} style={{ borderLeft: `3px solid ${catColor.border}` }}>
                    <div className="step-card-header">
                      <div className="step-info">
                        <span className="step-category" style={{ background: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}>
                          {step.category}
                        </span>
                        <span className="step-label">{step.label}</span>
                      </div>
                      <div className={`step-date ${!date ? "step-date-unset" : ""}`}>
                        {date ? fmtDate(date) : "日程調整中"}
                      </div>
                    </div>

                    {/* 必要書類 */}
                    {allDocs.length > 0 && (
                      <div className="docs-section">
                        <div className="docs-title">■ 必要書類・準備物</div>
                        <ul className="docs-list">
                          {allDocs.map((doc, i) => (
                            <li key={i} className="doc-item">
                              <span className="doc-check">□</span>{doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 担当タスク */}
                    {schedule?.tasks.filter(t => t.baseDateKey === step.key).length! > 0 && (
                      <div className="tasks-section">
                        <div className="tasks-title">■ 対応タスク</div>
                        {schedule!.tasks
                          .filter(t => t.baseDateKey === step.key)
                          .map(t => (
                            <div key={t.id} className="task-row">
                              <span className="task-check">□</span>
                              <span className="task-name">{t.name}</span>
                              {t.dueDate && (
                                <span className="task-due">期限: {t.dueDate.replace(/-/g, "/")}</span>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* メモ */}
                    {taskNotes.length > 0 && (
                      <div className="note-section">
                        {taskNotes.map((n, i) => <p key={i} className="note-text">※ {n}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 支払いサマリー ── */}
          {schedule?.payments && Object.values(schedule.payments).some(v => v) && (
            <div className="payment-section">
              <div className="payment-title">お支払いスケジュール</div>
              <table className="payment-table">
                <tbody>
                  {schedule.payments.landSettlement ? (
                    <tr>
                      <td className="pay-label">土地決済</td>
                      <td className="pay-value">{schedule.payments.landSettlement.toLocaleString()}万円</td>
                    </tr>
                  ) : null}
                  {schedule.payments.constructionFee ? (
                    <tr>
                      <td className="pay-label">着工金</td>
                      <td className="pay-value">{schedule.payments.constructionFee.toLocaleString()}万円</td>
                    </tr>
                  ) : null}
                  {schedule.payments.interimFee ? (
                    <tr>
                      <td className="pay-label">中間金</td>
                      <td className="pay-value">{schedule.payments.interimFee.toLocaleString()}万円</td>
                    </tr>
                  ) : null}
                  {schedule.payments.finalFee ? (
                    <tr>
                      <td className="pay-label">最終金</td>
                      <td className="pay-value">{schedule.payments.finalFee.toLocaleString()}万円</td>
                    </tr>
                  ) : null}
                  {schedule.payments.bridgeLoan && (
                    <tr>
                      <td className="pay-label">つなぎ融資</td>
                      <td className="pay-value">あり</td>
                    </tr>
                  )}
                  {schedule.payments.splitExecution && (
                    <tr>
                      <td className="pay-label">分割実行</td>
                      <td className="pay-value">あり</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── フッター ── */}
          <div className="doc-footer">
            <div className="footer-line" />
            <div className="footer-text">
              <span>{staffName} 作成</span>
              <span>作成日: {today}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── スタイル ── */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #E5E7EB; font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; }

        .print-page { min-height: 100vh; display: flex; justify-content: center; padding: 24px; }
        .a4 {
          width: 210mm;
          min-height: 297mm;
          background: #fff;
          padding: 20mm 18mm 18mm;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          border-radius: 2px;
        }

        /* ヘッダー */
        .doc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .doc-title { font-size: 20px; font-weight: 700; color: #111827; letter-spacing: 0.02em; }
        .doc-subtitle { font-size: 11px; color: #6B7280; margin-top: 4px; }
        .meta-table { font-size: 11px; border-collapse: collapse; }
        .meta-label { color: #6B7280; padding: 2px 8px 2px 0; white-space: nowrap; }
        .meta-value { color: #111827; font-weight: 600; padding: 2px 0; }

        /* 注意書き */
        .notice-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 4px; padding: 8px 12px; font-size: 10px; color: #6B7280; margin-bottom: 20px; }

        /* タイムライン */
        .timeline { }
        .step-row { display: flex; gap: 0; }
        .step-left { display: flex; flex-direction: column; align-items: center; width: 36px; shrink: 0; }
        .step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
        .step-line { flex: 1; width: 2px; background: #E5E7EB; min-height: 12px; margin: 2px 0; }

        .step-card { flex: 1; margin-left: 12px; padding: 10px 14px; background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; }
        .step-card-mb { margin-bottom: 8px; }

        .step-card-header { display: flex; justify-content: space-between; align-items: center; }
        .step-info { display: flex; align-items: center; gap: 8px; }
        .step-category { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 99px; white-space: nowrap; }
        .step-label { font-size: 14px; font-weight: 700; color: #111827; }
        .step-date { font-size: 13px; font-weight: 600; color: #1D4ED8; white-space: nowrap; }
        .step-date-unset { color: #9CA3AF; font-weight: 400; font-style: italic; }

        /* 必要書類 */
        .docs-section { margin-top: 8px; padding-top: 8px; border-top: 1px dashed #E5E7EB; }
        .docs-title { font-size: 10px; font-weight: 600; color: #374151; margin-bottom: 5px; }
        .docs-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; }
        .doc-item { font-size: 10.5px; color: #374151; display: flex; align-items: flex-start; gap: 5px; }
        .doc-check { color: #9CA3AF; flex-shrink: 0; margin-top: 1px; }

        /* タスク */
        .tasks-section { margin-top: 7px; padding-top: 7px; border-top: 1px dashed #E5E7EB; }
        .tasks-title { font-size: 10px; font-weight: 600; color: #374151; margin-bottom: 4px; }
        .task-row { display: flex; align-items: center; gap: 6px; font-size: 10.5px; margin-bottom: 2px; }
        .task-check { color: #9CA3AF; flex-shrink: 0; }
        .task-name { color: #374151; flex: 1; }
        .task-due { color: #EF4444; white-space: nowrap; font-size: 10px; }

        /* メモ */
        .note-section { margin-top: 6px; padding-top: 6px; border-top: 1px dashed #FEF3C7; }
        .note-text { font-size: 10px; color: #92400E; margin: 0; background: #FFFBEB; padding: 3px 8px; border-radius: 3px; }

        /* 支払いサマリー */
        .payment-section { margin-top: 20px; padding: 12px 16px; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 6px; }
        .payment-title { font-size: 12px; font-weight: 700; color: #0C4A6E; margin-bottom: 8px; }
        .payment-table { border-collapse: collapse; width: 100%; }
        .pay-label { font-size: 11px; color: #374151; padding: 4px 16px 4px 0; }
        .pay-value { font-size: 12px; font-weight: 600; color: #0C4A6E; padding: 4px 0; }

        /* フッター */
        .doc-footer { margin-top: 24px; }
        .footer-line { border-top: 1px solid #E5E7EB; margin-bottom: 8px; }
        .footer-text { display: flex; justify-content: space-between; font-size: 10px; color: #9CA3AF; }

        /* 印刷スタイル */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white; margin: 0; }
          .no-print { display: none !important; }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            padding: 12mm 14mm;
            margin: 0;
            background: white;
            box-sizing: border-box;
          }
          .a4 {
            width: 100%;
            min-height: 0;
            box-shadow: none;
            padding: 0;
            border-radius: 0;
          }
          .step-card { break-inside: avoid; }
          .payment-section { break-inside: avoid; }
        }
      `}</style>
    </>
  );
}

// ─── Page wrapper (Suspense for useSearchParams) ────────────────────────────────

export default function LoanSchedulePrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#6B7280" }}>
        PDF を準備しています...
      </div>
    }>
      <PrintPage />
    </Suspense>
  );
}
