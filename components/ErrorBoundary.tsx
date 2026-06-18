"use client";

import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
          background: "#0F172A", padding: "24px",
        }}>
          <div style={{
            maxWidth: "600px", width: "100%", background: "#1E293B",
            border: "1px solid #EF4444", borderRadius: "16px", padding: "32px",
          }}>
            <h2 style={{ color: "#EF4444", marginBottom: "16px", fontSize: "18px" }}>
              ⚠ アプリケーションエラー
            </h2>
            <p style={{ color: "#94A3B8", marginBottom: "12px", fontSize: "14px" }}>
              以下のエラーが発生しました。このメッセージをコピーして開発者に報告してください。
            </p>
            <pre style={{
              background: "#0F172A", color: "#FCA5A5", padding: "16px",
              borderRadius: "8px", fontSize: "12px", overflow: "auto",
              whiteSpace: "pre-wrap", wordBreak: "break-all",
            }}>
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <a href="/login" style={{
              display: "inline-block", marginTop: "20px", padding: "10px 24px",
              background: "#D4AF37", color: "#0F172A", borderRadius: "10px",
              fontWeight: "bold", fontSize: "14px", textDecoration: "none",
            }}>
              ログイン画面へ
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
