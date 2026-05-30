/**
 * POST /api/upload/promo — promo banner → promo-banners bucket → public URL.
 * Admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminServerClient } from "@/lib/supabase/admin";
import {
  PROMO_BANNER_ALLOWED_TYPES,
  PROMO_BANNER_MAX_BYTES,
  uploadPromoBannerToStorage,
} from "@/lib/storage/promo-banner";
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

  if (!PROMO_BANNER_ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: "Sadece JPEG, PNG veya WebP yükleyebilirsiniz.",
        code: "INVALID_TYPE",
      },
      { status: 400 },
    );
  }

  if (file.size > PROMO_BANNER_MAX_BYTES) {
    return NextResponse.json(
      { error: "Dosya en fazla 5 MB olabilir.", code: "FILE_TOO_LARGE" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const admin = createAdminServerClient();
  const result = await uploadPromoBannerToStorage(admin, buffer, file.type);

  if (!result.ok) {
    log.error("api.upload.promo.failed", {
      userId: user.id,
      reason: result.error,
    });
    return NextResponse.json(
      { error: result.error, code: "UPLOAD_FAILED" },
      { status: 500 },
    );
  }

  log.info("api.upload.promo.success", {
    userId: user.id,
    path: result.path,
  });

  return NextResponse.json({ url: result.url, path: result.path });
}
