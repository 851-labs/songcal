# D1 Queries

Reusable SQL queries for the production D1 database.

## Usage

Run a query against production:

```bash
bunx wrangler d1 execute songcal --remote --command "$(cat scripts/queries/<query-name>.sql)"
```

## Available Queries

### track-counts-by-user.sql

Count tracks per user with email.

```bash
bunx wrangler d1 execute songcal --remote --command "$(cat scripts/queries/track-counts-by-user.sql)"
```

### stats-overview.sql

High-level stats: total users, users with valid Apple Music token, total tracks.

```bash
bunx wrangler d1 execute songcal --remote --command "$(cat scripts/queries/stats-overview.sql)"
```
