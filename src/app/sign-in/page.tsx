import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Sign in to DevDrop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your developer knowledge, all in one place.
          </p>
        </div>

        <Suspense>
          <SignInForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
