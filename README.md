# Bangladesh Jail & Thana Management System

A full-stack web app for managing jail facilities, police stations (thanas), criminals, arrests, and case files in Bangladesh.

## Features

- **Criminal Records**: Track criminals with risk levels, status (custody/bail/released), and NID
- **Arrest Management**: Log arrests, manage custody status, bail dates
- **Jail & Cells**: Manage jails, cell blocks, and individual cells
- **Thana (Police Stations)**: Track police stations across districts
- **Officers**: Manage police officers with ranks and assignments
- **Case Files**: Track cases linked to criminals and thanas
- **GD Reports**: Public can submit General Diary reports
- **Analytics**: View system stats and query performance

## Tech Stack

- **Frontend**: React 18, Vite, CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL 18
- **No ORM**: Raw SQL queries only

## Quick Start

### Frontend Only (Mock Data)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### With Backend

```bash
# Setup database first
psql -U postgres -c "CREATE DATABASE black_vein_oracle;"
psql -U postgres -d black_vein_oracle -f backend/src/database/schema.sql

# Start backend
cd backend
npm install
npm run dev

# Start frontend (separate terminal)
cd frontend
npm run dev
```

## Project Structure

```
├── frontend/          # React app
│   └── src/
│       ├── pages/     # Dashboard, Criminals, Jails, etc.
│       └── styles/    # CSS
├── backend/           # Express API
│   └── src/
│       ├── database/  # Schema, views, triggers, indexes
│       ├── routes/    # REST endpoints
│       └── queries/   # SQL query helpers
└── README.md
```

## Database Highlights

- **Raw SQL**: No ORM, pure PostgreSQL
- **Triggers**: Auto-update timestamps, alerts
- **Views**: Pre-built analytics queries
- **Indexes**: Optimized for common queries
- **Full-text search**: Criminal name search

## Screenshots

The app uses a clean, government-style design with:

- Dark blue sidebar
- White cards with subtle shadows
- Color-coded status badges
- Professional typography

## License

MIT
