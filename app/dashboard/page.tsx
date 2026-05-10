import { createClient } from "@/lib/supabase/server";
import KpiCards from "./components/kpi-cards";
import InvoiceStatusChart from "./components/invoice-status-chart";
import MonthlyRevenueChart from "./components/monthly-revenue-chart";
import InvoiceComparisonChart from "./components/invoice-comparison-chart";
import StudentsByUnitChart from "./components/students-by-unit-chart";
import StudentStatusChart from "./components/student-status-chart";
import StudentGenderChart from "./components/student-gender-chart";
import NewStudentsChart from "./components/new-students-chart";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonthMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const endOfMonthMs = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  const twelveMonthsAgoMs = new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime();

  const [{ data: allStudents }, { data: allInvoices }] = await Promise.all([
    supabase.from("students").select("status, unit, gender, created_at"),
    supabase.from("invoices").select("amount, status, created_at"),
  ]);

  const students = allStudents ?? [];
  const invoices = allInvoices ?? [];

  // KPI: murid aktif
  const activeStudents = students.filter((s) => s.status === "Aktif").length;

  // KPI: tagihan dan terbayar bulan ini
  const thisMonthInvoices = invoices.filter((inv) => {
    const t = new Date(inv.created_at).getTime();
    return t >= startOfMonthMs && t <= endOfMonthMs;
  });
  const thisMonthTotal = thisMonthInvoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0);
  const thisMonthPaid = thisMonthInvoices
    .filter((inv) => inv.status === "PAID" || inv.status === "SETTLED")
    .reduce((sum, inv) => sum + (inv.amount ?? 0), 0);

  // KPI: tagihan UNPAID
  const unpaidCount = invoices.filter((inv) => inv.status === "UNPAID").length;

  // B1: status tagihan (semua invoice)
  const invoiceStatusMap: Record<string, number> = {};
  invoices.forEach((inv) => {
    invoiceStatusMap[inv.status] = (invoiceStatusMap[inv.status] ?? 0) + 1;
  });
  const invoiceStatusData = Object.entries(invoiceStatusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // B2 & B3: bulanan 12 bulan terakhir
  const monthlyMap: Record<string, { total: number; paid: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = { total: 0, paid: 0 };
  }
  invoices
    .filter((inv) => new Date(inv.created_at).getTime() >= twelveMonthsAgoMs)
    .forEach((inv) => {
      const d = new Date(inv.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyMap[key]) {
        monthlyMap[key].total += inv.amount ?? 0;
        if (inv.status === "PAID" || inv.status === "SETTLED") {
          monthlyMap[key].paid += inv.amount ?? 0;
        }
      }
    });
  const monthlyData = Object.entries(monthlyMap).map(([month, data]) => ({
    month,
    label: new Date(month + "-01").toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    }),
    total: data.total,
    paid: data.paid,
  }));

  // C1: murid aktif per unit
  const unitMap: Record<string, number> = {};
  students
    .filter((s) => s.status === "Aktif")
    .forEach((s) => {
      if (s.unit) unitMap[s.unit] = (unitMap[s.unit] ?? 0) + 1;
    });
  const studentsByUnitData = Object.entries(unitMap).map(([unit, count]) => ({ unit, count }));

  // C2: status murid
  const studentStatusMap: Record<string, number> = {};
  students.forEach((s) => {
    if (s.status) studentStatusMap[s.status] = (studentStatusMap[s.status] ?? 0) + 1;
  });
  const studentStatusData = Object.entries(studentStatusMap).map(([status, count]) => ({
    status,
    count,
  }));

  // C3: distribusi gender
  const genderMap: Record<string, number> = {};
  students.forEach((s) => {
    if (s.gender) genderMap[s.gender] = (genderMap[s.gender] ?? 0) + 1;
  });
  const genderData = Object.entries(genderMap).map(([gender, count]) => ({ gender, count }));

  // C4: murid baru per bulan (12 bulan terakhir)
  const newStudentsMap: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    newStudentsMap[key] = 0;
  }
  students
    .filter((s) => new Date(s.created_at).getTime() >= twelveMonthsAgoMs)
    .forEach((s) => {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (newStudentsMap[key] !== undefined) newStudentsMap[key]++;
    });
  const newStudentsData = Object.entries(newStudentsMap).map(([month, count]) => ({
    month,
    label: new Date(month + "-01").toLocaleDateString("id-ID", {
      month: "short",
      year: "2-digit",
    }),
    count,
  }));

  return (
    <div className="p-6 space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ringkasan data dan aktivitas sistem YISS
        </p>
      </div>

      <KpiCards
        activeStudents={activeStudents}
        thisMonthTotal={thisMonthTotal}
        thisMonthPaid={thisMonthPaid}
        unpaidCount={unpaidCount}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Keuangan</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Data SPP dan pembayaran</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InvoiceStatusChart data={invoiceStatusData} />
          <MonthlyRevenueChart data={monthlyData} />
        </div>
        <InvoiceComparisonChart data={monthlyData} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Data Murid</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">Statistik murid YISS</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StudentsByUnitChart data={studentsByUnitData} />
          <StudentStatusChart data={studentStatusData} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StudentGenderChart data={genderData} />
          <NewStudentsChart data={newStudentsData} />
        </div>
      </section>
    </div>
  );
}
