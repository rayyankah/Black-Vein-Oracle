import { useState, useEffect } from 'react'

// Mock data
const MOCK_THANAS = [
  { thana_id: 1, name: 'Motijheel Thana', district: 'Dhaka', address: '12 Dilkusha Road, Motijheel', head_officer_name: 'SI Rezaul Karim' },
  { thana_id: 2, name: 'Gulshan Thana', district: 'Dhaka', address: 'Road 103, Gulshan-2', head_officer_name: 'SI Farhana Akter' },
  { thana_id: 3, name: 'Dhanmondi Thana', district: 'Dhaka', address: 'Road 27, Dhanmondi', head_officer_name: 'SI Mohammad Ali' },
  { thana_id: 4, name: 'Mirpur Thana', district: 'Dhaka', address: 'Section 10, Mirpur', head_officer_name: 'SI Kamal Hossain' },
  { thana_id: 5, name: 'Uttara Thana', district: 'Dhaka', address: 'Sector 7, Uttara', head_officer_name: 'SI Nasrin Sultana' },
  { thana_id: 6, name: 'Agrabad Thana', district: 'Chittagong', address: 'Agrabad Commercial Area', head_officer_name: 'SI Rafiq Ahmed' },
  { thana_id: 7, name: 'Kotwali Thana', district: 'Chittagong', address: 'Station Road, Kotwali', head_officer_name: 'SI Jahanara Begum' },
  { thana_id: 8, name: 'Rajshahi Sadar', district: 'Rajshahi', address: 'Zero Point, Rajshahi', head_officer_name: 'SI Monirul Islam' },
  { thana_id: 9, name: 'Khulna Sadar', district: 'Khulna', address: 'KDA Avenue, Khulna', head_officer_name: 'SI Hasina Rahman' },
  { thana_id: 10, name: 'Sylhet Sadar', district: 'Sylhet', address: 'Zindabazar, Sylhet', head_officer_name: 'SI Abdul Hai' },
]

export default function Thanas() {
  const [thanas, setThanas] = useState(MOCK_THANAS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    district: '',
    address: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [alert, setAlert] = useState(null)

  const openModal = (thana = null) => {
    if (thana) {
      setFormData({
        name: thana.name,
        district: thana.district,
        address: thana.address
      })
      setEditingId(thana.thana_id)
    } else {
      setFormData({
        name: '',
        district: '',
        address: ''
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
    if (editingId) {
      setThanas(thanas.map(t => t.thana_id === editingId ? { ...t, ...formData } : t))
      setAlert({ type: 'success', message: 'Thana updated successfully' })
    } else {
      const newThana = { ...formData, thana_id: Date.now(), head_officer_name: '-' }
      setThanas([...thanas, newThana])
      setAlert({ type: 'success', message: 'Thana created successfully' })
    }
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure? This will delete all associated records.')) return
    setThanas(thanas.filter(t => t.thana_id !== id))
    setAlert({ type: 'success', message: 'Thana deleted' })
    setTimeout(() => setAlert(null), 3000)
  }

  // Group thanas by district
  const thanasByDistrict = thanas.reduce((acc, thana) => {
    if (!acc[thana.district]) acc[thana.district] = []
    acc[thana.district].push(thana)
    return acc
  }, {})

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Thanas (Police Stations)</h1>
        <p>Manage police stations across Bangladesh</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Thanas</div>
          <div className="stat-value">{thanas.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Districts Covered</div>
          <div className="stat-value">{Object.keys(thanasByDistrict).length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Thanas</h3>
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Thana
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>District</th>
                <th>Address</th>
                <th>Head Officer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {thanas.map(thana => (
                <tr key={thana.thana_id}>
                  <td><strong>{thana.name}</strong></td>
                  <td>{thana.district}</td>
                  <td>{thana.address}</td>
                  <td>{thana.head_officer_name || '-'}</td>
                  <td>
                    <div className="btn-group">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(thana)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(thana.thana_id)}
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

        {thanas.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏛️</div>
            <p>No thanas found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              {editingId ? 'Edit Thana' : 'Add Thana'}
            </h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Thana Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Mirpur Model Thana"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">District *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Dhaka"
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Full Address *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  required
                />
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
