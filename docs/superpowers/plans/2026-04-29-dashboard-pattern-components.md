# Dashboard Pattern Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a small reusable dashboard component layer plus a matching guide so repeated admin-page patterns stop living as one-off Tailwind blocks inside page files.

**Architecture:** Keep `src/components/ui/*` as the low-level shadcn primitive layer. Add a separate app-specific pattern layer for reusable dashboard building blocks, then migrate only the most repeated/stable patterns first so the system grows from real usage instead of abstraction-first design.

**Tech Stack:** Next.js App Router, React 19, TypeScript, shadcn/ui, Tailwind CSS, Vitest

---

## File Structure

**Existing low-level primitive layer**
- Keep: `src/components/ui/*`
  - Purpose: generic reusable primitives only (`Button`, `Card`, `Badge`, `Input`, `Separator`, etc.)

**New app-specific reusable layer**
- Create: `src/components/dashboard/`
  - Purpose: reusable admin/dashboard composition patterns built from `ui/*`

**Recommended first components**
- Create: `src/components/dashboard/section-heading.tsx`
  - Purpose: reusable title + description block for content sections
- Create: `src/components/dashboard/detail-group.tsx`
  - Purpose: grouped labeled rows for record/detail pages
- Create: `src/components/dashboard/empty-state-panel.tsx`
  - Purpose: dashed empty state with consistent copy/layout
- Create: `src/components/dashboard/file-asset-row.tsx`
  - Purpose: reusable file row for KK/warga documents

**Guide**
- Create: `docs/dashboard-component-guide.md`
  - Purpose: define extraction rules and the boundary between `components/ui` and `components/dashboard`

**First migration targets**
- Modify: `src/app/dashboard/_components/resident-detail-view.tsx`
- Modify: `src/app/dashboard/kk/[id]/page.tsx`
- Modify: `src/app/dashboard/dokumen/page.tsx`
- Optionally later: `src/app/dashboard/cari/page.tsx`, `src/app/dashboard/tindak-lanjut/page.tsx`

**Tests**
- Create: `tests/components/dashboard/detail-group.test.tsx`
- Create: `tests/components/dashboard/empty-state-panel.test.tsx`
- Create: `tests/components/dashboard/file-asset-row.test.tsx`
- Modify: `tests/components/resident-detail-page.test.tsx`

---

### Task 1: Write the guide first

**Files:**
- Create: `docs/dashboard-component-guide.md`

- [ ] **Step 1: Write the guide content**
Document these rules:

- `src/components/ui/*`
  - only for generic primitives
  - no app/domain naming
  - should be usable outside dashboard context

- `src/components/dashboard/*`
  - for reusable admin/dashboard composition patterns
  - should have semantic purpose, not just a bundle of classes

- Keep markup local when:
  - used in only one place
  - abstraction would mostly forward `className`
  - fields/content shape is unstable

- Extract a dashboard component when:
  - used in 2+ places
  - semantic purpose is stable
  - repeated structure is more important than repeated classes

- Naming rules:
  - `DetailGroup`, not `PrettyCard2`
  - `FileAssetRow`, not `DocumentThing`

- Accessibility rules:
  - section titles must be real headings when navigationally meaningful
  - links stay links
  - empty states must remain readable and specific

- [ ] **Step 2: Review guide against current code**
Check that the examples match the current app:
- `resident-detail-view.tsx`
- `kk/[id]/page.tsx`
- `dokumen/page.tsx`

- [ ] **Step 3: Commit**
```bash
git add docs/dashboard-component-guide.md
git commit -m "docs: add dashboard component extraction guide"
```

---

### Task 2: Add `SectionHeading`

**Files:**
- Create: `src/components/dashboard/section-heading.tsx`
- Test: optional if component stays trivial and fully covered indirectly

- [ ] **Step 1: Write a failing usage test or pick an existing target**
Use `resident-detail-view.tsx` as the first consumer.

Expected API:
```tsx
<SectionHeading
  title="Dokumen Warga"
  description="Unggah dan kelola dokumen pendukung yang melekat pada profil warga."
/>
```

- [ ] **Step 2: Run a failing test**
Use:
```bash
npm.cmd test -- tests/components/resident-detail-page.test.tsx
```
Expected:
- fail after updating the consumer test/usage expectation if needed

- [ ] **Step 3: Implement minimal component**
Suggested structure:
```tsx
type SectionHeadingProps = {
  title: string;
  description?: string;
  as?: "h2" | "h3";
};

export function SectionHeading({ title, description, as = "h2" }: SectionHeadingProps) {
  const Heading = as;
  return (
    <div className="space-y-1">
      <Heading className="text-base leading-snug font-medium">{title}</Heading>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Verify**
```bash
npm.cmd test -- tests/components/resident-detail-page.test.tsx
```

- [ ] **Step 5: Commit**
```bash
git add src/components/dashboard/section-heading.tsx src/app/dashboard/_components/resident-detail-view.tsx tests/components/resident-detail-page.test.tsx
git commit -m "feat: add reusable dashboard section heading"
```

---

### Task 3: Add `DetailGroup`

**Files:**
- Create: `src/components/dashboard/detail-group.tsx`
- Create: `tests/components/dashboard/detail-group.test.tsx`
- Modify: `src/app/dashboard/_components/resident-detail-view.tsx`

- [ ] **Step 1: Write the failing test**
Test real behavior:
- title renders as heading
- description optional
- rows render with labels and values
- repeated `Belum diisi` values are supported

Suggested test:
```tsx
it("renders grouped detail rows", () => {
  render(
    <DetailGroup
      title="Identitas Dasar"
      description="Informasi utama."
      rows={[
        { label: "NIK", value: "123" },
        { label: "Status", value: "Belum diisi" },
      ]}
    />
  );

  expect(screen.getByRole("heading", { name: "Identitas Dasar" })).toBeInTheDocument();
  expect(screen.getByText("NIK")).toBeInTheDocument();
  expect(screen.getByText("123")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify failure**
```bash
npm.cmd test -- tests/components/dashboard/detail-group.test.tsx
```

- [ ] **Step 3: Implement minimal component**
Move the current `DetailGroup` and `DetailRow` logic out of `resident-detail-view.tsx`.

Suggested API:
```tsx
type DetailGroupRow = {
  label: string;
  value: string;
};

type DetailGroupProps = {
  title: string;
  description: string;
  rows: DetailGroupRow[];
  headingLevel?: "h2" | "h3";
};
```

- [ ] **Step 4: Replace local usage in resident detail**
Import the new component and remove local duplicates.

- [ ] **Step 5: Run tests**
```bash
npm.cmd test -- tests/components/dashboard/detail-group.test.tsx tests/components/resident-detail-page.test.tsx
```

- [ ] **Step 6: Commit**
```bash
git add src/components/dashboard/detail-group.tsx tests/components/dashboard/detail-group.test.tsx src/app/dashboard/_components/resident-detail-view.tsx tests/components/resident-detail-page.test.tsx
git commit -m "feat: extract reusable dashboard detail group"
```

---

### Task 4: Add `EmptyStatePanel`

**Files:**
- Create: `src/components/dashboard/empty-state-panel.tsx`
- Create: `tests/components/dashboard/empty-state-panel.test.tsx`
- Modify:
  - `src/app/dashboard/_components/resident-detail-view.tsx`
  - `src/app/dashboard/kk/[id]/page.tsx`
  - optionally `src/app/dashboard/dokumen/page.tsx`

- [ ] **Step 1: Write the failing test**
Test:
- renders text
- supports dashed variant/default simple variant
- accepts optional extra className

Suggested API:
```tsx
<EmptyStatePanel>
  Belum ada dokumen warga.
</EmptyStatePanel>
```

- [ ] **Step 2: Run test to verify failure**
```bash
npm.cmd test -- tests/components/dashboard/empty-state-panel.test.tsx
```

- [ ] **Step 3: Implement minimal component**
Suggested structure:
```tsx
type EmptyStatePanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function EmptyStatePanel({ children, className }: EmptyStatePanelProps) {
  return (
    <div className={cn("text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm", className)}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Replace duplicated empty states**
Use it in:
- resident documents empty state
- KK documents empty state
- no family member / no queue / no results only if the fit is truly the same

- [ ] **Step 5: Run tests**
```bash
npm.cmd test -- tests/components/dashboard/empty-state-panel.test.tsx tests/components/resident-detail-page.test.tsx
```

- [ ] **Step 6: Commit**
```bash
git add src/components/dashboard/empty-state-panel.tsx tests/components/dashboard/empty-state-panel.test.tsx src/app/dashboard/_components/resident-detail-view.tsx src/app/dashboard/kk/[id]/page.tsx
git commit -m "feat: add reusable dashboard empty state panel"
```

---

### Task 5: Add `FileAssetRow`

**Files:**
- Create: `src/components/dashboard/file-asset-row.tsx`
- Create: `tests/components/dashboard/file-asset-row.test.tsx`
- Modify:
  - `src/app/dashboard/_components/resident-detail-view.tsx`
  - `src/app/dashboard/kk/[id]/page.tsx`
  - maybe `src/app/dashboard/dokumen/page.tsx` if shape fits cleanly

- [ ] **Step 1: Write the failing test**
Behavior to cover:
- renders file name, mime type, formatted size, date
- renders open link only when `downloadUrl` exists
- renders delete action slot or element
- open link accessible name includes filename

Suggested prop shape:
```tsx
type FileAssetRowProps = {
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  downloadUrl?: string | null;
  onDelete?: React.ReactNode;
};
```

- [ ] **Step 2: Run test to verify failure**
```bash
npm.cmd test -- tests/components/dashboard/file-asset-row.test.tsx
```

- [ ] **Step 3: Implement minimal component**
Move shared file-row presentation out of resident detail first.

Also move the file-size formatter there if it is only used for file rows.

- [ ] **Step 4: Reuse in KK detail**
Replace the duplicated document file row markup in `kk/[id]/page.tsx`.

- [ ] **Step 5: Verify**
```bash
npm.cmd test -- tests/components/dashboard/file-asset-row.test.tsx tests/components/resident-detail-page.test.tsx
```

- [ ] **Step 6: Commit**
```bash
git add src/components/dashboard/file-asset-row.tsx tests/components/dashboard/file-asset-row.test.tsx src/app/dashboard/_components/resident-detail-view.tsx src/app/dashboard/kk/[id]/page.tsx
git commit -m "feat: extract reusable dashboard file asset row"
```

---

### Task 6: Optional `RecordHeader` extraction

**Files:**
- Create only if repetition is real:
  - `src/components/dashboard/record-header.tsx`
- Potential consumers:
  - `resident-detail-view.tsx`
  - `kk/[id]/page.tsx`

- [ ] **Step 1: Compare resident and KK header structures**
Only extract if these are structurally close enough:
- avatar
- badge row
- title
- metadata lines
- action area

- [ ] **Step 2: If not close enough, skip**
Document in the guide that this pattern is not yet stable enough.

- [ ] **Step 3: If extracted, test and migrate one page first**
Do not force both pages into a bad abstraction.

- [ ] **Step 4: Commit**
```bash
git add src/components/dashboard/record-header.tsx src/app/dashboard/_components/resident-detail-view.tsx src/app/dashboard/kk/[id]/page.tsx
git commit -m "feat: add reusable dashboard record header"
```

---

### Task 7: Use the guide to audit remaining page-local patterns

**Files:**
- Review:
  - `src/app/dashboard/cari/page.tsx`
  - `src/app/dashboard/tindak-lanjut/page.tsx`
  - `src/app/dashboard/kk/[id]/page.tsx`
  - `src/app/dashboard/dokumen/page.tsx`

- [ ] **Step 1: Identify what should remain local**
Examples likely still local:
- search result grouping layout
- follow-up queue grouping logic
- page-specific hero sections

- [ ] **Step 2: Apply only low-risk migrations**
Do not chase every repeated `rounded-2xl border p-4`.
Only extract when semantics and structure match.

- [ ] **Step 3: Run focused page-related tests if changed**
```bash
npm.cmd test -- tests/components/resident-detail-page.test.tsx tests/components/dashboard-nav.test.tsx
```

---

### Task 8: Full verification

**Files:**
- Verify only

- [ ] **Step 1: Run dashboard pattern tests**
```bash
npm.cmd test -- tests/components/dashboard/*.test.tsx
```

- [ ] **Step 2: Run the full test suite**
```bash
npm.cmd test
```

- [ ] **Step 3: Run typecheck**
```bash
npm.cmd run typecheck
```

- [ ] **Step 4: Run build**
```bash
npm.cmd run build
```

Expected:
- all commands pass

---

## Recommendation Summary

Best architectural split:

- `src/components/ui/*`
  - generic shadcn-style primitives only

- `src/components/dashboard/*`
  - reusable app-specific dashboard building blocks

- page files / `_components`
  - page-specific composition and unstable layouts

This avoids two common problems:
- stuffing domain-specific patterns into generic `ui`
- abstracting every repeated class string into a fake component too early
