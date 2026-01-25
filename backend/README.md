# Backend API

Express.js API server with PostgreSQL database connection.

## Setup

```bash
npm install
npm run dev
```

## API Endpoints

| Endpoint              | Description           |
| --------------------- | --------------------- |
| `/api/criminals`      | Criminal records      |
| `/api/thanas`         | Police stations       |
| `/api/officers`       | Police officers       |
| `/api/jails`          | Jail facilities       |
| `/api/arrests`        | Arrest records        |
| `/api/cases`          | Case files            |
| `/api/gd-reports`     | GD reports            |
| `/api/incarcerations` | Incarceration records |
| `/api/bail-records`   | Bail records          |
| `/api/analytics`      | System analytics      |
| `/api/health`         | Health check          |

## Database

All SQL files are in `src/database/`:

- `schema.sql` - Tables
- `views.sql` - Views
- `triggers.sql` - Triggers
- `indexes.sql` - Indexes
- `seed_data.sql` - Sample data
