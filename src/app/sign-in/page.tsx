import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-marketing-bg">
      <MarketingNavbar />
      <div className="flex min-h-screen items-center justify-center p-6 pt-23">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-white">Sign in to DevDrop</h1>
            <p className="mt-1 text-sm text-marketing-text-muted">
              Your developer knowledge, all in one place.
            </p>
          </div>

          <Suspense>
            <SignInForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-marketing-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-white underline underline-offset-4">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
