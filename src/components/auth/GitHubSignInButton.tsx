"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface GitHubSignInButtonProps {
  redirectTo: string;
}

export function GitHubSignInButton({ redirectTo }: GitHubSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleGitHubSignIn() {
    setIsLoading(true);
    await signIn("github", { redirectTo });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGitHubSignIn}
        disabled={isLoading}
      >
        {isLoading ? "Redirecting..." : "Sign in with GitHub"}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>
    </>
  );
}
