import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useState, createContext, useContext } from 'react'
import Dashboard from './pages/Dashboard'
import Criminals from './pages/Criminals'
import Arrests from './pages/Arrests'
import Jails from './pages/Jails'
import Thanas from './pages/Thanas'
import Officers from './pages/Officers'
import Cases from './pages/Cases'
import GDReports from './pages/GDReports'
import Analytics from './pages/Analytics'
import Login from './pages/Login'

// Auth Context
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Role-based navigation
function Sidebar({ role, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        BLACK<span>VEIN</span> ORACLE
      </div>
      
      <nav className="sidebar-nav">
        {/* Admin sees everything */}
        {role === 'admin' && (
          <>
            <div className="nav-section">
              <div className="nav-section-title">Admin Panel</div>
              <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/analytics" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📈 Analytics
              </NavLink>
            </div>
            <div className="nav-section">
              <div className="nav-section-title">Manage</div>
              <NavLink to="/thanas" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                🏛️ Thanas
              </NavLink>
              <NavLink to="/jails" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                🏢 Jails & Cells
              </NavLink>
              <NavLink to="/officers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                👮 Officers
              </NavLink>
            </div>
            <div className="nav-section">
              <div className="nav-section-title">Records</div>
              <NavLink to="/criminals" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                👤 Criminals
              </NavLink>
              <NavLink to="/arrests" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                ⛓️ Arrests
              </NavLink>
              <NavLink to="/cases" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📁 Case Files
              </NavLink>
              <NavLink to="/gd-reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📝 GD Reports
              </NavLink>
            </div>
          </>
        )}

        {/* Thana Officer - manage their thana's data */}
        {role === 'officer' && (
          <>
            <div className="nav-section">
              <div className="nav-section-title">Thana Dashboard</div>
              <NavLink to="/dashboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📊 Dashboard
              </NavLink>
            </div>
            <div className="nav-section">
              <div className="nav-section-title">Criminal Records</div>
              <NavLink to="/criminals" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                👤 Criminals
              </NavLink>
              <NavLink to="/arrests" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                ⛓️ Arrests
              </NavLink>
              <NavLink to="/cases" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📁 Case Files
              </NavLink>
            </div>
            <div className="nav-section">
              <div className="nav-section-title">Public Service</div>
              <NavLink to="/gd-reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📝 GD Reports
              </NavLink>
            </div>
          </>
        )}

        {/* Public User - limited access */}
        {role === 'user' && (
          <>
            <div className="nav-section">
              <div className="nav-section-title">Public Portal</div>
              <NavLink to="/gd-reports" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                📝 Submit GD Report
              </NavLink>
              <NavLink to="/criminals" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
                🔍 Search Criminals
              </NavLink>
            </div>
          </>
        )}

        <div className="nav-section" style={{ marginTop: 'auto' }}>
          <button className="nav-link" onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
            🚪 Logout
          </button>
        </div>
      </nav>
    </aside>
  )
}

export default function App() {
  const [user, setUser] = useState(null) // { role: 'admin' | 'officer' | 'user', name: '...' }

  const login = (role, name) => {
    setUser({ role, name })
  }

  const logout = () => {
    setUser(null)
  }

  // Not logged in - show login page
  if (!user) {
    return <Login onLogin={login} />
  }

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar role={user.role} onLogout={logout} />
          <main className="main-content">
            <Routes>
              {/* Admin routes */}
              {user.role === 'admin' && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/thanas" element={<Thanas />} />
                  <Route path="/jails" element={<Jails />} />
                  <Route path="/officers" element={<Officers />} />
                  <Route path="/criminals" element={<Criminals />} />
                  <Route path="/arrests" element={<Arrests />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/gd-reports" element={<GDReports />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              )}

              {/* Officer routes */}
              {user.role === 'officer' && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/criminals" element={<Criminals />} />
                  <Route path="/arrests" element={<Arrests />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/gd-reports" element={<GDReports />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </>
              )}

              {/* User routes */}
              {user.role === 'user' && (
                <>
                  <Route path="/gd-reports" element={<GDReports />} />
                  <Route path="/criminals" element={<Criminals />} />
                  <Route path="*" element={<Navigate to="/gd-reports" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
