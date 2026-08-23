import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromR2, getR2KeyFromUrl } from "@/lib/r2";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const fileItems = await prisma.item.findMany({
      where: { userId: session.user.id, contentType: "FILE", fileUrl: { not: null } },
      select: { fileUrl: true },
    });

    await Promise.all(
      fileItems.map(({ fileUrl }) =>
        deleteFileFromR2(getR2KeyFromUrl(fileUrl!)).catch((error) =>
          console.error("Failed to delete R2 object during account deletion:", error)
        )
      )
    );

    await prisma.user.delete({ where: { id: session.user.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
