-- ============================================================
-- SAMPLE DATA FOR BANGLADESH JAIL + THANA MANAGEMENT SYSTEM
-- ============================================================
-- This file populates the database with realistic sample data
-- for demonstration and testing purposes.
-- Safe to rerun - uses ON CONFLICT DO NOTHING for idempotency.
-- ============================================================

-- ============================================================
-- 1. ADMIN (Government Officials)
-- ============================================================
INSERT INTO admin (admin_id, full_name, email) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'Mohammad Rafiqul Islam', 'rafiqul.islam@mha.gov.bd'),
    ('a2222222-2222-2222-2222-222222222222', 'Dr. Nasreen Akter', 'nasreen.akter@mha.gov.bd'),
    ('a3333333-3333-3333-3333-333333333333', 'Abdul Karim Chowdhury', 'abdul.karim@mha.gov.bd')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. LOCATIONS (Geographic Areas in Bangladesh)
-- ============================================================
INSERT INTO locations (district, thana_area, address) VALUES
    ('Dhaka', 'Dhanmondi', 'Road 27, Dhanmondi R/A'),
    ('Dhaka', 'Gulshan', 'Gulshan Avenue, Block C'),
    ('Dhaka', 'Mirpur', 'Mirpur-10 Circle'),
    ('Chittagong', 'Kotwali', 'Station Road, Kotwali'),
    ('Chittagong', 'Agrabad', 'CDA Avenue, Agrabad'),
    ('Sylhet', 'Kotwali', 'Zindabazar, Sylhet'),
    ('Rajshahi', 'Boalia', 'Saheb Bazar Road'),
    ('Khulna', 'Kotwali', 'Khan Jahan Ali Road')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. THANAS (Police Stations)
-- ============================================================
INSERT INTO thanas (name, district, address, created_by_admin_id) VALUES
    ('Dhanmondi Thana', 'Dhaka', 'Road 4, Dhanmondi R/A, Dhaka-1205', 'a1111111-1111-1111-1111-111111111111'),
    ('Gulshan Thana', 'Dhaka', 'Gulshan Avenue, Dhaka-1212', 'a1111111-1111-1111-1111-111111111111'),
    ('Mirpur Thana', 'Dhaka', 'Mirpur-2, Dhaka-1216', 'a2222222-2222-2222-2222-222222222222'),
    ('Kotwali Thana Chittagong', 'Chittagong', 'Station Road, Chittagong', 'a2222222-2222-2222-2222-222222222222'),
    ('Sylhet Kotwali', 'Sylhet', 'Zindabazar, Sylhet-3100', 'a3333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. OFFICERS (Police Personnel)
-- ============================================================
INSERT INTO officers (officer_id, thana_id, rank_code, full_name, badge_no) VALUES
    -- Dhanmondi Thana Officers
    ('11111111-1111-1111-1111-111111111111', 1, 'oc', 'ASP Mahbubur Rahman', 'BD-OC-001'),
    ('11111111-1111-1111-1111-222222222222', 1, 'inspector', 'Inspector Kamal Hossain', 'BD-INS-001'),
    ('11111111-1111-1111-1111-333333333333', 1, 'si', 'SI Rahim Uddin', 'BD-SI-001'),
    ('11111111-1111-1111-1111-444444444444', 1, 'constable', 'Constable Jalil Ahmed', 'BD-CON-001'),
    
    -- Gulshan Thana Officers
    ('22222222-2222-2222-2222-111111111111', 2, 'oc', 'ASP Shamsul Haque', 'BD-OC-002'),
    ('22222222-2222-2222-2222-222222222222', 2, 'inspector', 'Inspector Fatema Begum', 'BD-INS-002'),
    ('22222222-2222-2222-2222-333333333333', 2, 'si', 'SI Mostafizur Rahman', 'BD-SI-002'),
    
    -- Mirpur Thana Officers
    ('33333333-3333-3333-3333-111111111111', 3, 'oc', 'ASP Nazrul Islam', 'BD-OC-003'),
    ('33333333-3333-3333-3333-222222222222', 3, 'inspector', 'Inspector Hasina Khatun', 'BD-INS-003'),
    
    -- Chittagong Officers
    ('44444444-4444-4444-4444-111111111111', 4, 'oc', 'ASP Jashim Uddin', 'BD-OC-004'),
    ('44444444-4444-4444-4444-222222222222', 4, 'si', 'SI Monir Hossain', 'BD-SI-004'),
    
    -- Sylhet Officers
    ('55555555-5555-5555-5555-111111111111', 5, 'oc', 'ASP Shahidul Alam', 'BD-OC-005')
ON CONFLICT DO NOTHING;

-- Update thana head officers
UPDATE thanas SET head_officer_id = '11111111-1111-1111-1111-111111111111' WHERE thana_id = 1;
UPDATE thanas SET head_officer_id = '22222222-2222-2222-2222-111111111111' WHERE thana_id = 2;
UPDATE thanas SET head_officer_id = '33333333-3333-3333-3333-111111111111' WHERE thana_id = 3;
UPDATE thanas SET head_officer_id = '44444444-4444-4444-4444-111111111111' WHERE thana_id = 4;
UPDATE thanas SET head_officer_id = '55555555-5555-5555-5555-111111111111' WHERE thana_id = 5;

-- ============================================================
-- 5. USERS (Citizens with Online Accounts)
-- ============================================================
INSERT INTO users (user_id, full_name, nid_number, phone, address, email, password_hash) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 'Aminul Haque', '1990123456789', '01711223344', 'House 45, Road 12, Dhanmondi', 'aminul@gmail.com', '$2b$10$XvK9xK9xK9xK9xK9xK9xK.hashedpassword1'),
    ('aaaa2222-2222-2222-2222-222222222222', 'Rashida Begum', '1985234567890', '01812334455', 'Flat 3B, Gulshan Tower', 'rashida@gmail.com', '$2b$10$XvK9xK9xK9xK9xK9xK9xK.hashedpassword2'),
    ('aaaa3333-3333-3333-3333-333333333333', 'Kamrul Hassan', '1992345678901', '01913445566', 'Block D, Mirpur-10', 'kamrul@gmail.com', '$2b$10$XvK9xK9xK9xK9xK9xK9xK.hashedpassword3'),
    ('aaaa4444-4444-4444-4444-444444444444', 'Salma Akter', '1988456789012', '01614556677', 'Agrabad R/A, Chittagong', 'salma@gmail.com', '$2b$10$XvK9xK9xK9xK9xK9xK9xK.hashedpassword4'),
    ('aaaa5555-5555-5555-5555-555555555555', 'Zakir Hossain', '1995567890123', '01515667788', 'Zindabazar, Sylhet', 'zakir@gmail.com', '$2b$10$XvK9xK9xK9xK9xK9xK9xK.hashedpassword5')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. GD REPORTS (General Diary Entries)
-- ============================================================
INSERT INTO gd_reports (user_id, thana_id, description, status, approved_by_officer_id) VALUES
    ('aaaa1111-1111-1111-1111-111111111111', 1, 'Lost wallet near Dhanmondi Lake. Contains NID card and 5000 BDT cash.', 'approved', '11111111-1111-1111-1111-222222222222'),
    ('aaaa1111-1111-1111-1111-111111111111', 1, 'Suspicious person loitering near my building for 3 days.', 'submitted', NULL),
    ('aaaa2222-2222-2222-2222-222222222222', 2, 'Car break-in at Gulshan parking. Window smashed, radio stolen.', 'approved', '22222222-2222-2222-2222-222222222222'),
    ('aaaa3333-3333-3333-3333-333333333333', 3, 'Loud construction noise after midnight. Disturbing neighbors.', 'rejected', '33333333-3333-3333-3333-222222222222'),
    ('aaaa4444-4444-4444-4444-444444444444', 4, 'Missing mobile phone. Samsung Galaxy S21, IMEI: 123456789012345', 'submitted', NULL),
    ('aaaa5555-5555-5555-5555-555555555555', 5, 'Threatening phone calls from unknown number. Harassment complaint.', 'approved', '55555555-5555-5555-5555-111111111111')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. CRIMINALS (Criminal Records)
-- ============================================================
INSERT INTO criminals (criminal_id, full_name, nid_or_alias, status, risk_level, registered_thana_id) VALUES
    ('cccc1111-1111-1111-1111-111111111111', 'Babul Mia', 'Kala Babul', 'in_custody', 8, 1),
    ('cccc2222-2222-2222-2222-222222222222', 'Rafiq Sheikh', 'Sheikh Rafiq', 'on_bail', 6, 1),
    ('cccc3333-3333-3333-3333-333333333333', 'Jamal Uddin', 'Jamal Dacoit', 'in_custody', 9, 2),
    ('cccc4444-4444-4444-4444-444444444444', 'Shahana Begum', 'Lady Don', 'escaped', 7, 3),
    ('cccc5555-5555-5555-5555-555555555555', 'Mokhles Ahmed', NULL, 'released', 3, 4),
    ('cccc6666-6666-6666-6666-666666666666', 'Kabir Hossain', 'Kalu Kabir', 'in_custody', 5, 4),
    ('cccc7777-7777-7777-7777-777777777777', 'Rina Akter', NULL, 'unknown', 4, 5),
    ('cccc8888-8888-8888-8888-888888888888', 'Farid Ahmed', 'Farid Goonda', 'in_custody', 8, 1)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. ORGANIZATIONS (Criminal Gangs/Groups)
-- ============================================================
INSERT INTO organizations (org_id, name, ideology, threat_level) VALUES
    ('dddd1111-1111-1111-1111-111111111111', 'Dhanmondi Gang', 'Extortion and robbery', 7),
    ('dddd2222-2222-2222-2222-222222222222', 'North City Syndicate', 'Drug trafficking', 9),
    ('dddd3333-3333-3333-3333-333333333333', 'Port Mafia', 'Smuggling operations', 8),
    ('dddd4444-4444-4444-4444-444444444444', 'Border Runners', 'Human trafficking', 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. CRIMINAL-ORGANIZATION LINKS
-- ============================================================
INSERT INTO criminal_organizations (criminal_id, org_id, role) VALUES
    ('cccc1111-1111-1111-1111-111111111111', 'dddd1111-1111-1111-1111-111111111111', 'Leader'),
    ('cccc2222-2222-2222-2222-222222222222', 'dddd1111-1111-1111-1111-111111111111', 'Member'),
    ('cccc3333-3333-3333-3333-333333333333', 'dddd2222-2222-2222-2222-222222222222', 'Boss'),
    ('cccc4444-4444-4444-4444-444444444444', 'dddd2222-2222-2222-2222-222222222222', 'Coordinator'),
    ('cccc6666-6666-6666-6666-666666666666', 'dddd3333-3333-3333-3333-333333333333', 'Member'),
    ('cccc8888-8888-8888-8888-888888888888', 'dddd1111-1111-1111-1111-111111111111', 'Enforcer')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. CRIMINAL RELATIONS (Criminal Networks)
-- ============================================================
INSERT INTO criminal_relations (criminal_id_1, criminal_id_2, relation_type) VALUES
    ('cccc1111-1111-1111-1111-111111111111', 'cccc2222-2222-2222-2222-222222222222', 'accomplice'),
    ('cccc1111-1111-1111-1111-111111111111', 'cccc8888-8888-8888-8888-888888888888', 'associate'),
    ('cccc3333-3333-3333-3333-333333333333', 'cccc4444-4444-4444-4444-444444444444', 'accomplice'),
    ('cccc3333-3333-3333-3333-333333333333', 'cccc6666-6666-6666-6666-666666666666', 'financial'),
    ('cccc4444-4444-4444-4444-444444444444', 'cccc7777-7777-7777-7777-777777777777', 'family')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. CASE FILES (Legal Cases)
-- ============================================================
INSERT INTO case_files (case_number, criminal_id, thana_id, case_type, status) VALUES
    ('DHK-2024-001', 'cccc1111-1111-1111-1111-111111111111', 1, 'Armed Robbery', 'investigating'),
    ('DHK-2024-002', 'cccc1111-1111-1111-1111-111111111111', 1, 'Extortion', 'open'),
    ('DHK-2024-003', 'cccc2222-2222-2222-2222-222222222222', 1, 'Fraud', 'closed'),
    ('GUL-2024-001', 'cccc3333-3333-3333-3333-333333333333', 2, 'Drug Possession', 'investigating'),
    ('GUL-2024-002', 'cccc3333-3333-3333-3333-333333333333', 2, 'Assault', 'open'),
    ('MIR-2024-001', 'cccc4444-4444-4444-4444-444444444444', 3, 'Murder', 'investigating'),
    ('CTG-2024-001', 'cccc6666-6666-6666-6666-666666666666', 4, 'Smuggling', 'open'),
    ('SYL-2024-001', 'cccc7777-7777-7777-7777-777777777777', 5, 'Theft', 'closed')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. JAILS (Prison Facilities)
-- ============================================================
INSERT INTO jails (name, district, address, capacity) VALUES
    ('Dhaka Central Jail', 'Dhaka', 'Nazimuddin Road, Dhaka-1100', 5000),
    ('Kashimpur Central Jail', 'Gazipur', 'Kashimpur, Gazipur', 8000),
    ('Chittagong Central Jail', 'Chittagong', 'Dampara, Chittagong', 3500),
    ('Sylhet Central Jail', 'Sylhet', 'Jail Road, Sylhet', 2000),
    ('Rajshahi Central Jail', 'Rajshahi', 'Jail Road, Rajshahi', 2500)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 13. CELL BLOCKS
-- ============================================================
INSERT INTO cell_blocks (jail_id, block_name, capacity) VALUES
    (1, 'Block A - High Security', 200),
    (1, 'Block B - General', 500),
    (1, 'Block C - Women', 150),
    (2, 'Block A - Maximum Security', 300),
    (2, 'Block B - General Male', 600),
    (2, 'Block C - Juvenile', 100),
    (3, 'Block A - High Risk', 180),
    (3, 'Block B - General', 400),
    (4, 'Block A - Main', 250)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 14. CELLS
-- ============================================================
INSERT INTO cells (block_id, cell_number, capacity, status) VALUES
    (1, 'A-101', 4, 'occupied'),
    (1, 'A-102', 4, 'occupied'),
    (1, 'A-103', 4, 'available'),
    (1, 'A-104', 2, 'maintenance'),
    (2, 'B-101', 8, 'occupied'),
    (2, 'B-102', 8, 'occupied'),
    (2, 'B-103', 8, 'available'),
    (4, 'A-101', 6, 'occupied'),
    (4, 'A-102', 6, 'available'),
    (7, 'A-101', 4, 'occupied'),
    (7, 'A-102', 4, 'available'),
    (9, 'A-101', 6, 'available')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 15. ARREST RECORDS
-- ============================================================
INSERT INTO arrest_records (criminal_id, thana_id, arrest_date, bail_due_date, custody_status, case_reference) VALUES
    ('cccc1111-1111-1111-1111-111111111111', 1, '2024-01-15', NULL, 'in_custody', 'DHK-2024-001'),
    ('cccc2222-2222-2222-2222-222222222222', 1, '2024-02-20', '2024-05-20', 'on_bail', 'DHK-2024-003'),
    ('cccc3333-3333-3333-3333-333333333333', 2, '2024-03-10', NULL, 'in_custody', 'GUL-2024-001'),
    ('cccc6666-6666-6666-6666-666666666666', 4, '2024-04-05', NULL, 'in_custody', 'CTG-2024-001'),
    ('cccc8888-8888-8888-8888-888888888888', 1, '2024-05-12', NULL, 'in_custody', 'DHK-2024-002'),
    ('cccc5555-5555-5555-5555-555555555555', 4, '2023-06-01', NULL, 'released', 'CTG-2023-OLD')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 16. INCARCERATIONS
-- ============================================================
INSERT INTO incarcerations (arrest_id, jail_id, cell_id, admitted_at, released_at) VALUES
    (1, 1, 1, '2024-01-16 10:00:00+06', NULL),
    (3, 2, 8, '2024-03-11 14:30:00+06', NULL),
    (4, 3, 10, '2024-04-06 09:00:00+06', NULL),
    (5, 1, 2, '2024-05-13 11:00:00+06', NULL),
    (6, 3, 11, '2023-06-02 08:00:00+06', '2024-01-02 16:00:00+06')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 17. BAIL RECORDS
-- ============================================================
INSERT INTO bail_records (arrest_id, court_name, bail_amount, granted_at, surety_name, status) VALUES
    (1, 'Dhaka Chief Metropolitan Magistrate Court', 500000.00, NULL, NULL, 'rejected'),
    (2, 'Dhaka Sessions Court', 200000.00, '2024-03-01', 'Mohammad Ali', 'granted'),
    (3, 'Chittagong CMM Court', 1000000.00, NULL, NULL, 'pending'),
    (4, 'Chittagong Sessions Court', 300000.00, NULL, NULL, 'pending')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 18. CRIMINAL LOCATIONS (Tracking History)
-- ============================================================
INSERT INTO criminal_locations (criminal_id, location_id, noted_at) VALUES
    ('cccc1111-1111-1111-1111-111111111111', 1, '2024-01-10 08:30:00+06'),
    ('cccc1111-1111-1111-1111-111111111111', 2, '2024-01-12 14:00:00+06'),
    ('cccc3333-3333-3333-3333-333333333333', 2, '2024-03-05 10:00:00+06'),
    ('cccc4444-4444-4444-4444-444444444444', 3, '2024-02-28 16:30:00+06'),
    ('cccc4444-4444-4444-4444-444444444444', 7, '2024-03-15 09:00:00+06'),
    ('cccc7777-7777-7777-7777-777777777777', 6, '2024-01-20 11:00:00+06')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DATA INSERTION COMPLETE
-- ============================================================
