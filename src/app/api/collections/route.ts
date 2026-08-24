import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllCollections } from "@/lib/db/collections";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const collections = await getAllCollections(session.user.id);

  return NextResponse.json({ success: true, data: collections });
}
