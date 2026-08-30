import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadFileToR2 } from "@/lib/r2";
import { getUploadConstraints, formatFileSize } from "@/lib/constants/file-upload";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isPro) {
    return NextResponse.json(
      { success: false, error: "File and image uploads require DevDrop Pro" },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const itemTypeName = formData.get("itemTypeName");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  if (itemTypeName !== "file" && itemTypeName !== "image") {
    return NextResponse.json(
      { success: false, error: "Invalid item type" },
      { status: 400 }
    );
  }

  const { maxSize, mimeTypes, extensions } = getUploadConstraints(itemTypeName);

  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!extensions.includes(extension)) {
    return NextResponse.json(
      { success: false, error: `Unsupported file extension: ${extension}` },
      { status: 400 }
    );
  }

  if (!mimeTypes.has(file.type)) {
    return NextResponse.json(
      { success: false, error: `Unsupported file type: ${file.type}` },
      { status: 400 }
    );
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      { success: false, error: `File exceeds the ${formatFileSize(maxSize)} limit` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `${session.user.id}/${randomUUID()}${extension}`;

  const fileUrl = await uploadFileToR2(key, buffer, file.type);

  return NextResponse.json({
    success: true,
    data: {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
    },
  });
}
