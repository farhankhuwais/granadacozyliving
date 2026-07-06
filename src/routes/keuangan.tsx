import { useState } from "react";
import {
  useTransactions,
  useCreateTransaction,
} from "@/hooks/use-transactions";
import { useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/MobileLayout";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Download,
  Plus,
  X,
} from "lucide-react";

const incomeCategories = [
  { value: "monthly_rent", label: "Sewa Bulanan" },
  { value: "daily_rent", label: "Sewa Harian" },
  { value: "other", label: "Lainnya" },
];

const expenseCategories = [
  { value: "property_tax", label: "IPL" },
  { value: "management_fees", label: "Management Fee" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Lainnya" },
];

function formatRupiah(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function KeuanganPage() {
  const [filters, setFilters] = useState<{
    dateStart: string;
    dateEnd: string;
    type: string;
    category: string;
  }>({
    dateStart: "",
    dateEnd: "",
    type: "",
    category: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "income",
    category: "monthly_rent",
    amount: 0,
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });
  const [formError, setFormError] = useState("");

  const { data: transactions, isLoading } = useTransactions(filters.type ? filters : undefined);
  const createTransaction = useCreateTransaction();
  const { profile } = useAuth();

  const canManage =
    profile &&
    ["super_admin", "manager_only", "investor_manager"].includes(profile.role);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (form.amount <= 0) {
      setFormError("Jumlah harus lebih dari 0");
      return;
    }

    try {
      await createTransaction.mutateAsync(form as unknown as Record<string, unknown>);
      setShowForm(false);
      setForm({
        type: "income",
        category: "monthly_rent",
        amount: 0,
        description: "",
        transaction_date: new Date().toISOString().split("T")[0],
      });
    } catch {
      setFormError("Gagal menyimpan transaksi");
    }
  }

  function escapeCSV(val: string) {
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    if (/^[=+\-@]/.test(str)) {
      return `"'${str}"`;
    }
    return str;
  }

  function handleExportCSV() {
    if (!transactions?.length) return;
    const header = "Tanggal,Tipe,Kategori,Jumlah,Deskripsi";
    const rows = transactions.map(
      (t) =>
        `${escapeCSV(t.transaction_date)},${escapeCSV(t.type)},${escapeCSV(t.category)},${t.amount},"${escapeCSV(t.description || "")}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const currentMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];
  const currentMonthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  )
    .toISOString()
    .split("T")[0];

  function getMonthlyStats() {
    const monthTx = transactions?.filter(
      (t) =>
        t.transaction_date >= currentMonthStart &&
        t.transaction_date <= currentMonthEnd
    );
    const income = monthTx?.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) || 0;
    const expense = monthTx?.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0) || 0;
    return { income, expense, net: income - expense };
  }

  const monthly = getMonthlyStats();

  return (
    <MobileLayout>
      <div className="px-5 pt-12 pb-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Keuangan</h1>
            <p className="text-sm text-muted-foreground">Ringkasan transaksi dan performa</p>
          </div>
          <div className="flex gap-2">
            {transactions && transactions.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 rounded-xl border border-gray-800 px-3 py-2 text-xs text-gray-400 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </button>
            )}
            {canManage && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"
              >
                {showForm ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {showForm ? "Tutup" : "Tambah"}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10">
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total Pendapatan</p>
              <p className="text-lg font-bold text-foreground">
                {formatRupiah(monthly.income)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
              <p className="text-lg font-bold text-foreground">
                {formatRupiah(monthly.expense)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gold/10 border border-gold/20 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15">
                <TrendingUp className="h-5 w-5 text-gold" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gold-foreground/70">Hasil Bersih</p>
                <p className="text-lg font-bold text-gold">
                  {formatRupiah(monthly.net)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Form */}
        {showForm && canManage && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Tambah Transaksi
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "income", category: "monthly_rent" })}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                    form.type === "income"
                      ? "bg-success text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Pendapatan
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm({ ...form, type: "expense", category: "property_tax" })
                  }
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-colors ${
                    form.type === "expense"
                      ? "bg-destructive text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Pengeluaran
                </button>
              </div>

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-600 focus:outline-none"
              >
                {(form.type === "income" ? incomeCategories : expenseCategories).map(
                  (c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  )
                )}
              </select>

              <input
                type="number"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: parseInt(e.target.value) || 0 })
                }
                placeholder="Jumlah (Rp)"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                required
              />

              <input
                type="date"
                value={form.transaction_date}
                onChange={(e) =>
                  setForm({ ...form, transaction_date: e.target.value })
                }
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white focus:border-blue-600 focus:outline-none"
                required
              />

              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Deskripsi (opsional)"
                className="w-full rounded-xl border border-gray-800 bg-gray-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
              />

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              <button
                type="submit"
                disabled={createTransaction.isPending}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createTransaction.isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value })
            }
            className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white"
          >
            <option value="">Semua Tipe</option>
            <option value="income">Pendapatan</option>
            <option value="expense">Pengeluaran</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-white"
          >
            <option value="">Semua Kategori</option>
            {[...incomeCategories, ...expenseCategories].map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-white" />
            </div>
          ) : transactions?.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Belum ada transaksi
            </p>
          ) : (
            transactions?.slice(0, 50).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      tx.type === "income"
                        ? "bg-success/10"
                        : "bg-destructive/10"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {incomeCategories
                        .concat(expenseCategories)
                        .find((c) => c.value === tx.category)
                        ?.label || tx.category}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tx.transaction_date}
                      {tx.description ? ` - ${tx.description}` : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    tx.type === "income" ? "text-success" : "text-destructive"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

