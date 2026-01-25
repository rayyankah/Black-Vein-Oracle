import { useState, useEffect } from 'react'

// Mock data for demonstration
const MOCK_CRIMINALS = [
  { criminal_id: 1, full_name: 'Abdul Karim', nid_or_alias: '1990123456789', status: 'in_custody', risk_level: 8, registered_thana_id: 1 },
  { criminal_id: 2, full_name: 'Mohammad Hasan', nid_or_alias: 'Kala Hasan', status: 'in_custody', risk_level: 6, registered_thana_id: 2 },
  { criminal_id: 3, full_name: 'Jamal Uddin', nid_or_alias: '1985678901234', status: 'on_bail', risk_level: 4, registered_thana_id: 1 },
  { criminal_id: 4, full_name: 'Rahim Sheikh', nid_or_alias: 'Pagla Rahim', status: 'in_custody', risk_level: 9, registered_thana_id: 3 },
  { criminal_id: 5, full_name: 'Kamal Ahmed', nid_or_alias: '1995345678901', status: 'released', risk_level: 2, registered_thana_id: 2 },
  { criminal_id: 6, full_name: 'Faruk Mia', nid_or_alias: 'Chotku', status: 'escaped', risk_level: 7, registered_thana_id: 4 },
  { criminal_id: 7, full_name: 'Nasir Khan', nid_or_alias: '1988901234567', status: 'in_custody', risk_level: 5, registered_thana_id: 1 },
  { criminal_id: 8, full_name: 'Billal Hossain', nid_or_alias: 'Tiger Billal', status: 'in_custody', risk_level: 10, registered_thana_id: 5 },
]

const MOCK_THANAS = [
  { thana_id: 1, name: 'Motijheel Thana' },
  { thana_id: 2, name: 'Gulshan Thana' },
  { thana_id: 3, name: 'Dhanmondi Thana' },
  { thana_id: 4, name: 'Mirpur Thana' },
  { thana_id: 5, name: 'Uttara Thana' },
]

export default function Criminals() {
  const [criminals, setCriminals] = useState(MOCK_CRIMINALS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    nid_or_alias: '',
    status: 'unknown',
    risk_level: 1,
    registered_thana_id: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [thanas, setThanas] = useState(MOCK_THANAS)
  const [alert, setAlert] = useState(null)

  // Mock search - filters local data
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setCriminals(MOCK_CRIMINALS)
      return
    }
    const filtered = MOCK_CRIMINALS.filter(c => 
      c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nid_or_alias.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setCriminals(filtered)
  }

  const openModal = (criminal = null) => {
    if (criminal) {
      setFormData({
        full_name: criminal.full_name,
        nid_or_alias: criminal.nid_or_alias || '',
        status: criminal.status,
        risk_level: criminal.risk_level,
        registered_thana_id: criminal.registered_thana_id || ''
      })
      setEditingId(criminal.criminal_id)
    } else {
      setFormData({
        full_name: '',
        nid_or_alias: '',
        status: 'unknown',
        risk_level: 1,
        registered_thana_id: ''
      })
      setEditingId(null)
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Mock submit - just update local state
    if (editingId) {
      setCriminals(criminals.map(c => c.criminal_id === editingId ? { ...c, ...formData } : c))
      setAlert({ type: 'success', message: 'Criminal record updated successfully' })
    } else {
      const newCriminal = { ...formData, criminal_id: Date.now() }
      setCriminals([...criminals, newCriminal])
      setAlert({ type: 'success', message: 'Criminal record created successfully' })
    }
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    setCriminals(criminals.filter(c => c.criminal_id !== id))
    setAlert({ type: 'success', message: 'Record deleted' })
    setTimeout(() => setAlert(null), 3000)
  }

  const getRiskClass = (level) => {
    if (level <= 3) return 'low'
    if (level <= 6) return 'medium'
    return 'high'
  }

  const getStatusBadge = (status) => {
    const map = {
      'in_custody': 'custody',
      'on_bail': 'bail',
      'released': 'released',
      'escaped': 'escaped',
      'unknown': 'closed'
    }
    return map[status] || 'closed'
  }

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Criminal Records</h1>
        <p>Manage criminal database and profiles</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-md">
            <input
              type="text"
              className="form-input"
              placeholder="Search criminals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              style={{ maxWidth: '300px' }}
            />
            <button className="btn btn-secondary" onClick={handleSearch}>
              Search
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Criminal
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>NID/Alias</th>
                <th>Status</th>
                <th>Risk Level</th>
                <th>Thana</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {criminals.map(criminal => (
                <tr key={criminal.criminal_id}>
                  <td><strong>{criminal.full_name}</strong></td>
                  <td>{criminal.nid_or_alias || '-'}</td>
                  <td>
                    <span className={`badge badge-${getStatusBadge(criminal.status)}`}>
                      {criminal.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="risk-level">
                      <div className="risk-bar">
                        <div 
                          className={`risk-bar-fill ${getRiskClass(criminal.risk_level)}`}
                          style={{ width: `${criminal.risk_level * 10}%` }}
                        ></div>
                      </div>
                      <span className={getRiskClass(criminal.risk_level)}>
                        {criminal.risk_level}/10
                      </span>
                    </div>
                  </td>
                  <td>{criminal.thana_name || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(criminal)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(criminal.criminal_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {criminals.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <p>No criminal records found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              {editingId ? 'Edit Criminal' : 'Add Criminal'}
            </h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">NID or Alias</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.nid_or_alias}
                  onChange={(e) => setFormData({...formData, nid_or_alias: e.target.value})}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="unknown">Unknown</option>
                    <option value="in_custody">In Custody</option>
                    <option value="on_bail">On Bail</option>
                    <option value="released">Released</option>
                    <option value="escaped">Escaped</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Risk Level (1-10)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="1"
                    max="10"
                    value={formData.risk_level}
                    onChange={(e) => setFormData({...formData, risk_level: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Registered Thana</label>
                <select
                  className="form-select"
                  value={formData.registered_thana_id}
                  onChange={(e) => setFormData({...formData, registered_thana_id: e.target.value})}
                >
                  <option value="">Select Thana</option>
                  {thanas.map(thana => (
                    <option key={thana.thana_id} value={thana.thana_id}>
                      {thana.name} - {thana.district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
