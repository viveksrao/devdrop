import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getEditorPreferences } from "@/lib/db/user";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const preferences = await getEditorPreferences(session.user.id);

  return NextResponse.json({ success: true, data: preferences });
}
