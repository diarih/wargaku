import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { supabaseAdmin } from "~/server/supabase";
import { env } from "~/env";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const residentId = formData.get("residentId");
  const householdId = formData.get("householdId");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "File size exceeds 5MB limit" },
      { status: 400 },
    );
  }

  const safeResidentId =
    typeof residentId === "string" ? residentId : undefined;
  const safeHouseholdId =
    typeof householdId === "string" ? householdId : undefined;

  if (!safeResidentId && !safeHouseholdId) {
    return NextResponse.json(
      { message: "residentId or householdId is required" },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const folder = safeResidentId
    ? `resident/${safeResidentId}`
    : `household/${safeHouseholdId}`;
  const path = `${folder}/${randomUUID()}.${extension}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, buffer, {
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return NextResponse.json({ message: uploadError.message }, { status: 500 });
  }

  const asset = await db.fileAsset.create({
    data: {
      bucket: env.SUPABASE_STORAGE_BUCKET,
      path,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      residentId: safeResidentId,
      householdId: safeHouseholdId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json({
    id: asset.id,
    path: asset.path,
    bucket: asset.bucket,
    fileName: asset.fileName,
  });
}
