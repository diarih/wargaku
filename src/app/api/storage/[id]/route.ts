import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { recordAuditEvent } from "~/server/audit";
import { db } from "~/server/db";
import { deleteObject } from "~/server/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function deleteFileAsset(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { message: "ID berkas wajib diisi." },
      { status: 400 },
    );
  }

  const file = await db.fileAsset.findUnique({ where: { id } });

  if (!file) {
    return NextResponse.json(
      { message: "Berkas tidak ditemukan." },
      { status: 404 },
    );
  }

  try {
    await deleteObject(file.path);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Gagal menghapus berkas dari penyimpanan: ${error.message}`
            : "Gagal menghapus berkas dari penyimpanan.",
      },
      { status: 502 },
    );
  }

  await db.fileAsset.delete({ where: { id } });

  await recordAuditEvent({
    type: "DOCUMENT_DELETED",
    entityType: "DOCUMENT",
    entityId: file.id,
    householdId: file.householdId,
    residentId: file.residentId,
    fileAssetId: file.id,
    actorId: session.user.id,
    actorName: session.user.name,
    summary: `Dokumen ${file.fileName} dihapus.`,
    metadata: { fileName: file.fileName },
  });

  if (file.householdId) {
    revalidatePath(`/dashboard/kk/${file.householdId}`);
  }

  revalidatePath("/dashboard/dokumen");

  return NextResponse.json({ message: "Berkas berhasil dihapus." });
}

export const DELETE = deleteFileAsset;
