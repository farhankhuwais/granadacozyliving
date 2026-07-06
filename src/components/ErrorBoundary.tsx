import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[CozyLiving] App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-black px-4">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/20">
              <span className="text-xl text-red-400">!</span>
            </div>
            <h1 className="text-xl font-bold text-white">Aplikasi Error</h1>
            <p className="mt-2 text-sm text-gray-400">
              Terjadi kesalahan saat memuat aplikasi.
            </p>
            <pre className="mt-4 rounded-xl bg-gray-900 p-4 text-left text-xs text-red-300 overflow-auto max-h-40">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Muat Ulang
            </button>
            <p className="mt-4 text-xs text-gray-500">
              Pastikan file <code className="text-gray-400">.env.local</code> sudah dikonfigurasi.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
