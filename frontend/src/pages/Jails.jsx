import { useState, useEffect } from 'react'

// Mock data
const MOCK_JAILS = [
  { 
    jail_id: 1, 
    name: 'Dhaka Central Jail', 
    district: 'Dhaka', 
    address: 'Keraniganj, Dhaka',
    capacity: 2600,
    blocks: [
      { block_id: 1, block_name: 'Block A - High Security', capacity: 200, cells: [
        { cell_id: 1, cell_number: 'A-101', capacity: 4, status: 'occupied' },
        { cell_id: 2, cell_number: 'A-102', capacity: 4, status: 'occupied' },
        { cell_id: 3, cell_number: 'A-103', capacity: 4, status: 'available' },
      ]},
      { block_id: 2, block_name: 'Block B - Medium Security', capacity: 300, cells: [
        { cell_id: 4, cell_number: 'B-101', capacity: 6, status: 'occupied' },
        { cell_id: 5, cell_number: 'B-102', capacity: 6, status: 'maintenance' },
      ]},
    ]
  },
  { 
    jail_id: 2, 
    name: 'Chittagong Central Jail', 
    district: 'Chittagong', 
    address: 'Dampara, Chittagong',
    capacity: 1800,
    blocks: [
      { block_id: 3, block_name: 'Block A', capacity: 250, cells: [
        { cell_id: 6, cell_number: 'A-101', capacity: 5, status: 'available' },
      ]},
    ]
  },
  { 
    jail_id: 3, 
    name: 'Kashimpur Central Jail', 
    district: 'Gazipur', 
    address: 'Kashimpur, Gazipur',
    capacity: 3500,
    blocks: []
  },
  { 
    jail_id: 4, 
    name: 'Rajshahi Central Jail', 
    district: 'Rajshahi', 
    address: 'Rajshahi City',
    capacity: 1200,
    blocks: []
  },
]

export default function Jails() {
  const [jails, setJails] = useState(MOCK_JAILS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('jail') // 'jail', 'block', 'cell'
  const [selectedJail, setSelectedJail] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [formData, setFormData] = useState({})
  const [alert, setAlert] = useState(null)

  const openJailModal = () => {
    setModalType('jail')
    setFormData({
      name: '',
      district: '',
      address: '',
      capacity: 100
    })
    setShowModal(true)
  }

  const openBlockModal = (jail) => {
    setSelectedJail(jail)
    setModalType('block')
    setFormData({
      jail_id: jail.jail_id,
      block_name: '',
      capacity: 50
    })
    setShowModal(true)
  }

  const openCellModal = (jail, block) => {
    setSelectedJail(jail)
    setSelectedBlock(block)
    setModalType('cell')
    setFormData({
      block_id: block.block_id,
      cell_number: '',
      capacity: 4,
      status: 'available'
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedJail(null)
    setSelectedBlock(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (modalType === 'jail') {
      const newJail = { ...formData, jail_id: Date.now(), blocks: [] }
      setJails([...jails, newJail])
      setAlert({ type: 'success', message: 'Jail created successfully' })
    } else if (modalType === 'block') {
      const newBlock = { ...formData, block_id: Date.now(), cells: [] }
      setJails(jails.map(j => j.jail_id === selectedJail.jail_id 
        ? { ...j, blocks: [...(j.blocks || []), newBlock] } 
        : j))
      setAlert({ type: 'success', message: 'Cell block created successfully' })
    } else if (modalType === 'cell') {
      const newCell = { ...formData, cell_id: Date.now() }
      setJails(jails.map(j => j.jail_id === selectedJail.jail_id 
        ? { ...j, blocks: j.blocks.map(b => b.block_id === selectedBlock.block_id 
            ? { ...b, cells: [...(b.cells || []), newCell] } 
            : b) } 
        : j))
      setAlert({ type: 'success', message: 'Cell created successfully' })
    }
    closeModal()
    setTimeout(() => setAlert(null), 3000)
  }

  const getStatusBadge = (status) => {
    const map = {
      'available': 'released',
      'occupied': 'custody',
      'maintenance': 'bail'
    }
    return map[status] || 'closed'
  }

  const getTotalCapacity = () => jails.reduce((sum, j) => sum + (j.capacity || 0), 0)
  const getTotalBlocks = () => jails.reduce((sum, j) => sum + (j.blocks?.length || 0), 0)
  const getTotalCells = () => jails.reduce((sum, j) => 
    sum + (j.blocks?.reduce((s, b) => s + (b.cells?.length || 0), 0) || 0), 0)

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>Jails & Cells</h1>
        <p>Manage jail facilities, cell blocks, and individual cells</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.message}</div>
      )}

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Jails</div>
          <div className="stat-value">{jails.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Capacity</div>
          <div className="stat-value">{getTotalCapacity()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cell Blocks</div>
          <div className="stat-value">{getTotalBlocks()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Cells</div>
          <div className="stat-value">{getTotalCells()}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Jail Facilities</h3>
          <button className="btn btn-primary" onClick={openJailModal}>
            + Add Jail
          </button>
        </div>

        {jails.map(jail => (
          <div key={jail.jail_id} style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
            <div className="flex justify-between items-center mb-md">
              <div>
                <h4 style={{ marginBottom: '4px' }}>{jail.name}</h4>
                <p className="text-sm text-muted">
                  {jail.district} • {jail.address} • Capacity: {jail.capacity}
                </p>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => openBlockModal(jail)}
              >
                + Add Block
              </button>
            </div>

            {jail.blocks && jail.blocks.length > 0 ? (
              <div style={{ marginLeft: '16px' }}>
                {jail.blocks.map(block => (
                  <div key={block.block_id} style={{ marginBottom: '16px', padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e5e5' }}>
                    <div className="flex justify-between items-center mb-sm">
                      <div>
                        <strong>{block.block_name}</strong>
                        <span className="text-sm text-muted ml-sm">
                          (Capacity: {block.capacity})
                        </span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openCellModal(jail, block)}
                      >
                        + Add Cell
                      </button>
                    </div>

                    {block.cells && block.cells.length > 0 && (
                      <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                        {block.cells.map(cell => (
                          <div 
                            key={cell.cell_id}
                            style={{
                              padding: '8px 12px',
                              background: cell.status === 'available' ? '#dcfce7' 
                                : cell.status === 'occupied' ? '#fee2e2' : '#fef3c7',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <strong>Cell {cell.cell_number}</strong>
                            <div className="text-muted">
                              Cap: {cell.capacity} • {cell.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {(!block.cells || block.cells.length === 0) && (
                      <p className="text-sm text-muted">No cells in this block</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted" style={{ marginLeft: '16px' }}>
                No cell blocks added yet
              </p>
            )}
          </div>
        ))}

        {jails.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p>No jail facilities found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={closeModal}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3 className="modal-title">
              {modalType === 'jail' && 'Add New Jail'}
              {modalType === 'block' && `Add Block to ${selectedJail?.name}`}
              {modalType === 'cell' && `Add Cell to ${selectedBlock?.block_name}`}
            </h3>
            <button className="modal-close" onClick={closeModal}>&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {modalType === 'jail' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Jail Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.district || ''}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Capacity *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'block' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Block Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Block A, High Security Wing"
                      value={formData.block_name || ''}
                      onChange={(e) => setFormData({...formData, block_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Block Capacity *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'cell' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Cell Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., A-101"
                      value={formData.cell_number || ''}
                      onChange={(e) => setFormData({...formData, cell_number: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cell Capacity *</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status || 'available'}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
