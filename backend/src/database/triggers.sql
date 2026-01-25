-- ============================================================
-- DATABASE TRIGGERS
-- Bangladesh Jail & Thana Management System
-- ============================================================
-- Triggers automatically execute functions when specific
-- events occur on tables (INSERT, UPDATE, DELETE).
-- They enforce business rules at the database level.
-- ============================================================


-- ============================================================
-- TRIGGER 1: Validate Bail Due Date
-- ============================================================
-- Purpose: Ensures bail_due_date is never before arrest_date.
--          This is a business rule that must always be true.
--
-- When: BEFORE INSERT or UPDATE on arrest_records table
-- Action: Raises exception if bail_due_date < arrest_date
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_arrest_bail_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if bail_due_date is set and is before arrest_date
    IF NEW.bail_due_date IS NOT NULL AND NEW.bail_due_date < NEW.arrest_date THEN
        RAISE EXCEPTION 'bail_due_date (%) must be >= arrest_date (%)', 
            NEW.bail_due_date, NEW.arrest_date;
    END IF;
    
    -- Allow the operation to proceed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trg_validate_arrest_bail_dates ON arrest_records;

-- Create the trigger
CREATE TRIGGER trg_validate_arrest_bail_dates
BEFORE INSERT OR UPDATE OF arrest_date, bail_due_date
ON arrest_records
FOR EACH ROW 
EXECUTE FUNCTION fn_validate_arrest_bail_dates();

-- Test Example (this should fail):
-- INSERT INTO arrest_records (criminal_id, thana_id, arrest_date, bail_due_date, custody_status)
-- VALUES ('c1111111-1111-1111-1111-111111111111', 1, '2024-06-15', '2024-06-01', 'in_custody');


-- ============================================================
-- TRIGGER 2: Auto-Update Criminal Status on Arrest
-- ============================================================
-- Purpose: Automatically updates criminal's status based on
--          their custody_status in arrest_records.
--
-- When: AFTER INSERT or UPDATE on arrest_records
-- Action: Updates criminals.status to match custody_status
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_criminal_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the criminal's status based on arrest custody_status
    UPDATE criminals
    SET status = CASE NEW.custody_status
        WHEN 'in_custody' THEN 'in_custody'
        WHEN 'on_bail' THEN 'on_bail'
        WHEN 'released' THEN 'released'
        ELSE status  -- Keep current status for other cases
    END
    WHERE criminal_id = NEW.criminal_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_criminal_status ON arrest_records;

CREATE TRIGGER trg_update_criminal_status
AFTER INSERT OR UPDATE OF custody_status
ON arrest_records
FOR EACH ROW
EXECUTE FUNCTION fn_update_criminal_status();


-- ============================================================
-- TRIGGER 3: Update Cell Status on Incarceration
-- ============================================================
-- Purpose: Automatically marks cell as 'occupied' when a 
--          prisoner is assigned, and 'available' when released.
--
-- When: AFTER INSERT or UPDATE on incarcerations
-- Action: Updates cells.status accordingly
-- ============================================================

CREATE OR REPLACE FUNCTION fn_update_cell_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting new incarceration, mark cell as occupied
    IF TG_OP = 'INSERT' AND NEW.cell_id IS NOT NULL THEN
        UPDATE cells SET status = 'occupied' WHERE cell_id = NEW.cell_id;
    END IF;
    
    -- If updating and prisoner is released, check if cell should be available
    IF TG_OP = 'UPDATE' AND NEW.released_at IS NOT NULL AND NEW.cell_id IS NOT NULL THEN
        -- Check if any other active incarceration uses this cell
        IF NOT EXISTS (
            SELECT 1 FROM incarcerations 
            WHERE cell_id = NEW.cell_id 
            AND released_at IS NULL 
            AND incarceration_id != NEW.incarceration_id
        ) THEN
            UPDATE cells SET status = 'available' WHERE cell_id = NEW.cell_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_cell_status ON incarcerations;

CREATE TRIGGER trg_update_cell_status
AFTER INSERT OR UPDATE OF released_at
ON incarcerations
FOR EACH ROW
EXECUTE FUNCTION fn_update_cell_status();


-- ============================================================
-- TRIGGER 4: Log GD Report Status Changes
-- ============================================================
-- Purpose: Creates an audit trail when GD report status changes.
--          Records who approved/rejected and when.
--
-- When: BEFORE UPDATE on gd_reports (when status changes)
-- Action: Validates status transition and sets timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_gd_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only allow valid status transitions
    -- submitted -> approved OR submitted -> rejected
    IF OLD.status = 'submitted' AND NEW.status IN ('approved', 'rejected') THEN
        -- Valid transition - ensure officer is set for approval/rejection
        IF NEW.approved_by_officer_id IS NULL THEN
            RAISE EXCEPTION 'approved_by_officer_id is required when changing status to %', NEW.status;
        END IF;
        RETURN NEW;
    
    -- Don't allow changing from approved/rejected back to submitted
    ELSIF OLD.status IN ('approved', 'rejected') AND NEW.status = 'submitted' THEN
        RAISE EXCEPTION 'Cannot change status from % back to submitted', OLD.status;
    
    -- Allow if status is not changing
    ELSIF OLD.status = NEW.status THEN
        RETURN NEW;
    
    ELSE
        RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_gd_status_change ON gd_reports;

CREATE TRIGGER trg_validate_gd_status_change
BEFORE UPDATE OF status
ON gd_reports
FOR EACH ROW
EXECUTE FUNCTION fn_validate_gd_status_change();


-- ============================================================
-- TRIGGER 5: Prevent Officer Self-Approval of GD Reports
-- ============================================================
-- Purpose: Prevents officers from approving GD reports filed
--          at a different thana than their assignment.
--
-- When: BEFORE UPDATE on gd_reports (when officer is set)
-- Action: Validates officer belongs to the GD report's thana
-- ============================================================

CREATE OR REPLACE FUNCTION fn_validate_officer_thana()
RETURNS TRIGGER AS $$
DECLARE
    officer_thana INT;
BEGIN
    -- Skip if no officer is being set
    IF NEW.approved_by_officer_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get the officer's assigned thana
    SELECT thana_id INTO officer_thana
    FROM officers
    WHERE officer_id = NEW.approved_by_officer_id;
    
    -- Check if officer belongs to the same thana as the GD report
    IF officer_thana IS NULL THEN
        RAISE EXCEPTION 'Officer not found';
    END IF;
    
    IF officer_thana != NEW.thana_id THEN
        RAISE EXCEPTION 'Officer from thana % cannot approve GD reports for thana %',
            officer_thana, NEW.thana_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_officer_thana ON gd_reports;

CREATE TRIGGER trg_validate_officer_thana
BEFORE UPDATE OF approved_by_officer_id
ON gd_reports
FOR EACH ROW
EXECUTE FUNCTION fn_validate_officer_thana();
