"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteJson } from "@/lib/api-client";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    const { json } = await deleteJson("/api/auth/delete-account");

    if (!json.success) {
      setIsDeleting(false);
      toast.error(json.error ?? "Something went wrong");
      return;
    }

    await signOut({ redirectTo: "/sign-in" });
  }

  return (
    <AlertDialog onOpenChange={(open) => !open && setConfirmation("")}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and all items and collections. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5 px-4">
          <Label htmlFor="delete-confirmation">
            Type <span className="font-mono font-semibold">{CONFIRM_TEXT}</span> to
            confirm
          </Label>
          <Input
            id="delete-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={confirmation !== CONFIRM_TEXT || isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting..." : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
