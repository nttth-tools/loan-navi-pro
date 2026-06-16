"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Building2, TrendingUp, Calculator,
  ClipboardList, FileText, Bell, Settings, ChevronDown, HelpCircle, Menu, X, MapPin, BarChart2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/customers",    icon: Users,            label: "顧客管理" },
  { href: "/banks",        icon: Building2,        label: "銀行マスタ" },
  { href: "/area-master",  icon: MapPin,           label: "融資エリアマスタ" },
  { href: "/rates",        icon: TrendingUp,       label: "金利ランキング" },
  { href: "/diagnosis",    icon: Calculator,       label: "ローン診断" },
  { href: "/simulator",    icon: BarChart2,        label: "借入シミュレーター" },
  { href: "/screening",    icon: ClipboardList,    label: "事前審査管理" },
  { href: "/proposals",    icon: FileText,         label: "比較提案書" },
  { href: "/tasks",        icon: Bell,             label: "タスク・アラート", badge: 3 },
  { href: "/settings",     icon: Settings,         label: "設定" },
];

// ── LN House Logo ─────────────────────────────────────────────────────────────

function LNLogo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 48 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transition: "transform 0.2s ease", cursor: "default" }}
    >
      {/* Gold roof */}
      <polygon points="24,2 46,17 2,17" fill="#D4AF37" />

      {/* L — vertical bar */}
      <rect x="2" y="17" width="6" height="22" rx="0.5" fill="white" />
      {/* L — base */}
      <rect x="2" y="35" width="15" height="4" rx="0.5" fill="white" />

      {/* N — left vertical */}
      <rect x="20" y="17" width="6" height="22" rx="0.5" fill="white" />
      {/* N — diagonal stroke */}
      <polygon points="26,17 32,17 46,39 40,39" fill="white" />
      {/* N — right vertical */}
      <rect x="40" y="17" width="6" height="22" rx="0.5" fill="white" />

      {/* Gold 2×2 window grid (between L and N) */}
      <rect x="11" y="22" width="3.5" height="3.5" rx="0.4" fill="#D4AF37" />
      <rect x="15.5" y="22" width="3.5" height="3.5" rx="0.4" fill="#D4AF37" />
      <rect x="11" y="26.5" width="3.5" height="3.5" rx="0.4" fill="#D4AF37" />
      <rect x="15.5" y="26.5" width="3.5" height="3.5" rx="0.4" fill="#D4AF37" />
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const BG = "#0F172A";
const BORDER = "#1E293B";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div
          className="flex items-center gap-3"
          style={{ transition: "transform 0.2s ease" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          <LNLogo size={44} />
          <div>
            <div
              className="font-bold tracking-wide text-white"
              style={{ fontSize: "17px", letterSpacing: "0.01em", lineHeight: 1.2 }}
            >
              Loan Navi Pro
            </div>
            <div className="mt-0.5" style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500 }}>
              住宅ローン支援ツール
            </div>
          </div>
        </div>

        {/* Close button (mobile only) */}
        <button
          className="md:hidden p-1 rounded-lg"
          style={{ color: "#94A3B8" }}
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative"
                  style={{
                    background: active ? "rgba(212,175,55,0.12)" : "transparent",
                    color: active ? "#D4AF37" : "#CBD5E1",
                    border: active ? "1px solid rgba(212,175,55,0.2)" : "1px solid transparent",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#1E293B"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <item.icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "#EF4444", color: "#fff", fontSize: "10px" }}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Support */}
      <div className="px-3 pb-3" style={{ borderTop: `1px solid ${BORDER}` }}>
        <div className="mt-3 px-3 py-2.5 rounded-xl" style={{ background: "#1E293B" }}>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle size={13} style={{ color: "#64748B" }} />
            <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>サポートセンター</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>ご不明な点はお気軽にお問い合わせください。</p>
          <button className="mt-2 w-full text-xs py-1.5 rounded-lg font-medium"
            style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>
            お問い合わせ
          </button>
        </div>

        {/* User */}
        <div className="mt-3 flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors"
          onMouseEnter={e => (e.currentTarget.style.background = "#1E293B")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #1E40AF, #1D4ED8)", color: "#fff" }}>
            山
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-white">山田 太郎</div>
            <div className="text-xs truncate" style={{ color: "#94A3B8" }}>営業担当</div>
          </div>
          <ChevronDown size={14} style={{ color: "#64748B" }} />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-50"
        style={{ background: BG, borderRight: `1px solid ${BORDER}` }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile: hamburger ── */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
        style={{ background: BG, border: `1px solid ${BORDER}` }}
        onClick={() => setMobileOpen(true)}
        aria-label="メニューを開く"
      >
        <LNLogo size={28} />
      </button>

      {/* ── Mobile: backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile: drawer ── */}
      <aside
        className="md:hidden fixed left-0 top-0 h-full w-72 flex flex-col z-50 transition-transform duration-300"
        style={{
          background: BG,
          borderRight: `1px solid ${BORDER}`,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
