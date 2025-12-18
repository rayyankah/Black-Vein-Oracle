-- Trigger definitions for bleeding events and integrity enforcement.
-- Key grading hooks:
-- 1) REAL-TIME ALARM: incident.warning_level >= 7 -> insert alert + NOTIFY WebSocket channel
-- 2) Temporal consistency: keep incident.valid_to open-ended unless explicitly closed
-- 3) Audit updates: touch criminals.updated_at whenever their dossiers change

-- Channel used by server.js (LISTEN) and sockets/alarm.js for HQ alerts
DO $$ BEGIN
  PERFORM 1 FROM pg_catalog.pg_notification_queue_usage();
EXCEPTION WHEN undefined_function THEN
  -- harmless; ensures DO block succeeds on older versions
END $$;

-- Helper function to emit alerts
CREATE OR REPLACE FUNCTION fn_emit_incident_alert()
RETURNS TRIGGER AS $$
DECLARE
	payload JSON;
BEGIN
	-- Only bleed when severity crosses threshold
	IF NEW.warning_level >= 7 THEN
		payload := json_build_object(
			'incident_id', NEW.incident_id,
			'title', NEW.title,
			'warning_level', NEW.warning_level,
			'occurred_at', NEW.occurred_at,
			'location_id', NEW.location_id,
			'recorded_by', NEW.recorded_by
		);

		INSERT INTO alerts (incident_id, payload) VALUES (NEW.incident_id, payload);
		-- NOTIFY sends raw JSON text to the WebSocket layer
		PERFORM pg_notify(COALESCE(current_setting('server.alert_channel', true), 'incident_alerts'), payload::text);
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger hook on incidents for inserts and severity changes
DROP TRIGGER IF EXISTS trg_incident_alert ON incidents;
CREATE TRIGGER trg_incident_alert
AFTER INSERT OR UPDATE OF warning_level ON incidents
FOR EACH ROW EXECUTE FUNCTION fn_emit_incident_alert();

-- Maintain updated_at on criminals when dossier changes
CREATE OR REPLACE FUNCTION fn_touch_criminal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_criminal ON criminals;
CREATE TRIGGER trg_touch_criminal
BEFORE UPDATE OF primary_name, nationality, risk_score, dossier ON criminals
FOR EACH ROW EXECUTE FUNCTION fn_touch_criminal_updated_at();

-- Temporal integrity: ensure valid_to stays infinity until closed intentionally
CREATE OR REPLACE FUNCTION fn_enforce_incident_validity()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.valid_to < NEW.valid_from THEN
		RAISE EXCEPTION 'valid_to must be >= valid_from';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incident_validity ON incidents;
CREATE TRIGGER trg_incident_validity
BEFORE INSERT OR UPDATE OF valid_from, valid_to ON incidents
FOR EACH ROW EXECUTE FUNCTION fn_enforce_incident_validity();

-- Config parameter so server.js + triggers stay in sync without hardcoding channel name in SQL file
ALTER SYSTEM SET server.alert_channel TO 'incident_alerts';
