import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/db/user";
import { UpgradePricing } from "@/components/upgrade/UpgradePricing";

export default async function UpgradePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const profile = await getUserProfile(session.user.id);
  if (!profile) redirect("/sign-in");
  if (profile.isPro) redirect("/settings");

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-10 p-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Upgrade to Pro</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Unlock unlimited items, file uploads, and AI features.
        </p>
      </div>

      <UpgradePricing />
    </div>
  );
}
