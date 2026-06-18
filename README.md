# goodlogger

A self-contained local web app for creating custom data-logging templates, organizing them into projects, logging entries, and exporting as CSV. No authentication, no cloud, no telemetry.

## Features

- **Projects** — organize templates into named groups. Import the same template into multiple projects. Each project shows its templates, entry counts, and quick actions.
- **Template designer** — define any number of templates, each with up to 14 field types: Text, Number, Boolean, Dropdown, Multi-select, Date, Time, Slider, Email, URL, Phone, Color, Rich Text, Rating (stars).
- **Dynamic logging form** — open a template, fill it in, save. Each field type renders its own input control. Client-side validation, server-side re-validation.
- **Sortable & filterable view** — browse all entries for a template, sort by any column, filter by date range.
- **CSV export** — downloads a properly-quoted, injection-safe CSV. What you see in the filtered view is what gets exported.
- **Local-only** — data lives in `prisma/dev.db` (SQLite). No server, no network calls.

## Quick start

```bash
npm install
npm start
```

Open <http://localhost:3000>. A "Daily Standup" example template is seeded on first run.

## Requirements

- Node.js 20+ (tested on Node 24)
- ~150 MB of disk for `node_modules` and the SQLite file

## Scripts

| Command | What it does |
|---|---|
| `npm install` | Install dependencies, generate Prisma client, push DB schema |
| `npm start` | Run the dev server (alias for `next dev`) |
| `npm run build` | Production build |
| `npm start:prod` | Run the production server (requires `build` first) |
| `npm test` | Run unit tests once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run prisma:push` | Push schema changes to the SQLite DB |

## Field types

| Type | Input control | CSV format |
|---|---|---|
| Text | Text input | Raw string |
| Number | Number input | Number |
| Boolean | Checkbox | `Yes` / `No` |
| Dropdown | Select menu | Raw string |
| Multi-select | Checkbox group | Quoted, comma-separated when needed |
| Date | Date picker | `YYYY-MM-DD` |
| Time | Time picker | `HH:MM` |
| Slider | Range slider + value | Number |
| Email | Email input | Raw string |
| URL | URL input | Raw string |
| Phone | Tel input | Raw string |
| Color | Color picker + hex input | `#RRGGBB` |
| Rich Text | Textarea | Raw string |
| Rating | Star buttons (★☆) | Number (0 to max) |

## Data storage

- `prisma/dev.db` — the SQLite file. Delete it to start fresh.
- `prisma/schema.prisma` — the DB schema. Tables: `Template`, `Log`, `Project`, `ProjectTemplate`.

## CSV format

- UTF-8, comma-separated, header row of field names.
- Last column is `Timestamp (<IANA timezone>)` (e.g. `Timestamp (Europe/Berlin)`).
- String values are quoted only when needed (commas, quotes, or newlines).
- **CSV injection is defeated**: any cell starting with `=`, `+`, `-`, `@`, tab, or carriage return is prefixed with `'`.
- The timezone is also sent in the `X-GoodLogger-Timezone` HTTP header.

## Example

The seeded "Daily Standup" template exports rows like:

```csv
Mood,Slept well?,Energy level,Blockers,Start time,Mood Rating,Contact Email,Timestamp (Europe/Berlin)
😀,Yes,8,"People, Tools",09:00,4,user@example.com,2026-06-17 09:05:12
```

## Edge cases

- **Deleting a project** removes the project-template associations; templates themselves are not deleted.
- **Deleting a template** removes all its entries and its project associations.
- **Removing a template from a project** only removes the association; the template still exists globally.
- **Editing a template with existing entries** shows a warning banner.
- **Field names** must be unique within a template (case-insensitive).

## Project layout

```
app/           Next.js App Router pages, server actions, API routes
components/    React components
lib/           Pure logic: schema, validation, CSV, Prisma client, seed
prisma/        Database schema and SQLite file
```

## Reset

```bash
rm prisma/dev.db
npm run prisma:push
```

## License

MIT.
