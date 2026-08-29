import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-marketing-bg">
      <MarketingNavbar />
      <div className="flex min-h-screen items-center justify-center p-6 pt-23">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-white">Create your account</h1>
            <p className="mt-1 text-sm text-marketing-text-muted">
              Start building your developer knowledge hub.
            </p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-marketing-text-muted">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-white underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
