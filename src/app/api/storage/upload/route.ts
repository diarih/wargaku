import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { storageBucket, uploadObject } from "~/server/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function postUpload(request: Request, userId: string) {
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

  try {
    await uploadObject({
      key: path,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 },
    );
  }

  const asset = await db.fileAsset.create({
    data: {
      bucket: storageBucket,
      path,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      residentId: safeResidentId,
      householdId: safeHouseholdId,
      uploadedById: userId,
    },
  });

  return NextResponse.json({
    id: asset.id,
    path: asset.path,
    bucket: asset.bucket,
    fileName: asset.fileName,
  });
}

async function postUploadAuthed(
  request: Request & { auth?: { user?: { id?: string } } | null },
) {
  const userId = request.auth?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return postUpload(request, userId);
}

export const POST = auth(postUploadAuthed) as unknown as (
  request: Request,
) => Promise<Response>;
