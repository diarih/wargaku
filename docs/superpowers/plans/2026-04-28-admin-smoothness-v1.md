# Admin Smoothness V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve daily admin workflow with faster lookup, a clearer follow-up queue, and a dedicated resident detail page while keeping the current KK, resident, and document model intact.

**Architecture:** Keep the existing server-rendered dashboard pages and add small server-side query helpers for cross-entity search and completeness queue shaping. Start by stabilizing the current storage route tests so new work lands on a trustworthy baseline.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, Playwright, Tailwind CSS

---

## Minimal V1 Scope

- [ ] Fix the current failing storage route tests around `revalidatePath`
- [ ] Add shared admin search and completeness helpers
- [ ] Add `/dashboard/cari` for cross-entity admin search
- [ ] Add `/dashboard/tindak-lanjut` for incomplete-data follow-up
- [ ] Add `/dashboard/warga/[id]` as a resident detail page
- [ ] Update dashboard navigation
- [ ] Run full verification with `npm.cmd test`
