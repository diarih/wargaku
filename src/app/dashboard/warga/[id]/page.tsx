import { notFound } from "next/navigation";

import { ResidentDetailView } from "~/app/dashboard/_components/resident-detail-view";
import { getResidentTimeline } from "~/server/audit";
import { db } from "~/server/db";
import { getResidentCompleteness } from "~/server/households";
import { createSignedDownloadUrl } from "~/server/storage";

type ResidentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResidentDetailPage({
  params,
}: ResidentDetailPageProps) {
  const { id } = await params;

  const resident = await db.resident.findUnique({
    where: { id },
    include: {
      household: {
        select: {
          id: true,
          noKk: true,
          alamat: true,
          rt: true,
          rw: true,
        },
      },
      files: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!resident) {
    notFound();
  }

  const completeness = getResidentCompleteness(resident);
  const [filesWithUrl, timeline] = await Promise.all([
    Promise.all(
      resident.files.map(async (file) => ({
        ...file,
        downloadUrl: await createSignedDownloadUrl({ key: file.path }).catch(
          () => null,
        ),
      })),
    ),
    getResidentTimeline(resident.id),
  ]);

  return (
    <ResidentDetailView
      resident={resident}
      completeness={completeness}
      files={filesWithUrl}
      timeline={timeline}
    />
  );
}
