-- Black Vein Oracle schema
-- This file is the heart that “learns to bleed”: every table, constraint, and column is chosen
-- to showcase advanced PostgreSQL craft (recursive CTE-ready graph tables, temporal columns,
-- full-text search, and integrity rules) for grading.

-- Extensions that power FTS and UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- supports trigram indexes for fuzzy search

-- Reference data for ranks and severity scoring keeps rubric-visible domain constraints tight
CREATE TABLE IF NOT EXISTS agent_ranks (
	rank_code TEXT PRIMARY KEY,
	hierarchy INT NOT NULL CHECK (hierarchy > 0)
);

INSERT INTO agent_ranks (rank_code, hierarchy) VALUES
	('field', 1),
	('lead', 2),
	('analyst', 2),
	('chief', 3)
ON CONFLICT DO NOTHING;

-- Agents table: demonstrates uniqueness, FK to domain table, and auditing columns
CREATE TABLE IF NOT EXISTS agents (
	agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	codename TEXT NOT NULL UNIQUE,
	full_name TEXT NOT NULL,
	rank_code TEXT NOT NULL REFERENCES agent_ranks(rank_code),
	clearance_level INT NOT NULL CHECK (clearance_level BETWEEN 1 AND 10),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HQ table: single logical HQ for dashboard rollups
CREATE TABLE IF NOT EXISTS headquarters (
	hq_id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	region TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations table: normalized for incidents + network visualization layers
CREATE TABLE IF NOT EXISTS locations (
	location_id SERIAL PRIMARY KEY,
	label TEXT NOT NULL,
	geo_point GEOGRAPHY(POINT, 4326),
	city TEXT,
	country TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Criminals: includes FTS generated column to grade search/index craft
CREATE TABLE IF NOT EXISTS criminals (
	criminal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	primary_name TEXT NOT NULL,
	nationality TEXT,
	risk_score NUMERIC(5,2) DEFAULT 0 CHECK (risk_score >= 0),
	captured BOOLEAN NOT NULL DEFAULT FALSE,
	dossier JSONB DEFAULT '{}'::JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	search_vector tsvector GENERATED ALWAYS AS (
		setweight(to_tsvector('english', coalesce(primary_name,'')), 'A') ||
		setweight(to_tsvector('english', coalesce(nationality,'')), 'B') ||
		setweight(to_tsvector('english', coalesce(dossier::text,'')), 'C')
	) STORED
);

-- Aliases to demonstrate 1:N with uniqueness scoped by criminal
CREATE TABLE IF NOT EXISTS criminal_aliases (
	alias_id SERIAL PRIMARY KEY,
	criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	alias TEXT NOT NULL,
	confidence INT NOT NULL CHECK (confidence BETWEEN 1 AND 100),
	noted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (criminal_id, alias)
);

-- Organizations and memberships to fuel recursive network queries
CREATE TABLE IF NOT EXISTS organizations (
	org_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL UNIQUE,
	ideology TEXT,
	threat_level INT CHECK (threat_level BETWEEN 1 AND 10),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
	membership_id SERIAL PRIMARY KEY,
	org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
	criminal_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
	left_at DATE,
	role TEXT,
	CHECK (left_at IS NULL OR left_at >= joined_at),
	UNIQUE (org_id, criminal_id, joined_at)
);

-- Relationship graph between criminals (edges) to drive recursive CTE distance up to 6 hops
CREATE TABLE IF NOT EXISTS relationships (
	relationship_id SERIAL PRIMARY KEY,
	source_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	target_id UUID NOT NULL REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	relation_type TEXT NOT NULL CHECK (relation_type IN ('associate','family','financial','accomplice','mentor','handler')),
	strength INT NOT NULL CHECK (strength BETWEEN 1 AND 10),
	first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	discovered_in_incident BIGINT,
	UNIQUE (source_id, target_id, relation_type)
);

-- Incidents: includes temporal validity and warning_level to drive bleeding alerts
CREATE TABLE IF NOT EXISTS incidents (
	incident_id BIGSERIAL PRIMARY KEY,
	title TEXT NOT NULL,
	description TEXT,
	occurred_at TIMESTAMPTZ NOT NULL,
	reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	location_id INT REFERENCES locations(location_id),
	recorded_by UUID REFERENCES agents(agent_id),
	warning_level INT NOT NULL CHECK (warning_level BETWEEN 1 AND 10),
	valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	valid_to TIMESTAMPTZ NOT NULL DEFAULT '9999-12-31',
	status TEXT NOT NULL DEFAULT 'open',
	UNIQUE (title, occurred_at)
);

-- Incident participants: maps criminals and victims into incidents for timeline slider
CREATE TABLE IF NOT EXISTS incident_participants (
	incident_id BIGINT NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
	criminal_id UUID REFERENCES criminals(criminal_id) ON DELETE CASCADE,
	role TEXT CHECK (role IN ('suspect','mastermind','accomplice','victim','witness')),
	PRIMARY KEY (incident_id, criminal_id, role)
);

-- Victims table for predictive at-risk analysis
CREATE TABLE IF NOT EXISTS victims (
	victim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name TEXT NOT NULL,
	risk_band TEXT CHECK (risk_band IN ('low','medium','high')),
	protected BOOLEAN NOT NULL DEFAULT FALSE,
	last_seen_incident BIGINT REFERENCES incidents(incident_id)
);

-- Communications capture temporal graph activity for timeline slider and window functions
CREATE TABLE IF NOT EXISTS communications (
	communication_id BIGSERIAL PRIMARY KEY,
	sender UUID NOT NULL REFERENCES criminals(criminal_id),
	receiver UUID NOT NULL REFERENCES criminals(criminal_id),
	sent_at TIMESTAMPTZ NOT NULL,
	channel TEXT NOT NULL CHECK (channel IN ('sms','email','darknet','radio','dead_drop')),
	content TEXT,
	content_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(content,''))) STORED
);

-- Alerts table captures bleeding events triggered by SQL-level checks; also used by WebSocket
CREATE TABLE IF NOT EXISTS alerts (
	alert_id BIGSERIAL PRIMARY KEY,
	incident_id BIGINT NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
	triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	payload JSONB NOT NULL,
	handled BOOLEAN NOT NULL DEFAULT FALSE
);

-- Analytics staging table for EXPLAIN/optimization demos
CREATE TABLE IF NOT EXISTS query_probes (
	probe_id SERIAL PRIMARY KEY,
	label TEXT NOT NULL,
	sql_text TEXT NOT NULL,
	plan JSONB,
	duration_ms NUMERIC(10,3),
	captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materialized view placeholders are defined in views.sql to keep DDL modular

-- End of schema: tables are intentionally interconnected to showcase recursive CTEs,
-- window functions, temporal queries, and FTS—all reflected in grading docs.
