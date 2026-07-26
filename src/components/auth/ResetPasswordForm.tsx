"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        This reset link is invalid.{" "}
        <Link href="/forgot-password" className="font-medium underline underline-offset-4">
          Request a new one
        </Link>
        .
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...parsed.data }),
    });
    const json = await res.json();

    setIsSubmitting(false);

    if (!json.success) {
      if (json.error === "expired") {
        setError("This reset link has expired. Please request a new one.");
      } else if (json.error === "invalid") {
        setError("This reset link is invalid. Please request a new one.");
      } else {
        setError(json.error ?? "Something went wrong");
      }
      return;
    }

    toast.success("Password reset — you can now sign in");
    router.push("/sign-in");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}{" "}
          {(error.includes("expired") || error.includes("invalid")) && (
            <Link href="/forgot-password" className="font-medium underline underline-offset-4">
              Request a new link
            </Link>
          )}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
