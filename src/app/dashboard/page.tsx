import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardMain } from "@/components/dashboard/DashboardMain";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardMain />
    </DashboardShell>
  );
}
