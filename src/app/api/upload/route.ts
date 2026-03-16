import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth/config";
import { storage } from "@/lib/storage/client";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_MB } from "@/lib/storage/types";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, folder } = body as {
      contentType: string;
      folder?: string;
    };

    if (!contentType) {
      return NextResponse.json(
        { error: "contentType is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(contentType as typeof ALLOWED_IMAGE_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const prefix = folder ? `${folder}/` : "";
    const key = `${prefix}${nanoid()}.${ext}`;

    const result = await storage.getPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      key: result.key,
      maxSizeMB: MAX_FILE_SIZE_MB,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
