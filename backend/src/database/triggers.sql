-- Trigger definitions for the Bangladesh jail + thana management schema
-- Keeps data consistent without real-time alerting.

-- Validate bail dates (bail due date must be >= arrest date if provided)
CREATE OR REPLACE FUNCTION fn_validate_arrest_bail_dates()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.bail_due_date IS NOT NULL AND NEW.bail_due_date < NEW.arrest_date THEN
		RAISE EXCEPTION 'bail_due_date must be >= arrest_date';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_arrest_bail_dates ON arrest_records;
CREATE TRIGGER trg_validate_arrest_bail_dates
BEFORE INSERT OR UPDATE OF arrest_date, bail_due_date
ON arrest_records
FOR EACH ROW EXECUTE FUNCTION fn_validate_arrest_bail_dates();
