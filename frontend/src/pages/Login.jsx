import { useState } from 'react'

// Mock users for demo
const MOCK_USERS = {
  admin: { password: 'admin123', name: 'Government Admin', role: 'admin' },
  officer: { password: 'officer123', name: 'SI Rezaul Karim', role: 'officer' },
  user: { password: 'user123', name: 'Citizen User', role: 'user' }
}

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const user = MOCK_USERS[username.toLowerCase()]
    if (user && user.password === password) {
      onLogin(user.role, user.name)
    } else {
      setError('Invalid username or password')
    }
  }

  const handleQuickLogin = (role) => {
    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      officer: { username: 'officer', password: 'officer123' },
      user: { username: 'user', password: 'user123' }
    }
    setUsername(credentials[role].username)
    setPassword(credentials[role].password)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>BLACK<span style={{ color: '#ef4444' }}>VEIN</span> ORACLE</h1>
          <p>Bangladesh Jail & Thana Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full">
            Login
          </button>
        </form>

        <div className="login-demo">
          <p className="text-muted text-sm" style={{ marginBottom: '12px' }}>Quick login for demo:</p>
          <div className="btn-group" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('admin')}
            >
              👑 Admin
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('officer')}
            >
              👮 Thana Officer
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('user')}
            >
              👤 Public User
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
