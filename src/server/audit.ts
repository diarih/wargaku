import type { Prisma } from "@prisma/client";

import { db } from "~/server/db";

export type AuditEventType =
  | "HOUSEHOLD_CREATED"
  | "HOUSEHOLD_UPDATED"
  | "RESIDENT_CREATED"
  | "RESIDENT_UPDATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED";

export type AuditEntityType = "HOUSEHOLD" | "RESIDENT" | "DOCUMENT";

export type AuditTimelineItem = {
  id: string;
  type: AuditEventType;
  label: string;
  summary: string;
  actorName: string;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
  source: "audit" | "fallback";
};

type RawAuditEvent = {
  id: string;
  type: AuditEventType;
  summary: string;
  actorName: string | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
};

type AuditFallbackEvent = {
  id: string;
  type: AuditEventType;
  summary: string;
  actorName: string | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
  fallbackKey: string;
};

type FileFallbackInput = {
  id: string;
  fileName: string;
  createdAt: Date;
};

const eventLabels: Record<AuditEventType, string> = {
  HOUSEHOLD_CREATED: "KK dibuat",
  HOUSEHOLD_UPDATED: "KK diperbarui",
  RESIDENT_CREATED: "Warga ditambahkan",
  RESIDENT_UPDATED: "Warga diperbarui",
  DOCUMENT_UPLOADED: "Dokumen diunggah",
  DOCUMENT_DELETED: "Dokumen dihapus",
};

export function getAuditEventLabel(type: AuditEventType) {
  return eventLabels[type];
}

function displayActorName(actorName: string | null | undefined) {
  return actorName?.trim() ? actorName : "Petugas";
}

function getFallbackKey(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const fallbackKey = metadata.fallbackKey;
  return typeof fallbackKey === "string" ? fallbackKey : null;
}

export function buildAuditTimeline(input: {
  auditEvents: RawAuditEvent[];
  fallbackEvents: AuditFallbackEvent[];
}): AuditTimelineItem[] {
  const auditFallbackKeys = new Set(
    input.auditEvents
      .map((event) => getFallbackKey(event.metadata))
      .filter((key): key is string => Boolean(key)),
  );

  const auditItems = input.auditEvents.map(
    (event): AuditTimelineItem => ({
      id: event.id,
      type: event.type,
      label: getAuditEventLabel(event.type),
      summary: event.summary,
      actorName: displayActorName(event.actorName),
      createdAt: event.createdAt,
      metadata: event.metadata,
      source: "audit",
    }),
  );

  const fallbackItems = input.fallbackEvents
    .filter((event) => !auditFallbackKeys.has(event.fallbackKey))
    .map(
      (event): AuditTimelineItem => ({
        id: event.id,
        type: event.type,
        label: getAuditEventLabel(event.type),
        summary: event.summary,
        actorName: event.actorName?.trim() ? event.actorName : "Sistem",
        createdAt: event.createdAt,
        metadata: event.metadata,
        source: "fallback",
      }),
    );

  return [...auditItems, ...fallbackItems].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
}

export function buildAuditFallbackFileEvents(files: FileFallbackInput[]) {
  return files.map(
    (file): AuditFallbackEvent => ({
      id: `fallback-file-${file.id}`,
      type: "DOCUMENT_UPLOADED",
      summary: `Dokumen ${file.fileName} tersedia.`,
      actorName: "Sistem",
      createdAt: file.createdAt,
      metadata: { fileName: file.fileName },
      fallbackKey: `file:${file.id}:uploaded`,
    }),
  );
}

export async function recordAuditEvent(input: {
  type: AuditEventType;
  entityType: AuditEntityType;
  entityId: string;
  householdId?: string | null;
  residentId?: string | null;
  fileAssetId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await db.auditEvent.create({
    data: {
      type: input.type,
      entityType: input.entityType,
      entityId: input.entityId,
      householdId: input.householdId ?? null,
      residentId: input.residentId ?? null,
      fileAssetId: input.fileAssetId ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName?.trim() ? input.actorName : null,
      summary: input.summary,
      ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
    },
  });
}

export async function getHouseholdTimeline(householdId: string) {
  const household = await db.household.findUnique({
    where: { id: householdId },
    select: {
      id: true,
      noKk: true,
      createdAt: true,
      updatedAt: true,
      files: {
        select: { id: true, fileName: true, createdAt: true },
      },
      residents: {
        select: {
          id: true,
          namaLengkap: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!household) {
    return [];
  }

  const residentIds = household.residents.map((resident) => resident.id);
  const auditEvents = await db.auditEvent.findMany({
    where: {
      OR: [
        { householdId },
        ...(residentIds.length > 0
          ? [{ residentId: { in: residentIds } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const fallbackEvents: AuditFallbackEvent[] = [
    {
      id: `fallback-household-${household.id}-created`,
      type: "HOUSEHOLD_CREATED",
      summary: `KK ${household.noKk} dibuat dari data yang sudah ada.`,
      actorName: "Sistem",
      createdAt: household.createdAt,
      metadata: null,
      fallbackKey: `household:${household.id}:created`,
    },
    ...buildAuditFallbackFileEvents(household.files),
    ...household.residents.flatMap((resident) => [
      {
        id: `fallback-resident-${resident.id}-created`,
        type: "RESIDENT_CREATED" as const,
        summary: `Warga ${resident.namaLengkap} tersedia dari data yang sudah ada.`,
        actorName: "Sistem",
        createdAt: resident.createdAt,
        metadata: null,
        fallbackKey: `resident:${resident.id}:created`,
      },
      ...(resident.updatedAt.getTime() > resident.createdAt.getTime()
        ? [
            {
              id: `fallback-resident-${resident.id}-updated`,
              type: "RESIDENT_UPDATED" as const,
              summary: `Warga ${resident.namaLengkap} pernah diperbarui.`,
              actorName: "Sistem",
              createdAt: resident.updatedAt,
              metadata: null,
              fallbackKey: `resident:${resident.id}:updated`,
            },
          ]
        : []),
    ]),
  ];

  if (household.updatedAt.getTime() > household.createdAt.getTime()) {
    fallbackEvents.push({
      id: `fallback-household-${household.id}-updated`,
      type: "HOUSEHOLD_UPDATED",
      summary: `KK ${household.noKk} pernah diperbarui.`,
      actorName: "Sistem",
      createdAt: household.updatedAt,
      metadata: null,
      fallbackKey: `household:${household.id}:updated`,
    });
  }

  return buildAuditTimeline({
    auditEvents: auditEvents as RawAuditEvent[],
    fallbackEvents,
  });
}

export async function getResidentTimeline(residentId: string) {
  const resident = await db.resident.findUnique({
    where: { id: residentId },
    select: {
      id: true,
      namaLengkap: true,
      createdAt: true,
      updatedAt: true,
      files: {
        select: { id: true, fileName: true, createdAt: true },
      },
    },
  });

  if (!resident) {
    return [];
  }

  const auditEvents = await db.auditEvent.findMany({
    where: { residentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const fallbackEvents: AuditFallbackEvent[] = [
    {
      id: `fallback-resident-${resident.id}-created`,
      type: "RESIDENT_CREATED",
      summary: `Warga ${resident.namaLengkap} tersedia dari data yang sudah ada.`,
      actorName: "Sistem",
      createdAt: resident.createdAt,
      metadata: null,
      fallbackKey: `resident:${resident.id}:created`,
    },
    ...buildAuditFallbackFileEvents(resident.files),
  ];

  if (resident.updatedAt.getTime() > resident.createdAt.getTime()) {
    fallbackEvents.push({
      id: `fallback-resident-${resident.id}-updated`,
      type: "RESIDENT_UPDATED",
      summary: `Warga ${resident.namaLengkap} pernah diperbarui.`,
      actorName: "Sistem",
      createdAt: resident.updatedAt,
      metadata: null,
      fallbackKey: `resident:${resident.id}:updated`,
    });
  }

  return buildAuditTimeline({
    auditEvents: auditEvents as RawAuditEvent[],
    fallbackEvents,
  });
}
