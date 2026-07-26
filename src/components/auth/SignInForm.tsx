"use client";

import { useState } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      toast.success("Email verified — you can now sign in");
    } else if (searchParams.get("verifyError") === "expired") {
      toast.error("That verification link has expired. Please request a new one.");
    } else if (searchParams.get("verifyError")) {
      toast.error("That verification link is invalid.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.code === "email-not-verified") {
      setNeedsVerification(true);
      setError("Please verify your email before signing in.");
      return;
    }

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    window.location.href = callbackUrl;
  }

  async function handleResendVerification() {
    setIsResending(true);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setIsResending(false);
    toast.success("If that account needs verification, a new email is on its way.");
  }

  async function handleGitHubSignIn() {
    setIsGitHubLoading(true);
    await signIn("github", { redirectTo: callbackUrl });
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGitHubSignIn}
        disabled={isGitHubLoading}
      >
        {isGitHubLoading ? "Redirecting..." : "Sign in with GitHub"}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {needsVerification && (
          <Button
            type="button"
            variant="link"
            className="h-auto justify-start p-0 text-sm"
            onClick={handleResendVerification}
            disabled={isResending}
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </Button>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
