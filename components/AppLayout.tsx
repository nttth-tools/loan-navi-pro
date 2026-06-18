import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-60 min-h-screen overflow-auto" style={{ background: "var(--bg-primary)" }}>
        <div className="pt-14 md:pt-0">{children}</div>
      </main>
    </div>
  );
}
