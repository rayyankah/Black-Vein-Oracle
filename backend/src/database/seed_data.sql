-- Sample dataset to make the demo and grading scripts deterministic.
-- Safe to rerun because PRIMARY KEY/UNIQUE constraints prevent duplicates.

INSERT INTO locations (label, city, country) VALUES
	('Dockyard 7', 'Marseille', 'France'),
	('Warehouse 12', 'Berlin', 'Germany'),
	('Safehouse Delta', 'Athens', 'Greece')
ON CONFLICT DO NOTHING;

INSERT INTO agents (codename, full_name, rank_code, clearance_level) VALUES
	('Specter', 'Ava Monroe', 'lead', 9),
	('Pulse', 'Rami Idris', 'analyst', 7)
ON CONFLICT DO NOTHING;

-- HQ and admin user
INSERT INTO headquarters (name, region) VALUES ('Central Command', 'Global')
ON CONFLICT DO NOTHING;

INSERT INTO hq_users (hq_id, username, hashed_password, role)
SELECT hq_id, 'overwatch', '$2b$10$placeholderhash', 'admin' FROM headquarters WHERE name='Central Command'
ON CONFLICT DO NOTHING;

INSERT INTO criminals (primary_name, nationality, risk_score, dossier) VALUES
	('Lazar Vukovic', 'Serbian', 8.7, '{"signature":"uses burner satellites"}'),
	('Mara El-Sayed', 'Egyptian', 9.1, '{"signature":"bio-agent smuggling"}'),
	('Jun Park', 'Korean', 6.4, '{"signature":"crypto laundering"}')
ON CONFLICT DO NOTHING;

INSERT INTO criminal_aliases (criminal_id, alias, confidence)
SELECT criminal_id, alias, confidence FROM (
	VALUES
		((SELECT criminal_id FROM criminals WHERE primary_name='Lazar Vukovic'), 'Ghostline', 90),
		((SELECT criminal_id FROM criminals WHERE primary_name='Mara El-Sayed'), 'Red Bloom', 95),
		((SELECT criminal_id FROM criminals WHERE primary_name='Jun Park'), 'Ledger', 80)
) AS t(criminal_id, alias, confidence)
ON CONFLICT DO NOTHING;

INSERT INTO relationships (source_id, target_id, relation_type, strength)
SELECT * FROM (
	VALUES
		((SELECT criminal_id FROM criminals WHERE primary_name='Lazar Vukovic'), (SELECT criminal_id FROM criminals WHERE primary_name='Mara El-Sayed'), 'accomplice', 8),
		((SELECT criminal_id FROM criminals WHERE primary_name='Mara El-Sayed'), (SELECT criminal_id FROM criminals WHERE primary_name='Jun Park'), 'financial', 7)
) AS t(source_id, target_id, relation_type, strength)
ON CONFLICT DO NOTHING;

INSERT INTO incidents (title, description, occurred_at, location_id, recorded_by, warning_level)
VALUES
	('Bio-agent transfer', 'Thermal signature spike near Warehouse 12', NOW() - INTERVAL '2 days', (SELECT location_id FROM locations WHERE label='Warehouse 12'), (SELECT agent_id FROM agents WHERE codename='Specter'), 8),
	('Cryptic ledger sync', 'Large crypto mixers identified', NOW() - INTERVAL '1 day', (SELECT location_id FROM locations WHERE label='Dockyard 7'), (SELECT agent_id FROM agents WHERE codename='Pulse'), 6)
ON CONFLICT DO NOTHING;

INSERT INTO incident_participants (incident_id, criminal_id, role)
SELECT * FROM (
	VALUES
		((SELECT incident_id FROM incidents WHERE title='Bio-agent transfer'), (SELECT criminal_id FROM criminals WHERE primary_name='Mara El-Sayed'), 'mastermind'),
		((SELECT incident_id FROM incidents WHERE title='Bio-agent transfer'), (SELECT criminal_id FROM criminals WHERE primary_name='Lazar Vukovic'), 'accomplice'),
		((SELECT incident_id FROM incidents WHERE title='Cryptic ledger sync'), (SELECT criminal_id FROM criminals WHERE primary_name='Jun Park'), 'suspect')
) AS t(incident_id, criminal_id, role)
ON CONFLICT DO NOTHING;

-- Epstein file sample
INSERT INTO epstein_files (title, summary, sensitivity_level, primary_criminal_id, related_incident_id, related_org_id)
VALUES (
	'Epstein File Alpha',
	'Cross-border financial and bio-agent coordination dossier',
	9,
	(SELECT criminal_id FROM criminals WHERE primary_name='Mara El-Sayed'),
	(SELECT incident_id FROM incidents WHERE title='Bio-agent transfer'),
	NULL
)
ON CONFLICT DO NOTHING;
