# Bangladesh Jail & Thana Management System

## Database Design Documentation

**Course:** Database Management Systems  
**Project Title:** Jail and Thana (Police Station) Management System  
**Technology Stack:** PostgreSQL 18 + Node.js + React (PERN Stack)

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [Database Schema Analysis](#2-database-schema-analysis)
3. [Table Descriptions](#3-table-descriptions)
4. [Relationships and Constraints](#4-relationships-and-constraints)
5. [Database Connection Code](#5-database-connection-code)
6. [Views Implementation](#6-views-implementation)
7. [Triggers Implementation](#7-triggers-implementation)
8. [Indexes and Optimization](#8-indexes-and-optimization)
9. [Sample Queries](#9-sample-queries)

---

# 1. Project Overview

## 1.1 Introduction

This project implements a comprehensive database management system for managing jail facilities and police stations (thanas) in Bangladesh. The system tracks criminals, arrests, incarcerations, bail records, and allows citizens to submit General Diary (GD) reports online.

## 1.2 System Objectives

- Manage police stations (thanas) across different districts
- Track police officers and their assignments
- Maintain criminal records with risk assessment
- Record arrest and incarceration details
- Manage jail facilities, cell blocks, and individual cells
- Allow citizens to submit GD reports online
- Track criminal organizations and networks
- Manage bail records and court proceedings

## 1.3 User Roles

| Role        | Description                                        | Permissions                                          |
| ----------- | -------------------------------------------------- | ---------------------------------------------------- |
| **Admin**   | Government officials from Ministry of Home Affairs | Create thanas, assign officers, full system access   |
| **Officer** | Police personnel at thanas                         | Manage criminals, arrests, cases, approve GD reports |
| **User**    | Citizens with registered accounts                  | Submit GD reports, view public criminal information  |

---

# 2. Database Schema Analysis

## 2.1 Schema Design Principles

The database follows these design principles:

1. **Third Normal Form (3NF)**: All tables are normalized to eliminate redundancy
2. **Referential Integrity**: Foreign keys ensure data consistency
3. **UUID Primary Keys**: Used for sensitive entities (admin, officers, criminals) for security
4. **SERIAL Primary Keys**: Used for simpler entities (locations, jails, cells)
5. **Check Constraints**: Enforce business rules at database level
6. **Timestamps**: Track creation and modification times

## 2.2 Data Types Used

| Data Type        | Usage                                          | Example                 |
| ---------------- | ---------------------------------------------- | ----------------------- |
| UUID             | Unique identifiers for security-sensitive data | criminal_id, officer_id |
| SERIAL/BIGSERIAL | Auto-incrementing integers                     | thana_id, jail_id       |
| TEXT             | Variable-length strings                        | names, addresses        |
| INT              | Integer values                                 | capacity, risk_level    |
| NUMERIC(12,2)    | Currency/decimal values                        | bail_amount             |
| DATE             | Date only                                      | arrest_date             |
| TIMESTAMPTZ      | Timestamp with timezone                        | submitted_at            |

---

# 3. Table Descriptions

## 4.1 Admin Table

**Purpose:** Stores government administrator information who manage the entire system.

```sql
CREATE TABLE IF NOT EXISTS admin (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);
```

| Column    | Type | Constraints       | Description                  |
| --------- | ---- | ----------------- | ---------------------------- |
| admin_id  | UUID | PRIMARY KEY, AUTO | Unique identifier using UUID |
| full_name | TEXT | NOT NULL          | Administrator's full name    |
| email     | TEXT | NOT NULL, UNIQUE  | Government email address     |

**Design Decision:** UUID is used for admin_id to prevent enumeration attacks and provide globally unique identifiers.

---

## 4.2 Thanas Table

**Purpose:** Stores information about police stations across Bangladesh.

```sql
CREATE TABLE IF NOT EXISTS thanas (
    thana_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    created_by_admin_id UUID NOT NULL REFERENCES admin(admin_id),
    head_officer_id UUID
);
```

| Column              | Type   | Constraints | Description                  |
| ------------------- | ------ | ----------- | ---------------------------- |
| thana_id            | SERIAL | PRIMARY KEY | Auto-incrementing identifier |
| name                | TEXT   | NOT NULL    | Police station name          |
| district            | TEXT   | NOT NULL    | District location            |
| address             | TEXT   | NOT NULL    | Full address                 |
| created_by_admin_id | UUID   | FOREIGN KEY | Admin who created this thana |
| head_officer_id     | UUID   | FOREIGN KEY | Officer-in-Charge reference  |

**Special Note:** The `head_officer_id` creates a circular reference with the `officers` table. This is resolved using a deferred constraint that is added after the officers table is created.

---

## 4.3 Ranks Table

**Purpose:** Lookup table for police officer ranks in Bangladesh Police hierarchy.

```sql
CREATE TABLE IF NOT EXISTS ranks (
    rank_code TEXT PRIMARY KEY,
    rank_name TEXT NOT NULL,
    level INT NOT NULL CHECK (level >= 1)
);

INSERT INTO ranks (rank_code, rank_name, level) VALUES
    ('constable', 'Constable', 1),
    ('si', 'Sub-Inspector', 2),
    ('inspector', 'Inspector', 3),
    ('oc', 'Officer-in-Charge', 4)
ON CONFLICT DO NOTHING;
```

| Column    | Type | Constraints | Description                  |
| --------- | ---- | ----------- | ---------------------------- |
| rank_code | TEXT | PRIMARY KEY | Short code for rank          |
| rank_name | TEXT | NOT NULL    | Full rank name               |
| level     | INT  | CHECK >= 1  | Hierarchy level (1 = lowest) |

**Design Decision:** Using TEXT as primary key (rank_code) instead of integer provides readable foreign key values and self-documenting data.

---

## 4.4 Officers Table

**Purpose:** Stores police officer information with thana assignments.

```sql
CREATE TABLE IF NOT EXISTS officers (
    officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thana_id INT NOT NULL REFERENCES thanas(thana_id) ON DELETE CASCADE,
    rank_code TEXT NOT NULL REFERENCES ranks(rank_code),
    full_name TEXT NOT NULL,
    badge_no TEXT NOT NULL UNIQUE
);
```

| Column     | Type | Constraints                    | Description               |
| ---------- | ---- | ------------------------------ | ------------------------- |
| officer_id | UUID | PRIMARY KEY                    | Unique officer identifier |
| thana_id   | INT  | FOREIGN KEY, ON DELETE CASCADE | Assigned police station   |
| rank_code  | TEXT | FOREIGN KEY                    | Officer's rank            |
| full_name  | TEXT | NOT NULL                       | Officer's full name       |
| badge_no   | TEXT | UNIQUE                         | Unique badge number       |

**CASCADE Rule:** When a thana is deleted, all officers assigned to it are also deleted. This maintains referential integrity.

---

## 4.5 Locations Table

**Purpose:** Geographic location data for tracking criminal movements.

```sql
CREATE TABLE IF NOT EXISTS locations (
    location_id SERIAL PRIMARY KEY,
    district TEXT NOT NULL,
    thana_area TEXT,
    address TEXT
);
```

| Column      | Type   | Constraints | Description          |
| ----------- | ------ | ----------- | -------------------- |
| location_id | SERIAL | PRIMARY KEY | Auto-incrementing ID |
| district    | TEXT   | NOT NULL    | District name        |
| thana_area  | TEXT   | NULLABLE    | Thana area name      |
| address     | TEXT   | NULLABLE    | Specific address     |

---

## 4.6 Users Table

**Purpose:** Citizen accounts for online GD report submission.

```sql
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    nid_number TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    address TEXT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);
```

| Column        | Type | Constraints | Description            |
| ------------- | ---- | ----------- | ---------------------- |
| user_id       | UUID | PRIMARY KEY | Unique user identifier |
| full_name     | TEXT | NOT NULL    | Citizen's full name    |
| nid_number    | TEXT | UNIQUE      | National ID number     |
| phone         | TEXT | NOT NULL    | Contact phone number   |
| address       | TEXT | NULLABLE    | Residential address    |
| email         | TEXT | UNIQUE      | Email for login        |
| password_hash | TEXT | NOT NULL    | Bcrypt hashed password |

**Security Note:** Passwords are stored as bcrypt hashes, never in plain text. The password_hash column stores the complete hash including salt.

---

## 4.7 GD Reports Table

**Purpose:** General Diary entries submitted by citizens online.

```sql
CREATE TABLE IF NOT EXISTS gd_reports (
    gd_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    thana_id INT NOT NULL REFERENCES thanas(thana_id),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('submitted','approved','rejected'))
        DEFAULT 'submitted',
    approved_by_officer_id UUID REFERENCES officers(officer_id)
);
```

| Column                 | Type        | Constraints           | Description           |
| ---------------------- | ----------- | --------------------- | --------------------- |
| gd_id                  | BIGSERIAL   | PRIMARY KEY           | GD report number      |
| user_id                | UUID        | FOREIGN KEY, CASCADE  | Submitting citizen    |
| thana_id               | INT         | FOREIGN KEY           | Target police station |
| submitted_at           | TIMESTAMPTZ | DEFAULT NOW()         | Submission timestamp  |
| description            | TEXT        | NOT NULL              | Report details        |
| status                 | TEXT        | CHECK CONSTRAINT      | Report status         |
| approved_by_officer_id | UUID        | FOREIGN KEY, NULLABLE | Approving officer     |

**Workflow:** Status follows: submitted → approved/rejected. The approved_by_officer_id is NULL until an officer reviews the report.

---

## 4.8 Criminals Table

**Purpose:** Master record of known criminals with risk assessment.

```sql
CREATE TABLE IF NOT EXISTS criminals (
    criminal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    nid_or_alias TEXT,
    status TEXT NOT NULL CHECK (status IN
        ('in_custody','on_bail','released','escaped','unknown')) DEFAULT 'unknown',
    risk_level INT NOT NULL CHECK (risk_level BETWEEN 1 AND 10) DEFAULT 1,
    registered_thana_id INT REFERENCES thanas(thana_id)
);
```

| Column              | Type | Constraints      | Description                |
| ------------------- | ---- | ---------------- | -------------------------- |
| criminal_id         | UUID | PRIMARY KEY      | Unique criminal identifier |
| full_name           | TEXT | NOT NULL         | Criminal's name            |
| nid_or_alias        | TEXT | NULLABLE         | NID or known alias         |
| status              | TEXT | CHECK CONSTRAINT | Current custody status     |
| risk_level          | INT  | CHECK 1-10       | Risk assessment score      |
| registered_thana_id | INT  | FOREIGN KEY      | Registering thana          |

**Status Values Explained:**

- `in_custody`: Currently in jail
- `on_bail`: Released on court bail
- `released`: Sentence completed
- `escaped`: Prison escapee
- `unknown`: Status not determined

---

## 4.9 Organizations Table

**Purpose:** Criminal organizations/gangs database.

```sql
CREATE TABLE IF NOT EXISTS organizations (
    org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    ideology TEXT,
    threat_level INT NOT NULL CHECK (threat_level BETWEEN 1 AND 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column       | Type        | Constraints   | Description               |
| ------------ | ----------- | ------------- | ------------------------- |
| org_id       | UUID        | PRIMARY KEY   | Organization identifier   |
| name         | TEXT        | UNIQUE        | Organization name         |
| ideology     | TEXT        | NULLABLE      | Criminal purpose/ideology |
| threat_level | INT         | CHECK 1-10    | Threat assessment         |
| created_at   | TIMESTAMPTZ | DEFAULT NOW() | Record creation time      |

---

## 4.10 Criminal Organizations Junction Table

**Purpose:** Many-to-many relationship between criminals and organizations.

```sql
CREATE TABLE IF NOT EXISTS criminal_organizations (
    criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
    role TEXT,
    PRIMARY KEY (criminal_id, org_id)
);
```

| Column      | Type | Constraints          | Description            |
| ----------- | ---- | -------------------- | ---------------------- |
| criminal_id | UUID | FOREIGN KEY, CASCADE | Criminal reference     |
| org_id      | UUID | FOREIGN KEY, CASCADE | Organization reference |
| role        | TEXT | NULLABLE             | Role in organization   |

**Composite Primary Key:** The combination of (criminal_id, org_id) ensures a criminal can only have one role in each organization.

---

## 4.11 Criminal Relations Table

**Purpose:** Self-referential relationship tracking criminal networks.

```sql
CREATE TABLE IF NOT EXISTS criminal_relations (
    relation_id SERIAL PRIMARY KEY,
    criminal_id_1 UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
    criminal_id_2 UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK
        (relation_type IN ('associate','family','financial','accomplice')),
    CHECK (criminal_id_1 <> criminal_id_2),
    UNIQUE (criminal_id_1, criminal_id_2, relation_type)
);
```

| Column        | Type   | Constraints      | Description          |
| ------------- | ------ | ---------------- | -------------------- |
| relation_id   | SERIAL | PRIMARY KEY      | Relation identifier  |
| criminal_id_1 | UUID   | FOREIGN KEY      | First criminal       |
| criminal_id_2 | UUID   | FOREIGN KEY      | Second criminal      |
| relation_type | TEXT   | CHECK CONSTRAINT | Type of relationship |

**Self-Reference Check:** The CHECK constraint `criminal_id_1 <> criminal_id_2` prevents a criminal from being related to themselves.

---

## 4.12 Case Files Table

**Purpose:** Legal case records against criminals.

```sql
CREATE TABLE IF NOT EXISTS case_files (
    case_id BIGSERIAL PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
    thana_id INT NOT NULL REFERENCES thanas(thana_id),
    case_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open','investigating','closed'))
        DEFAULT 'open',
    filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column      | Type        | Constraints      | Description          |
| ----------- | ----------- | ---------------- | -------------------- |
| case_id     | BIGSERIAL   | PRIMARY KEY      | Internal case ID     |
| case_number | TEXT        | UNIQUE           | Official case number |
| criminal_id | UUID        | FOREIGN KEY      | Accused criminal     |
| thana_id    | INT         | FOREIGN KEY      | Filing thana         |
| case_type   | TEXT        | NOT NULL         | Type of crime        |
| status      | TEXT        | CHECK CONSTRAINT | Case status          |
| filed_at    | TIMESTAMPTZ | DEFAULT NOW()    | Filing timestamp     |

---

## 4.13 Jails Table

**Purpose:** Prison facility information.

```sql
CREATE TABLE IF NOT EXISTS jails (
    jail_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    address TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0)
);
```

| Column   | Type   | Constraints | Description       |
| -------- | ------ | ----------- | ----------------- |
| jail_id  | SERIAL | PRIMARY KEY | Jail identifier   |
| name     | TEXT   | NOT NULL    | Jail name         |
| district | TEXT   | NOT NULL    | District location |
| address  | TEXT   | NOT NULL    | Full address      |
| capacity | INT    | CHECK > 0   | Maximum capacity  |

---

## 4.14 Cell Blocks Table

**Purpose:** Organizational units within jails.

```sql
CREATE TABLE IF NOT EXISTS cell_blocks (
    block_id SERIAL PRIMARY KEY,
    jail_id INT NOT NULL REFERENCES jails(jail_id) ON DELETE CASCADE,
    block_name TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0)
);
```

| Column     | Type   | Constraints          | Description       |
| ---------- | ------ | -------------------- | ----------------- |
| block_id   | SERIAL | PRIMARY KEY          | Block identifier  |
| jail_id    | INT    | FOREIGN KEY, CASCADE | Parent jail       |
| block_name | TEXT   | NOT NULL             | Block designation |
| capacity   | INT    | CHECK > 0            | Block capacity    |

---

## 4.15 Cells Table

**Purpose:** Individual prison cells within blocks.

```sql
CREATE TABLE IF NOT EXISTS cells (
    cell_id SERIAL PRIMARY KEY,
    block_id INT NOT NULL REFERENCES cell_blocks(block_id) ON DELETE CASCADE,
    cell_number TEXT NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    status TEXT NOT NULL CHECK (status IN ('available','occupied','maintenance'))
        DEFAULT 'available',
    UNIQUE (block_id, cell_number)
);
```

| Column      | Type   | Constraints          | Description      |
| ----------- | ------ | -------------------- | ---------------- |
| cell_id     | SERIAL | PRIMARY KEY          | Cell identifier  |
| block_id    | INT    | FOREIGN KEY, CASCADE | Parent block     |
| cell_number | TEXT   | NOT NULL             | Cell designation |
| capacity    | INT    | CHECK > 0            | Cell capacity    |
| status      | TEXT   | CHECK CONSTRAINT     | Current status   |

**Composite Unique:** `UNIQUE (block_id, cell_number)` ensures cell numbers are unique within each block.

---

## 4.16 Arrest Records Table

**Purpose:** Records of arrests made by police.

```sql
CREATE TABLE IF NOT EXISTS arrest_records (
    arrest_id BIGSERIAL PRIMARY KEY,
    criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
    thana_id INT NOT NULL REFERENCES thanas(thana_id),
    arrest_date DATE NOT NULL,
    bail_due_date DATE,
    custody_status TEXT NOT NULL CHECK
        (custody_status IN ('in_custody','on_bail','released','transferred')),
    case_reference TEXT
);
```

| Column         | Type      | Constraints      | Description         |
| -------------- | --------- | ---------------- | ------------------- |
| arrest_id      | BIGSERIAL | PRIMARY KEY      | Arrest record ID    |
| criminal_id    | UUID      | FOREIGN KEY      | Arrested criminal   |
| thana_id       | INT       | FOREIGN KEY      | Arresting thana     |
| arrest_date    | DATE      | NOT NULL         | Date of arrest      |
| bail_due_date  | DATE      | NULLABLE         | Bail deadline       |
| custody_status | TEXT      | CHECK CONSTRAINT | Current status      |
| case_reference | TEXT      | NULLABLE         | Related case number |

---

## 4.17 Incarcerations Table

**Purpose:** Links arrests to jail cell assignments.

```sql
CREATE TABLE IF NOT EXISTS incarcerations (
    incarceration_id BIGSERIAL PRIMARY KEY,
    arrest_id BIGINT NOT NULL REFERENCES arrest_records(arrest_id) ON DELETE CASCADE,
    jail_id INT NOT NULL REFERENCES jails(jail_id),
    cell_id INT REFERENCES cells(cell_id),
    admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ
);
```

| Column           | Type        | Constraints           | Description                       |
| ---------------- | ----------- | --------------------- | --------------------------------- |
| incarceration_id | BIGSERIAL   | PRIMARY KEY           | Incarceration ID                  |
| arrest_id        | BIGINT      | FOREIGN KEY           | Related arrest                    |
| jail_id          | INT         | FOREIGN KEY           | Prison facility                   |
| cell_id          | INT         | FOREIGN KEY, NULLABLE | Assigned cell                     |
| admitted_at      | TIMESTAMPTZ | DEFAULT NOW()         | Prison entry time                 |
| released_at      | TIMESTAMPTZ | NULLABLE              | Release time (NULL if still held) |

---

## 4.18 Bail Records Table

**Purpose:** Court bail information for arrested criminals.

```sql
CREATE TABLE IF NOT EXISTS bail_records (
    bail_id BIGSERIAL PRIMARY KEY,
    arrest_id BIGINT NOT NULL REFERENCES arrest_records(arrest_id) ON DELETE CASCADE,
    court_name TEXT NOT NULL,
    bail_amount NUMERIC(12,2),
    granted_at DATE,
    surety_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending','granted','rejected'))
        DEFAULT 'pending'
);
```

| Column      | Type          | Constraints      | Description        |
| ----------- | ------------- | ---------------- | ------------------ |
| bail_id     | BIGSERIAL     | PRIMARY KEY      | Bail record ID     |
| arrest_id   | BIGINT        | FOREIGN KEY      | Related arrest     |
| court_name  | TEXT          | NOT NULL         | Court name         |
| bail_amount | NUMERIC(12,2) | NULLABLE         | Bail amount in BDT |
| granted_at  | DATE          | NULLABLE         | Grant date         |
| surety_name | TEXT          | NULLABLE         | Guarantor name     |
| status      | TEXT          | CHECK CONSTRAINT | Bail status        |

---

## 4.19 Criminal Locations Table

**Purpose:** Historical location tracking for criminals.

```sql
CREATE TABLE IF NOT EXISTS criminal_locations (
    criminal_location_id BIGSERIAL PRIMARY KEY,
    criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations(location_id),
    noted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| Column               | Type        | Constraints   | Description               |
| -------------------- | ----------- | ------------- | ------------------------- |
| criminal_location_id | BIGSERIAL   | PRIMARY KEY   | Location record ID        |
| criminal_id          | UUID        | FOREIGN KEY   | Criminal tracked          |
| location_id          | INT         | FOREIGN KEY   | Location reference        |
| noted_at             | TIMESTAMPTZ | DEFAULT NOW() | When criminal was spotted |

---

# 4. Relationships and Constraints

## 5.1 Foreign Key Relationships

```sql
-- Admin creates Thanas
thanas.created_by_admin_id → admin.admin_id

-- Thana has head officer (circular reference)
thanas.head_officer_id → officers.officer_id

-- Officers belong to Thanas
officers.thana_id → thanas.thana_id (ON DELETE CASCADE)

-- Officers have Ranks
officers.rank_code → ranks.rank_code

-- Users submit GD Reports
gd_reports.user_id → users.user_id (ON DELETE CASCADE)

-- GD Reports go to Thanas
gd_reports.thana_id → thanas.thana_id

-- Officers approve GD Reports
gd_reports.approved_by_officer_id → officers.officer_id

-- Criminals registered at Thanas
criminals.registered_thana_id → thanas.thana_id

-- Criminal-Organization junction
criminal_organizations.criminal_id → criminals.criminal_id (ON DELETE CASCADE)
criminal_organizations.org_id → organizations.org_id (ON DELETE CASCADE)

-- Criminal self-relations
criminal_relations.criminal_id_1 → criminals.criminal_id (ON DELETE CASCADE)
criminal_relations.criminal_id_2 → criminals.criminal_id (ON DELETE CASCADE)

-- Case files against criminals
case_files.criminal_id → criminals.criminal_id (ON DELETE CASCADE)
case_files.thana_id → thanas.thana_id

-- Arrest records
arrest_records.criminal_id → criminals.criminal_id (ON DELETE CASCADE)
arrest_records.thana_id → thanas.thana_id

-- Jail hierarchy
cell_blocks.jail_id → jails.jail_id (ON DELETE CASCADE)
cells.block_id → cell_blocks.block_id (ON DELETE CASCADE)

-- Incarcerations
incarcerations.arrest_id → arrest_records.arrest_id (ON DELETE CASCADE)
incarcerations.jail_id → jails.jail_id
incarcerations.cell_id → cells.cell_id

-- Bail records
bail_records.arrest_id → arrest_records.arrest_id (ON DELETE CASCADE)

-- Criminal location tracking
criminal_locations.criminal_id → criminals.criminal_id (ON DELETE CASCADE)
criminal_locations.location_id → locations.location_id
```

## 5.2 Check Constraints

| Table              | Constraint                     | Rule                        |
| ------------------ | ------------------------------ | --------------------------- |
| ranks              | level >= 1                     | Rank level must be positive |
| gd_reports         | status IN (...)                | Only valid status values    |
| criminals          | status IN (...)                | Only valid status values    |
| criminals          | risk_level BETWEEN 1 AND 10    | Risk score range            |
| organizations      | threat_level BETWEEN 1 AND 10  | Threat score range          |
| criminal_relations | criminal_id_1 <> criminal_id_2 | No self-relations           |
| case_files         | status IN (...)                | Only valid status values    |
| jails              | capacity > 0                   | Positive capacity           |
| cell_blocks        | capacity > 0                   | Positive capacity           |
| cells              | capacity > 0                   | Positive capacity           |
| cells              | status IN (...)                | Only valid status values    |
| arrest_records     | custody_status IN (...)        | Only valid status values    |
| bail_records       | status IN (...)                | Only valid status values    |

---

# 5. Database Connection Code

## 6.1 Connection Configuration

**File:** `backend/src/database/connection.js`

```javascript
import dotenv from "dotenv";
import pkg from "pg";

// Load environment variables from .env file
dotenv.config();

// Destructure Pool from pg package
const { Pool } = pkg;

// Create connection pool with configuration
export const pool = new Pool({
  host: process.env.PGHOST, // Database server hostname
  port: Number(process.env.PGPORT) || 5432, // PostgreSQL port
  user: process.env.PGUSER, // Database username
  password: process.env.PGPASSWORD, // Database password
  database: process.env.PGDATABASE, // Database name
  min: Number(process.env.PGPOOL_MIN) || 2, // Minimum pool connections
  max: Number(process.env.PGPOOL_MAX) || 10, // Maximum pool connections
  idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT) || 10000,
  statement_timeout: 15000, // Query timeout in ms
  application_name: "jail-thana-management", // App identifier in pg_stat
});
```

### Code Explanation:

1. **dotenv.config()**: Loads database credentials from `.env` file, keeping sensitive data out of source code.

2. **Connection Pool**: Instead of creating a new connection for each query, a pool maintains multiple reusable connections:
   - `min: 2` - Always keep at least 2 connections ready
   - `max: 10` - Never exceed 10 concurrent connections
   - `idleTimeoutMillis` - Close idle connections after 10 seconds

3. **statement_timeout**: Prevents long-running queries from blocking resources (15 second limit).

## 6.2 Per-Connection Setup

```javascript
// Hook that runs when a new connection is established
pool.on("connect", async (client) => {
  await client.query(`
        SET search_path TO public; 
        SET timezone TO 'Asia/Dhaka'
    `);
});
```

### Explanation:

- **search_path = public**: Ensures queries look in the public schema first
- **timezone = Asia/Dhaka**: Bangladesh Standard Time for accurate local timestamps

## 6.3 Environment Variables (.env)

```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=admin123
PGDATABASE=black_vein_oracle
PGPOOL_MIN=2
PGPOOL_MAX=10
```

## 6.4 Query Execution Pattern

```javascript
// Example: Get all criminals with high risk level
async function getHighRiskCriminals() {
  const query = `
        SELECT criminal_id, full_name, risk_level, status
        FROM criminals
        WHERE risk_level >= 7
        ORDER BY risk_level DESC
    `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Database error:", error.message);
    throw error;
  }
}
```

---

# 6. Views Implementation

## 7.1 Criminal Last Location View

**Purpose:** Shows each criminal with their most recently spotted location.

```sql
CREATE VIEW v_criminal_last_location AS
SELECT
    c.criminal_id,
    c.full_name,
    c.status,
    c.risk_level,
    cl.noted_at AS last_seen_at,
    l.district,
    l.thana_area,
    l.address
FROM criminals c
LEFT JOIN LATERAL (
    SELECT *
    FROM criminal_locations cl
    WHERE cl.criminal_id = c.criminal_id
    ORDER BY cl.noted_at DESC
    LIMIT 1
) cl ON TRUE
LEFT JOIN locations l ON l.location_id = cl.location_id;
```

### Explanation:

- **LATERAL JOIN**: Allows the subquery to reference columns from the outer query
- **ORDER BY noted_at DESC LIMIT 1**: Gets only the most recent location
- **LEFT JOIN**: Includes criminals even if they have no location records

**Usage:**

```sql
SELECT * FROM v_criminal_last_location WHERE risk_level >= 7;
```

## 7.2 Thana Case Summary View

**Purpose:** Aggregates case statistics per police station.

```sql
CREATE VIEW v_thana_case_summary AS
SELECT
    t.thana_id,
    t.name AS thana_name,
    COUNT(cf.case_id) FILTER (WHERE cf.status = 'open') AS open_cases,
    COUNT(cf.case_id) FILTER (WHERE cf.status = 'investigating') AS investigating_cases,
    COUNT(cf.case_id) FILTER (WHERE cf.status = 'closed') AS closed_cases
FROM thanas t
LEFT JOIN case_files cf ON cf.thana_id = t.thana_id
GROUP BY t.thana_id, t.name;
```

### Explanation:

- **FILTER (WHERE ...)**: PostgreSQL-specific aggregate filter, counts only matching rows
- **LEFT JOIN + GROUP BY**: Ensures thanas with no cases still appear (with zero counts)

**Usage:**

```sql
SELECT * FROM v_thana_case_summary ORDER BY open_cases DESC;
```

## 7.3 GD Status Summary View

**Purpose:** Shows GD report statistics per thana.

```sql
CREATE VIEW v_gd_status_summary AS
SELECT
    thana_id,
    COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_count,
    COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count
FROM gd_reports
GROUP BY thana_id;
```

---

# 7. Triggers Implementation

## 8.1 Bail Date Validation Trigger

**Purpose:** Ensures bail_due_date is never before arrest_date.

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION fn_validate_arrest_bail_dates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.bail_due_date IS NOT NULL AND NEW.bail_due_date < NEW.arrest_date THEN
        RAISE EXCEPTION 'bail_due_date must be >= arrest_date';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to arrest_records table
DROP TRIGGER IF EXISTS trg_validate_arrest_bail_dates ON arrest_records;
CREATE TRIGGER trg_validate_arrest_bail_dates
BEFORE INSERT OR UPDATE OF arrest_date, bail_due_date
ON arrest_records
FOR EACH ROW EXECUTE FUNCTION fn_validate_arrest_bail_dates();
```

### How It Works:

1. **BEFORE INSERT OR UPDATE**: Runs before data is saved
2. **NEW.bail_due_date**: References the value being inserted/updated
3. **RAISE EXCEPTION**: Aborts the operation if validation fails
4. **RETURN NEW**: Allows the operation to proceed if valid

**Test:**

```sql
-- This will fail:
INSERT INTO arrest_records (criminal_id, thana_id, arrest_date, bail_due_date, custody_status)
VALUES ('c1111111-1111-1111-1111-111111111111', 1, '2024-06-15', '2024-06-01', 'in_custody');

-- Error: bail_due_date must be >= arrest_date
```

---

# 8. Indexes and Optimization

## 9.1 Index Strategy

Indexes are created to optimize common query patterns:

```sql
-- Speed up criminal searches by thana
CREATE INDEX idx_criminals_thana ON criminals(registered_thana_id);

-- Speed up case lookups by status
CREATE INDEX idx_case_status ON case_files(status);

-- Speed up GD report lookups by user
CREATE INDEX idx_gd_user ON gd_reports(user_id);

-- Speed up location tracking queries
CREATE INDEX idx_criminal_loc_time ON criminal_locations(criminal_id, noted_at DESC);

-- Speed up officer lookups by thana
CREATE INDEX idx_officers_thana ON officers(thana_id);

-- Speed up arrest records by date
CREATE INDEX idx_arrests_date ON arrest_records(arrest_date DESC);
```

## 9.2 When Indexes Help

| Query Pattern               | Index Used            |
| --------------------------- | --------------------- |
| Find criminals at thana X   | idx_criminals_thana   |
| Find open cases             | idx_case_status       |
| User's GD reports           | idx_gd_user           |
| Criminal's location history | idx_criminal_loc_time |
| Recent arrests              | idx_arrests_date      |

---

# 9. Sample Queries

## 10.1 Basic Queries

### Get all thanas with their head officers:

```sql
SELECT
    t.name AS thana_name,
    t.district,
    o.full_name AS head_officer,
    o.badge_no
FROM thanas t
LEFT JOIN officers o ON t.head_officer_id = o.officer_id
ORDER BY t.district, t.name;
```

### Get criminals with high risk level:

```sql
SELECT
    full_name,
    nid_or_alias AS alias,
    risk_level,
    status
FROM criminals
WHERE risk_level >= 7
ORDER BY risk_level DESC;
```

## 10.2 Join Queries

### Get arrests with criminal and thana details:

```sql
SELECT
    ar.arrest_id,
    c.full_name AS criminal_name,
    t.name AS arresting_thana,
    ar.arrest_date,
    ar.custody_status
FROM arrest_records ar
JOIN criminals c ON ar.criminal_id = c.criminal_id
JOIN thanas t ON ar.thana_id = t.thana_id
ORDER BY ar.arrest_date DESC;
```

### Get criminals with their organizations:

```sql
SELECT
    c.full_name AS criminal_name,
    o.name AS organization_name,
    co.role,
    o.threat_level
FROM criminal_organizations co
JOIN criminals c ON co.criminal_id = c.criminal_id
JOIN organizations o ON co.org_id = o.org_id
ORDER BY o.threat_level DESC;
```

## 10.3 Aggregate Queries

### Count prisoners per jail:

```sql
SELECT
    j.name AS jail_name,
    j.capacity,
    COUNT(i.incarceration_id) AS current_inmates,
    j.capacity - COUNT(i.incarceration_id) AS available_space
FROM jails j
LEFT JOIN incarcerations i ON j.jail_id = i.jail_id AND i.released_at IS NULL
GROUP BY j.jail_id, j.name, j.capacity
ORDER BY current_inmates DESC;
```

### GD reports per thana with approval rate:

```sql
SELECT
    t.name AS thana_name,
    COUNT(*) AS total_reports,
    COUNT(*) FILTER (WHERE g.status = 'approved') AS approved,
    COUNT(*) FILTER (WHERE g.status = 'rejected') AS rejected,
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE g.status = 'approved') / NULLIF(COUNT(*), 0),
        1
    ) AS approval_rate_percent
FROM thanas t
LEFT JOIN gd_reports g ON t.thana_id = g.thana_id
GROUP BY t.thana_id, t.name
ORDER BY total_reports DESC;
```

## 10.4 Subquery Examples

### Find criminals with pending bail:

```sql
SELECT c.full_name, c.status
FROM criminals c
WHERE c.criminal_id IN (
    SELECT ar.criminal_id
    FROM arrest_records ar
    JOIN bail_records br ON ar.arrest_id = br.arrest_id
    WHERE br.status = 'pending'
);
```

### Thanas with more than 5 open cases:

```sql
SELECT t.name, t.district
FROM thanas t
WHERE (
    SELECT COUNT(*)
    FROM case_files cf
    WHERE cf.thana_id = t.thana_id AND cf.status = 'open'
) > 5;
```

---

# Appendix A: Complete Schema File

The complete schema is available in:
`backend/src/database/schema.sql`

# Appendix B: Sample Data

Sample data for testing is available in:
`backend/src/database/seed_data.sql`

# Appendix C: Database Setup Instructions

1. Install PostgreSQL 18
2. Create database: `CREATE DATABASE jail_thana_db;`
3. Run schema: `psql -U postgres -d jail_thana_db -f schema.sql`
4. Run seed data: `psql -U postgres -d jail_thana_db -f seed_data.sql`
5. Configure `.env` with connection details

---

**Document Prepared for Academic Evaluation**  
**Database Management Systems Course Project**
