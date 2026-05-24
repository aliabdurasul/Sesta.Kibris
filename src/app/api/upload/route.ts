/**
 * POST /api/upload — product image file → Supabase Storage → public HTTPS URL.
 * No database writes. Admin only (MVP).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminServerClient } from "@/lib/supabase/admin";
import {
  PRODUCT_IMAGE_ALLOWED_TYPES,
  PRODUCT_IMAGE_MAX_BYTES,
  uploadProductImageToStorage,
} from "@/lib/storage/product-image";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function assertAdminUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const role = (user.app_metadata as Record<string, string> | undefined)?.[
    "role"
  ];
  if (role !== "admin") return null;

  return user;
}

export async function POST(request: NextRequest) {
  const user = await assertAdminUser();
  if (!user) {
    return NextResponse.json(
      { error: "Yetkisiz.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Geçersiz form verisi.", code: "INVALID_BODY" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Dosya seçilmedi.", code: "NO_FILE" },
      { status: 400 },
    );
  }

  if (!PRODUCT_IMAGE_ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: "Sadece JPEG, PNG, WebP veya GIF yükleyebilirsiniz.",
        code: "INVALID_TYPE",
      },
      { status: 400 },
    );
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return NextResponse.json(
      { error: "Dosya en fazla 5 MB olabilir.", code: "FILE_TOO_LARGE" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createAdminServerClient();
  const result = await uploadProductImageToStorage(
    admin,
    buffer,
    file.type,
  );

  if (!result.ok) {
    log.error("api.upload.failed", {
      userId: user.id,
      reason: result.error,
    });
    return NextResponse.json(
      { error: result.error, code: "UPLOAD_FAILED" },
      { status: 500 },
    );
  }

  log.info("api.upload.success", {
    userId: user.id,
    path: result.path,
  });

  return NextResponse.json({ url: result.url, path: result.path });
}
