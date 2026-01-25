import { useState, useEffect } from 'react'

// Mock data
const MOCK_OFFICERS = [
  { officer_id: 1, thana_id: 1, thana_name: 'Motijheel Thana', rank_code: 'oc', rank_name: 'Officer-in-Charge', full_name: 'Rezaul Karim', badge_no: 'OC-001' },
  { officer_id: 2, thana_id: 2, thana_name: 'Gulshan Thana', rank_code: 'si', rank_name: 'Sub-Inspector', full_name: 'Farhana Akter', badge_no: 'SI-042' },
  { officer_id: 3, thana_id: 1, thana_name: 'Motijheel Thana', rank_code: 'inspector', rank_name: 'Inspector', full_name: 'Mohammad Ali', badge_no: 'INS-015' },
  { officer_id: 4, thana_id: 3, thana_name: 'Dhanmondi Thana', rank_code: 'constable', rank_name: 'Constable', full_name: 'Kamal Hossain', badge_no: 'CON-123' },
  { officer_id: 5, thana_id: 4, thana_name: 'Mirpur Thana', rank_code: 'si', rank_name: 'Sub-Inspector', full_name: 'Nasrin Sultana', badge_no: 'SI-089' },
]

const MOCK_THANAS = [
  { thana_id: 1, name: 'Motijheel Thana' },
  { thana_id: 2, name: 'Gulshan Thana' },
  { thana_id: 3, name: 'Dhanmondi Thana' },
  { thana_id: 4, name: 'Mirpur Thana' },
  { thana_id: 5, name: 'Uttara Thana' },
]

export default function Officers() {
  const [officers, setOfficers] = useState(MOCK_OFFICERS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [thanas, setThanas] = useState(MOCK_THANAS)
  const [formData, setFormData] = useState({
    thana_id: '',
    rank_code: 'constable',
    full_name: '',
    badge_no: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [alert, setAlert] = useState(null)

  const ranks = [
    { code: 'constable', name: 'Constable', level: 1 },
    { code: 'si', name: 'Sub-Inspector', level: 2 },
    { code: 'inspector', name: 'Inspector', level: 3 },
    { code: 'oc', name: 'Officer-in-Charge', level: 4 }
  ]

  const openModal = (officer = null) => {
    if (officer) {
      setFormData({
        thana_id: officer.thana_id,
        rank_code: officer.rank_code,
        full_name: officer.full_name,
        badge_no: officer.badge_no
      })
      setEditingId(officer.officer_id)
    } else {
      setFormData({
        thana_id: '',
        rank_code: 'constable',
        full_name: '',
        badge_no: ''
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
    const rankInfo = ranks.find(r => r.code === formData.rank_code)
    if (editingId) {
      setOfficers(officers.map(o => o.officer_id === editingId 
        ? { ...o, ...formData, rank_name: rankInfo?.name, thana_name: thanas.find(t => t.thana_id == formData.thana_id)?.name } 
        : o))
      setAlert({ type: 'success', message: 'Officer updated successfully' })
    } else {
      const newOfficer = { 
        ...formData, 
        officer_id: Date.now(), 
        rank_name: rankInfo?.name,
        thana_name: thanas.find(t => t.thana_id == formData.thana_id)?.name
      }
      setOfficers([...officers, newOfficer])
      setAlert({ type: 'success', message: 'Officer created successfully' })
    }
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this officer?')) return
    setOfficers(officers.filter(o => o.officer_id !== id))
    setAlert({ type: 'success', message: 'Officer deleted' })
    setTimeout(() => setAlert(null), 3000)
  }

  const getRankBadgeColor = (rankCode) => {
    const colors = {
      'constable': '#6b7280',
      'si': '#3b82f6',
      'inspector': '#8b5cf6',
      'oc': '#dc2626'
    }
    return colors[rankCode] || '#6b7280'
  }

  // Group officers by rank
  const officersByRank = officers.reduce((acc, officer) => {
    const rank = officer.rank_code || 'unknown'
    if (!acc[rank]) acc[rank] = []
    acc[rank].push(officer)
    return acc
  }, {})

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Police Officers</h1>
        <p>Manage officer records and assignments</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Officers</div>
          <div className="stat-value">{officers.length}</div>
        </div>
        {ranks.map(rank => (
          <div key={rank.code} className="stat-card">
            <div className="stat-label">{rank.name}s</div>
            <div className="stat-value">{officersByRank[rank.code]?.length || 0}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Officers</h3>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Officer
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Badge No</th>
                <th>Name</th>
                <th>Rank</th>
                <th>Thana</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.map(officer => (
                <tr key={officer.officer_id}>
                  <td><strong>{officer.badge_no}</strong></td>
                  <td>{officer.full_name}</td>
                  <td>
                    <span 
                      style={{
                        background: getRankBadgeColor(officer.rank_code),
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {ranks.find(r => r.code === officer.rank_code)?.name || officer.rank_code}
                    </span>
                  </td>
                  <td>{officer.thana_name || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(officer)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(officer.officer_id)}
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

        {officers.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👮</div>
            <p>No officers found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              {editingId ? 'Edit Officer' : 'Add Officer'}
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
                <label className="form-label">Badge Number *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., BD-001234"
                  value={formData.badge_no}
                  onChange={(e) => setFormData({...formData, badge_no: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Rank *</label>
                  <select
                    className="form-select"
                    value={formData.rank_code}
                    onChange={(e) => setFormData({...formData, rank_code: e.target.value})}
                    required
                  >
                    {ranks.map(rank => (
                      <option key={rank.code} value={rank.code}>
                        {rank.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Thana *</label>
                  <select
                    className="form-select"
                    value={formData.thana_id}
                    onChange={(e) => setFormData({...formData, thana_id: e.target.value})}
                    required
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
