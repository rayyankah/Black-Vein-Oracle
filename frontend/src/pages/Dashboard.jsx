import { useState, useEffect } from 'react'

// Mock data for demonstration (simulated database)
const MOCK_STATS = {
  totalCriminals: 1247,
  inCustody: 823,
  onBail: 156,
  totalThanas: 64,
  totalJails: 12,
  totalCells: 2340,
  openCases: 489,
  pendingGD: 127
}

const MOCK_ARRESTS = [
  { arrest_id: 1, criminal_name: 'Abdul Karim', thana_name: 'Motijheel Thana', arrest_date: '2026-01-23', custody_status: 'in_custody' },
  { arrest_id: 2, criminal_name: 'Mohammad Hasan', thana_name: 'Gulshan Thana', arrest_date: '2026-01-22', custody_status: 'in_custody' },
  { arrest_id: 3, criminal_name: 'Jamal Uddin', thana_name: 'Dhanmondi Thana', arrest_date: '2026-01-21', custody_status: 'on_bail' },
  { arrest_id: 4, criminal_name: 'Rahim Sheikh', thana_name: 'Mirpur Thana', arrest_date: '2026-01-20', custody_status: 'in_custody' },
  { arrest_id: 5, criminal_name: 'Kamal Ahmed', thana_name: 'Uttara Thana', arrest_date: '2026-01-19', custody_status: 'released' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(MOCK_STATS)
  const [recentArrests, setRecentArrests] = useState(MOCK_ARRESTS)
  const [loading, setLoading] = useState(false)

  // Using mock data - no API calls needed
  // In production, this would fetch from the backend

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Bangladesh Jail & Thana Management System Overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Criminals</div>
          <div className="stat-value">{stats.totalCriminals}</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">In Custody</div>
          <div className="stat-value">{stats.inCustody}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">On Bail</div>
          <div className="stat-value">{stats.onBail}</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Open Cases</div>
          <div className="stat-value">{stats.openCases}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Thanas</div>
          <div className="stat-value">{stats.totalThanas}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Jails</div>
          <div className="stat-value">{stats.totalJails}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cells</div>
          <div className="stat-value">{stats.totalCells}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending GD Reports</div>
          <div className="stat-value">{stats.pendingGD}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Arrests</h3>
        </div>
        {recentArrests.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Criminal</th>
                  <th>Thana</th>
                  <th>Arrest Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentArrests.map(arrest => (
                  <tr key={arrest.arrest_id}>
                    <td>{arrest.criminal_name || arrest.criminal_id}</td>
                    <td>{arrest.thana_name || arrest.thana_id}</td>
                    <td>{new Date(arrest.arrest_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${arrest.custody_status?.replace('_', '-')}`}>
                        {arrest.custody_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No recent arrests to display</p>
          </div>
        )}
      </div>
    </div>
  )
}
