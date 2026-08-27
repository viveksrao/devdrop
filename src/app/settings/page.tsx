import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { EditorPreferencesForm } from "@/components/settings/EditorPreferencesForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile } from "@/lib/db/user";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const profile = await getUserProfile(session.user.id);
  if (!profile) redirect("/sign-in");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 p-6">
      <Link
        href="/dashboard"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings.
        </p>
      </div>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Editor preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <EditorPreferencesForm />
          </CardContent>
        </Card>
      </section>

      {profile.hasPassword && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated items and
              collections. This action cannot be undone.
            </p>
            <DeleteAccountDialog />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
