# goodlogger — Design Spec

**Date:** 2026-06-17
**Status:** Approved by user
**Project root:** `/home/home/Programming/goodlogger`

## 1. Purpose

A self-contained local web app for creating custom data-logging templates,
logging entries against them, viewing past entries, and exporting them as CSV.
No authentication. Runs on the user's PC with a single command.

## 2. Tech Stack

- **Runtime:** Node.js 24 (already installed)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict)
- **Database:** SQLite via Prisma
- **Styling:** Tailwind CSS v3
- **Validation:** Zod
- **Testing:** Vitest + Testing Library (smoke component tests)
- **Package manager:** npm

The single dev process is `next dev`; the single user command is
`npm install && npm start` (where `npm start` is aliased to `next dev`).

## 3. Architecture

### 3.1 Process model

A single Next.js dev server serves both the UI and the data layer. Mutations
use **Server Actions** (typed, no fetch boilerplate, automatic cache
revalidation). Reads happen in **Server Components** via Prisma.

There are no REST routes for **mutations**: every server action is exported
from `app/actions/*.ts` and invoked from a Client Component form. The
**one exception** is the CSV export endpoint
(`app/api/templates/[id]/export/route.ts`), which is a GET route handler
so the browser can stream the file with proper `Content-Disposition`
headers. This is a deliberate, single-exception to the "server actions
only" rule, justified by HTTP semantics around file downloads.

### 3.2 Source-of-truth for field types

`lib/schema.ts` defines:

- `FieldType` union: `'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'date' | 'time' | 'slider'`
- `FieldDef` discriminated union (see §4.2)
- Zod schemas for each variant
- `validateFieldDef(def)` for the designer
- `buildLogValueSchema(fields)` returning a Zod object schema for a given template

All client-side and server-side validation goes through the same Zod schemas.

### 3.3 CSV building

`lib/csv.ts` exports `buildCsv(template, logs): string` and is **pure**
(no DB, no IO). It is exhaustively unit-tested.

## 4. Data Model

### 4.1 Prisma schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Template {
  id        String   @id @default(cuid())
  name      String   @unique
  fields    String   // JSON: FieldDef[] (SQLite has no native JSON; stored as TEXT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  logs      Log[]
}

model Log {
  id         String   @id @default(cuid())
  templateId String
  template   Template @relation(fields: [templateId], references: [id], onDelete: Cascade)
  values     String   // JSON: Record<fieldId, value>
  loggedAt   DateTime @default(now())

  @@index([templateId, loggedAt])
}
```

`fields` and `values` are stored as JSON-encoded `String` columns because
SQLite has no native JSON type. Prisma's `Json` type is supported on SQLite
via Prisma 5+ but is normalized to TEXT under the hood; we store as `String`
explicitly to make the encoding obvious and avoid surprise behavior.

### 4.2 TypeScript types (`lib/schema.ts`)

```ts
export type FieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'time'
  | 'slider';

export type FieldDef =
  | { id: string; name: string; type: 'text' | 'number' | 'date' | 'time'; required: boolean }
  | { id: string; name: string; type: 'boolean'; required: boolean }
  | { id: string; name: string; type: 'select' | 'multiselect'; required: boolean; options: string[] }
  | { id: string; name: string; type: 'slider'; required: boolean; min: number; max: number; step: number };

export type LogValue = string | number | boolean | string[];
export type LogValues = Record<string, LogValue>;
```

## 5. UI / Routes

| Route | Purpose | Component type |
|---|---|---|
| `/` | List templates + actions (Log, View Logs, Edit, Delete, + New) | Server Component |
| `/templates/new` | Designer: create template | Client (interactive) |
| `/templates/[id]/edit` | Designer: edit template | Client (interactive) |
| `/templates/[id]/log` | Dynamic data-entry form | Client (interactive) |
| `/templates/[id]/logs` | Sortable table, date filter, Export CSV | Server (table) + Client (filter) |

### 5.1 Template list (`/`)

- Each template shown as a card/row with: name, field count, log count,
  "Log Entry" / "View Logs" / "Edit" / "Delete" buttons.
- "New Template" button at top.
- The example "Daily Standup" template is seeded on first run if no
  templates exist.

### 5.2 Designer (`/templates/new`, `/templates/[id]/edit`)

- Form for template name.
- Dynamic field list with "Add Field" button. Each field row has:
  - Name (text)
  - Type (dropdown of the 8 types)
  - Required (checkbox, default checked)
  - Type-specific config (rendered conditionally):
    - `select` / `multiselect`: options textarea (one per line, or
      comma-separated; parsed into string[])
    - `slider`: min, max, step number inputs (min < max, step > 0)
- Drag-handle-free list (no reorder in v1) — fields rendered in add order.
- Field names validated case-insensitively unique within the template.
- On Edit, if `logCount > 0`, the page shows a banner:
  > "Heads up: this template has N entries. Changing or removing fields
  > will cause older entries to show '—' for affected columns."

### 5.3 Logging form (`/templates/[id]/log`)

- Renders one input per field, using the appropriate control:
  - `text` → `<input type="text">`
  - `number` → `<input type="number">`
  - `boolean` → `<input type="checkbox">`
  - `select` → `<select>` with options
  - `multiselect` → group of checkboxes
  - `date` → `<input type="date">`
  - `time` → `<input type="time">`
  - `slider` → `<input type="range">` with current value displayed
- Required fields marked with `*`.
- Submit disabled until valid; client-side validation via the same Zod
  schemas. On success, redirect to `/templates/[id]/logs` and show a
  transient toast.

### 5.4 View / Export (`/templates/[id]/logs`)

- Table columns: each field's current name + "Logged At".
  - If a log's value key is missing for a field (because the field was
    added after the log was created, or the field was renamed/removed),
    the cell shows "—".
- Sortable headers (click to sort asc/desc; first click sorts by the
  most-natural type for the field).
- Date range filter (from / to) — both optional, applied to `loggedAt`.
- "Export CSV" button always exports the **currently filtered** set
  (not all logs). This is the principle of least surprise: what you
  see is what you export.
- "Delete" button per log row (with confirm).

## 6. CSV Format (`lib/csv.ts`)

### 6.1 Header

- Column order: field definitions in template order, then the timestamp
  column (last column).
- Column header is the field's current `name`. If a log predates a
  field, the cell is `—` (en dash).
- The timestamp column header is `Timestamp (<TZ>)` where `<TZ>` is the
  IANA timezone name detected at export time via
  `Intl.DateTimeFormat().resolvedOptions().timeZone` (e.g.,
  `Timestamp (Europe/Berlin)`). This satisfies the spec's request to
  "note the timezone in the CSV header" without breaking parsers with
  a leading comment line.
- The HTTP response also includes an `X-GoodLogger-Timezone` header
  carrying the same value, for programmatic consumers.

### 6.2 Cell formatting

| Field type | Empty / null | Value formatting |
|---|---|---|
| `text` | empty string | raw string |
| `number` | empty string | number as JS `String(value)` |
| `boolean` | empty string | `Yes` if true, `No` if false |
| `select` | empty string | raw string |
| `multiselect` | empty string | `, `-joined string of options, **always quoted** |
| `date` | empty string | `YYYY-MM-DD` |
| `time` | empty string | `HH:MM` (24h) |
| `slider` | empty string | number as `String(value)` |
| timestamp | (n/a) | `YYYY-MM-DD HH:MM:SS` in local time |

### 6.3 Quoting & injection safety

- All string values are wrapped in double quotes.
- Internal double quotes are escaped as `""`.
- **CSV injection defense:** any cell whose first character is one of
  `=`, `+`, `-`, `@`, `\t` (tab), or `\r` (carriage return) is prefixed
  with a single apostrophe `'` before quoting. This neutralizes formula
  injection in Excel / Google Sheets / LibreOffice.
- Newlines inside string values are preserved as `\n` (no escaping needed
  inside quoted CSV).

## 7. Server Actions

All in `app/actions/`:

- `createTemplate(formData)` — validates with zod, inserts row.
- `updateTemplate(id, formData)` — validates, updates row.
- `deleteTemplate(id)` — cascade deletes logs.
- `createLog(templateId, values)` — validates against template's fields,
  inserts log row.
- `deleteLog(id)` — removes a single log.
- `exportLogsCsv(templateId, from?, to?)` — returns the CSV string and
  triggers a download via the client. (Implemented as a route handler
  `app/api/templates/[id]/export/route.ts` for clean `Content-Disposition`
  handling — the only API route in the project, used by the Export
  button. This is a deliberate exception to the "server actions only"
  rule, justified by HTTP semantics.)

## 8. Project Structure

```
goodlogger/
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                      # template list
│   ├── templates/
│   │   ├── new/page.tsx
│   │   └── [id]/
│   │       ├── edit/page.tsx
│   │       ├── log/page.tsx
│   │       └── logs/page.tsx
│   ├── actions/
│   │   ├── templates.ts              # createTemplate, updateTemplate, deleteTemplate
│   │   └── logs.ts                   # createLog, deleteLog
│   └── api/
│       └── templates/[id]/export/route.ts   # CSV download
├── components/
│   ├── TemplateList.tsx
│   ├── TemplateDesigner.tsx
│   ├── FieldRow.tsx
│   ├── LogForm.tsx                   # dynamic form
│   ├── LogTable.tsx
│   └── DeleteButton.tsx
├── lib/
│   ├── schema.ts                     # types + zod
│   ├── validate.ts                   # log value validation
│   ├── csv.ts                        # buildCsv
│   ├── prisma.ts                     # singleton client
│   ├── seed.ts                       # Daily Standup template
│   └── __tests__/
│       ├── csv.test.ts
│       ├── validate.test.ts
│       └── schema.test.ts
├── prisma/
│   ├── schema.prisma
│   └── dev.db                        # gitignored
├── public/
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
└── README.md
```

## 9. Setup & Run

```bash
cd goodlogger
npm install        # postinstall runs: prisma generate && prisma db push
npm start          # = next dev, opens http://localhost:3000
```

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "start": "next dev",
    "build": "next build",
    "start:prod": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:push": "prisma db push",
    "postinstall": "prisma generate && prisma db push"
  }
}
```

`prisma db push` is non-interactive by default with a fresh local SQLite
file; no flags needed.

## 10. Testing

**Vitest** for unit tests of pure logic:

- `lib/schema.test.ts` — `validateFieldDef` covers each type's happy path
  and each type's failure cases (missing options, min >= max, etc.).
- `lib/validate.test.ts` — `buildLogValueSchema` rejects bad values,
  accepts good ones; tests every field type.
- `lib/csv.test.ts` — exhaustive:
  - All field types round-trip correctly
  - Empty / missing values produce empty cells
  - Boolean → `Yes`/`No`
  - Multi-select → quoted, comma-joined
  - Timestamps formatted in local time
  - Quoting: cells with `,`, `"`, `\n` are quoted and escaped
  - Injection: cells starting with `=`, `+`, `-`, `@`, tab, CR are
    prefixed with `'`
  - Header row matches field order + `Timestamp`
  - Example: the spec's Daily Standup sample row matches the expected
    CSV output

**Manual smoke test** documented in `README.md`:

1. Open `http://localhost:3000`
2. Confirm "Daily Standup" seed template is shown
3. Click "Log Entry" → fill in the form → submit
4. Click "View Logs" → confirm entry is shown
5. Click "Export CSV" → open the file → confirm it matches expectations
6. Create a new template with at least one of each field type
7. Log a few entries
8. Filter by date range → export → confirm filter applied

## 11. Edge Cases & Decisions

| Scenario | Behavior |
|---|---|
| Delete template with logs | Confirm dialog shows log count; cascade delete on confirm |
| Remove a field from an existing template | Banner warns; on save, older logs render `—` for that column |
| Rename a field | Older logs render the cell under the new name (lookup is by field ID, so renaming just changes the header) |
| Change a field's type | Banner warns; older logs render `—` for that column (the value's stored JSON may not be type-coercible) |
| Field name collision (case-insensitive) | Designer rejects; error shown inline |
| Empty options for select/multiselect | Designer rejects; error shown inline |
| `min >= max` or `step <= 0` for slider | Designer rejects; error shown inline |
| Multiselect with nothing checked and `required: true` | Submit disabled; error shown |
| Empty logs table | Friendly empty state; Export button disabled |
| CSV cell starting with `=+@-`\t\r | Prefixed with `'` to defeat formula injection |
| Multiselect values with commas | Quoted in CSV (`"People, Tools"`) |
| UTC vs local time | Stored as UTC; rendered in local time in UI; CSV timestamps also in local time; README documents this |
| Concurrent edits | Not a concern (single-user local app) |

## 12. Out of Scope

- Authentication, users, sharing
- Field reordering (v1: fields keep insertion order)
- Bulk import of CSV (export-only in v1)
- Charts / aggregations
- Internationalization
- Dark mode (not requested; can be added later via `prefers-color-scheme`)
- Database migrations across versions (local-only; `prisma db push` is fine)

## 13. Open Risks

- **Next.js 15 + Prisma 5/6 compatibility:** pinned versions in
  `package.json`. If `postinstall` fails on the user's PC, fallback
  instructions in README.
- **`prisma db push` in `postinstall`:** safe on first install (creates
  the file); safe on subsequent installs (no-op if schema is current).
  If schema changes are pushed to a version with an existing local DB,
  destructive changes require `--accept-data-loss`; README documents
  how to wipe `prisma/dev.db` to reset.
- **Long field names breaking CSV column widths:** accepted; CSV readers
  handle this fine.

## 14. References

- Spec request: user message, 2026-06-17
- Next.js 15 App Router docs
- Prisma SQLite docs
- OWASP CSV Injection guidance
