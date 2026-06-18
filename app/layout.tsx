import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loan Navi Pro | 住宅ローン支援SaaS",
  description: "住宅営業マン向け住宅ローン業務プラットフォーム",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}
