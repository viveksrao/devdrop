import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TypeBreakdown } from "@/components/profile/TypeBreakdown";
import { getUserProfile } from "@/lib/db/user";
import { getItemStats, getSystemItemTypes } from "@/lib/db/items";
import { getCollectionStats } from "@/lib/db/collections";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const userId = session.user.id;

  const [profile, itemStats, collectionStats, itemTypes] = await Promise.all([
    getUserProfile(userId),
    getItemStats(userId),
    getCollectionStats(userId),
    getSystemItemTypes(userId),
  ]);

  if (!profile) redirect("/sign-in");

  const memberSince = profile.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <div className="flex items-center gap-4">
        <UserAvatar
          name={profile.name}
          email={profile.email}
          image={profile.image}
          size="lg"
        />
        <div>
          <h1 className="text-xl font-semibold">{profile.name ?? "Account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Member since {memberSince}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Usage</h2>
        <StatsCards itemStats={itemStats} collectionStats={collectionStats} />
        <TypeBreakdown types={itemTypes} />
      </section>
    </div>
  );
}
