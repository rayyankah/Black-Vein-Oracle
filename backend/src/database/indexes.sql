-- Index strategy is tailored to the showcased queries; each entry references the query file that benefits.

-- FTS for criminal search (supports /criminals advanced search)
CREATE INDEX IF NOT EXISTS idx_criminals_search_vector ON criminals USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_criminal_alias_trgm ON criminal_aliases USING GIN (alias gin_trgm_ops);

-- Relationship graph traversal (supports recursive CTE in queries/criminal_network.js)
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships (source_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships (target_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type_strength ON relationships (relation_type, strength DESC);

-- Temporal incident analytics (supports timeline_analysis.js)
CREATE INDEX IF NOT EXISTS idx_incidents_occurred_at ON incidents (occurred_at);
CREATE INDEX IF NOT EXISTS idx_incidents_warning_level ON incidents (warning_level);
CREATE INDEX IF NOT EXISTS idx_incident_participants_criminal ON incident_participants (criminal_id, incident_id);

-- Communications timeline + FTS (supports predictive_queries.js)
CREATE INDEX IF NOT EXISTS idx_comm_sender_receiver_time ON communications (sender, receiver, sent_at);
CREATE INDEX IF NOT EXISTS idx_comm_content_vector ON communications USING GIN (content_vector);

-- Alerts queue for HQ WebSocket polling fallbacks (supports realtime_alerts.js)
CREATE INDEX IF NOT EXISTS idx_alerts_handled ON alerts (handled, triggered_at DESC);
