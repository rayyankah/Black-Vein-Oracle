-- ============================================================
-- DATABASE INDEXES
-- Bangladesh Jail & Thana Management System
-- ============================================================
-- Indexes improve query performance by creating efficient
-- lookup structures. Each index is designed for specific
-- query patterns commonly used in the application.
-- ============================================================


-- ============================================================
-- INDEXES FOR CRIMINALS TABLE
-- ============================================================

-- Index 1: Speed up criminal searches by registered thana
-- Use Case: "Show all criminals registered at Dhanmondi Thana"
CREATE INDEX IF NOT EXISTS idx_criminals_thana 
ON criminals(registered_thana_id);

-- Index 2: Speed up filtering by criminal status
-- Use Case: "Show all criminals currently in custody"
CREATE INDEX IF NOT EXISTS idx_criminals_status 
ON criminals(status);

-- Index 3: Speed up sorting by risk level
-- Use Case: "Show highest risk criminals first"
CREATE INDEX IF NOT EXISTS idx_criminals_risk 
ON criminals(risk_level DESC);


-- ============================================================
-- INDEXES FOR CASE_FILES TABLE
-- ============================================================

-- Index 4: Speed up case lookups by status
-- Use Case: "Show all open cases"
CREATE INDEX IF NOT EXISTS idx_case_status 
ON case_files(status);

-- Index 5: Speed up case lookups by thana
-- Use Case: "Show all cases filed at Gulshan Thana"
CREATE INDEX IF NOT EXISTS idx_case_thana 
ON case_files(thana_id);

-- Index 6: Speed up case lookups by criminal
-- Use Case: "Show all cases against a specific criminal"
CREATE INDEX IF NOT EXISTS idx_case_criminal 
ON case_files(criminal_id);

-- Index 7: Speed up sorting by filing date
-- Use Case: "Show most recent cases first"
CREATE INDEX IF NOT EXISTS idx_case_filed_at 
ON case_files(filed_at DESC);


-- ============================================================
-- INDEXES FOR GD_REPORTS TABLE
-- ============================================================

-- Index 8: Speed up GD report lookups by user
-- Use Case: "Show all reports submitted by a citizen"
CREATE INDEX IF NOT EXISTS idx_gd_user 
ON gd_reports(user_id);

-- Index 9: Speed up GD report lookups by thana
-- Use Case: "Show all reports for Mirpur Thana"
CREATE INDEX IF NOT EXISTS idx_gd_thana 
ON gd_reports(thana_id);

-- Index 10: Speed up filtering pending reports
-- Use Case: "Show all reports awaiting approval"
CREATE INDEX IF NOT EXISTS idx_gd_status 
ON gd_reports(status);

-- Index 11: Speed up sorting by submission time
-- Use Case: "Show most recent reports first"
CREATE INDEX IF NOT EXISTS idx_gd_submitted_at 
ON gd_reports(submitted_at DESC);


-- ============================================================
-- INDEXES FOR OFFICERS TABLE
-- ============================================================

-- Index 12: Speed up officer lookups by thana
-- Use Case: "Show all officers at Dhanmondi Thana"
CREATE INDEX IF NOT EXISTS idx_officers_thana 
ON officers(thana_id);

-- Index 13: Speed up officer lookups by rank
-- Use Case: "Show all Sub-Inspectors"
CREATE INDEX IF NOT EXISTS idx_officers_rank 
ON officers(rank_code);


-- ============================================================
-- INDEXES FOR ARREST_RECORDS TABLE
-- ============================================================

-- Index 14: Speed up arrest lookups by criminal
-- Use Case: "Show arrest history for a criminal"
CREATE INDEX IF NOT EXISTS idx_arrests_criminal 
ON arrest_records(criminal_id);

-- Index 15: Speed up arrest lookups by thana
-- Use Case: "Show all arrests made by Kotwali Thana"
CREATE INDEX IF NOT EXISTS idx_arrests_thana 
ON arrest_records(thana_id);

-- Index 16: Speed up sorting by arrest date
-- Use Case: "Show most recent arrests first"
CREATE INDEX IF NOT EXISTS idx_arrests_date 
ON arrest_records(arrest_date DESC);

-- Index 17: Speed up filtering by custody status
-- Use Case: "Show all currently detained individuals"
CREATE INDEX IF NOT EXISTS idx_arrests_custody_status 
ON arrest_records(custody_status);


-- ============================================================
-- INDEXES FOR INCARCERATIONS TABLE
-- ============================================================

-- Index 18: Speed up incarceration lookups by jail
-- Use Case: "Show all inmates at Dhaka Central Jail"
CREATE INDEX IF NOT EXISTS idx_incarcerations_jail 
ON incarcerations(jail_id);

-- Index 19: Speed up finding active incarcerations
-- Use Case: "Show currently held prisoners (not released)"
CREATE INDEX IF NOT EXISTS idx_incarcerations_released 
ON incarcerations(released_at) WHERE released_at IS NULL;


-- ============================================================
-- INDEXES FOR CRIMINAL_LOCATIONS TABLE
-- ============================================================

-- Index 20: Speed up location history for a criminal
-- Use Case: "Show location history sorted by time"
CREATE INDEX IF NOT EXISTS idx_criminal_loc_history 
ON criminal_locations(criminal_id, noted_at DESC);


-- ============================================================
-- INDEXES FOR CRIMINAL_RELATIONS TABLE
-- ============================================================

-- Index 21: Speed up finding related criminals
-- Use Case: "Show all associates of a criminal"
CREATE INDEX IF NOT EXISTS idx_relations_criminal1 
ON criminal_relations(criminal_id_1);

-- Index 22: Speed up reverse relationship lookups
-- Use Case: "Who is this criminal related to?"
CREATE INDEX IF NOT EXISTS idx_relations_criminal2 
ON criminal_relations(criminal_id_2);


-- ============================================================
-- INDEXES FOR BAIL_RECORDS TABLE
-- ============================================================

-- Index 23: Speed up bail lookups by arrest
-- Use Case: "Show bail status for an arrest"
CREATE INDEX IF NOT EXISTS idx_bail_arrest 
ON bail_records(arrest_id);

-- Index 24: Speed up filtering by bail status
-- Use Case: "Show all pending bail applications"
CREATE INDEX IF NOT EXISTS idx_bail_status 
ON bail_records(status);


-- ============================================================
-- INDEXES FOR CELLS TABLE
-- ============================================================

-- Index 25: Speed up finding available cells
-- Use Case: "Show all available cells in a block"
CREATE INDEX IF NOT EXISTS idx_cells_status 
ON cells(status);


-- ============================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================

-- Index 26: Speed up finding criminals by thana and risk
-- Use Case: "Show high-risk criminals at a specific thana"
CREATE INDEX IF NOT EXISTS idx_criminals_thana_risk 
ON criminals(registered_thana_id, risk_level DESC);

-- Index 27: Speed up finding cases by thana and status
-- Use Case: "Show open cases at a specific thana"
CREATE INDEX IF NOT EXISTS idx_case_thana_status 
ON case_files(thana_id, status);
