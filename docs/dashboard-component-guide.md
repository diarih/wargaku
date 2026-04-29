# Dashboard Component Guide

This app keeps two different component layers on purpose:

- `src/components/ui/*` is the low-level primitive layer.
- `src/components/dashboard/*` is the app-specific dashboard pattern layer.

## `src/components/ui/*`

Use `ui/*` only for generic primitives.

- No app or domain naming.
- No resident, household, document, or dashboard-specific copy.
- A component should still make sense outside the dashboard.

Examples in the current app:

- `Button`, `Card`, `Badge`, and `Input` belong in `ui/*`.
- Shared button variant classes can live alongside `Button` because they are still primitive styling, not dashboard behavior.

## `src/components/dashboard/*`

Use `dashboard/*` for reusable admin and dashboard composition patterns.

- Components should express a semantic purpose, not just bundle classes.
- Components can be opinionated about admin layouts and repeated record-page structure.
- Components should usually be built from `ui/*` primitives.

Examples in the current app:

- `resident-detail-view.tsx` repeats titled detail cards and section heading blocks, so `DetailGroup` and `SectionHeading` belong in `dashboard/*`.
- `kk/[id]/page.tsx` has reusable dashboard patterns such as empty dashed panels and record-oriented lists that are good future extraction candidates.
- `dokumen/page.tsx` has repeated file-row and empty-state patterns that also fit `dashboard/*` once reused.

## Keep Markup Local When

- It is used in only one place.
- The abstraction would mostly forward `className`.
- The field shape or content model is still changing.

## Extract a Dashboard Component When

- The pattern appears in 2 or more places.
- Its semantic purpose is stable.
- The repeated structure matters more than the repeated classes.

## Naming Rules

- Prefer semantic names such as `DetailGroup`.
- Prefer semantic names such as `FileAssetRow`.
- Avoid vague or decorative names such as `PrettyCard2` or `DocumentThing`.

## Accessibility Rules

- Section titles should be real headings when they help navigation.
- Links should stay links, even when they look like buttons.
- Empty states should remain specific and readable without surrounding context.
