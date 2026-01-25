-- ============================================================
-- DATABASE VIEWS
-- Bangladesh Jail & Thana Management System
-- ============================================================
-- Views provide pre-defined queries for common data needs.
-- They simplify complex joins and provide security by
-- limiting direct table access.
-- ============================================================

-- ============================================================
-- VIEW 1: Criminal Last Known Location
-- ============================================================
-- Purpose: Shows each criminal with their most recently 
--          spotted location for tracking purposes.
-- 
-- Technique: Uses LATERAL JOIN to get only the latest
--            location record per criminal efficiently.
-- ============================================================

DROP VIEW IF EXISTS v_criminal_last_location;
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
    SELECT criminal_id, location_id, noted_at
    FROM criminal_locations
    WHERE criminal_id = c.criminal_id
    ORDER BY noted_at DESC
    LIMIT 1
) cl ON TRUE
LEFT JOIN locations l ON l.location_id = cl.location_id;

-- Usage Example:
-- SELECT * FROM v_criminal_last_location WHERE risk_level >= 7;


-- ============================================================
-- VIEW 2: Thana Case Summary
-- ============================================================
-- Purpose: Aggregates case statistics per police station.
--          Shows open, investigating, and closed case counts.
--
-- Technique: Uses FILTER clause for conditional counting,
--            which is more efficient than CASE WHEN.
-- ============================================================

DROP VIEW IF EXISTS v_thana_case_summary;
CREATE VIEW v_thana_case_summary AS
SELECT
    t.thana_id,
    t.name AS thana_name,
    t.district,
    COUNT(cf.case_id) AS total_cases,
    COUNT(cf.case_id) FILTER (WHERE cf.status = 'open') AS open_cases,
    COUNT(cf.case_id) FILTER (WHERE cf.status = 'investigating') AS investigating_cases,
    COUNT(cf.case_id) FILTER (WHERE cf.status = 'closed') AS closed_cases
FROM thanas t
LEFT JOIN case_files cf ON cf.thana_id = t.thana_id
GROUP BY t.thana_id, t.name, t.district;

-- Usage Example:
-- SELECT * FROM v_thana_case_summary ORDER BY open_cases DESC;


-- ============================================================
-- VIEW 3: GD Report Status Summary
-- ============================================================
-- Purpose: Shows GD report statistics per thana for 
--          administrative dashboards.
--
-- Technique: Groups GD reports by thana and counts by status.
-- ============================================================

DROP VIEW IF EXISTS v_gd_status_summary;
CREATE VIEW v_gd_status_summary AS
SELECT
    t.thana_id,
    t.name AS thana_name,
    COUNT(g.gd_id) AS total_reports,
    COUNT(g.gd_id) FILTER (WHERE g.status = 'submitted') AS pending_count,
    COUNT(g.gd_id) FILTER (WHERE g.status = 'approved') AS approved_count,
    COUNT(g.gd_id) FILTER (WHERE g.status = 'rejected') AS rejected_count
FROM thanas t
LEFT JOIN gd_reports g ON g.thana_id = t.thana_id
GROUP BY t.thana_id, t.name;

-- Usage Example:
-- SELECT * FROM v_gd_status_summary WHERE pending_count > 0;


-- ============================================================
-- VIEW 4: Officer Details with Rank and Thana
-- ============================================================
-- Purpose: Complete officer information including their
--          rank name and assigned thana details.
--
-- Technique: Multi-table join for denormalized view.
-- ============================================================

DROP VIEW IF EXISTS v_officer_details;
CREATE VIEW v_officer_details AS
SELECT
    o.officer_id,
    o.badge_no,
    o.full_name AS officer_name,
    r.rank_name,
    r.level AS rank_level,
    t.name AS thana_name,
    t.district,
    CASE 
        WHEN t.head_officer_id = o.officer_id THEN 'Yes'
        ELSE 'No'
    END AS is_head_officer
FROM officers o
JOIN ranks r ON o.rank_code = r.rank_code
JOIN thanas t ON o.thana_id = t.thana_id;

-- Usage Example:
-- SELECT * FROM v_officer_details WHERE is_head_officer = 'Yes';


-- ============================================================
-- VIEW 5: Jail Occupancy Status
-- ============================================================
-- Purpose: Shows current occupancy of each jail facility
--          for capacity management.
--
-- Technique: Counts active incarcerations (released_at IS NULL)
--            and calculates available space.
-- ============================================================

DROP VIEW IF EXISTS v_jail_occupancy;
CREATE VIEW v_jail_occupancy AS
SELECT
    j.jail_id,
    j.name AS jail_name,
    j.district,
    j.capacity AS total_capacity,
    COUNT(i.incarceration_id) AS current_inmates,
    j.capacity - COUNT(i.incarceration_id) AS available_space,
    ROUND(100.0 * COUNT(i.incarceration_id) / j.capacity, 1) AS occupancy_percent
FROM jails j
LEFT JOIN incarcerations i ON j.jail_id = i.jail_id AND i.released_at IS NULL
GROUP BY j.jail_id, j.name, j.district, j.capacity;

-- Usage Example:
-- SELECT * FROM v_jail_occupancy WHERE occupancy_percent > 80;


-- ============================================================
-- VIEW 6: Criminal Organization Membership
-- ============================================================
-- Purpose: Shows criminals with their organization affiliations
--          for network analysis.
--
-- Technique: Joins criminal, organization, and junction table.
-- ============================================================

DROP VIEW IF EXISTS v_criminal_org_membership;
CREATE VIEW v_criminal_org_membership AS
SELECT
    c.criminal_id,
    c.full_name AS criminal_name,
    c.risk_level,
    o.name AS organization_name,
    o.threat_level AS org_threat_level,
    co.role AS role_in_org
FROM criminal_organizations co
JOIN criminals c ON co.criminal_id = c.criminal_id
JOIN organizations o ON co.org_id = o.org_id;

-- Usage Example:
-- SELECT * FROM v_criminal_org_membership WHERE org_threat_level >= 8;


-- ============================================================
-- VIEW 7: Active Arrests with Details
-- ============================================================
-- Purpose: Shows all active (non-released) arrests with
--          criminal and thana information.
--
-- Technique: Filters for current custody situations.
-- ============================================================

DROP VIEW IF EXISTS v_active_arrests;
CREATE VIEW v_active_arrests AS
SELECT
    ar.arrest_id,
    c.full_name AS criminal_name,
    c.risk_level,
    t.name AS arresting_thana,
    ar.arrest_date,
    ar.bail_due_date,
    ar.custody_status,
    ar.case_reference
FROM arrest_records ar
JOIN criminals c ON ar.criminal_id = c.criminal_id
JOIN thanas t ON ar.thana_id = t.thana_id
WHERE ar.custody_status IN ('in_custody', 'on_bail');

-- Usage Example:
-- SELECT * FROM v_active_arrests ORDER BY arrest_date DESC;
