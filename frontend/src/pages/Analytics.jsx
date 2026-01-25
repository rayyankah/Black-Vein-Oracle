import { useState, useEffect } from 'react'

// Mock analytics data
const MOCK_QUERY_TIMINGS = [
  { query: 'SELECT * FROM criminals WHERE status = in_custody', durationMs: 2.4 },
  { query: 'SELECT COUNT(*) FROM arrest_records GROUP BY thana_id', durationMs: 5.8 },
  { query: 'SELECT * FROM case_files WHERE status = open', durationMs: 3.1 },
  { query: 'UPDATE criminals SET risk_level = 8 WHERE criminal_id = 1', durationMs: 1.2 },
  { query: 'SELECT c.*, t.name FROM criminals c JOIN thanas t ON...', durationMs: 12.5 },
  { query: 'INSERT INTO gd_reports (description, thana_id) VALUES...', durationMs: 1.8 },
  { query: 'SELECT * FROM incarcerations WHERE released_at IS NULL', durationMs: 4.2 },
]

const MOCK_THANA_SUMMARY = [
  { thana_name: 'Motijheel Thana', total_arrests: 145, open_cases: 23, officers: 12 },
  { thana_name: 'Gulshan Thana', total_arrests: 89, open_cases: 15, officers: 8 },
  { thana_name: 'Dhanmondi Thana', total_arrests: 112, open_cases: 18, officers: 10 },
  { thana_name: 'Mirpur Thana', total_arrests: 198, open_cases: 31, officers: 15 },
  { thana_name: 'Uttara Thana', total_arrests: 76, open_cases: 12, officers: 9 },
]

export default function Analytics() {
  const [loading, setLoading] = useState(false)
  const [queryTimings, setQueryTimings] = useState(MOCK_QUERY_TIMINGS)
  const [thanaSummary, setThanaSummary] = useState(MOCK_THANA_SUMMARY)
  const [activeTab, setActiveTab] = useState('performance')

  const getTimingColor = (ms) => {
    if (ms < 10) return '#16a34a'
    if (ms < 50) return '#ca8a04'
    return '#dc2626'
  }

  const avgTiming = queryTimings.length > 0
    ? (queryTimings.reduce((sum, t) => sum + t.durationMs, 0) / queryTimings.length).toFixed(2)
    : 0

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Analytics & Performance</h1>
        <p>Database query performance and system analytics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Queries Logged</div>
          <div className="stat-value">{queryTimings.length}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Avg Query Time</div>
          <div className="stat-value">{avgTiming} ms</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Fastest Query</div>
          <div className="stat-value">
            {queryTimings.length > 0 
              ? Math.min(...queryTimings.map(t => t.durationMs)).toFixed(2) 
              : 0} ms
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Slowest Query</div>
          <div className="stat-value">
            {queryTimings.length > 0 
              ? Math.max(...queryTimings.map(t => t.durationMs)).toFixed(2) 
              : 0} ms
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Query Performance
        </button>
        <button 
          className={`tab ${activeTab === 'thana' ? 'active' : ''}`}
          onClick={() => setActiveTab('thana')}
        >
          Thana Case Summary
        </button>
        <button 
          className={`tab ${activeTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveTab('database')}
        >
          Database Info
        </button>
      </div>

      {activeTab === 'performance' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Query Timings</h3>
            <button className="btn btn-secondary" onClick={loadData}>
              Refresh
            </button>
          </div>

          {queryTimings.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Query Label</th>
                    <th>Duration</th>
                    <th>Timestamp</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {queryTimings.slice().reverse().map((timing, idx) => (
                    <tr key={idx}>
                      <td><strong>{timing.label}</strong></td>
                      <td style={{ color: getTimingColor(timing.durationMs) }}>
                        {timing.durationMs.toFixed(2)} ms
                      </td>
                      <td className="text-muted text-sm">{timing.at}</td>
                      <td>
                        <div style={{
                          width: '100px',
                          height: '8px',
                          background: '#e5e5e5',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(timing.durationMs, 100)}%`,
                            height: '100%',
                            background: getTimingColor(timing.durationMs),
                            borderRadius: '4px'
                          }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <p>No query timings recorded yet</p>
              <p className="text-sm text-muted mt-sm">
                Perform some operations to see query performance data
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'thana' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Case Summary by Thana</h3>
          </div>

          {thanaSummary.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Thana</th>
                    <th>Open Cases</th>
                    <th>Investigating</th>
                    <th>Closed Cases</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {thanaSummary.map(thana => (
                    <tr key={thana.thana_id}>
                      <td><strong>{thana.thana_name}</strong></td>
                      <td>
                        <span className="badge badge-open">{thana.open_cases || 0}</span>
                      </td>
                      <td>
                        <span className="badge badge-bail">{thana.investigating_cases || 0}</span>
                      </td>
                      <td>
                        <span className="badge badge-closed">{thana.closed_cases || 0}</span>
                      </td>
                      <td>
                        {(thana.open_cases || 0) + (thana.investigating_cases || 0) + (thana.closed_cases || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🏛️</div>
              <p>No case summary data available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'database' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Database Features</h3>
          </div>

          <div style={{ padding: '16px' }}>
            <h4 style={{ marginBottom: '16px' }}>Advanced PostgreSQL Features Used</h4>
            
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>🔄 Recursive CTEs</h5>
                <p className="text-sm text-muted">
                  Criminal network mapping with cycle prevention. 
                  Traces relationships up to 6 degrees of separation.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>🔍 Full-Text Search</h5>
                <p className="text-sm text-muted">
                  GIN indexes and tsvector columns for fast criminal 
                  search with relevance ranking.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>📊 Window Functions</h5>
                <p className="text-sm text-muted">
                  Timeline analysis with moving averages, 
                  cumulative sums, and temporal slicing.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>⚡ Triggers</h5>
                <p className="text-sm text-muted">
                  Data validation triggers ensure bail dates 
                  are always after arrest dates.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>📋 Views</h5>
                <p className="text-sm text-muted">
                  Pre-built views for common queries like 
                  thana case summary and criminal locations.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>📡 LISTEN/NOTIFY</h5>
                <p className="text-sm text-muted">
                  Real-time alerts via PostgreSQL channels 
                  connected to WebSocket for instant updates.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>🎯 Strategic Indexes</h5>
                <p className="text-sm text-muted">
                  B-Tree and GIN indexes optimized for 
                  each query pattern with EXPLAIN ANALYZE proof.
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e5e5' }}>
                <h5 style={{ marginBottom: '8px', color: '#2563eb' }}>🔐 UUID Primary Keys</h5>
                <p className="text-sm text-muted">
                  Using pgcrypto for distributed-safe IDs 
                  with no collision or sequential guessing risks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
