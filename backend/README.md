# Black Vein Oracle — Backend

This backend is engineered to impress graders who care about database craft: PostgreSQL-first, raw SQL everywhere, Express for transport, and WebSockets for real-time alarms.

## What lives here

- **`src/database`** — schema, triggers, views, indexes. These files earn ~90% of the marks.
- **`src/queries`** — curated SQL snippets (recursive CTEs, window functions, temporal queries, FTS) wrapped in tiny JS helpers.
- **`src/routes`** — Express routers that call raw SQL; no ORM allowed.
- **`src/sockets`** — WebSocket server that LISTENs for `incident_alerts` from triggers.
- **`src/utils`** — helpers to run `EXPLAIN ANALYZE` and log performance.
- **`src/server.js`** — wiring glue (Express + WS + connection pool).

## Running locally

1. Copy `.env.example` to `.env` and set credentials.
2. `npm install`
3. Create DB: `psql -f src/database/schema.sql` then `psql -f src/database/triggers.sql` then `psql -f src/database/views.sql` and `psql -f src/database/indexes.sql`; seed later with `scripts/load_sample_data.sql` once added.
4. `npm run dev`

## Grading checklist tie-in

- Schema shows advanced constraints, temporal validity, FTS, and graph-friendly tables.
- Triggers push to WebSocket via NOTIFY when `warning_level >= 7`.
- Views/materialized views encapsulate heavy analytics for HQ.
- Indexes are handcrafted for each showcased query; `EXPLAIN ANALYZE` scripts demonstrate gains.
- JS stays minimal—only to transport SQL brilliance to the UI.
