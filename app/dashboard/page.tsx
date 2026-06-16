import { Bell, Calendar, ChevronRight, AlertTriangle, Clock, TrendingUp, Users, FileCheck, Handshake, ArrowUpRight, Square, ExternalLink, RefreshCw, CheckSquare } from "lucide-react";

// ─── Mock data ──────────────────────────────────────────────

const kpis = [
  { label: "顧客数", value: "152", unit: "件", delta: "+12件 (+8.6%)", up: true, icon: Users, color: "#3b82f6", bg: "#DBEAFE" },
  { label: "事前審査申込中", value: "12", unit: "件", delta: "+3件 (+33.3%)", up: true, icon: FileCheck, color: "#10b981", bg: "#D1FAE5" },
  { label: "提案中", value: "23", unit: "件", delta: "+5件 (+27.8%)", up: true, icon: TrendingUp, color: "#f59e0b", bg: "#FEF3C7" },
  { label: "今月契約数", value: "8", unit: "件", delta: "+2件 (+33.3%)", up: true, icon: Handshake, color: "#8b5cf6", bg: "#EDE9FE" },
];

const variableRates = [
  { rank: 1, name: "住信SBIネット銀行", rate: "0.320%", danshin: "無料", fee: "55,000円", gold: true },
  { rank: 2, name: "auじぶん銀行", rate: "0.329%", danshin: "無料", fee: "55,000円", gold: false },
  { rank: 3, name: "PayPay銀行", rate: "0.380%", danshin: "無料", fee: "55,000円", gold: false },
  { rank: 4, name: "楽天銀行", rate: "0.390%", danshin: "無料", fee: "55,000円", gold: false },
  { rank: 5, name: "ソニー銀行", rate: "0.397%", danshin: "無料", fee: "44,000円", gold: false },
];

const fixedRates = [
  { rank: 1, name: "auじぶん銀行", rate: "1.150%", danshin: "無料", fee: "55,000円", gold: true },
  { rank: 2, name: "住信SBIネット銀行", rate: "1.190%", danshin: "無料", fee: "55,000円", gold: false },
  { rank: 3, name: "イオン銀行", rate: "1.290%", danshin: "無料", fee: "55,000円", gold: false },
  { rank: 4, name: "PayPay銀行", rate: "1.340%", danshin: "無料", fee: "55,000円", gold: false },
  { rank: 5, name: "みずほ銀行", rate: "1.350%", danshin: "無料", fee: "33,000円", gold: false },
];

const alerts = [
  { type: "error", icon: AlertTriangle, title: "最終確認日が30日以上前の銀行があります", sub: "7件の銀行が対象です", date: "2024/07/10" },
  { type: "warning", icon: Clock, title: "事前審査の回答期限が近い案件があります", sub: "3件の案件が対象です", date: "2024/07/10" },
  { type: "info", icon: RefreshCw, title: "金利が更新された銀行があります", sub: "住信SBIネット銀行、楽天銀行 など", date: "2024/07/09" },
  { type: "success", icon: CheckSquare, title: "事前審査が承認されました", sub: "田中 様（住信SBIネット銀行）", date: "2024/07/09" },
  { type: "success", icon: CheckSquare, title: "新しい銀行が追加されました", sub: "関西みらい銀行", date: "2024/07/08" },
];

const alertColors: Record<string, string> = {
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  success: "#10b981",
};
const alertBgs: Record<string, string> = {
  error: "#FEF2F2",
  warning: "#FFFBEB",
  info: "#EFF6FF",
  success: "#ECFDF5",
};

const recentCustomers = [
  { name: "田中 健一 様", age: 35, amount: "4,000万円", status: "事前審査中", statusColor: "#3b82f6", statusBg: "#DBEAFE", date: "2024/07/10" },
  { name: "佐藤 美咲 様", age: 32, amount: "3,500万円", status: "提案中", statusColor: "#f59e0b", statusBg: "#FEF3C7", date: "2024/07/10" },
  { name: "鈴木 大輔 様", age: 40, amount: "5,000万円", status: "前審査待ち", statusColor: "#f59e0b", statusBg: "#FEF3C7", date: "2024/07/09" },
  { name: "高橋 優子 様", age: 28, amount: "3,000万円", status: "情報収集中", statusColor: "#64748b", statusBg: "#F1F5F9", date: "2024/07/08" },
  { name: "伊藤 誠 様", age: 45, amount: "6,000万円", status: "契約准備中", statusColor: "#10b981", statusBg: "#D1FAE5", date: "2024/07/08" },
];

const tasks = [
  { name: "山田 様 書類提出フォロー", tag: "事前審査", tagColor: "#3b82f6", tagBg: "#DBEAFE", date: "7/10 (水) 10:00", done: false },
  { name: "佐藤 様 銀行比較提案書作成", tag: "提案", tagColor: "#f59e0b", tagBg: "#FEF3C7", date: "7/11 (木) 14:00", done: false },
  { name: "鈴木 様 追加資料依頼", tag: "事前審査", tagColor: "#3b82f6", tagBg: "#DBEAFE", date: "7/12 (金) 11:00", done: false },
  { name: "田中 様 本審査進捗確認", tag: "本審査", tagColor: "#8b5cf6", tagBg: "#EDE9FE", date: "7/12 (金) 15:00", done: false },
  { name: "高橋 様 面談", tag: "提案", tagColor: "#f59e0b", tagBg: "#FEF3C7", date: "7/13 (土) 10:00", done: false },
];

// ─── Sub-components ─────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 transition-shadow duration-200 hover:shadow-md ${className}`}
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
      {href && (
        <a href={href} className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: "var(--accent-blue)" }}>
          すべて見る <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

const rankColors = ["#f59e0b", "#94a3b8", "#cd7c2e"];

// ─── Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-7 max-w-[1440px]">

      {/* Top bar */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            おはようございます、山田 太郎さん！
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            本日も素晴らしいご提案で、理想のマイホームづくりをサポートしましょう！
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-xl transition-colors hover:bg-gray-50" style={{ border: "1px solid var(--border)" }}>
            <Bell size={16} style={{ color: "var(--text-secondary)" }} />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: "var(--accent-red)", color: "#fff", fontSize: "9px" }}>3</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <Calendar size={14} />
            <span>2024年7月10日（水）</span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: k.bg }}>
              <k.icon size={20} style={{ color: k.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs mb-1 truncate" style={{ color: "var(--text-muted)" }}>{k.label}</p>
              <p className="text-2xl font-bold leading-none mb-1.5" style={{ color: "var(--text-primary)" }}>
                {k.value}<span className="text-sm font-medium ml-1" style={{ color: "var(--text-secondary)" }}>{k.unit}</span>
              </p>
              <div className="flex items-center gap-1 text-xs" style={{ color: k.up ? "#10b981" : "#ef4444" }}>
                <ArrowUpRight size={12} />
                <span>前月比 {k.delta}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Middle row: rates + alerts */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_320px] gap-4 mb-4">

        {/* Variable rate */}
        <Card>
          <SectionHeader title="金利ランキング（変動金利）" href="/rates" />
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                <th className="pb-2 text-left font-medium w-8">順位</th>
                <th className="pb-2 text-left font-medium">銀行名</th>
                <th className="pb-2 text-right font-medium">変動金利</th>
                <th className="pb-2 text-right font-medium">団信</th>
                <th className="pb-2 text-right font-medium">事務手数料</th>
              </tr>
            </thead>
            <tbody>
              {variableRates.map((r) => (
                <tr key={r.rank} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td className="py-2.5 pr-2">
                    {r.rank <= 3 ? (
                      <span className="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs font-bold" style={{ background: rankColors[r.rank - 1] + "22", color: rankColors[r.rank - 1] }}>{r.rank}</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.rank}</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="font-medium text-xs" style={{ color: r.gold ? "#f59e0b" : "var(--text-primary)" }}>{r.name}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="font-bold text-xs" style={{ color: "#3b82f6" }}>{r.rate}</span>
                  </td>
                  <td className="py-2.5 text-right text-xs" style={{ color: "#10b981" }}>{r.danshin}</td>
                  <td className="py-2.5 text-right text-xs" style={{ color: "var(--text-secondary)" }}>{r.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>※ 2024年7月10日時点の情報です。</p>
          <button className="mt-3 w-full py-2 rounded-xl text-xs font-medium transition-colors hover:opacity-90" style={{ background: "#DBEAFE", color: "var(--accent-blue)", border: "1px solid #BFDBFE" }}>
            金利ランキングをもっと見る
          </button>
        </Card>

        {/* Fixed rate */}
        <Card>
          <SectionHeader title="金利ランキング（固定金利10年）" href="/rates" />
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                <th className="pb-2 text-left font-medium w-8">順位</th>
                <th className="pb-2 text-left font-medium">銀行名</th>
                <th className="pb-2 text-right font-medium">固定10年</th>
                <th className="pb-2 text-right font-medium">団信</th>
                <th className="pb-2 text-right font-medium">事務手数料</th>
              </tr>
            </thead>
            <tbody>
              {fixedRates.map((r) => (
                <tr key={r.rank} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td className="py-2.5 pr-2">
                    {r.rank <= 3 ? (
                      <span className="inline-flex w-5 h-5 rounded-full items-center justify-center text-xs font-bold" style={{ background: rankColors[r.rank - 1] + "22", color: rankColors[r.rank - 1] }}>{r.rank}</span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.rank}</span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="font-medium text-xs" style={{ color: r.gold ? "#f59e0b" : "var(--text-primary)" }}>{r.name}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="font-bold text-xs" style={{ color: "#8b5cf6" }}>{r.rate}</span>
                  </td>
                  <td className="py-2.5 text-right text-xs" style={{ color: "#10b981" }}>{r.danshin}</td>
                  <td className="py-2.5 text-right text-xs" style={{ color: "var(--text-secondary)" }}>{r.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs" style={{ color: "var(--text-muted)" }}>※ 2024年7月10日時点の情報です。</p>
          <button className="mt-3 w-full py-2 rounded-xl text-xs font-medium transition-colors hover:opacity-90" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", border: "1px solid rgba(139,92,246,0.2)" }}>
            固定金利ランキングをもっと見る
          </button>
        </Card>

        {/* Alerts */}
        <Card>
          <SectionHeader title="アラート・お知らせ" href="/tasks" />
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="flex gap-2.5 p-2.5 rounded-xl" style={{ background: alertBgs[a.type] }}>
                <a.icon size={14} className="shrink-0 mt-0.5" style={{ color: alertColors[a.type] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{a.sub}</p>
                </div>
                <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>{a.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">

        {/* Recent customers */}
        <Card>
          <SectionHeader title="最近の顧客一覧" href="/customers" />
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
                <th className="pb-2 text-left font-medium">顧客名</th>
                <th className="pb-2 text-right font-medium">年齢</th>
                <th className="pb-2 text-right font-medium">希望借入額</th>
                <th className="pb-2 text-left font-medium pl-3">進捗状況</th>
                <th className="pb-2 text-right font-medium">最終更新日</th>
              </tr>
            </thead>
            <tbody>
              {recentCustomers.map((c, i) => (
                <tr key={i} className="cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "#BFDBFE", color: "#2563EB" }}>
                        {c.name[0]}
                      </div>
                      <span className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-xs" style={{ color: "var(--text-secondary)" }}>{c.age}歳</td>
                  <td className="py-3 text-right text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{c.amount}</td>
                  <td className="py-3 pl-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{ background: c.statusBg, color: c.statusColor }}>{c.status}</span>
                  </td>
                  <td className="py-3 text-right text-xs" style={{ color: "var(--text-muted)" }}>{c.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="mt-3 w-full py-2 rounded-xl text-xs font-medium transition-colors hover:opacity-90" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            顧客一覧をもっと見る
          </button>
        </Card>

        {/* Tasks */}
        <Card>
          <SectionHeader title="今週のタスク" href="/tasks" />
          <div className="space-y-2">
            {tasks.map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                <Square size={14} className="shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: t.tagBg, color: t.tagColor }}>{t.tag}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors hover:opacity-90" style={{ background: "#DBEAFE", color: "var(--accent-blue)", border: "1px solid #BFDBFE" }}>
            タスクを追加する +
          </button>
        </Card>
      </div>

      {/* CTA Banner */}
      <div className="mt-4 rounded-2xl p-5 flex items-center gap-5" style={{ background: "linear-gradient(135deg, #DBEAFE, #EDE9FE)", border: "1px solid #BFDBFE" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#BFDBFE" }}>
          <FileCheck size={20} style={{ color: "#2563EB" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>ローン診断をもっと簡単・スピーディーに</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>ローン診断機能を使うと、お客様の情報から最適な銀行候補を自動でご提案できます。</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff" }}>
          ローン診断を始める <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
