import { useState, useEffect } from 'react'

// Mock data
const MOCK_CASES = [
  { case_id: 1, case_number: 'CASE-2026-0001', criminal_name: 'Abdul Karim', thana_name: 'Motijheel Thana', case_type: 'Robbery', status: 'open', filed_date: '2026-01-15' },
  { case_id: 2, case_number: 'CASE-2026-0002', criminal_name: 'Mohammad Hasan', thana_name: 'Gulshan Thana', case_type: 'Fraud', status: 'under_investigation', filed_date: '2026-01-12' },
  { case_id: 3, case_number: 'CASE-2026-0003', criminal_name: 'Jamal Uddin', thana_name: 'Dhanmondi Thana', case_type: 'Assault', status: 'closed', filed_date: '2025-12-28' },
  { case_id: 4, case_number: 'CASE-2026-0004', criminal_name: 'Rahim Sheikh', thana_name: 'Mirpur Thana', case_type: 'Murder', status: 'open', filed_date: '2026-01-20' },
  { case_id: 5, case_number: 'CASE-2026-0005', criminal_name: 'Billal Hossain', thana_name: 'Uttara Thana', case_type: 'Drug Trafficking', status: 'under_investigation', filed_date: '2026-01-18' },
]

const MOCK_CRIMINALS = [
  { criminal_id: 1, full_name: 'Abdul Karim' },
  { criminal_id: 2, full_name: 'Mohammad Hasan' },
  { criminal_id: 3, full_name: 'Jamal Uddin' },
  { criminal_id: 4, full_name: 'Rahim Sheikh' },
  { criminal_id: 5, full_name: 'Billal Hossain' },
]

const MOCK_THANAS = [
  { thana_id: 1, name: 'Motijheel Thana' },
  { thana_id: 2, name: 'Gulshan Thana' },
  { thana_id: 3, name: 'Dhanmondi Thana' },
  { thana_id: 4, name: 'Mirpur Thana' },
  { thana_id: 5, name: 'Uttara Thana' },
]

export default function Cases() {
  const [cases, setCases] = useState(MOCK_CASES)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [criminals, setCriminals] = useState(MOCK_CRIMINALS)
  const [thanas, setThanas] = useState(MOCK_THANAS)
  const [formData, setFormData] = useState({
    case_number: '',
    criminal_id: '',
    thana_id: '',
    case_type: '',
    status: 'open'
  })
  const [alert, setAlert] = useState(null)
  const [filter, setFilter] = useState('all')

  const openModal = () => {
    setFormData({
      case_number: `CASE-2026-${String(cases.length + 1).padStart(4, '0')}`,
      criminal_id: '',
      thana_id: '',
      case_type: '',
      status: 'open'
    })
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newCase = {
      case_id: Date.now(),
      case_number: formData.case_number,
      criminal_name: criminals.find(c => c.criminal_id == formData.criminal_id)?.full_name,
      thana_name: thanas.find(t => t.thana_id == formData.thana_id)?.name,
      case_type: formData.case_type,
      status: formData.status,
      filed_date: new Date().toISOString().split('T')[0]
    }
    setCases([newCase, ...cases])
    setAlert({ type: 'success', message: 'Case file created successfully' })
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const updateStatus = (id, status) => {
    setCases(cases.map(c => c.case_id === id ? { ...c, status } : c))
    setAlert({ type: 'success', message: 'Case status updated' })
    setTimeout(() => setAlert(null), 3000)
  }

  const getStatusBadge = (status) => {
    const map = {
      'open': 'open',
      'under_investigation': 'bail',
      'closed': 'closed'
    }
    return map[status] || 'closed'
  }

  const filteredCases = filter === 'all' 
    ? cases 
    : cases.filter(c => c.status === filter)

  const caseTypes = [
    'Theft', 'Robbery', 'Murder', 'Assault', 'Fraud', 
    'Drug Trafficking', 'Kidnapping', 'Extortion', 'Cyber Crime', 'Other'
  ]

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Case Files</h1>
        <p>Manage criminal case files and investigations</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Cases</div>
          <div className="stat-value">{cases.length}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Open Cases</div>
          <div className="stat-value">
            {cases.filter(c => c.status === 'open').length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Investigating</div>
          <div className="stat-value">
            {cases.filter(c => c.status === 'investigating').length}
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Closed</div>
          <div className="stat-value">
            {cases.filter(c => c.status === 'closed').length}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-md">
            <h3 className="card-title">All Cases</h3>
            <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
              <button 
                className={`tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`tab ${filter === 'open' ? 'active' : ''}`}
                onClick={() => setFilter('open')}
              >
                Open
              </button>
              <button 
                className={`tab ${filter === 'investigating' ? 'active' : ''}`}
                onClick={() => setFilter('investigating')}
              >
                Investigating
              </button>
              <button 
                className={`tab ${filter === 'closed' ? 'active' : ''}`}
                onClick={() => setFilter('closed')}
              >
                Closed
              </button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            + New Case
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Case Number</th>
                <th>Criminal</th>
                <th>Type</th>
                <th>Thana</th>
                <th>Filed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(caseFile => (
                <tr key={caseFile.case_id}>
                  <td><strong>{caseFile.case_number}</strong></td>
                  <td>{caseFile.criminal_name || caseFile.criminal_id}</td>
                  <td>{caseFile.case_type}</td>
                  <td>{caseFile.thana_name || '-'}</td>
                  <td>{new Date(caseFile.filed_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(caseFile.status)}`}>
                      {caseFile.status}
                    </span>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={caseFile.status}
                      onChange={(e) => updateStatus(caseFile.case_id, e.target.value)}
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCases.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <p>No case files found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Create New Case File</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Case Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.case_number}
                  onChange={(e) => setFormData({...formData, case_number: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Criminal *</label>
                <select
                  className="form-select"
                  value={formData.criminal_id}
                  onChange={(e) => setFormData({...formData, criminal_id: e.target.value})}
                  required
                >
                  <option value="">Select Criminal</option>
                  {criminals.map(c => (
                    <option key={c.criminal_id} value={c.criminal_id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Case Type *</label>
                  <select
                    className="form-select"
                    value={formData.case_type}
                    onChange={(e) => setFormData({...formData, case_type: e.target.value})}
                    required
                  >
                    <option value="">Select Type</option>
                    {caseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Thana *</label>
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
              </div>
              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Case
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
