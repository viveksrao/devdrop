import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getItemDetail(session.user.id, id);

  if (!item || !item.fileUrl) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const fileResponse = await fetch(item.fileUrl);
  if (!fileResponse.ok || !fileResponse.body) {
    return NextResponse.json({ success: false, error: "File unavailable" }, { status: 502 });
  }

  const fileName = item.fileName ?? "download";

  return new NextResponse(fileResponse.body, {
    headers: {
      "Content-Type": fileResponse.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      ...(item.fileSize ? { "Content-Length": String(item.fileSize) } : {}),
    },
  });
}
