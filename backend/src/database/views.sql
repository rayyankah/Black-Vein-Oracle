-- Views for Bangladesh jail + thana management

-- Criminal profile with last known location
CREATE VIEW IF NOT EXISTS v_criminal_last_location AS
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

-- Thana case workload overview
CREATE VIEW IF NOT EXISTS v_thana_case_summary AS
SELECT
	t.thana_id,
	t.name AS thana_name,
	COUNT(cf.case_id) FILTER (WHERE cf.status = 'open') AS open_cases,
	COUNT(cf.case_id) FILTER (WHERE cf.status = 'investigating') AS investigating_cases,
	COUNT(cf.case_id) FILTER (WHERE cf.status = 'closed') AS closed_cases
FROM thanas t
LEFT JOIN case_files cf ON cf.thana_id = t.thana_id
GROUP BY t.thana_id, t.name;

-- GD status summary for user service dashboards
CREATE VIEW IF NOT EXISTS v_gd_status_summary AS
SELECT
	thana_id,
	COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_count,
	COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
	COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count
FROM gd_reports
GROUP BY thana_id;
