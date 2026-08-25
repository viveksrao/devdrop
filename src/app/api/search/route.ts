import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSearchData } from "@/lib/db/search";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const data = await getSearchData(session.user.id);

  return NextResponse.json({ success: true, data });
}
