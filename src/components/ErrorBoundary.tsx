import React from "react";

console.log("[CozyLiving] ErrorBoundary.tsx: loaded");

interface Props { children: React.ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CozyLiving] ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", background: "#000", color: "white", minHeight: "100vh" }}>
          <h1>Aplikasi Error</h1>
          <pre style={{ color: "#f87171", marginTop: "16px" }}>
            {this.state.error?.message || "Unknown error"}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: "16px", padding: "12px 24px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
