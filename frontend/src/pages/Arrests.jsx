import { useState, useEffect } from 'react'

// Mock data
const MOCK_ARRESTS = [
  { arrest_id: 1, criminal_id: 1, criminal_name: 'Abdul Karim', thana_id: 1, thana_name: 'Motijheel Thana', arrest_date: '2026-01-23', custody_status: 'in_custody', case_reference: 'CASE-2026-0001' },
  { arrest_id: 2, criminal_id: 2, criminal_name: 'Mohammad Hasan', thana_id: 2, thana_name: 'Gulshan Thana', arrest_date: '2026-01-22', custody_status: 'in_custody', case_reference: 'CASE-2026-0002' },
  { arrest_id: 3, criminal_id: 3, criminal_name: 'Jamal Uddin', thana_id: 3, thana_name: 'Dhanmondi Thana', arrest_date: '2026-01-21', custody_status: 'on_bail', bail_due_date: '2026-02-21', case_reference: 'CASE-2026-0003' },
  { arrest_id: 4, criminal_id: 4, criminal_name: 'Rahim Sheikh', thana_id: 4, thana_name: 'Mirpur Thana', arrest_date: '2026-01-20', custody_status: 'in_custody', case_reference: 'CASE-2026-0004' },
  { arrest_id: 5, criminal_id: 5, criminal_name: 'Kamal Ahmed', thana_id: 5, thana_name: 'Uttara Thana', arrest_date: '2026-01-19', custody_status: 'released', case_reference: 'CASE-2025-0189' },
]

const MOCK_CRIMINALS = [
  { criminal_id: 1, full_name: 'Abdul Karim' },
  { criminal_id: 2, full_name: 'Mohammad Hasan' },
  { criminal_id: 3, full_name: 'Jamal Uddin' },
  { criminal_id: 4, full_name: 'Rahim Sheikh' },
  { criminal_id: 5, full_name: 'Kamal Ahmed' },
]

const MOCK_THANAS = [
  { thana_id: 1, name: 'Motijheel Thana' },
  { thana_id: 2, name: 'Gulshan Thana' },
  { thana_id: 3, name: 'Dhanmondi Thana' },
  { thana_id: 4, name: 'Mirpur Thana' },
  { thana_id: 5, name: 'Uttara Thana' },
]

export default function Arrests() {
  const [arrests, setArrests] = useState(MOCK_ARRESTS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [criminals, setCriminals] = useState(MOCK_CRIMINALS)
  const [thanas, setThanas] = useState(MOCK_THANAS)
  const [formData, setFormData] = useState({
    criminal_id: '',
    thana_id: '',
    arrest_date: new Date().toISOString().split('T')[0],
    bail_due_date: '',
    custody_status: 'in_custody',
    case_reference: ''
  })
  const [alert, setAlert] = useState(null)

  const openModal = () => {
    setFormData({
      criminal_id: '',
      thana_id: '',
      arrest_date: new Date().toISOString().split('T')[0],
      bail_due_date: '',
      custody_status: 'in_custody',
      case_reference: ''
    })
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const newArrest = {
      arrest_id: Date.now(),
      criminal_id: formData.criminal_id,
      criminal_name: criminals.find(c => c.criminal_id == formData.criminal_id)?.full_name,
      thana_id: formData.thana_id,
      thana_name: thanas.find(t => t.thana_id == formData.thana_id)?.name,
      arrest_date: formData.arrest_date,
      bail_due_date: formData.bail_due_date,
      custody_status: formData.custody_status,
      case_reference: formData.case_reference
    }
    setArrests([newArrest, ...arrests])
    setAlert({ type: 'success', message: 'Arrest record created successfully' })
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const updateStatus = (id, status) => {
    setArrests(arrests.map(a => a.arrest_id === id ? { ...a, custody_status: status } : a))
    setAlert({ type: 'success', message: 'Status updated' })
    setTimeout(() => setAlert(null), 3000)
  }

  const getStatusBadge = (status) => {
    const map = {
      'in_custody': 'custody',
      'on_bail': 'bail',
      'released': 'released',
      'transferred': 'open'
    }
    return map[status] || 'closed'
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Arrest Records</h1>
        <p>Track arrests, custody status, and bail information</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card danger">
          <div className="stat-label">In Custody</div>
          <div className="stat-value">
            {arrests.filter(a => a.custody_status === 'in_custody').length}
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">On Bail</div>
          <div className="stat-value">
            {arrests.filter(a => a.custody_status === 'on_bail').length}
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Released</div>
          <div className="stat-value">
            {arrests.filter(a => a.custody_status === 'released').length}
          </div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total Arrests</div>
          <div className="stat-value">{arrests.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Arrests</h3>
          <button className="btn btn-primary" onClick={openModal}>
            + Record Arrest
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Criminal</th>
                <th>Thana</th>
                <th>Arrest Date</th>
                <th>Bail Due</th>
                <th>Status</th>
                <th>Case Ref</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {arrests.map(arrest => (
                <tr key={arrest.arrest_id}>
                  <td><strong>{arrest.criminal_name || arrest.criminal_id}</strong></td>
                  <td>{arrest.thana_name || arrest.thana_id}</td>
                  <td>{new Date(arrest.arrest_date).toLocaleDateString()}</td>
                  <td>
                    {arrest.bail_due_date 
                      ? new Date(arrest.bail_due_date).toLocaleDateString() 
                      : '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(arrest.custody_status)}`}>
                      {arrest.custody_status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{arrest.case_reference || '-'}</td>
                  <td>
                    <select
                      className="form-select"
                      value={arrest.custody_status}
                      onChange={(e) => updateStatus(arrest.arrest_id, e.target.value)}
                      style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option value="in_custody">In Custody</option>
                      <option value="on_bail">On Bail</option>
                      <option value="released">Released</option>
                      <option value="transferred">Transferred</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {arrests.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">⛓️</div>
            <p>No arrest records found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">Record New Arrest</h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
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
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Arrest Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.arrest_date}
                    onChange={(e) => setFormData({...formData, arrest_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Bail Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.bail_due_date}
                    onChange={(e) => setFormData({...formData, bail_due_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Custody Status</label>
                <select
                  className="form-select"
                  value={formData.custody_status}
                  onChange={(e) => setFormData({...formData, custody_status: e.target.value})}
                >
                  <option value="in_custody">In Custody</option>
                  <option value="on_bail">On Bail</option>
                  <option value="released">Released</option>
                  <option value="transferred">Transferred</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Case Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., CASE-2024-001"
                  value={formData.case_reference}
                  onChange={(e) => setFormData({...formData, case_reference: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Record Arrest
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
