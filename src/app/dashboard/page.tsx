import { DashboardTopBar } from "@/components/layout/DashboardTopBar";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopBar />
      <div className="flex flex-1">
        <aside className="w-64 border-r border-border p-6">
          <h2>Sidebar</h2>
        </aside>
        <main className="flex-1 p-6">
          <h2>Main</h2>
        </main>
      </div>
    </div>
  );
}
