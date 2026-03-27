import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth/config";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/storage/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Max ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    const ext = extMap[file.type] ?? "png";
    const fileName = `${folder}/${nanoid()}.${ext}`;

    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, key: fileName });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
