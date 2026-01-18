-- Bangladesh Jail + Thana Management schema
-- Clear, linear, production-ready entities (Bangladesh context)

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

-- Admin (government)
CREATE TABLE IF NOT EXISTS admin (
	admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	full_name TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE
);

-- Thana (police station)
CREATE TABLE IF NOT EXISTS thanas (
	thana_id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	district TEXT NOT NULL,
	address TEXT NOT NULL,
	created_by_admin_id UUID NOT NULL REFERENCES admin(admin_id),
	head_officer_id UUID
);

-- Police ranks
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

-- Police officers
CREATE TABLE IF NOT EXISTS officers (
	officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	thana_id INT NOT NULL REFERENCES thanas(thana_id) ON DELETE CASCADE,
	rank_code TEXT NOT NULL REFERENCES ranks(rank_code),
	full_name TEXT NOT NULL,
	badge_no TEXT NOT NULL UNIQUE
);

-- Link thana head (optional 1:1)
ALTER TABLE thanas
	ADD CONSTRAINT fk_thana_head_officer
	FOREIGN KEY (head_officer_id) REFERENCES officers(officer_id);

-- Locations in Bangladesh
CREATE TABLE IF NOT EXISTS locations (
	location_id SERIAL PRIMARY KEY,
	district TEXT NOT NULL,
	thana_area TEXT,
	address TEXT
);

-- General users (citizens) with login
CREATE TABLE IF NOT EXISTS users (
	user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	full_name TEXT NOT NULL,
	nid_number TEXT NOT NULL UNIQUE,
	phone TEXT NOT NULL,
	address TEXT,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL
);

-- Online GD reports (submitted by users, approved by thana officer)
CREATE TABLE IF NOT EXISTS gd_reports (
	gd_id BIGSERIAL PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
	thana_id INT NOT NULL REFERENCES thanas(thana_id),
	submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	description TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('submitted','approved','rejected')) DEFAULT 'submitted',
	approved_by_officer_id UUID REFERENCES officers(officer_id)
);

-- Criminal master record
CREATE TABLE IF NOT EXISTS criminals (
	criminal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	full_name TEXT NOT NULL,
	nid_or_alias TEXT,
	status TEXT NOT NULL CHECK (status IN ('in_custody','on_bail','released','escaped','unknown')) DEFAULT 'unknown',
	risk_level INT NOT NULL CHECK (risk_level BETWEEN 1 AND 10) DEFAULT 1,
	registered_thana_id INT REFERENCES thanas(thana_id)
);

-- Criminal organizations (gangs)
CREATE TABLE IF NOT EXISTS organizations (
	org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL UNIQUE,
	ideology TEXT,
	threat_level INT NOT NULL CHECK (threat_level BETWEEN 1 AND 10),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS criminal_organizations (
	criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
	role TEXT,
	PRIMARY KEY (criminal_id, org_id)
);

-- Criminal to criminal relationship (self-relation)
CREATE TABLE IF NOT EXISTS criminal_relations (
	relation_id SERIAL PRIMARY KEY,
	criminal_id_1 UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	criminal_id_2 UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	relation_type TEXT NOT NULL CHECK (relation_type IN ('associate','family','financial','accomplice')),
	CHECK (criminal_id_1 <> criminal_id_2),
	UNIQUE (criminal_id_1, criminal_id_2, relation_type)
);

-- Criminal case file
CREATE TABLE IF NOT EXISTS case_files (
	case_id BIGSERIAL PRIMARY KEY,
	case_number TEXT NOT NULL UNIQUE,
	criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	thana_id INT NOT NULL REFERENCES thanas(thana_id),
	case_type TEXT NOT NULL,
	status TEXT NOT NULL CHECK (status IN ('open','investigating','closed')) DEFAULT 'open',
	filed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jails and cells
CREATE TABLE IF NOT EXISTS jails (
	jail_id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	district TEXT NOT NULL,
	address TEXT NOT NULL,
	capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS cell_blocks (
	block_id SERIAL PRIMARY KEY,
	jail_id INT NOT NULL REFERENCES jails(jail_id) ON DELETE CASCADE,
	block_name TEXT NOT NULL,
	capacity INT NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS cells (
	cell_id SERIAL PRIMARY KEY,
	block_id INT NOT NULL REFERENCES cell_blocks(block_id) ON DELETE CASCADE,
	cell_number TEXT NOT NULL,
	capacity INT NOT NULL CHECK (capacity > 0),
	status TEXT NOT NULL CHECK (status IN ('available','occupied','maintenance')) DEFAULT 'available',
	UNIQUE (block_id, cell_number)
);

-- Arrest records
CREATE TABLE IF NOT EXISTS arrest_records (
	arrest_id BIGSERIAL PRIMARY KEY,
	criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	thana_id INT NOT NULL REFERENCES thanas(thana_id),
	arrest_date DATE NOT NULL,
	bail_due_date DATE,
	custody_status TEXT NOT NULL CHECK (custody_status IN ('in_custody','on_bail','released','transferred')),
	case_reference TEXT
);

-- Incarceration details
CREATE TABLE IF NOT EXISTS incarcerations (
	incarceration_id BIGSERIAL PRIMARY KEY,
	arrest_id BIGINT NOT NULL REFERENCES arrest_records(arrest_id) ON DELETE CASCADE,
	jail_id INT NOT NULL REFERENCES jails(jail_id),
	cell_id INT REFERENCES cells(cell_id),
	admitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	released_at TIMESTAMPTZ
);

-- Bail records
CREATE TABLE IF NOT EXISTS bail_records (
	bail_id BIGSERIAL PRIMARY KEY,
	arrest_id BIGINT NOT NULL REFERENCES arrest_records(arrest_id) ON DELETE CASCADE,
	court_name TEXT NOT NULL,
	bail_amount NUMERIC(12,2),
	granted_at DATE,
	surety_name TEXT,
	status TEXT NOT NULL CHECK (status IN ('pending','granted','rejected')) DEFAULT 'pending'
);

-- Criminal locations (for public viewing by location)
CREATE TABLE IF NOT EXISTS criminal_locations (
	criminal_location_id BIGSERIAL PRIMARY KEY,
	criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	location_id INT NOT NULL REFERENCES locations(location_id),
	noted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
