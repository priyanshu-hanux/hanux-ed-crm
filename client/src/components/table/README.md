# Data table

A reusable data table built on TanStack Table v9 and shadcn/ui. Everything it needs lives in this folder.

```tsx
import { DataTable, createSortableHeader, type ColumnDef } from "@/components/table"
```

Import only from `@/components/table` (`index.ts`). The files below are internal.

## Structure

```
table/
├── index.ts            Public API
├── data-table.tsx      <DataTable />: wires the hooks and components together
├── config/             TanStack features (features.ts) and tunable constants (constants.ts)
├── types/              Props, column meta, filter, view and settings types
├── helpers/            Pure functions, no React
│   ├── columns.ts          column ids, labels, pinned/movable order
│   ├── filter-fns.ts       text / select / range filters, multi-column search
│   ├── filter-summary.ts   select options with counts, chip text, numeric bounds
│   ├── storage.ts          localStorage: layout settings and saved views
│   ├── url-state.ts        search and filters ⇄ URL
│   ├── views.ts            view ids, comparing setups
│   ├── export-csv.ts       CSV building (formula-safe) and download
│   ├── selection.ts        where the selection is (pages, hidden by filters)
│   ├── pagination.ts       page number list with ellipses
│   ├── clipboard.ts, errors.ts, sticky.ts
├── hooks/              Stateful logic, one concern per hook
│   ├── use-initial-state.ts        saved layout, saved views and URL filters, read once
│   ├── use-table-search.ts         debounced search
│   ├── use-column-visibility.ts    controlled/uncontrolled visibility
│   ├── use-table-columns.ts        adds the checkbox and actions columns
│   ├── use-column-order.ts         pinned + reorderable columns
│   ├── use-saved-views.ts          views: apply, save, rename, delete, "modified"
│   ├── use-table-persistence.ts    localStorage + URL sync
│   ├── use-filters-change.ts       server mode: report filters; client mode: back to page 1
│   ├── use-table-pagination.ts     one pagination model for client and server mode
│   ├── use-row-selection-sync.ts   prune and report the selection
│   ├── use-synced-scroll.ts        header / body / scrollbar scroll together
│   ├── use-sticky-columns.ts       pinned column offsets
│   ├── use-table-layout-flags.ts   data-stuck, overflow flags, gutter CSS variables
│   ├── use-element-height.ts       sticky toolbar height
│   ├── use-details-drawer.ts       open row, stepping, row click
│   ├── use-roving-focus.ts, use-keyboard-navigation.ts, use-global-shortcuts.ts
├── components/
│   ├── grid/          table frame, header row, column resizer, body rows
│   ├── toolbar/       search, views menu, export, column settings, refresh / bulk delete
│   ├── filters/       filters popover, filter panels, active filter chips
│   ├── cells/         copyable cell, sortable header, row actions menu
│   ├── columns/       checkbox and actions column definitions
│   ├── states/        skeletons, error state, stale-data banner, no results
│   ├── selection/     selection bar
│   ├── pagination/    footer with page links and rows per page
│   ├── details/       details drawer
│   ├── mobile/        card layout for narrow screens
│   └── dialogs/       keyboard shortcuts
└── styles/
    └── data-table.css  Table styles, imported by data-table.tsx
```

## Notes

- **Styles** are imported by `data-table.tsx`, so any page that renders the table gets them.
  The same rules still exist in `src/index.css` for the old `components/leads` table;
  remove that block once nothing uses the old table.
- **localStorage keys** are unchanged (`data-table:<persistKey>` and `data-table:<persistKey>:views`),
  so users keep their saved layouts and views when a page switches to this table.
