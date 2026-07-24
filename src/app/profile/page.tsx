import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { name, email, image } = session.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <UserAvatar name={name} email={email} image={image} size="lg" />
        <div>
          <h1 className="text-xl font-semibold">{name ?? "Account"}</h1>
          {email && <p className="mt-1 text-sm text-muted-foreground">{email}</p>}
        </div>
      </div>
    </div>
  );
}
