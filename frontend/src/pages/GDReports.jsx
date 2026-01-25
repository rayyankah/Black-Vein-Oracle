import { useState, useEffect } from 'react'

// Mock data
const MOCK_REPORTS = [
  { gd_id: 1, thana_name: 'Motijheel Thana', description: 'Lost wallet near station road', status: 'submitted', submitted_at: '2026-01-24T10:30:00Z' },
  { gd_id: 2, thana_name: 'Gulshan Thana', description: 'Noise complaint in residential area', status: 'approved', submitted_at: '2026-01-23T14:20:00Z', approved_by: 'SI Farhana' },
  { gd_id: 3, thana_name: 'Dhanmondi Thana', description: 'Missing bicycle from parking area', status: 'submitted', submitted_at: '2026-01-24T09:15:00Z' },
  { gd_id: 4, thana_name: 'Mirpur Thana', description: 'Stray dog menace in sector 10', status: 'rejected', submitted_at: '2026-01-22T16:45:00Z' },
  { gd_id: 5, thana_name: 'Uttara Thana', description: 'Found suspicious bag near market', status: 'approved', submitted_at: '2026-01-21T11:00:00Z', approved_by: 'SI Nasrin' },
]

const MOCK_THANAS = [
  { thana_id: 1, name: 'Motijheel Thana' },
  { thana_id: 2, name: 'Gulshan Thana' },
  { thana_id: 3, name: 'Dhanmondi Thana' },
  { thana_id: 4, name: 'Mirpur Thana' },
  { thana_id: 5, name: 'Uttara Thana' },
]

const MOCK_OFFICERS = [
  { officer_id: 1, full_name: 'SI Rezaul Karim' },
  { officer_id: 2, full_name: 'SI Farhana Akter' },
]

export default function GDReports() {
  const [reports, setReports] = useState(MOCK_REPORTS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [thanas, setThanas] = useState(MOCK_THANAS)
  const [officers, setOfficers] = useState(MOCK_OFFICERS)
  const [formData, setFormData] = useState({
    thana_id: '',
    description: ''
  })
  const [alert, setAlert] = useState(null)
  const [filter, setFilter] = useState('all')

  const openModal = () => {
    setFormData({
      thana_id: '',
      description: ''
    })
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newReport = {
      gd_id: Date.now(),
      thana_name: thanas.find(t => t.thana_id == formData.thana_id)?.name,
      description: formData.description,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }
    setReports([newReport, ...reports])
    setAlert({ type: 'success', message: 'GD Report submitted successfully' })
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const updateStatus = (id, status, officerId = null) => {
    setReports(reports.map(r => r.gd_id === id 
      ? { ...r, status, approved_by: officerId ? officers.find(o => o.officer_id === officerId)?.full_name : null }
      : r))
    setAlert({ type: 'success', message: `Report ${status}` })
    setTimeout(() => setAlert(null), 3000)
  }

  const getStatusBadge = (status) => {
    const map = {
      'submitted': 'open',
      'approved': 'released',
      'rejected': 'custody'
    }
    return map[status] || 'closed'
  }

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter)

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>GD Reports</h1>
        <p>General Diary reports submitted by citizens</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Reports</div>
          <div className="stat-value">{reports.length}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Pending Review</div>
          <div className="stat-value">
            {reports.filter(r => r.status === 'submitted').length}
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Approved</div>
          <div className="stat-value">
            {reports.filter(r => r.status === 'approved').length}
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-label">Rejected</div>
          <div className="stat-value">
            {reports.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-md">
            <h3 className="card-title">All Reports</h3>
            <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
              <button 
                className={`tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`tab ${filter === 'submitted' ? 'active' : ''}`}
                onClick={() => setFilter('submitted')}
              >
                Pending
              </button>
              <button 
                className={`tab ${filter === 'approved' ? 'active' : ''}`}
                onClick={() => setFilter('approved')}
              >
                Approved
              </button>
              <button 
                className={`tab ${filter === 'rejected' ? 'active' : ''}`}
                onClick={() => setFilter('rejected')}
              >
                Rejected
              </button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            + Submit GD Report
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>GD #</th>
                <th>Submitted By</th>
                <th>Thana</th>
                <th>Description</th>
                <th>Submitted At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr key={report.gd_id}>
                  <td><strong>GD-{report.gd_id}</strong></td>
                  <td>{report.user_name || 'Citizen'}</td>
                  <td>{report.thana_name || '-'}</td>
                  <td style={{ maxWidth: '300px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {report.description}
                    </div>
                  </td>
                  <td>{new Date(report.submitted_at).toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    {report.status === 'submitted' && (
                      <div className="btn-group">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => updateStatus(report.gd_id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => updateStatus(report.gd_id, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {report.status !== 'submitted' && (
                      <span className="text-muted text-sm">
                        {report.approved_by_officer_name || 'Processed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>No GD reports found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Submit GD Report</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <strong>Note:</strong> This form simulates citizen GD report submission. 
                In production, this would require citizen authentication.
              </div>
              <div className="form-group">
                <label className="form-label">Select Thana *</label>
                <select
                  className="form-select"
                  value={formData.thana_id}
                  onChange={(e) => setFormData({...formData, thana_id: e.target.value})}
                  required
                >
                  <option value="">Select Thana</option>
                  {thanas.map(t => (
                    <option key={t.thana_id} value={t.thana_id}>
                      {t.name} - {t.district}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description of Incident *</label>
                <textarea
                  className="form-textarea"
                  rows="5"
                  placeholder="Describe the incident in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Report
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
